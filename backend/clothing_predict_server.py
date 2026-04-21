from __future__ import annotations

import io
import os
import re
from typing import Any, Dict

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# ----------------------------
# Optional ML dependencies
# ----------------------------
_TORCH_READY = False
_TORCHVISION_READY = False
_CLIP_READY = False

_TORCH_IMPORT_ERR = ""
_TORCHVISION_IMPORT_ERR = ""
_CLIP_IMPORT_ERR = ""

_DEVICE = "cpu"
_MODEL = None
_IMAGENET_LABELS: list[str] = []
_PREPROCESS = None

_CLIP_MODEL = None
_CLIP_PROCESSOR = None

# Make HF downloads/cache stable (optional but helps)
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HOME", os.path.expanduser("~/.cache/huggingface"))
os.environ.setdefault("TRANSFORMERS_CACHE", os.path.expanduser("~/.cache/huggingface/transformers"))

# Import torch first (so we can report accurately)
try:
    import torch  # noqa: F401

    _DEVICE = str(torch.device("cuda" if torch.cuda.is_available() else "cpu"))
    _TORCH_READY = True
    print(f"[INIT] torch ✓  device={_DEVICE}")
except Exception as e:  # pylint: disable=broad-except
    _TORCH_IMPORT_ERR = str(e)
    _TORCH_READY = False
    print(f"[INIT] torch ✗  err={_TORCH_IMPORT_ERR}")

# Import torchvision + ResNet only if torch is OK
if _TORCH_READY:
    try:
        from torchvision.models import ResNet18_Weights, resnet18

        _WEIGHTS = ResNet18_Weights.IMAGENET1K_V1
        _MODEL = resnet18(weights=_WEIGHTS).to(_DEVICE)
        _MODEL.eval()
        _IMAGENET_LABELS = list(_WEIGHTS.meta["categories"])
        _PREPROCESS = _WEIGHTS.transforms()
        _TORCHVISION_READY = True
        print("[INIT] torchvision/resnet ✓")
    except Exception as e:  # pylint: disable=broad-except
        _TORCHVISION_IMPORT_ERR = str(e)
        _TORCHVISION_READY = False
        print(f"[INIT] torchvision/resnet ✗  err={type(e).__name__}: {e}")

# Try CLIP only if torch is OK
if _TORCH_READY:
    try:
        from transformers import CLIPModel, CLIPProcessor  # type: ignore

        _CLIP_MODEL = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(_DEVICE)
        _CLIP_PROCESSOR = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _CLIP_MODEL.eval()
        _CLIP_READY = True
        print("[INIT] CLIP ✓")
    except Exception as e:  # pylint: disable=broad-except
        _CLIP_IMPORT_ERR = str(e)
        _CLIP_READY = False
        print(f"[INIT] CLIP ✗  err={type(e).__name__}: {e}")


