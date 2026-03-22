"""
Standalone clothing image server for Restyle (single file — safe to add without touching Node/React).

What it does
  POST /predict-clothing  — multipart file field "file"; returns JSON:
    category, color, season, description, confidence (approximate), notes

How to run (from repo root)
  pip install fastapi uvicorn python-multipart torch torchvision pillow numpy opencv-python-headless
  python clothing_predict_server.py
  # or: uvicorn clothing_predict_server:app --host 127.0.0.1 --port 8000

First run downloads ImageNet weights (~45MB) — needs network once.

Limitations (honest MVP)
  - Category uses a pretrained ResNet18 on ImageNet labels, mapped to clothing words.
    It is NOT a dedicated fashion dataset; replace `model` + mapping with your fine-tuned
    weights when your team has labeled data.
  - Color = dominant cluster in the image (good for solid colors; busy photos are harder).
  - Season = simple rules from category + color name (easy to swap for a trained head).

Your team can later point Node at http://127.0.0.1:8000/predict-clothing without changing this file.
"""

from __future__ import annotations

import io
import re
from typing import Any

import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
import cv2
from torchvision.models import resnet18, ResNet18_Weights

# --- PyTorch model (loaded once) ---
_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_WEIGHTS = ResNet18_Weights.IMAGENET1K_V1
_MODEL = resnet18(weights=_WEIGHTS).to(_DEVICE)
_MODEL.eval()
_IMAGENET_LABELS: list[str] = list(_WEIGHTS.meta["categories"])
_PREPROCESS = _WEIGHTS.transforms()


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


# --- Dominant color (OpenCV k-means) + name mapping ---

_NAMED = [
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
    ("green", (0, 128, 0)),
    ("brown", (139, 69, 19)),
    ("gray", (128, 128, 128)),
    ("grey", (128, 128, 128)),
    ("black", (0, 0, 0)),
]


def _rgb_distance(a: np.ndarray, b: tuple[int, int, int]) -> float:
    return float(np.linalg.norm(a - np.array(b, dtype=np.float32)))


def _dominant_color_name(pil_img: Image.Image) -> tuple[str, tuple[int, int, int]]:
    rgb = np.asarray(pil_img.convert("RGB"))
    h, w, _ = rgb.shape
    # Focus center region (often the garment)
    ch, cw = h // 4, w // 4
    crop = rgb[ch : h - ch, cw : w - cw]
    if crop.size == 0:
        crop = rgb
    pixels = crop.reshape(-1, 3).astype(np.float32)

    K = 3
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(
        pixels, K, None, criteria, attempts=3, flags=cv2.KMEANS_PP_CENTERS
    )
    counts = np.bincount(labels.flatten(), minlength=K)
    idx = int(np.argmax(counts))
    bgr = centers[idx]
    r, g, b = int(bgr[2]), int(bgr[1]), int(bgr[0])
    r = max(0, min(255, r))
    g = max(0, min(255, g))
    b = max(0, min(255, b))
    vec = np.array([r, g, b], dtype=np.float32)

    best_name = "unknown"
    best_d = 1e9
    for name, ref in _NAMED:
        d = _rgb_distance(vec, ref)
        if d < best_d:
            best_d = d
            best_name = name
    return best_name, (r, g, b)


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
    return {"status": "ok", "device": str(_DEVICE)}


@app.post("/predict-clothing")
async def predict_clothing(file: UploadFile = File(...)) -> dict[str, Any]:
    raw = await file.read()
    pil = Image.open(io.BytesIO(raw))

    category, conf, top5 = _predict_clothing_category(pil)
    color_name, rgb = _dominant_color_name(pil)
    season = _infer_season(category, color_name)
    description = _build_description(season, color_name, category)

    return {
        "category": category,
        "color": color_name,
        "rgb": {"r": rgb[0], "g": rgb[1], "b": rgb[2]},
        "season": season,
        "description": description,
        "confidence_category": round(conf, 4),
        "imagenet_top5_hints": top5,
        "notes": "Category is inferred via ImageNet→clothing mapping; train a dedicated model for production accuracy.",
    }


def main() -> None:
    import uvicorn

    uvicorn.run("clothing_predict_server:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    main()
