"""
Standalone clothing image server for Restyle (single file — safe to add without touching Node/React).

What it does
  POST /predict-clothing  — multipart file field "file"; returns JSON:
    category, color, season, description, confidence (approximate), notes

How to run (from repo root)
  pip install -r requirements.txt
  python clothing_predict_server.py
  # or: uvicorn clothing_predict_server:app --host 127.0.0.1 --port 8000

Optional better category accuracy (still lightweight CPU):
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

Limitations (honest MVP)
  - If torch/torchvision is installed, category uses a pretrained ResNet18 mapped to clothing words.
  - If torch/torchvision is not installed, it falls back to filename-based category hints.
  - Color = dominant cluster in the image (good for solid colors; busy photos are harder).
  - Season = simple rules from category + color name (easy to swap for a trained head).

Your team can later point Node at http://127.0.0.1:8000/predict-clothing without changing this file.
"""

from __future__ import annotations

import io
import re
from typing import Any

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import cv2
from skimage.color import rgb2lab, deltaE_cie76

CENTER_CROP_FRACTION = 10
HIGHLIGHT_THRESHOLD = 230
BORDER_WIDTH_FRACTION = 12

# Optional ML dependency: keep service runnable even without torch.
_TORCH_READY = False
_TORCH_IMPORT_ERR = ""
_DEVICE = "cpu"
_MODEL = _IMAGENET_LABELS = _PREPROCESS = None

try:
    import torch
    from torchvision.models import ResNet18_Weights, resnet18
    _DEVICE = str(torch.device("cuda" if torch.cuda.is_available() else "cpu"))
    _WEIGHTS = ResNet18_Weights.IMAGENET1K_V1
    _MODEL = resnet18(weights=_WEIGHTS).to(_DEVICE)
    _MODEL.eval()
    _IMAGENET_LABELS = list(_WEIGHTS.meta["categories"])
    _PREPROCESS = _WEIGHTS.transforms()
    _TORCH_READY = True
except Exception as e:  # pylint: disable=broad-except
    _TORCH_IMPORT_ERR = str(e)


def _map_imagenet_to_clothing(label: str) -> str | None:
    """Map one ImageNet English label to a coarse clothing category (or None)."""
    patterns: list[tuple[re.Pattern[str], str]] = [
        (re.compile(r"\b(t[- ]?shirt|jersey|maillot)\b"), "t-shirt"),
        (re.compile(r"\b(tank\s*top|undershirt|vest)\b"), "tank top"),
        (re.compile(r"\b(sweatshirt|hoodie|cardigan|pullover)\b"), "sweater"),
        (re.compile(r"\b(sweater|poncho)\b"), "sweater"),
        (re.compile(r"\b(blouse|shirt|tunic)\b"), "shirt"),
        (re.compile(r"\b(jeans|jean)\b"), "jeans"),
        (re.compile(r"\b(shorts|bermuda)\b"), "shorts"),
        (re.compile(r"\b(trouser|pant|slack|legging)\b"), "pants"),
        (re.compile(r"\b(skirt)\b"), "skirt"),
        (re.compile(r"\b(dress|gown|kimono)\b"), "dress"),
        (re.compile(r"\b(suit|tuxedo)\b"), "suit"),
        (re.compile(r"\b(coat|jacket|blazer|parka|anorak|pea coat)\b"), "jacket"),
        (re.compile(r"\b(sneaker|shoe|boot|loafer|sandal|clog|moccasin)\b"), "shoes"),
        (re.compile(r"\b(hat|cap|bonnet|sombrero|cowboy hat)\b"), "hat"),
        (re.compile(r"\b(scarf|neck brace)\b"), "scarf"),
        (re.compile(r"\b(sock|stocking)\b"), "socks"),
        (re.compile(r"\b(backpack|handbag|purse|wallet|mailbag)\b"), "bag"),
    ]
    for pat, name in patterns:
        if pat.search(label.lower()):
            return name
    return None

def _predict_clothing_category(pil_img: Image.Image) -> tuple[str, float, list[str]]:
    """Returns (category, confidence on chosen logit slice, top5 raw ImageNet labels)."""
    tensor = _PREPROCESS(pil_img.convert("RGB")).unsqueeze(0).to(_DEVICE)
    with torch.no_grad():
        logits = _MODEL(tensor)
        probs = torch.softmax(logits, dim=1)[0]

    topk = min(15, probs.numel())
    p_vals, p_idx = torch.topk(probs, topk)
    top_labels = [_IMAGENET_LABELS[i] for i in p_idx.tolist()]

    best_cat, best_conf = None, 0.0
    for rank, idx in enumerate(p_idx.tolist()):
        cat = _map_imagenet_to_clothing(_IMAGENET_LABELS[idx])
        if cat and float(p_vals[rank]) > best_conf:
            best_cat, best_conf = cat, float(p_vals[rank])
    return (best_cat or "clothing item"), best_conf, top_labels[:5]

