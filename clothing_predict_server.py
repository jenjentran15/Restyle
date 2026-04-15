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

# Optional ML dependency: keep service runnable even without torch.
_TORCH_READY = False
_TORCH_IMPORT_ERR = ""
_DEVICE = "cpu"
_MODEL = None
_IMAGENET_LABELS: list[str] = []
_PREPROCESS = None

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
    s = label.lower()

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
        if pat.search(s):
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

    best_cat: str | None = None
    best_conf = 0.0
    for i in range(topk):
        lbl = _IMAGENET_LABELS[p_idx[i].item()]
        cat = _map_imagenet_to_clothing(lbl)
        if cat is not None:
            conf = float(p_vals[i].item())
            if best_cat is None or conf > best_conf:
                best_cat = cat
                best_conf = conf

    if best_cat is None:
        # Fallback: describe as generic clothing so downstream still gets a string
        return "clothing item", float(p_vals[0].item()), top_labels[:5]

    return best_cat, best_conf, top_labels[:5]


def _clothing_category_heuristics(pil_img: Image.Image) -> str:
    img = pil_img.convert("RGB")
    width, height = img.size
    aspect = height / max(width, 1)
    if aspect > 1.6:
            aspect_vote = "dress"
    elif aspect > 1.1:
        aspect_vote = "top"
    elif aspect < 0.7:
        aspect_vote = "pants"
    else:
        aspect_vote = "shirt"

    gray = np.array(img.convert("L"))
    edges = cv2.Canny(gray, 80, 160)
    edge_density = float(edges.mean())

    if edge_density > 12:
        edge_vote = "jacket"
    elif edge_density > 6:
        edge_vote = "shirt"
    else:
        edge_vote = "t-shirt"

    arr = np.array(img)
    mid = height // 2
    upper_sat = float(cv2.cvtColor(arr[:mid], cv2.COLOR_RGB2HSV)[..., 1].mean())
    lower_sat = float(cv2.cvtColor(arr[mid:], cv2.COLOR_RGB2HSV)[..., 1].mean())
    if lower_sat > upper_sat * 1.3:
        zone_vote = "pants"
    elif upper_sat > lower_sat * 1.3:
        zone_vote = "top"
    else:
        zone_vote = "shirt"
    
    votes: dict[str, float] = {}
    for cat, weight in [(aspect_vote, 1.5), (edge_vote, 1.0), (zone_vote, 1.0)]:
        votes[cat] = votes.get(cat,0) + weight
    winner = max(votes, key=lambda k: votes[k])
    print(f"[PIXEL HEURISTIC] aspect={aspect_vote}, edge={edge_vote}, zone={zone_vote} -> {winner}")
    return winner

# --- Dominant color (OpenCV k-means) + name mapping ---

