#!/usr/bin/env python3
"""Historical clothing extraction experiment; use register-field-clothing.py.

This batch is deliberately separate from the public doll manifest.  The default
collection may reuse its three validated clean-garment prototypes; paid garments
in an alternate collection are always regenerated from their new product
references.  Raw API responses and request receipts stay
under ``scripts/art-sources/rigged-clothing`` while only cleaned RGBA/WebP
layers and visual QA sheets are written below ``assets/doll/rigged/clothing``.
"""
from __future__ import annotations

import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import threading
import time
import urllib.error
import urllib.request

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
DOLL = ROOT / "assets" / "doll"
DOLL_REFERENCE = ROOT / "scripts" / "art-sources" / "doll-reference"
DEFAULT_CATALOG = ROOT / "assets" / "wardrobe-catalog.json"
DEFAULT_DESIGNS = ROOT / "scripts" / "art-sources" / "shop-designs"
DEFAULT_OUT = DOLL / "rigged" / "clothing"
DEFAULT_SOURCES = ROOT / "scripts" / "art-sources" / "rigged-clothing"
CATALOG_PATH = DEFAULT_CATALOG
DESIGNS = DEFAULT_DESIGNS
PROTOTYPES = DOLL_REFERENCE / "prototypes" / "clothes"
OUT = DEFAULT_OUT
SOURCES = DEFAULT_SOURCES
MANIFEST_PATH = OUT / "manifest.json"
QA_DIR = OUT
MODEL = "gpt-image-2.5-sunburst"
QUALITY = "high"
CANVAS = (1024, 1536)
W, H = CANVAS
MAX_ATTEMPTS = 2
MAX_WORKERS = 4

PAID_CLOAKS = tuple(f"cloak-{i:02d}" for i in range(1, 13))
PAID_VESTS = tuple(f"vest-{i:02d}" for i in range(1, 13))
PAID_PANTS = tuple(f"pants-{i:02d}" for i in range(1, 13))
ALL_ITEMS = PAID_CLOAKS + PAID_VESTS + PAID_PANTS
CANDIDATE_MODE = False

MANNEQUIN_PATH = DOLL_REFERENCE / "mannequin.png"
GRIP_BASE_PATH = DOLL_REFERENCE / "prototypes" / "grips" / "grip-base.png"
HAND_BOXES = ((228, 770, 386, 978), (690, 770, 810, 978))
SHOULDER_Y = 469
BOOT_Y = 1332

# The API mask is intentionally broad.  The final semantic matte is narrower,
# but no hand/arm pixels are ever editable during the request.
EDITABLE_BOXES = {
    "cloak": (145, 420, 880, 1310),
    "vest": (350, 425, 675, 950),
}

_PRINT_LOCK = threading.Lock()
_MANIFEST_LOCK = threading.Lock()
_API_CALL_LOCK = threading.Lock()
_API_CALLS = 0


def log(message: str) -> None:
    with _PRINT_LOCK:
        print(message, flush=True)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGBA").save(buffer, format="PNG")
    return buffer.getvalue()


def webp_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGBA").save(buffer, format="WEBP", lossless=True, method=6)
    return buffer.getvalue()


def load_rgba(path: Path, *, canvas: bool = True) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(path)
    image = Image.open(path).convert("RGBA")
    if canvas and image.size != CANVAS:
        raise ValueError(f"{path}: expected {CANVAS}, got {image.size}")
    return image


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").point(lambda value: 255 if value > 10 else 0).getbbox()


def alpha_pixels(image: Image.Image) -> int:
    return int((np.asarray(image.getchannel("A")) > 10).sum())


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def load_catalog(path: Path) -> list[dict[str, object]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("items", data.get("catalog"))
    if not isinstance(data, list):
        raise ValueError(f"catalog must be a JSON list: {path}")
    if not all(isinstance(item, dict) for item in data):
        raise ValueError(f"catalog entries must be objects: {path}")
    return data


def _inside(path: Path, root: Path) -> bool:
    path, root = path.resolve(), root.resolve()
    return path == root or root in path.parents


def configure_paths(args: argparse.Namespace) -> None:
    global CATALOG_PATH, DESIGNS, OUT, SOURCES, MANIFEST_PATH, QA_DIR, CANDIDATE_MODE
    CANDIDATE_MODE = args.catalog is not None or args.design_dir is not None
    CATALOG_PATH = Path(args.catalog).expanduser() if args.catalog else DEFAULT_CATALOG
    DESIGNS = Path(args.design_dir).expanduser() if args.design_dir else DEFAULT_DESIGNS
    OUT = Path(args.output_dir).expanduser() if args.output_dir else DEFAULT_OUT
    SOURCES = Path(args.raw_dir).expanduser() if args.raw_dir else DEFAULT_SOURCES
    QA_DIR = Path(args.qa_dir).expanduser() if args.qa_dir else OUT
    MANIFEST_PATH = OUT / "manifest.json"
    if CANDIDATE_MODE:
        if args.output_dir is None or args.raw_dir is None:
            raise SystemExit("--output-dir and --raw-dir are required with --catalog or --design-dir")
        if not CATALOG_PATH.is_file() or not DESIGNS.is_dir():
            raise SystemExit("alternate catalog/design-dir paths must exist")
        if OUT.resolve() == SOURCES.resolve() or _inside(OUT, DEFAULT_OUT) or _inside(DEFAULT_OUT, OUT) or _inside(SOURCES, DEFAULT_SOURCES) or _inside(DEFAULT_SOURCES, SOURCES) or _inside(QA_DIR, DEFAULT_OUT) or _inside(DEFAULT_OUT, QA_DIR):
            raise SystemExit("alternate catalog/design-dir requires fresh, isolated output and raw directories")


def configure_catalog(items: list[dict[str, object]]) -> None:
    global PAID_CLOAKS, PAID_VESTS, PAID_PANTS, ALL_ITEMS
    groups = {
        "cloak": tuple(str(item["id"]) for item in items if item.get("category") == "cloak" and item.get("id")),
        "vest": tuple(str(item["id"]) for item in items if item.get("category") == "vest" and item.get("id")),
        "pants": tuple(str(item["id"]) for item in items if item.get("category") == "pants" and item.get("id")),
    }
    if not all(groups.values()):
        raise ValueError(f"catalog has no paid clothing entries: {CATALOG_PATH}")
    PAID_CLOAKS, PAID_VESTS, PAID_PANTS = groups["cloak"], groups["vest"], groups["pants"]
    ALL_ITEMS = PAID_CLOAKS + PAID_VESTS + PAID_PANTS


def source_record(path: Path, image: Image.Image | None = None) -> dict[str, object]:
    if image is None:
        image = load_rgba(path, canvas=False)
    return {
        "path": rel(path),
        "sha256": sha256_file(path),
        "size": list(image.size),
        "alphaBbox": list(alpha_bbox(image) or ()),
    }


def multipart(fields: dict[str, str], images: list[tuple[str, bytes]], mask: bytes) -> tuple[bytes, str]:
    boundary = "rigged-clothing-" + hashlib.sha256(os.urandom(24)).hexdigest()[:24]
    chunks: list[bytes] = []

    def field(name: str, value: str) -> None:
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"'
            f"\r\n\r\n{value}\r\n".encode()
        )

    for name, value in fields.items():
        field(name, value)
    for filename, data in images:
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="image[]"; '
            f'filename="{filename}"\r\nContent-Type: image/png\r\n\r\n'.encode()
        )
        chunks.extend((data, b"\r\n"))
    chunks.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="mask"; '
        'filename="mask.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
    )
    chunks.extend((mask, b"\r\n", f"--{boundary}--\r\n".encode()))
    return b"".join(chunks), boundary