def _guess_category_from_filename(filename: str | None) -> str:
    """Lightweight fallback when torch isn't installed."""
    name = (filename or "").lower()
    rules = [
        (r"t[-_ ]?shirt|tee", "t-shirt"),
        (r"tank", "tank top"),
        (r"hoodie|sweater", "sweater"),
        (r"shirt|blouse", "shirt"),
        (r"jeans?", "jeans"),
        (r"shorts?", "shorts"),
        (r"pants?|trousers?", "pants"),
        (r"skirt", "skirt"),
        (r"dress", "dress"),
        (r"jacket|coat|blazer", "jacket"),
        (r"shoe|sneaker|boot|loafer|sandal", "shoes"),
    ]
    for pattern, category in rules:
        if re.search(pattern, name):
            return category
    return "top"

# --- Dominant color (OpenCV k-means) + name mapping ---

_NAMED_RGB = [
    ("white", (255, 255, 255)),
    ("cream", (245, 245, 220)),
    ("beige", (245, 245, 220)),
    ("yellow", (255, 255, 0)),
    ("orange", (255, 165, 0)),
    ("red", (255, 0, 0)),
    ("pink", (255, 192, 203)),
    ("purple", (128, 0, 128)),
    ("navy", (0, 0, 128)),
    ("blue", (0, 0, 255)),
    ("light blue", (173, 216, 230)),
    ("teal", (0, 128, 128)),
    ("green", (0, 128, 0)),
    ("olive", (107, 142, 35)),
    ("brown", (139, 69, 19)),
    ("gray", (128, 128, 128)),
    ("black", (0, 0, 0)),
]


def _lab_distance(rgb_a: np.ndarray, rgb_b: tuple[int, int, int]) -> float:
    # rgb2lab expects float values in [0, 1] and a (1, 1, 3) shaped array
    lab_a = rgb2lab(rgb_a.reshape(1, 1, 3) / 255.0)
    lab_b = rgb2lab(np.array(rgb_b, dtype=np.float32).reshape(1, 1, 3) / 255.0)
    return float(deltaE_cie76(lab_a, lab_b).item())