_NAMED_RGB: list[tuple[str, tuple[int, int, int]]] = [
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


def _rgb_lab(red: int, green: int, blue: int) -> np.ndarray:
    """Convert a single sRGB triplet(0-255) to CIE LAB via OpenCV"""
    px = np.array([[[blue, green, red]]], dtype=np.uint8)
    return cv2.cvtColor(px, cv2.COLOR_BGR2LAB)[0,0].astype(np.float32)

_NAMED_LAB: list[tuple[str, np.ndarray]] = [
    (name, _rgb_lab(*rgb)) for name, rgb in _NAMED_RGB
]

def _lab_nearest_color(lab_vec: np.ndarray) -> str:
    """Return the closest named color by LAB Euclidean distance"""
    best_name, best_d = "unknown", 1e9
    for name, ref in _NAMED_LAB:
        d = float(np.linalg.norm(lab_vec - ref))
        if d < best_d:
            best_d, best_name = d, name
    return best_name

def _dominant_color_name(pil_img: Image.Image) -> tuple[str, tuple[int, int, int]]:
    rgb = np.asarray(pil_img.convert("RGB"))
    h, w, _ = rgb.shape
    # Focus center region (often the garment)
    ch, cw = h // 4, w // 4
    crop = rgb[ch : h - ch, cw : w - cw]
    if crop.size == 0:
        crop = rgb
    crop_bgr = cv2.cvtColor(crop, cv2.COLOR_RGB2BGR)
    crop_lab = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)

    # Estimate background color by sampling the image border
    bw = max(8, min(h, w) // 12)
    bg_mean = None
    try:
        border_parts = [rgb[:bw, :], rgb[h-bw:,:], rgb[:,:bw], rgb[:,w-bw:]]
        border_pixels = np.concatenate([p.reshape(-1, 3) for p in border_parts], axis=0)
        border_bgr = cv2.cvtColor(border_pixels.reshape(-1, 1, 3), cv2.COLOR_RGB2BGR).reshape(-1, 3)
        border_lab = cv2.cvtColor(border_pixels.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
        bg_mean = border_lab.mean(axis=0)
        print(f"[COLOR] Border bg mode enabled: bg_mean RGB ~ ({bg_mean[0]:.0f}, {bg_mean[1]:.0f}, {bg_mean[2]:.0f})")
    except Exception as e:
        print(f"[COLOR] Warning: border sampling failed: {e}")
        bg_mean = None

    K = 4
    np.random.seed(42)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(
        crop_lab, K, None, criteria, attempts=3, flags=cv2.KMEANS_PP_CENTERS
    )
    counts = np.bincount(labels.flatten(), minlength=K)

    # Prefer clusters that are not similar to the border/background color.
    chosen_idx = None

    if bg_mean is not None:
        BG_THRESHOLD = 20.0
        dists = [float(np.linalg.norm(centers[i] - bg_mean)) for i in range(K)]
        candidates = [i for i in range(K) if dists[i] > BG_THRESHOLD]
        if candidates:
            chosen_idx = max(candidates, key=lambda i: counts[i])
            print(f"[COLOR] Using bg-excluded cluster (idx={chosen_idx}, dist from bg={dists[chosen_idx]:.1f})")

    # Fallback to largest cluster overall
    if chosen_idx is None:
        chosen_idx = int(np.argmax(counts))
        print(f"[COLOR] Fallback to largest cluster (bg-exclusion found no candidates)")

    lab_pixel = np.array([[[
        int(np.clip(centers[chosen_idx][0], 0, 255)),
        int(np.clip(centers[chosen_idx][1], 0, 255)),
        int(np.clip(centers[chosen_idx][2], 0, 255)),
    ]]], dtype=np.uint8)
    rgb_out = cv2.cvtColor(cv2.cvtColor(lab_pixel, cv2.COLOR_LAB2BGR), cv2.COLOR_BGR2RGB)[0,0]
    red, green, blue = int(rgb_out[0]), int(rgb_out[1]), int(rgb_out[2])

    color_name = _lab_nearest_color(centers[chosen_idx].astype(np.float32))
    print(f"[COLOR] Result: {color_name} (RGB {red}, {green}, {blue})")
    return color_name, (red, green, blue)


def _infer_season(category: str, color_name: str) -> str:
    c = category.lower()
    col = color_name.lower()

    summerish = {"t-shirt", "tank top", "shorts", "dress", "shirt"}
    winterish = {"jacket", "sweater", "coat"}
    if any(x in c for x in winterish):
        return "winter"
    if any(x in c for x in summerish):
        return "summer"
    if col in ("white", "yellow", "light blue", "cream", "beige", "pink", "orange"):
        return "summer"
    if col in ("navy", "black", "brown", "gray", "grey"):
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
            print(f"[PREDICT] Mode: PIXEL HEURISTIC")
            category = _clothing_category_heuristics(pil)
            conf = 0.0
            top5 = []
            mode_note = (
                "Torch not installed; using category via pixel-based heuristics. "
                "Users can edit the fields manually."
            )
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