def api_edit(prompt: str, references: list[Image.Image], mask: Image.Image, item: str) -> tuple[Image.Image, bytes]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    fields = {
        "model": MODEL,
        "prompt": prompt,
        "size": f"{W}x{H}",
        "quality": QUALITY,
        "background": "transparent",
        "output_format": "png",
        "n": "1",
    }
    payload, boundary = multipart(
        fields,
        [(f"reference-{index}.png", png_bytes(image)) for index, image in enumerate(references)],
        png_bytes(mask),
    )
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/edits",
        data=payload,
        headers={
            "Authorization": "Bearer " + api_key,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    with _API_CALL_LOCK:
        global _API_CALLS
        _API_CALLS += 1
        call_number = _API_CALLS
    log(f"{item}: image edit {call_number}")
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read()).get("error", {}).get("message", "image API error")
        except (ValueError, UnicodeDecodeError):
            detail = "image API error"
        raise RuntimeError(f"HTTP {error.code}: {detail}") from None
    try:
        encoded = result["data"][0]["b64_json"]
        raw_png = base64.b64decode(encoded, validate=True)
        image = Image.open(io.BytesIO(raw_png)).convert("RGBA")
    except (KeyError, IndexError, TypeError, ValueError, OSError) as error:
        raise RuntimeError("image API returned no decodable image") from error
    if image.size != CANVAS:
        raise ValueError(f"{item}: API output must be {CANVAS}, got {image.size}")
    return image, raw_png


def alpha_composite(*layers: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    for layer in layers:
        canvas = Image.alpha_composite(canvas, layer.convert("RGBA"))
    return canvas


def make_editable(category: str) -> np.ndarray:
    editable = np.zeros((H, W), dtype=bool)
    if category == "pants":
        yy, xx = np.indices((H, W))
        editable = (
            (yy >= 774)
            & (yy < 1400)
            & (
                ((yy < 975) & (xx >= 348) & (xx < 703))
                | ((yy >= 975) & (xx >= 200) & (xx < 824))
            )
        )
        # Explicitly protect the side arms in the upper waist band.  The
        # central lower-body band remains broad; only the arm corridors are
        # removed, never a narrow old pants bbox.
        editable[774:975, :348] = False
        editable[774:975, 670:824] = False
        return editable
    x0, y0, x1, y1 = EDITABLE_BOXES[category]
    editable[y0:y1, x0:x1] = True
    return editable


def mask_from_editable(editable: np.ndarray) -> Image.Image:
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, 3] = np.where(editable, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba, mode="RGBA")


def hsv_array(image: Image.Image) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    hsv = np.asarray(image.convert("HSV"), dtype=np.float32)
    return hsv[:, :, 0] * (360.0 / 255.0), hsv[:, :, 1] / 255.0, hsv[:, :, 2] / 255.0


def body_copy_mask(current: Image.Image | None, mannequin: Image.Image, category: str) -> np.ndarray:
    """Conservatively identify mannequin pixels copied into a generated layer."""
    if current is None:
        return np.zeros((H, W), dtype=bool)
    current_rgba = np.asarray(current.convert("RGBA"), dtype=np.int32)
    body_rgba = np.asarray(mannequin.convert("RGBA"), dtype=np.int32)
    alpha = current_rgba[:, :, 3] > 10
    distance = np.sqrt(((current_rgba[:, :, :3] - body_rgba[:, :, :3]) ** 2).sum(axis=2))
    copied = alpha & (distance <= 28)

    hue, saturation, value = hsv_array(mannequin)
    skin = (
        (hue < 52)
        & (saturation > 0.10)
        & (saturation < 0.72)
        & (value > 0.46)
        & (value < 1.0)
    )
    skin_region = np.zeros((H, W), dtype=bool)
    skin_region[390:SHOULDER_Y, 350:680] = True
    for x0, y0, x1, y1 in HAND_BOXES:
        skin_region[y0:y1, x0:x1] = True
    copied |= alpha & skin & skin_region
    copied[:390] = True
    copied[BOOT_Y:] = True
    if category == "vest":
        copied[940:] = True
    return copied


def native_body_fragment_mask(
    layer: Image.Image | None,
    mannequin: Image.Image,
    category: str,
) -> np.ndarray:
    """Remove shirt/neck/hand pixels even when an edit changed their RGB."""
    if layer is None:
        return np.zeros((H, W), dtype=bool)
    layer_arr = np.asarray(layer.convert("RGBA"), dtype=np.int32)
    body_arr = np.asarray(mannequin.convert("RGBA"), dtype=np.int32)
    alpha = layer_arr[:, :, 3] > 10
    body_alpha = body_arr[:, :, 3] > 10
    distance = np.sqrt(((layer_arr[:, :, :3] - body_arr[:, :, :3]) ** 2).sum(axis=2))
    hue, saturation, value = hsv_array(mannequin)
    skin = (
        (hue < 52)
        & (saturation > 0.10)
        & (saturation < 0.72)
        & (value > 0.46)
        & (value < 1.0)
    )
    cream_shirt = (saturation < 0.42) & (value > 0.62)
    region = np.zeros((H, W), dtype=bool)
    # Neckline and native cream shirt corridor.  Restricting this to the
    # upper torso keeps a genuinely gray/brown cloak panel intact.
    region[390:640, 340:690] = True
    for x0, y0, x1, y1 in HAND_BOXES:
        region[max(0, y0 - 12):min(H, y1 + 12), x0:x1] = True
    if category == "vest":
        region[640:950, 350:675] = True
    return alpha & body_alpha & region & (skin | cream_shirt) & (distance <= 96)


def raw_changed_mask(raw: Image.Image, mannequin: Image.Image, editable: np.ndarray) -> np.ndarray:
    a = np.asarray(raw.convert("RGBA"), dtype=np.int32)
    b = np.asarray(mannequin.convert("RGBA"), dtype=np.int32)
    rgb_distance = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha_distance = np.abs(a[:, :, 3] - b[:, :, 3])
    changed = ((rgb_distance > 30) | (alpha_distance > 24)) & (a[:, :, 3] > 10)
    return changed & editable


def product_image(key: str) -> tuple[Image.Image, dict[str, object]]:
    path = DESIGNS / f"{key}.webp"
    image = Image.open(path).convert("RGBA")
    info: dict[str, object] = {"path": rel(path), "sha256": sha256_file(path), "size": list(image.size)}
    if key == "vest-06":
        # The source is a side-by-side front/back product card.  The left
        # panel is the front; never expose the back panel in the rigged vest.
        split = image.width // 2 + 4
        image = image.crop((0, 0, split, image.height))
        info["frontCrop"] = [0, 0, split, image.height]
        info["frontCropSha256"] = sha256_bytes(png_bytes(image))
    info["alphaBbox"] = list(alpha_bbox(image) or ())
    info["fittedSize"] = list(image.size)
    return image, info


def current_layer(key: str) -> tuple[Image.Image | None, Path | None]:
    path = DOLL_REFERENCE / f"{key}.webp"
    if not path.is_file():
        return None, None
    return load_rgba(path), path


def target_box(key: str, category: str, current: Image.Image | None) -> tuple[int, int, int, int]:
    if category == "vest":
        # Measured collar/shoulder/hem anchors from vest-01 prototype.
        return (397, 467, 628, 823)
    if category == "pants":
        # Full leg ownership width.  The broad API mask is larger than this
        # target and is never narrowed to a single old pants-layer bbox.
        return (348, 774, 704, 1400)
    if key == "cloak-01":
        return (222, 437, 802, 1208)
    if key == "cloak-12":
        return (175, 437, 848, 1285)
    if current is not None:
        bbox = alpha_bbox(current)
        if bbox:
            return (bbox[0], 437, bbox[2], 1286)
    return (190, 437, 849, 1286)