def _dominant_color_name(pil_img: Image.Image) -> tuple[str, tuple[int, int, int]]:
    rgb = np.asarray(pil_img.convert("RGB"))
    h, w, _ = rgb.shape
    # Focus center region (often the garment)
    ch, cw = h // CENTER_CROP_FRACTION, w // CENTER_CROP_FRACTION
    crop = rgb[ch : h - ch, cw : w - cw].reshape(-1, 3).astype(np.float32)
    if crop.size == 0:
        crop = rgb.reshape(-1, 3).astype(np.float32)
    
    # Estimate background color by sampling the image border
    is_highlight = np.all(crop > HIGHLIGHT_THRESHOLD, axis=1)
    crop = crop[~is_highlight]
    if crop.size == 0:
        crop = rgb.reshape(-1, 3).astype(np.float32)

    bw = max(8, min(h,w) // BORDER_WIDTH_FRACTION)
    try:
        border = np.concatenate([rgb[:bw,:].reshape(-1, 3), rgb[h-bw:, :].reshape(-1, 3),
                                 rgb[:, :bw].reshape(-1, 3), rgb[:, w-bw:].reshape(-1, 3),
        ]).astype(np.uint8)
        if border.size:
            quantized = (border // 10) * 10
            unique, counts_b = np.unique(quantized.reshape(-1, 3), axis=0, return_counts=True)
            bg_mean = unique[np.argmax(counts_b)].astype(np.float32)
            print(f"[COLOR] Border bg mode enabled: bg_mean RGB ~ ({bg_mean[0]:.0f}, {bg_mean[1]:.0f}, {bg_mean[2]:.0f})")
        else:
            bg_mean = None
    except Exception as e:
        print(f"[COLOR] Warning: border sampling failed: {e}")
        bg_mean = None

    K = 6
    np.random.seed(42)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(
        crop, K, None, criteria, attempts=3, flags=cv2.KMEANS_PP_CENTERS
    )
    counts = np.bincount(labels.flatten(), minlength=K)

    # Prefer clusters that are not similar to the border/background color.
    chosen_idx = None

    if bg_mean is not None:
        BG_THRESHOLD = 15.0
        dists = [_lab_distance(centers[i], tuple(bg_mean.astype(int))) for i in range(len(centers))]
        candidates = [i for i, d in enumerate(dists) if d > BG_THRESHOLD]
        chosen_idx = max(candidates, key=lambda i: counts[i]) if candidates else int(np.argmax(counts))
        print(f"[COLOR] Using bg-excluded cluster (idx={chosen_idx}, dist from bg={dists[chosen_idx]:.1f})")
    # Fallback to largest cluster overall
    else:
        chosen_idx = int(np.argmax(counts))
        print(f"[COLOR] Fallback to largest cluster (bg-exclusion found no candidates)")

    red = int(np.clip(centers[chosen_idx][0], 0, 255))
    green = int(np.clip(centers[chosen_idx][1], 0, 255))
    blue = int(np.clip(centers[chosen_idx][2], 0, 255))

    rgb_vec = np.array([red, green, blue], dtype=np.float32)
    color_name = min(_NAMED_RGB, key=lambda nc: _lab_distance(rgb_vec, nc[1]))[0]
    print(f"[COLOR] Result: {color_name} (RGB {red}, {green}, {blue})")
    return color_name, (red, green, blue)


def _infer_season(category: str, color_name: str) -> str:
    cat, color = category.lower(), color_name.lower()
    summerish = {"t-shirt", "tank top", "shorts", "dress", "shirt"}
    winterish = {"jacket", "sweater", "coat"}
    if any(x in cat for x in winterish):
        return "winter"
    if any(x in cat for x in summerish):
        return "summer"
    if color in ("white", "yellow", "light blue", "cream", "beige", "pink", "orange"):
        return "summer"
    if color in ("navy", "black", "brown", "gray", "grey"):
        return "all-season"
    return "all-season"


def _build_description(season: str, color_name: str, category: str) -> str:
    # e.g. "This is a summer-time white T-shirt." or "This is an all-season navy jacket."
    pretty = category
    if pretty == "t-shirt":
        pretty = "T-shirt"
    else:
        pretty = pretty[:1].upper() + pretty[1:]
    if season == "all-season":
        return f"This is an all-season {color_name} {pretty}."
    return f"This is a {season}-time {color_name} {pretty}."

app = FastAPI(title="Restyle clothing predictor", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict[str, str]:
    mode = "torch" if _TORCH_READY else "lightweight"
    print(f"[HEALTH] Status check: mode={mode}, device={_DEVICE}")
    return {
        "status": "ok",
        "ml_mode": mode,
        "device": str(_DEVICE),
    }


@app.post("/predict-clothing")
async def predict_clothing(file: UploadFile = File(...)) -> dict[str, Any]:
    try:
        raw = await file.read()
        if not raw or len(raw) < 100:
            raise HTTPException(status_code=400, detail="Empty or too-small image file")
        print(f"\n[PREDICT] Received file: {file.filename} ({len(raw)} bytes)")

        try:
            pil = Image.open(io.BytesIO(raw)).convert("RGB")
            pil.load()
            print(f"[PREDICT] Image loaded: {pil.size[0]}x{pil.size[1]} pixels")
        except OSError as e:
            print(f"[PREDICT] Image load failed: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid or unsupported image: {e!s}") from e

        if _TORCH_READY:
            print(f"[PREDICT] Mode: TORCH (ML model enabled)")
            category, conf, top5 = _predict_clothing_category(pil)
            mode_note = "Category inferred via ImageNet->clothing mapping."
            print(f"[PREDICT] Category: {category} (confidence: {conf:.4f})")
            if top5:
                print(f"[PREDICT] Top-5 ImageNet hints: {top5[:3]}")
        else:
            print(f"[PREDICT] Mode: LIGHTWEIGHT (no torch)")
            category, conf, top5 = _guess_category_from_filename(file.filename), 0.0, []
            mode_note = "Torch not installed; category guessed from filename. Users can edit the fields manually."
            print(f"[PREDICT] Category (from heuristic): {category}")
            
        color_name, rgb = _dominant_color_name(pil)
        print(f"[PREDICT] Color: {color_name} (RGB: {rgb})")
        season = _infer_season(category, color_name)
        print(f"[PREDICT] Season: {season}")
        description = _build_description(season, color_name, category)
        print(f"[PREDICT] ✓ Prediction complete: {description}")

        return {
            "category": category,
            "color": color_name,
            "rgb": {"r": rgb[0], "g": rgb[1], "b": rgb[2]},
            "season": season,
            "description": description,
            "confidence_category": round(conf, 4),
            "imagenet_top5_hints": top5,
            "notes": mode_note,
            "torch_ready": _TORCH_READY,
            "torch_import_error": _TORCH_IMPORT_ERR if not _TORCH_READY else "",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e!s}") from e


def main() -> None:
    import uvicorn

    uvicorn.run("clothing_predict_server:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    main()