# ----------------------------
# Category prediction (CLIP)
# ----------------------------
def _predict_clothing_category_clip(pil_img: Image.Image) -> tuple[str, float, Dict[str, float]]:
    """
    Returns:
      (best_category, best_confidence, per_category_scores)

    Uses multiple prompts per category and takes max score per category.
    """
    prompt_map: list[tuple[str, str]] = [
        ("a product photo of a short-sleeve t-shirt", "shirt"),
        ("a product photo of a t-shirt", "shirt"),
        ("a product photo of a casual shirt", "shirt"),
        ("a product photo of a blouse", "shirt"),
        ("a product photo of a tank top", "tank top"),
        ("a product photo of a hoodie", "sweater"),
        ("a product photo of a sweater", "sweater"),
        ("a product photo of a jacket", "jacket"),
        ("a product photo of jeans", "jeans"),
        ("a product photo of pants", "pants"),
        ("a product photo of shorts", "shorts"),
        ("a product photo of a skirt", "skirt"),
        ("a product photo of a short dress", "dress"),
        ("a product photo of a long dress", "dress"),
        ("a product photo of shoes", "shoes"),
        ("a product photo of a hat", "accessory"),
        ("a product photo of a bag", "accessory"),
    ]

    prompts = [p for p, _ in prompt_map]
    mapped = [c for _, c in prompt_map]

    inputs = _CLIP_PROCESSOR(text=prompts, images=pil_img, return_tensors="pt", padding=True)
    inputs = {k: v.to(_DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _CLIP_MODEL(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0].detach().cpu().numpy()

    scores: Dict[str, float] = {}
    for p, cat in zip(probs.tolist(), mapped):
        scores[cat] = max(scores.get(cat, 0.0), float(p))

    best_cat = max(scores, key=scores.get)
    best_conf = float(scores[best_cat])
    return best_cat, best_conf, scores


# ----------------------------
# Category prediction (ImageNet fallback)
# ----------------------------
def _map_imagenet_to_clothing(label: str) -> str | None:
    s = label.lower()
    patterns: list[tuple[re.Pattern[str], str]] = [
        (re.compile(r"\b(t[- ]?shirt|jersey|maillot|polo|tee)\b"), "shirt"),
        (re.compile(r"\b(tank\s*top|undershirt|vest|singlet)\b"), "tank top"),
        (re.compile(r"\b(sweatshirt|hoodie|cardigan|pullover|sweater)\b"), "sweater"),
        (re.compile(r"\b(blouse|shirt|tunic|top)\b"), "shirt"),
        (re.compile(r"\b(jeans|jean|denim)\b"), "jeans"),
        (re.compile(r"\b(shorts|bermuda|trunks)\b"), "shorts"),
        (re.compile(r"\b(trouser|pant|slack|legging|chinos)\b"), "pants"),
        (re.compile(r"\b(skirt|mini)\b"), "skirt"),
        (re.compile(r"\b(dress|gown|kimono|frock)\b"), "dress"),
        (re.compile(r"\b(coat|jacket|blazer|parka|anorak|pea coat|windbreaker)\b"), "jacket"),
        (re.compile(r"\b(sneaker|shoe|boot|loafer|sandal|trainer)\b"), "shoes"),
        (re.compile(r"\b(hat|cap|beanie|scarf|tie|belt|sock|bag|purse|backpack)\b"), "accessory"),
    ]
    for pat, name in patterns:
        if pat.search(s):
            return name
    return None


def _predict_clothing_category_imagenet(pil_img: Image.Image) -> tuple[str, float, list[str]]:
    tensor = _PREPROCESS(pil_img.convert("RGB")).unsqueeze(0).to(_DEVICE)
    with torch.no_grad():
        probs = torch.softmax(_MODEL(tensor), dim=1)[0]

    topk = min(15, probs.numel())
    p_vals, p_idx = torch.topk(probs, topk)
    top_labels = [_IMAGENET_LABELS[i] for i in p_idx.tolist()]

    best_cat = None
    best_conf = 0.0
    for i in range(topk):
        lbl = _IMAGENET_LABELS[p_idx[i].item()]
        cat = _map_imagenet_to_clothing(lbl)
        if cat is not None:
            conf = float(p_vals[i].item())
            if best_cat is None or conf > best_conf:
                best_cat, best_conf = cat, conf

    if best_cat is None:
        return "clothing item", float(p_vals[0].item()), top_labels[:5]
    return best_cat, best_conf, top_labels[:5]


def _guess_category_from_filename(filename: str | None) -> str:
    name = (filename or "").lower()
    rules = [
        (r"t[-_ ]?shirt|tee|shirt", "shirt"),
        (r"tank|singlet", "tank top"),
        (r"hoodie|sweater|jumper", "sweater"),
        (r"jeans?|denim", "jeans"),
        (r"shorts?|bermuda", "shorts"),
        (r"pants?|trousers?|chinos", "pants"),
        (r"skirt", "skirt"),
        (r"dress|gown", "dress"),
        (r"jacket|coat|blazer|cardigan", "jacket"),
        (r"shoe|sneaker|boot|loafer|sandal|trainer", "shoes"),
        (r"hat|cap|beanie|scarf|tie|belt|sock|bag|purse|backpack", "accessory"),
    ]
    for pattern, category in rules:
        if re.search(pattern, name):
            return category
    return "clothing item"


# ----------------------------
# Color detection (Option A: GrabCut garment mask)
# ----------------------------
_NAMED = [
    ("white", (255, 255, 255)),
    ("black", (0, 0, 0)),
    ("gray", (128, 128, 128)),
    ("navy", (0, 0, 128)),
    ("blue", (0, 0, 255)),
    ("light blue", (173, 216, 230)),
    ("green", (0, 128, 0)),
    ("brown", (139, 69, 19)),
    ("red", (255, 0, 0)),
    ("pink", (255, 192, 203)),
    ("purple", (128, 0, 128)),
    ("orange", (255, 165, 0)),
    ("yellow", (255, 255, 0)),
    ("beige", (245, 245, 220)),
    ("cream", (250, 245, 230)),
]


def _garment_mask_grabcut(pil_img: Image.Image) -> np.ndarray:
    """
    Returns a boolean mask (H,W) where True ~= foreground garment.
    Uses OpenCV GrabCut with a rectangle initialization.
    """
    rgb = np.asarray(pil_img.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]

    # Rectangle inset from edges (assumes garment roughly centered)
    rect = (int(0.08 * w), int(0.08 * h), int(0.84 * w), int(0.84 * h))

    mask = np.zeros((h, w), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    cv2.grabCut(bgr, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)

    fg = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
    return fg


def _dominant_color_name(pil_img: Image.Image) -> tuple[str, tuple[int, int, int]]:
    rgb = np.asarray(pil_img.convert("RGB"))
    h, w, _ = rgb.shape

    # 1) Try GrabCut foreground pixels
    pixels: np.ndarray
    try:
        fg_mask = _garment_mask_grabcut(pil_img)
        pixels = rgb[fg_mask].astype(np.float32)
    except Exception:
        pixels = np.empty((0, 3), dtype=np.float32)

    # 2) Fallback to center crop if mask is too small / failed
    if pixels.shape[0] < 800:
        ch, cw = h // 4, w // 4
        crop = rgb[ch : h - ch, cw : w - cw]
        if crop.size == 0:
            crop = rgb
        pixels = crop.reshape(-1, 3).astype(np.float32)

    # 3) K-means on garment pixels
    K = 4
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(pixels, K, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.flatten(), minlength=K)
    cent = centers[int(np.argmax(counts))]

    r, g, b = [int(x) for x in cent]
    r, g, b = [max(0, min(255, v)) for v in (r, g, b)]

    # More aggressive "white" rule (helps warm lighting)
    if r >= 225 and g >= 225 and b >= 225:
        return "white", (r, g, b)

    vec = np.array([r, g, b], dtype=np.float32)
    best = min(_NAMED, key=lambda item: float(np.linalg.norm(vec - np.array(item[1], dtype=np.float32))))
    return best[0], (r, g, b)


def _infer_season(category: str, color_name: str) -> str:
    c = category.lower()
    if any(x in c for x in ("jacket", "sweater", "coat", "hoodie")):
        return "winter"
    if any(x in c for x in ("shirt", "tank top", "shorts", "dress")):
        return "summer"
    if color_name in ("white", "yellow", "light blue", "cream", "beige", "pink", "orange"):
        return "summer"
    return "all-season"


def _build_description(season: str, color_name: str, category: str) -> str:
    pretty = category[:1].upper() + category[1:] if category else "Clothing item"
    if season == "all-season":
        return f"This is an all-season {color_name} {pretty}."
    return f"This is a {season}-time {color_name} {pretty}."


# ----------------------------
# FastAPI app
# ----------------------------
app = FastAPI(title="Restyle clothing predictor", version="0.5.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "device": _DEVICE,
        "torch_ready": _TORCH_READY,
        "torchvision_ready": _TORCHVISION_READY,
        "clip_ready": _CLIP_READY,
    }


@app.post("/predict-clothing")
async def predict_clothing(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    raw = await file.read()
    if not raw or len(raw) < 100:
        raise HTTPException(status_code=400, detail="Empty or too-small image file")

    try:
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
        pil.load()
    except OSError as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e!s}") from e

    if pil.size[0] < 32 or pil.size[1] < 32:
        raise HTTPException(status_code=400, detail="Image too small (minimum 32x32)")

    notes: list[str] = []
    top5: list[str] = []
    category = "clothing item"
    conf = 0.0

    if _CLIP_READY:
        category, conf, scores = _predict_clothing_category_clip(pil)
        notes.append("Category via CLIP (multi-prompt).")

        # Guardrail: if dress barely beats shirt, choose shirt
        if category == "dress":
            shirt_p = float(scores.get("shirt", 0.0))
            if (conf - shirt_p) < 0.08:
                notes.append(f"Guardrail: dress({conf:.3f}) close to shirt({shirt_p:.3f}); choosing shirt.")
                category = "shirt"
                conf = shirt_p

    elif _TORCHVISION_READY:
        category, conf, top5 = _predict_clothing_category_imagenet(pil)
        notes.append("Category via ImageNet mapping (weaker than CLIP).")
        if conf < 0.45:
            category = _guess_category_from_filename(file.filename)
            conf = 0.0
            notes.append("Low confidence; using filename hint.")
    else:
        category = _guess_category_from_filename(file.filename)
        notes.append("No ML backend; using filename hint.")

    color_name, rgb = _dominant_color_name(pil)
    notes.append("Color via GrabCut foreground mask + k-means (fallback to center crop).")

    season = _infer_season(category, color_name)
    description = _build_description(season, color_name, category)

    return {
        "category": category,
        "color": color_name,
        "rgb": {"r": rgb[0], "g": rgb[1], "b": rgb[2]},
        "season": season,
        "description": description,
        "confidence_category": round(float(conf), 4),
        "imagenet_top5_hints": top5,
        "notes": " ".join(notes),
        "torch_import_error": _TORCH_IMPORT_ERR,
        "torchvision_import_error": _TORCHVISION_IMPORT_ERR,
        "clip_import_error": _CLIP_IMPORT_ERR,
        "torch_ready": _TORCH_READY,
        "torchvision_ready": _TORCHVISION_READY,
        "clip_ready": _CLIP_READY,
    }


def main() -> None:
    import uvicorn
    uvicorn.run("clothing_predict_server:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    main()