def fitted_design_alpha(product: Image.Image, target: tuple[int, int, int, int]) -> tuple[np.ndarray, dict[str, object]]:
    source_alpha = product.getchannel("A")
    bbox = source_alpha.point(lambda value: 255 if value > 10 else 0).getbbox()
    if bbox is None:
        raise ValueError("product reference has no visible alpha")
    cropped = source_alpha.crop(bbox)
    x0, y0, x1, y1 = target
    fitted = cropped.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
    canvas = Image.new("L", CANVAS, 0)
    canvas.paste(fitted, (x0, y0))
    transform = {
        "method": "product-alpha-ghost-fit",
        "sourceBbox": list(bbox),
        "targetBbox": list(target),
        "scaleX": (x1 - x0) / max(1, bbox[2] - bbox[0]),
        "scaleY": (y1 - y0) / max(1, bbox[3] - bbox[1]),
        "offset": [x0, y0],
        "landmarks": {
            "collar": [(x0 + x1) // 2, y0],
            "shoulders": [[x0, y0 + 32], [x1, y0 + 32]],
            "cuffs": [[x0, min(y1, y0 + 330)], [x1, min(y1, y0 + 330)]],
        },
    }
    return np.asarray(canvas, dtype=np.uint8), transform


def fitted_raw_art(raw: Image.Image, target_alpha: np.ndarray, target: tuple[int, int, int, int]) -> tuple[Image.Image, np.ndarray, dict[str, object]]:
    raw_alpha = raw.getchannel("A").point(lambda value: 255 if value > 10 else 0)
    raw_bbox = raw_alpha.getbbox()
    if raw_bbox is None:
        raise ValueError("raw API output has no alpha")
    raw_alpha_pixels = int((np.asarray(raw_alpha) > 10).sum())
    target_image = Image.fromarray(target_alpha, mode="L")
    target_bbox = target_image.point(lambda value: 255 if value > 10 else 0).getbbox()
    if target_bbox is None:
        raise ValueError("target alpha has no visible geometry")
    crop = raw.crop(raw_bbox).resize((target_bbox[2] - target_bbox[0], target_bbox[3] - target_bbox[1]), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(crop, (target_bbox[0], target_bbox[1]))
    rgba = np.asarray(canvas).copy()
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], target_alpha)
    rgba[rgba[:, :, 3] < 10] = 0
    fitted = Image.fromarray(rgba, mode="RGBA")

    # Register the API semantic-change mask with the same crop/transform.  It
    # prevents a composite response from becoming a source-body fallback.
    raw_arr = np.asarray(raw.convert("RGBA"))
    raw_semantic = (raw_arr[:, :, 3] > 10).astype(np.uint8) * 255
    semantic_crop = Image.fromarray(raw_semantic, mode="L").crop(raw_bbox).resize(
        (target_bbox[2] - target_bbox[0], target_bbox[3] - target_bbox[1]), Image.Resampling.LANCZOS
    )
    semantic_canvas = Image.new("L", CANVAS, 0)
    semantic_canvas.paste(semantic_crop, (target_bbox[0], target_bbox[1]))
    semantic = np.asarray(semantic_canvas, dtype=np.uint8)
    before = int((rgba[:, :, 3] > 10).sum())
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], semantic)
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], target_alpha)
    rgba[rgba[:, :, 3] < 10] = 0
    semantic_fitted = Image.fromarray(rgba, mode="RGBA")
    after = int((rgba[:, :, 3] > 10).sum())
    drift = {
        "rawBbox": list(raw_bbox),
        "targetBbox": list(target_bbox),
        "rawAlphaPixels": raw_alpha_pixels,
        "fittedTargetPixels": before,
        "rawBeforeClampPixels": raw_alpha_pixels,
        "semanticAfterClampPixels": after,
        "removedPixels": raw_alpha_pixels - after,
        "removedFraction": (raw_alpha_pixels - after) / raw_alpha_pixels if raw_alpha_pixels else 1.0,
        "translation": [target_bbox[0] - raw_bbox[0], target_bbox[1] - raw_bbox[1]],
        "scale": [
            (target_bbox[2] - target_bbox[0]) / max(1, raw_bbox[2] - raw_bbox[0]),
            (target_bbox[3] - target_bbox[1]) / max(1, raw_bbox[3] - raw_bbox[1]),
        ],
    }
    return fitted, np.asarray(semantic_fitted), drift


def soft_alpha(mask: np.ndarray) -> np.ndarray:
    blurred = Image.fromarray((mask.astype(np.uint8) * 255), mode="L").filter(ImageFilter.GaussianBlur(1.0))
    return np.asarray(blurred, dtype=np.float32) / 255.0


def extract_garment(
    key: str,
    category: str,
    current: Image.Image | None,
    raw: Image.Image,
    mannequin: Image.Image,
    editable: np.ndarray,
    product: Image.Image,
    target: tuple[int, int, int, int],
) -> tuple[Image.Image, dict[str, object], dict[str, object]]:
    design_geometry, registration = fitted_design_alpha(product, target)
    raw_fit, semantic_fit_arr, drift = fitted_raw_art(raw, design_geometry, target)
    raw_arr = np.asarray(raw_fit.convert("RGBA"))
    semantic = (semantic_fit_arr[:, :, 3] > 10)
    copied = body_copy_mask(current, mannequin, category)
    copied |= native_body_fragment_mask(current, mannequin, category)
    if category == "pants":
        # Pants have no trusted old layer.  Only changed pixels from the raw
        # response, in the broad editable region, are allowed through.
        matte = semantic & editable & (design_geometry > 10)
        # Remove unmistakable unchanged mannequin pixels without narrowing the
        # broad whole-leg ownership mask.
        body = np.asarray(mannequin.convert("RGBA"), dtype=np.int32)
        diff = np.sqrt(((raw_arr[:, :, :3].astype(np.int32) - body[:, :, :3]) ** 2).sum(axis=2))
        copied_pants = (diff <= 24) & matte & (body[:, :, 3] > 10)
        matte &= ~copied_pants
        output = np.zeros((H, W, 4), dtype=np.uint8)
        output[:, :, :3] = raw_arr[:, :, :3]
        output[:, :, 3] = np.where(matte, raw_arr[:, :, 3], 0)
        output[:774] = 0
        output[1400:] = 0
        stats = {
            "oldGarmentPixels": 0,
            "apiSemanticPixels": int(semantic.sum()),
            "bodyCopyPixelsRemoved": int(copied_pants.sum()),
            "finalAlphaPixels": int((output[:, :, 3] > 10).sum()),
            "broadMaskPixels": int(editable.sum()),
            "targetGeometryPixels": int((design_geometry > 10).sum()),
        }
        return Image.fromarray(output, mode="RGBA"), registration, {**stats, "rawDrift": drift}

    current_arr = np.asarray(current.convert("RGBA"), dtype=np.uint8) if current is not None else np.zeros((H, W, 4), dtype=np.uint8)
    copied_effective = copied.copy()
    registered_region = (design_geometry > 10)
    if category == "cloak":
        # Keep real registered sleeves/panels above the waist; product alpha
        # controls all lower panels and genuine open-front transparency.
        yy = np.indices((H, W))[0]
        registered_region |= yy < 975
    old_garment = (
        (current_arr[:, :, 3] > 10)
        & editable
        & registered_region
        & (design_geometry > 10)
        & ~copied_effective
    )
    raw_semantic = semantic & editable & (design_geometry > 10) & ~copied_effective
    matte = old_garment | raw_semantic
    output = np.zeros((H, W, 4), dtype=np.uint8)
    output[old_garment] = current_arr[old_garment]
    output[raw_semantic] = raw_arr[raw_semantic]
    output[:, :, 3] = np.clip(soft_alpha(matte) * 255.0, 0, 255).astype(np.uint8)
    output[copied_effective] = 0
    output[native_body_fragment_mask(Image.fromarray(output, mode="RGBA"), mannequin, category)] = 0
    output[output[:, :, 3] < 10] = 0
    if category == "cloak":
        output[:390] = 0
        output[1310:] = 0
    else:
        output[:425] = 0
        output[950:] = 0
    stats = {
        "oldGarmentPixels": int(old_garment.sum()),
        "apiSemanticPixels": int(raw_semantic.sum()),
        "bodyCopyPixelsRemoved": int(copied_effective.sum()),
        "finalAlphaPixels": int((output[:, :, 3] > 10).sum()),
        "targetGeometryPixels": int((design_geometry > 10).sum()),
    }
    return Image.fromarray(output, mode="RGBA"), registration, {**stats, "rawDrift": drift}


def validate_output(
    key: str,
    category: str,
    final: Image.Image,
    current: Image.Image | None,
    mannequin: Image.Image,
    target: tuple[int, int, int, int],
    product: Image.Image | None = None,
) -> dict[str, object]:
    arr = np.asarray(final.convert("RGBA"))
    alpha = arr[:, :, 3] > 10
    pixels = int(alpha.sum())
    bbox = alpha_bbox(final)
    # Paid pants intentionally have no trusted old layer: their raw response
    # is the sole garment RGB source.  Comparing those outputs to the legacy
    # layers would reject valid pixels merely because old files contain body
    # fragments this batch removes.
    copied = (
        body_copy_mask(current, mannequin, category)
        if category in {"cloak", "vest"} and current is not None
        else np.zeros((H, W), dtype=bool)
    )
    copied_overlap = int((alpha & copied).sum())
    x0, y0, x1, y1 = bbox or (0, 0, 0, 0)
    target_x0, target_y0, target_x1, target_y1 = target
    if category == "cloak":
        alignment = pixels >= 4000 and x0 >= target_x0 - 18 and x1 <= target_x1 + 18 and y0 >= 420 and y1 <= 1310
        expected_opening = False
        if product is not None:
            design_geometry, _ = fitted_design_alpha(product, target)
            center_geometry = design_geometry[820:1300, 420:604] > 10
            expected_opening = float((~center_geometry).sum()) / float(center_geometry.size) >= 0.08
        if expected_opening:
            center = alpha[820:1300, 420:604]
            opening_fraction = float((~center).sum()) / float(center.size)
            opening_ok = opening_fraction >= 0.08
        else:
            opening_fraction = None
            opening_ok = True
        upper_body_ok = not alpha[:390].any()
    elif category == "vest":
        alignment = pixels >= 2500 and x0 >= 370 and x1 <= 660 and 440 <= y0 <= 500 and 790 <= y1 <= 860
        opening_fraction = None
        opening_ok = True
        upper_body_ok = not alpha[:425].any()
    else:
        broad = make_editable("pants")
        alignment = pixels >= 10000 and alpha[774:1400].any() and not alpha[:774].any() and not (alpha & ~broad).any()
        opening_fraction = None
        opening_ok = True
        upper_body_ok = not alpha[:774].any()
    result = {
        "alphaPixels": pixels,
        "alphaBbox": list(bbox) if bbox else None,
        "bodyCopyOverlapPixels": copied_overlap,
        "alignmentOk": bool(alignment),
        "openingFraction": opening_fraction,
        "openingOk": bool(opening_ok),
        "upperBodyTransparent": bool(upper_body_ok),
        "bodyMaskOk": copied_overlap == 0,
    }
    result["ok"] = bool(alignment and opening_ok and upper_body_ok and copied_overlap == 0)
    return result


def prompt_for(
    key: str,
    category: str,
    include_fitted_reference: bool = True,
) -> str:
    if category == "cloak":
        prompt = (
            "Image 1 is the authoritative 1024x1536 transparent mannequin in the exact front-facing pose. "
            "Image 2 is the exact shop product cloak design. "
            "Extract the exact cloak, preserving fabric RGB, seams, trim, sleeves, collar and silhouette, and fit it "
            "to the mannequin's neck approximately y=437, shoulders near y=469 and unchanged hanging-arm cuffs. "
            "Preserve every real product panel and opening: closed cloth stays solid, while genuine product openings "
            "remain transparent; never invent or fill a central hole. Output ONLY cloak pixels on transparent background: no neck, hands, cream shirt, gray pants, "
            "boots, face, hair, props or body fragments. This is semantic extraction, not recoloring or a new illustration."
        )
        if include_fitted_reference:
            prompt = prompt.replace(
                "Image 2 is the exact shop product cloak design. ",
                "Image 2 is the exact shop product cloak design. Image 3 is the already-generated fitted garment composite. ",
            )
        return prompt
    if category == "vest":
        front_note = " For vest-06 use only the FRONT panel on the left side of the supplied front/back product card; never use the back panel."
        prompt = (
            "Image 1 is the authoritative 1024x1536 transparent mannequin in the exact front-facing pose. "
            "Image 2 is the exact shop product vest design. "
            "Extract only this front vest and fit its collar, shoulders, armholes and hem to the unchanged mannequin "
            "coordinates (neck around y=469, shoulders around y=507). Preserve exact textile RGB, stitching, buttons, "
            "pockets and construction; do not recolor or redesign. The neck opening must be transparent. Output one "
            f"garment-only transparent RGBA layer: no neck skin, hands, sleeves, cream shirt, trousers, boots, face or body pixels.{front_note}"
        )
        if include_fitted_reference:
            prompt = prompt.replace(
                "Image 2 is the exact shop product vest design. ",
                "Image 2 is the exact shop product vest design. Image 3 is the already-generated fitted vest composite. ",
            )
        return prompt
    prompt = (
        "Image 1 is the authoritative 1024x1536 transparent mannequin in the exact front-facing pose. Image 2 is "
        "the exact shop product trouser design. Image 3 is the canonical two-fist grip-base pose. Generate only the exact pants garment, preserving its textile RGB, seams and "
        "details. Keep both legs in the unchanged pose and fit the waist near y=774 through the full broad leg region. "
        "The editable region covers x=200..824 and y=774..1400 (with arms/hands protected); do not narrow this to a "
        "slim old pants bbox. Return transparent pants-only RGBA pixels: no torso, hands, arms, face, shirt, props or boots."
    )
    if include_fitted_reference:
        prompt = prompt.replace(
            "Image 3 is the canonical two-fist grip-base pose. ",
            "Image 3 is the canonical two-fist grip-base pose. Image 4 is the existing lower-body reference. ",
        )
    return prompt


def ownership_mask(source: Image.Image) -> Image.Image:
    rgba = np.asarray(source.convert("RGBA"))
    yy, xx = np.indices((H, W))
    region = (((yy >= 774) & (yy < 975) & (xx >= 348) & (xx < 703)) | ((yy >= 975) & (xx >= 200) & (xx < 824)))
    alpha = rgba[:, :, 3] > 10
    result = region & alpha
    # At the top of the canonical band the two fist/arm silhouettes are
    # disconnected side runs.  Keep only substantial central-body runs so a
    # pants-base layer cannot reintroduce an arm fragment.  The lower band is
    # already two leg/boot runs and is retained exactly as specified.
    for y in range(774, 975):
        row = result[y].copy()
        indexes = np.flatnonzero(row)
        keep = np.zeros(W, dtype=bool)
        if indexes.size:
            start = int(indexes[0])
            previous = start
            runs: list[tuple[int, int]] = []
            for x in indexes[1:]:
                x = int(x)
                if x > previous + 1:
                    runs.append((start, previous + 1))
                    start = x
                previous = x
            runs.append((start, previous + 1))
            for start, end in runs:
                if end - start >= 30:
                    keep[start:end] = True
        result[y] = keep
    result = np.where(result, 255, 0).astype(np.uint8)
    return Image.fromarray(result, mode="L")


def save_webp(image: Image.Image, path: Path) -> bytes:
    data = webp_bytes(image)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data


def load_manifest() -> dict[str, object]:
    if not MANIFEST_PATH.is_file():
        return {
            "schema": "rigged-clothing-v1",
            "model": MODEL,
            "quality": QUALITY,
            "size": list(CANVAS),
            "maxAttempts": MAX_ATTEMPTS,
            "files": {},
            "qa": {},
            "failures": [],
        }
    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"schema": "rigged-clothing-v1", "model": MODEL, "quality": QUALITY, "size": list(CANVAS), "maxAttempts": MAX_ATTEMPTS, "files": {}, "qa": {}, "failures": []}
    if data.get("schema") != "rigged-clothing-v1":
        raise ValueError(f"unexpected manifest schema in {MANIFEST_PATH}")
    data.setdefault("files", {})
    data.setdefault("qa", {})
    data.setdefault("failures", [])
    return data


def write_manifest(manifest: dict[str, object]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    temp = MANIFEST_PATH.with_suffix(".json.tmp")
    temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(MANIFEST_PATH)


def record_entry(manifest: dict[str, object], key: str, entry: dict[str, object]) -> None:
    with _MANIFEST_LOCK:
        files = manifest.setdefault("files", {})
        assert isinstance(files, dict)
        files[key] = entry
        write_manifest(manifest)


def skip_entry(manifest: dict[str, object], key: str, input_hash: str) -> dict[str, object] | None:
    files = manifest.get("files", {})
    if not isinstance(files, dict):
        return None
    entry = files.get(key)
    if not isinstance(entry, dict) or entry.get("inputHash") != input_hash:
        return None
    if entry.get("qaStatus") == "failed" or entry.get("status") == "failed":
        return None
    path = OUT / str(entry.get("file", ""))
    raw = SOURCES / str(entry.get("rawFile", "")) if entry.get("rawFile") else None
    if not path.is_file() or entry.get("sha256") != sha256_file(path):
        return None
    if raw is not None and not raw.is_file():
        return None
    return entry


def base_entry(
    key: str,
    category: str,
    stage: str,
    output_path: Path,
    input_hash: str,
    sources: dict[str, object],
    prompt: str,
    registration: dict[str, object],
    ownership: dict[str, object],
) -> dict[str, object]:
    source_hashes = {
        name: value.get("sha256")
        for name, value in sources.items()
        if isinstance(value, dict) and value.get("sha256")
    }
    return {
        "key": key,
        "category": category,
        "stage": stage,
        "file": output_path.name,
        "inputHash": input_hash,
        "sources": sources,
        "sourceHashes": source_hashes,
        "model": MODEL,
        "quality": QUALITY,
        "promptSha256": sha256_bytes(prompt.encode()),
        "registration": registration,
        "ownership": ownership,
        "qaStatus": "pending-visual-review",
    }


def write_receipt(key: str, receipt: dict[str, object]) -> Path:
    SOURCES.mkdir(parents=True, exist_ok=True)
    path = SOURCES / f"{key}.json"
    path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def input_hash_for(source_paths: list[Path], prompt: str, mask: Image.Image, extra: dict[str, object] | None = None) -> str:
    payload = {
        "sources": [(rel(path), sha256_file(path)) for path in source_paths],
        "promptSha256": sha256_bytes(prompt.encode()),
        "maskSha256": sha256_bytes(png_bytes(mask)),
        "extra": extra or {},
    }
    return sha256_bytes(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode())


def make_prototype_entry(
    key: str,
    category: str,
    mannequin: Image.Image,
    current: Image.Image | None,
    product: Image.Image,
    manifest: dict[str, object],
    force: bool = False,
) -> dict[str, object]:
    prototype_png = PROTOTYPES / f"{key}.png"
    prototype_meta = PROTOTYPES / f"{key}.json"
    if not prototype_png.is_file() or not prototype_meta.is_file():
        raise FileNotFoundError(f"validated prototype missing: {key}")
    metadata = json.loads(prototype_meta.read_text(encoding="utf-8"))
    final = load_rgba(prototype_png)
    output_path = OUT / f"{key}.webp"
    output_data = save_webp(final, output_path)
    raw_source_name = f"{key}-prototype-raw.png"
    raw_source_path = SOURCES / raw_source_name
    existing_raw = PROTOTYPES / str(metadata.get("rawPath", f"{key}-raw.png"))
    if existing_raw.is_file():
        raw_source_path.write_bytes(existing_raw.read_bytes())
    prompt = str(metadata.get("prompt", "validated clean-garment prototype"))
    mask = mask_from_editable(make_editable(category))
    source_paths = [MANNEQUIN_PATH, CATALOG_PATH, DESIGNS / f"{key}.webp", prototype_png, prototype_meta]
    if current is not None:
        source_paths.append(DOLL_REFERENCE / f"{key}.webp")
    input_hash = input_hash_for(source_paths, prompt, mask, {"prototype": True, "metaSha256": sha256_file(prototype_meta)})
    old = None if force else skip_entry(manifest, key, input_hash)
    if old:
        return old
    registration = dict(metadata.get("sources", {}).get("ghostFit", {}))
    registration["method"] = "reused-validated-prototype"
    registration["prototypeMetadata"] = rel(prototype_meta)
    prototype_bbox = alpha_bbox(final)
    if prototype_bbox:
        px0, py0, px1, py1 = prototype_bbox
        registration["landmarks"] = {
            "collar": [(px0 + px1) // 2, py0],
            "shoulders": [[px0, py0 + 32], [px1, py0 + 32]],
            "cuffs": [[px0, min(py1, py0 + 330)], [px1, min(py1, py0 + 330)]],
        }
    selected_note = next(
        (
            note
            for note in metadata.get("attempts", [])
            if note.get("attempt") == metadata.get("selectedAttempt")
        ),
        {},
    )
    raw_bbox = selected_note.get("rawAlphaBbox") if isinstance(selected_note, dict) else None
    target_bbox = list(alpha_bbox(final) or ())
    raw_alpha_pixels = None
    if existing_raw.is_file():
        raw_alpha_pixels = alpha_pixels(load_rgba(existing_raw, canvas=False))
    if isinstance(raw_bbox, list) and len(raw_bbox) == 4 and len(target_bbox) == 4:
        raw_before_clamp = {
            "rawBbox": raw_bbox,
            "targetBbox": target_bbox,
            "rawAlphaPixels": raw_alpha_pixels,
            "fittedTargetPixels": alpha_pixels(final),
            "rawBeforeClampPixels": raw_alpha_pixels,
            "semanticAfterClampPixels": alpha_pixels(final),
            "removedPixels": (raw_alpha_pixels - alpha_pixels(final)) if raw_alpha_pixels is not None else None,
            "removedFraction": (
                (raw_alpha_pixels - alpha_pixels(final)) / raw_alpha_pixels
                if raw_alpha_pixels
                else None
            ),
            "directAlignment": bool(selected_note.get("rawDirectAlignmentOk", False)),
            "translation": [target_bbox[0] - raw_bbox[0], target_bbox[1] - raw_bbox[1]],
            "scale": [
                (target_bbox[2] - target_bbox[0]) / max(1, raw_bbox[2] - raw_bbox[0]),
                (target_bbox[3] - target_bbox[1]) / max(1, raw_bbox[3] - raw_bbox[1]),
            ],
            "source": "validated prototype metadata",
        }
    else:
        raw_before_clamp = {"source": "validated prototype metadata", "rawBbox": raw_bbox, "targetBbox": target_bbox}
    entry = base_entry(
        key,
        category,
        "paid",
        output_path,
        input_hash,
        {
            "mannequin": source_record(MANNEQUIN_PATH, mannequin),
            "catalog": {"path": rel(CATALOG_PATH), "sha256": sha256_file(CATALOG_PATH)},
            "product": source_record(DESIGNS / f"{key}.webp", product),
            "prototype": source_record(prototype_png, final),
            "prototypeMetadata": {"path": rel(prototype_meta), "sha256": sha256_file(prototype_meta)},
        },
        prompt,
        registration,
        {"type": "garment-alpha", "editableBox": list(EDITABLE_BOXES[category])},
    )
    entry.update({
        "status": "accepted-reused",
        "sha256": sha256_bytes(output_data),
        "size": list(final.size),
        "alphaBbox": list(alpha_bbox(final) or ()),
        "alphaPixels": alpha_pixels(final),
        "rawFile": raw_source_name if raw_source_path.is_file() else None,
        "rawBeforeClamp": {
            "source": rel(existing_raw),
            "sha256": sha256_file(existing_raw) if existing_raw.is_file() else None,
            **raw_before_clamp,
            "drift": raw_before_clamp,
        },
        "validation": {"ok": True, "source": "validated prototype metadata", "visual": "pending-visual-review"},
        "attempts": metadata.get("attempts", []),
    })
    write_receipt(key, {"schema": "rigged-clothing-receipt-v1", "key": key, "reusedPrototype": True, "sourceMetadata": rel(prototype_meta), "outputSha256": entry["sha256"]})
    record_entry(manifest, key, entry)
    return entry


def process_api_item(
    key: str,
    category: str,
    stage: str,
    character: str | None,
    mannequin: Image.Image,
    grip_base: Image.Image,
    manifest: dict[str, object],
    reuse_raw: bool = False,
    force: bool = False,
) -> dict[str, object]:
    current, current_path = (None, None) if CANDIDATE_MODE else current_layer(key)
    if category in {"cloak", "vest", "pants"} and current_path is None and not CANDIDATE_MODE:
        raise FileNotFoundError(f"missing current fitted layer for {key}")
    product, product_meta = product_image(key)
    product_info = product_meta
    prompt = prompt_for(key, category, include_fitted_reference=not CANDIDATE_MODE)
    current_composite = alpha_composite(mannequin, current) if current is not None else mannequin
    if category == "pants":
        references = [mannequin, product, grip_base]
        reference_paths = [MANNEQUIN_PATH, CATALOG_PATH, DESIGNS / f"{key}.webp", GRIP_BASE_PATH]
        if not CANDIDATE_MODE:
            references.append(current_composite)
            reference_paths.append(current_path or DOLL_REFERENCE / f"{key}.webp")
    else:
        references = [mannequin, product]
        reference_paths = [MANNEQUIN_PATH, CATALOG_PATH, DESIGNS / f"{key}.webp"]
        if not CANDIDATE_MODE:
            references.append(current_composite)
            reference_paths.append(current_path or DOLL_REFERENCE / f"{key}.webp")
    target = target_box(key, category, current)
    editable = make_editable(category)
    mask = mask_from_editable(editable)
    input_hash = input_hash_for(reference_paths, prompt, mask, {"target": target, "category": category, "stage": stage, "product": product_info})
    old = None if force else skip_entry(manifest, key, input_hash)
    if old:
        return old
    output_path = OUT / f"{key}.webp"
    attempts: list[dict[str, object]] = []
    candidates: list[tuple[int, Image.Image, bytes, dict[str, object], dict[str, object], str]] = []
    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.time()
        raw_name = f"{key}-attempt-{attempt}.png"
        raw_path = SOURCES / raw_name
        try:
            cached_raw_path = SOURCES / f"{key}-attempt-{attempt}.png"
            if reuse_raw:
                if not cached_raw_path.is_file():
                    raise RuntimeError(f"{key}: --reuse-raw requested but {cached_raw_path.name} is missing")
                if CANDIDATE_MODE:
                    receipt_path = SOURCES / f"{key}.json"
                    try:
                        cached_receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
                    except (OSError, ValueError) as error:
                        raise RuntimeError(f"{key}: candidate --reuse-raw requires a readable matching receipt") from error
                    if cached_receipt.get("inputHash") != input_hash:
                        raise RuntimeError(f"{key}: cached raw provenance does not match the alternate product sources")
                raw_png = cached_raw_path.read_bytes()
                if CANDIDATE_MODE:
                    attempt_record = next(
                        (
                            note for note in cached_receipt.get("attempts", [])
                            if isinstance(note, dict) and note.get("rawFile") == raw_name
                        ),
                        None,
                    )
                    if not isinstance(attempt_record, dict) or attempt_record.get("rawSha256") != sha256_bytes(raw_png):
                        raise RuntimeError(f"{key}: cached raw hash does not match its alternate-source receipt")
                raw = Image.open(io.BytesIO(raw_png)).convert("RGBA")
                if raw.size != CANVAS:
                    raise ValueError(f"{key}: cached raw output must be {CANVAS}, got {raw.size}")
            else:
                raw, raw_png = api_edit(prompt, references, mask, key)
            SOURCES.mkdir(parents=True, exist_ok=True)
            raw_path.write_bytes(raw_png)
            final, registration, stats = extract_garment(key, category, current, raw, mannequin, editable, product, target)
            validation = validate_output(
                key,
                category,
                final,
                current if category in {"cloak", "vest"} else None,
                mannequin,
                target,
                product,
            )
            note = {
                "attempt": attempt,
                "status": "accepted" if validation["ok"] else "rejected",
                "elapsedSeconds": round(time.time() - started, 3),
                "rawFile": raw_name,
                "rawSha256": sha256_bytes(raw_png),
                "rawSize": list(raw.size),
                "rawAlphaBbox": list(alpha_bbox(raw) or ()),
                "rawBeforeClampDrift": stats.get("rawDrift", {}),
                "extraction": stats,
                "validation": validation,
            }
            attempts.append(note)
            if validation["ok"]:
                candidates.append((int(stats.get("finalAlphaPixels", 0)), final, raw_png, registration, validation, raw_name))
                break
        except (OSError, RuntimeError, ValueError, KeyError, urllib.error.URLError, TimeoutError) as error:
            attempts.append({"attempt": attempt, "status": "error", "elapsedSeconds": round(time.time() - started, 3), "error": str(error), "rawFile": raw_name})
        if attempt < MAX_ATTEMPTS:
            time.sleep(2)
    receipt = {
        "schema": "rigged-clothing-receipt-v1",
        "key": key,
        "category": category,
        "stage": stage,
        "model": MODEL,
        "quality": QUALITY,
        "prompt": prompt,
        "promptSha256": sha256_bytes(prompt.encode()),
        "inputHash": input_hash,
        "sources": [(rel(path), sha256_file(path)) for path in reference_paths if path.is_file()],
        "attempts": attempts,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    write_receipt(key, receipt)
    if not candidates:
        entry = {
            "key": key,
            "category": category,
            "stage": stage,
            "file": output_path.name,
            "inputHash": input_hash,
            "status": "failed",
            "qaStatus": "failed",
            "sources": receipt["sources"],
            "attempts": attempts,
        }
        record_entry(manifest, key, entry)
        raise RuntimeError(f"{key}: no valid non-empty garment after {MAX_ATTEMPTS} attempts")
    _, final, selected_raw, registration, validation, selected_raw_name = max(candidates, key=lambda candidate: candidate[0])
    output_data = save_webp(final, output_path)
    selected_raw_path = SOURCES / f"{key}-raw.png"
    selected_raw_path.write_bytes(selected_raw)
    drift = next((note.get("rawBeforeClampDrift", {}) for note in attempts if note.get("rawFile") == selected_raw_name), {})
    ownership = {
        "type": "garment-alpha",
        "editableMask": {"path": "request-mask", "sha256": sha256_bytes(png_bytes(mask)), "pixels": int(editable.sum())},
        "forbidden": ["neck", "hands", "arms", "native-cream-shirt", "gray-pants", "boots", "face", "hair", "props"],
    }
    entry = base_entry(
        key,
        category,
        stage,
        output_path,
        input_hash,
        {
            "mannequin": source_record(MANNEQUIN_PATH, mannequin),
            "catalog": {"path": rel(CATALOG_PATH), "sha256": sha256_file(CATALOG_PATH)},
            "gripBase": source_record(GRIP_BASE_PATH, grip_base) if category == "pants" else None,
            "product": product_info,
            "currentLayer": source_record(current_path, current) if current is not None and current_path is not None else None,
        },
        prompt,
        registration,
        ownership,
    )
    entry.update({
        "status": "accepted",
        "sha256": sha256_bytes(output_data),
        "size": list(final.size),
        "alphaBbox": list(alpha_bbox(final) or ()),
        "alphaPixels": alpha_pixels(final),
        "rawFile": selected_raw_path.name,
        "rawPath": rel(selected_raw_path),
        "rawBeforeClamp": {**drift, "drift": drift},
        "attempts": attempts,
        "validation": validation,
    })
    record_entry(manifest, key, entry)
    log(f"{key}: accepted alpha={entry['alphaPixels']}")
    return entry


def build_pants_base(manifest: dict[str, object], grip_base: Image.Image) -> dict[str, object]:
    ownership = ownership_mask(grip_base)
    ownership_path = OUT / "pants-ownership.png"
    ownership_data = png_bytes(ownership)
    ownership_path.parent.mkdir(parents=True, exist_ok=True)
    ownership_path.write_bytes(ownership_data)
    source_arr = np.asarray(grip_base.convert("RGBA")).copy()
    source_arr[:, :, 3] = np.minimum(source_arr[:, :, 3], np.asarray(ownership))
    source_arr[source_arr[:, :, 3] < 10] = 0
    base = Image.fromarray(source_arr, mode="RGBA")
    output_path = OUT / "pants-base.webp"
    output_data = save_webp(base, output_path)
    entry = {
        "key": "pants-base",
        "category": "pants",
        "stage": "foundation",
        "file": output_path.name,
        "status": "accepted-extracted",
        "qaStatus": "pending-visual-review",
        "sha256": sha256_bytes(output_data),
        "size": list(base.size),
        "alphaBbox": list(alpha_bbox(base) or ()),
        "alphaPixels": alpha_pixels(base),
        "sources": {"gripBase": source_record(GRIP_BASE_PATH, grip_base)},
        "sourceHashes": {"gripBase": sha256_file(GRIP_BASE_PATH)},
        "ownership": {
            "maskFile": ownership_path.name,
            "maskSha256": sha256_bytes(ownership_data),
            "upperBand": [348, 774, 703, 975],
            "lowerBand": [200, 975, 824, 1536],
            "sourceAlphaApplied": True,
            "upperBodyTransparent": not np.asarray(base.getchannel("A"))[:774].any(),
        },
        "registration": {
            "method": "canonical-grip-base-extraction",
            "pose": "unchanged",
            "bootsPreserved": True,
            "landmarks": {
                "waist": [526, 774],
                "leftAnkle": [350, 1332],
                "rightAnkle": [702, 1332],
            },
        },
        "rawBeforeClamp": {
            "source": rel(GRIP_BASE_PATH),
            "drift": {"type": "none-extraction", "notApi": True},
        },
    }
    record_entry(manifest, "pants-base", entry)
    return entry


def tint_layer(image: Image.Image, color: str) -> Image.Image:
    arr = np.asarray(image.convert("RGBA"), dtype=np.float32)
    luminance = np.asarray(image.convert("L"), dtype=np.float32) / 255.0
    rgb = np.array(tuple(bytes.fromhex(color.lstrip("#"))), dtype=np.float32)
    light = 0.32 + 1.18 * luminance[:, :, None]
    arr[:, :, :3] = np.clip(rgb[None, None, :] * light, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), mode="RGBA")


def qa_red_pants(body: Image.Image) -> Image.Image:
    ownership = ownership_mask(body)
    red = tint_layer(body, "#e83d4f")
    red_alpha = np.asarray(ownership, dtype=np.uint8)
    red_arr = np.asarray(red).copy()
    red_arr[:, :, 3] = np.minimum(red_arr[:, :, 3], red_alpha)
    return Image.fromarray(red_arr, mode="RGBA")


def qa_underlayers(body: Image.Image, vest: Image.Image) -> Image.Image:
    red = qa_red_pants(body)
    teal = tint_layer(vest, "#00d7c6")
    return alpha_composite(body, red, teal)


def thumbnail(image: Image.Image, width: int = 320, height: int = 480) -> Image.Image:
    scale = min(width / image.width, height / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    resized = image.resize(size, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (width, height), (239, 234, 226, 255))
    cell.alpha_composite(resized, ((width - size[0]) // 2, (height - size[1]) // 2))
    return cell


def make_sheet(name: str, keys: list[str], body: Image.Image, vest: Image.Image, manifests: dict[str, object], mode: str) -> Path:
    cell_w, cell_h, label_h = 320, 480, 34
    columns = 3
    sheet = Image.new("RGB", (cell_w * columns, (cell_h + label_h) * len(keys)), "#e5ddd2")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    base_under = qa_underlayers(body, vest)
    for row, key in enumerate(keys):
        path = OUT / f"{key}.webp"
        if not path.is_file():
            continue
        garment = load_rgba(path)
        under = base_under if mode != "pants" else qa_underlayers(body, vest)
        composite = alpha_composite(under, garment)
        raw_path = manifests.get(key, {}).get("rawFile") if isinstance(manifests.get(key), dict) else None
        raw = load_rgba(SOURCES / raw_path) if raw_path and (SOURCES / raw_path).is_file() else garment
        cells = (under, composite, raw)
        labels = (f"{key} · teal vest + red pants", f"{key} · cleaned garment", f"{key} · raw source")
        for column, (cell, label) in enumerate(zip(cells, labels)):
            x, y = column * cell_w, row * (cell_h + label_h)
            draw.rectangle((x, y, x + cell_w - 1, y + label_h - 1), fill="#2d2930")
            draw.text((x + 8, y + 8), label, fill="white", font=font)
            sheet.paste(thumbnail(cell, cell_w, cell_h).convert("RGB"), (x, y + label_h))
    output_path = QA_DIR / name
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path, format="PNG")
    return output_path


def make_stack_sheet(name: str, keys: tuple[str, str, str], body: Image.Image, vest: Image.Image, manifests: dict[str, object]) -> Path:
    cloak_key, vest_key, pants_key = keys
    # Sentinel underlayers intentionally use a bright teal vest and red native
    # lower body.  This exposes copied cream-shirt/gray-pants pixels in the
    # cloak, exactly as the prototype QA sheet does.
    under = qa_underlayers(body, vest)
    composite = alpha_composite(under, load_rgba(OUT / f"{cloak_key}.webp"))
    sheet = Image.new("RGB", (960, 514), "#e5ddd2")
    draw = ImageDraw.Draw(sheet)
    for column, (cell, label) in enumerate(((under, f"{name} · teal vest + red pants"), (composite, f"{name} · full stack"), (load_rgba(OUT / f"{cloak_key}.webp"), f"{name} · cloak"))):
        x = column * 320
        draw.rectangle((x, 0, x + 319, 33), fill="#2d2930")
        draw.text((x + 8, 8), label, fill="white")
        sheet.paste(thumbnail(cell, 320, 480).convert("RGB"), (x, 34))
    path = QA_DIR / name
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, format="PNG")
    return path


def make_qas(manifest: dict[str, object], body: Image.Image, vest: Image.Image) -> None:
    files = manifest.get("files", {})
    assert isinstance(files, dict)
    paid_cloak_sheet = make_sheet("qa-cloaks.png", list(PAID_CLOAKS), body, vest, files, "cloak")
    paid_vest_sheet = make_sheet("qa-vests.png", list(PAID_VESTS), body, vest, files, "vest")
    paid_pants_sheet = make_sheet("qa-pants.png", list(PAID_PANTS), body, vest, files, "pants")
    cheap_sheet = make_stack_sheet("qa-cheapstack-01.png", ("cloak-01", "vest-01", "pants-01"), body, vest, files)
    luxury_sheet = make_stack_sheet("qa-luxury-12.png", ("cloak-12", "vest-12", "pants-12"), body, vest, files)
    qa_files = {
        path.name: {"path": rel(path), "sha256": sha256_file(path), "visualStatus": "pending-visual-review"}
        for path in (paid_cloak_sheet, paid_vest_sheet, paid_pants_sheet, cheap_sheet, luxury_sheet)
    }
    manifest["qa"] = qa_files
    manifest["qaStatus"] = "pending-visual-review"
    write_manifest(manifest)


def mark_visual_review(manifest: dict[str, object], status: str, note: str) -> None:
    if status not in {"passed", "failed"}:
        raise ValueError("review status must be passed or failed")
    qa = manifest.get("qa", {})
    if not isinstance(qa, dict) or not qa:
        raise RuntimeError("QA sheets do not exist; run generation first")
    for entry in qa.values():
        if isinstance(entry, dict):
            entry["visualStatus"] = status
            entry["reviewNote"] = note
    files = manifest.get("files", {})
    if isinstance(files, dict):
        for entry in files.values():
            if isinstance(entry, dict) and entry.get("status") != "failed":
                entry["qaStatus"] = "visual-review-passed" if status == "passed" else "failed"
                entry.setdefault("validation", {})
                if isinstance(entry["validation"], dict):
                    entry["validation"]["visual"] = status
    manifest["qaStatus"] = "visual-review-passed" if status == "passed" else "failed"
    manifest["visualReview"] = {"status": status, "note": note, "reviewedAt": datetime.now(timezone.utc).isoformat()}
    write_manifest(manifest)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workers", type=int, default=MAX_WORKERS)
    parser.add_argument("--force", action="store_true", help="regenerate API items even when hash-matched output exists")
    parser.add_argument("--only", nargs="+", help="generate only the listed clothing keys")
    parser.add_argument(
        "--reuse-raw",
        action="store_true",
        help="reprocess cached API responses without making additional API calls",
    )
    parser.add_argument("--catalog", type=Path, metavar="PATH", help="catalog JSON (alternate collections require isolated output/raw directories)")
    parser.add_argument("--design-dir", type=Path, metavar="PATH", help="directory containing exact product design references")
    parser.add_argument("--output-dir", type=Path, metavar="PATH", help="directory for cleaned garment layers and manifest")
    parser.add_argument("--raw-dir", type=Path, metavar="PATH", help="directory for API responses and receipts")
    parser.add_argument("--qa-dir", type=Path, metavar="PATH", help="directory for visual QA sheets")
    parser.add_argument("--review", choices=("passed", "failed"), help="mark already-viewed QA sheets honestly")
    parser.add_argument("--review-note", default="", help="evidence note stored with --review")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    configure_paths(args)
    configure_catalog(load_catalog(CATALOG_PATH))
    OUT.mkdir(parents=True, exist_ok=True)
    SOURCES.mkdir(parents=True, exist_ok=True)
    QA_DIR.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest()
    if args.review:
        mark_visual_review(manifest, args.review, args.review_note or "QA sheets viewed by operator")
        print(f"visual review: {args.review}")
        return 0

    mannequin = load_rgba(MANNEQUIN_PATH)
    grip_base = load_rgba(GRIP_BASE_PATH)
    vest_reference = (
        load_rgba(PROTOTYPES / "vest-01.png")
        if not CANDIDATE_MODE
        else Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    )
    build_pants_base(manifest, grip_base)

    failures: list[dict[str, str]] = []
    records: dict[str, object] = {}

    # The alternate collection must derive every paid garment from its new
    # product reference.  The default collection keeps the validated
    # prototypes for the existing game build.
    if not CANDIDATE_MODE:
        for key, category in (("cloak-01", "cloak"), ("cloak-12", "cloak"), ("vest-01", "vest")):
            try:
                product, _ = product_image(key)
                current, _ = current_layer(key)
                records[key] = make_prototype_entry(key, category, mannequin, current, product, manifest, args.force)
            except Exception as error:
                failures.append({"key": key, "error": str(error)})

    tasks: list[tuple[str, str, str, str | None]] = []
    selected = set(args.only or ())
    unknown = selected - set(ALL_ITEMS)
    if unknown:
        raise ValueError(f"Unknown clothing keys: {sorted(unknown)}")
    prototype_keys = {"cloak-01", "cloak-12", "vest-01"} if not CANDIDATE_MODE else set()
    tasks.extend((key, "cloak", "paid", None) for key in PAID_CLOAKS if key not in prototype_keys)
    tasks.extend((key, "vest", "paid", None) for key in PAID_VESTS if key not in prototype_keys)
    tasks.extend((key, "pants", "paid", None) for key in PAID_PANTS)
    if selected:
        tasks = [task for task in tasks if task[0] in selected]

    workers = max(1, min(int(args.workers), MAX_WORKERS))
    with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="rigged-clothing") as pool:
        futures = {
            pool.submit(
                process_api_item,
                key,
                category,
                stage,
                character,
                mannequin,
                grip_base,
                manifest,
                args.reuse_raw,
                args.force,
            ): key
            for key, category, stage, character in tasks
        }
        for future in as_completed(futures):
            key = futures[future]
            try:
                records[key] = future.result()
            except Exception as error:
                failures.append({"key": key, "error": str(error)})
                log(f"{key}: FAILED: {error}")

    manifest["failures"] = failures
    manifest["createdAt"] = manifest.get("createdAt", datetime.now(timezone.utc).isoformat())
    manifest["updatedAt"] = datetime.now(timezone.utc).isoformat()
    write_manifest(manifest)
    if not failures:
        if CANDIDATE_MODE:
            candidate_vest = OUT / "vest-01.webp"
            if candidate_vest.is_file():
                vest_reference = load_rgba(candidate_vest)
        make_qas(manifest, mannequin, vest_reference)
    else:
        log(json.dumps({"failures": failures}, ensure_ascii=False))
        return 1
    print(f"generated {len(manifest.get('files', {}))} clothing files; API calls={_API_CALLS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
