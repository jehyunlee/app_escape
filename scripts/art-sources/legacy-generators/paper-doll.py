"""Paper-doll pipeline: one shared mannequin body + per-character heads +
masked-inpainting garments/hats generated with the OpenAI Images API.

Stages (run in order, each gated by a human approval checkpoint via IRC):
    body        -> assets/doll/mannequin.png
    landmarks   -> assets/doll/landmarks.json + QA overlay (WAITS for approval)
    zones       -> library only, no API calls (used by later stages)
    heads       -> assets/doll/{char}-{mood}.webp, {char}-portrait.webp, body.webp
    hats        -> assets/doll/{char}-hat-XX.webp  (6 chars x 12 hats)
    garments    -> assets/doll/{itemId}.webp        (84 non-hat items)
    starters    -> assets/doll/{char}-base-{hat,cloak,wand,broom}.webp
    sheets      -> QA contact sheets under /tmp/paper-doll-qa/

Usage:
    python3 scripts/paper-doll.py <stage> [--only id] [--force]

This script only ever writes under assets/doll/ and /tmp/paper-doll-qa/.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import math
import os
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import urllib.error
import urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WIZARDS = ROOT / "assets" / "wizards"
DESIGNS = ROOT / "assets" / "shop-designs"
CATALOG_PATH = ROOT / "assets" / "wardrobe-catalog.json"
OUT = ROOT / "assets" / "doll"
QA = Path("/tmp/paper-doll-qa")
MANIFEST_PATH = OUT / "manifest.json"

MODEL = "gpt-image-2.5-sunburst"
CANVAS = (1024, 1536)
W, H = CANVAS

CHARACTERS = ("dad", "mom", "jeongan", "suan", "yewon", "hunho")
MOODS = ("neutral", "happy", "sad")

# dad, jeongan, yewon wear glasses in the existing sprites (per assets/wizards/*.json
# design prompts); suan, hunho do not. hunho keeps a small antler circlet.
GLASSES = {"dad", "mom", "jeongan", "yewon"}
ANTLERS = {"hunho"}

# dad/mom/jeongan/suan were originally generated from stylised caricature line-art
# (assets/family-characters.webp), not photos; passing only the beautified sunburst
# sprite as identity reference lost that grounding and the model defaulted to
# generic/Western facial rendering. Re-include the original caricature crop as an
# extra identity reference for those four so hair silhouette, glasses shape and
# proportions stay anchored, and make the Korean-features instruction explicit
# in the prompt for every character.
CARICATURE_SOURCE = ROOT / "assets" / "family-characters.webp"
CARICATURE_CROPS = {
    "dad": (32, 36, 552, 556),
    "mom": (600, 50, 1170, 570),
    "jeongan": (620, 555, 1165, 1000),
    "suan": (45, 550, 625, 1005),
}
KOREAN_FEATURES_CLAUSE = (
    "This is a Korean family member: render East Asian Korean facial features "
    "(monolid or subtle double-eyelid eyes, straight dark hair, warm ivory-tan "
    "skin tone) -- do not default to Western facial proportions or lighter hair/eye "
    "colouring."
)


def head_identity_references(char: str) -> list[Image.Image]:
    """Extra identity-anchoring reference images for the head-swap edit call,
    beyond the primary {char}-neutral.webp reference."""
    extra = []
    crop_box = CARICATURE_CROPS.get(char)
    if crop_box and CARICATURE_SOURCE.is_file():
        caricature = Image.open(CARICATURE_SOURCE).convert("RGBA").crop(crop_box)
        extra.append(caricature)
    return extra

CATEGORIES = ("hat", "necklace", "cloak", "wand", "broom", "gloves", "pants", "vest")
COVERAGE_MIN = {
    "hat": 0.12,
    "cloak": 0.25,
    "pants": 0.25,
    "vest": 0.20,
    "gloves": 0.30,
    "necklace": 0.03,
    "wand": 0.03,
    "broom": 0.06,
    "head": 0.12,
    "face": 0.25,
}
DRIFT_MAX = 0.015

STYLE_SNIPPET = (
    "high-end stylized 3D animated-feature character art, softly rounded chibi "
    "proportions matching the reference's head-to-body ratio, soft cinematic "
    "studio rim lighting, polished and charming; same consistent art style as "
    "the reference image throughout."
)

STARTER_ITEMS = {
    "dad-base-hat": ("dad", "hat", "A navy-blue pointed astronomy wizard hat with gold constellation embroidery, matching this character's signature colors."),
    "mom-base-hat": ("mom", "hat", "A sculptural emerald-green wide-brim pointed hat with tiny botanical embroidery, matching this character's signature colors."),
    "jeongan-base-hat": ("jeongan", "hat", "A tilted violet pointed hat with a silver crescent ornament, matching this character's signature colors."),
    "suan-base-hat": ("suan", "hat", "A small sapphire-blue pointed scholar's hat, matching this character's signature colors."),
    "yewon-base-hat": ("yewon", "hat", "A jaunty coral-red pointed hat with a gold feather, matching this character's signature colors."),
    "dad-base-cloak": ("dad", "cloak", "An elegant midnight-blue layered coat with gold constellation embroidery, waistcoat and brass buckles, matching this character's signature colors."),
    "mom-base-cloak": ("mom", "cloak", "A sophisticated forest-green layered robe with a flowing short cape and gold leaf clasps, matching this character's signature colors."),
    "jeongan-base-cloak": ("jeongan", "cloak", "A layered deep-violet coat with cyan lining and a short asymmetric star-pattern cape, matching this character's signature colors."),
    "suan-base-cloak": ("suan", "cloak", "A deep sapphire-blue fitted scholar's cloak with silver piping over a structured waistcoat, matching this character's signature colors."),
    "yewon-base-cloak": ("yewon", "cloak", "A tailored coral and amber flight coat with a cream scarf and warm gold toggles, matching this character's signature colors."),
    "hunho-base-cloak": ("hunho", "cloak", "A rich burgundy and silver frontier explorer coat with a fitted silver vest and leather belt, matching this character's signature colors."),
    "dad-base-wand": ("dad", "wand", "A slender celestial wand with delicate metallic star details, matching this character's signature colors."),
    "mom-base-wand": ("mom", "wand", "A graceful living-wood leafy staff topped with a luminous leaf-shaped emerald gem, matching this character's signature colors."),
    "jeongan-base-wand": ("jeongan", "wand", "A silver wand with a small crescent-and-star ornament at the tip, matching this character's signature colors."),
    "yewon-base-wand": ("yewon", "wand", "A slim blue-and-silver scholar's wand, matching this character's signature colors."),
    "suan-base-broom": ("suan", "broom", "A beautifully detailed full-length wooden flying broom with a recognizable large golden straw head, matching this character's signature colors."),
    "hunho-base-broom": ("hunho", "broom", "A long travelling broom with a sturdy wooden handle, matching this character's signature colors."),
}


# --------------------------------------------------------------------------
# HTTP / API plumbing
# --------------------------------------------------------------------------

def _multipart(fields: dict, images: list[tuple[str, bytes]], mask: bytes | None):
    boundary = "paperdoll-" + uuid.uuid4().hex
    chunks = []

    def field(name, value):
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )

    for name, value in fields.items():
        field(name, value)
    for filename, data in images:
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="{filename}"\r\n'
            f'Content-Type: image/png\r\n\r\n'.encode()
        )
        chunks.append(data)
        chunks.append(b"\r\n")
    if mask is not None:
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="mask"; filename="mask.png"\r\n'
            f'Content-Type: image/png\r\n\r\n'.encode()
        )
        chunks.append(mask)
        chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), boundary


def _png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGBA").save(buffer, format="PNG")
    return buffer.getvalue()


def api_edit(prompt: str, images: list[Image.Image], mask: Image.Image | None, retries: int = 3) -> Image.Image:
    """Call /v1/images/edits with one or more reference images and an optional mask."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    image_payload = [(f"ref{i}.png", _png_bytes(image)) for i, image in enumerate(images)]
    mask_payload = _png_bytes(mask) if mask is not None else None
    fields = {
        "model": MODEL,
        "prompt": prompt,
        "size": f"{W}x{H}",
        "quality": "high",
        "background": "transparent",
        "output_format": "png",
        "n": "1",
    }
    payload, boundary = _multipart(fields, image_payload, mask_payload)
    last_error = None
    for attempt in range(retries):
        request = urllib.request.Request(
            "https://api.openai.com/v1/images/edits",
            data=payload,
            headers={
                "Authorization": "Bearer " + api_key,
                "Content-Type": f"multipart/form-data; boundary={boundary}",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=300) as response:
                result = json.load(response)
            encoded = result["data"][0]["b64_json"]
            return Image.open(io.BytesIO(base64.b64decode(encoded, validate=True))).convert("RGBA")
        except urllib.error.HTTPError as error:
            body = error.read()
            try:
                detail = json.loads(body).get("error", {}).get("message", "image API error")
            except ValueError:
                detail = "image API error"
            last_error = RuntimeError(f"HTTP {error.code}: {detail}")
            if error.code not in (429, 500, 502, 503, 504) or attempt == retries - 1:
                raise last_error
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = RuntimeError(str(error))
            if attempt == retries - 1:
                raise last_error
        time.sleep(2 ** attempt * 2)
    raise last_error


# --------------------------------------------------------------------------
# Manifest
# --------------------------------------------------------------------------

def load_manifest() -> dict:
    if MANIFEST_PATH.is_file():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    else:
        manifest = {}
    manifest["model"] = MODEL
    manifest.setdefault("quality", "high")
    manifest["canvas"] = [W, H]
    landmarks_path = OUT / "landmarks.json"
    if landmarks_path.is_file():
        manifest["landmarks"] = json.loads(landmarks_path.read_text(encoding="utf-8"))
    else:
        manifest.setdefault("landmarks", {})
    manifest.setdefault("outputs", {})
    manifest.setdefault("failures", [])
    manifest.setdefault("flagged", {})
    manifest["generatedAt"] = datetime.now(timezone.utc).isoformat()
    return manifest


_MANIFEST_LOCK = threading.Lock()


def save_manifest(manifest: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with _MANIFEST_LOCK:
        tmp = MANIFEST_PATH.with_suffix(f".part-{uuid.uuid4().hex}.json")
        tmp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        tmp.replace(MANIFEST_PATH)


def record_output(manifest: dict, filename: str, image: Image.Image, *, stage: str,
                   prompt: str, source: str, reference: str | None = None,
                   character: str | None = None, item: str | None = None,
                   category: str | None = None, coverage: float | None = None,
                   drift: float | None = None, attempts: int = 1,
                   hair_stability: float | None = None, cheek_delta_e: float | None = None) -> None:
    width, height = image.size
    alpha_bbox = image.convert("RGBA").getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    entry = {
        "stage": stage,
        "width": width,
        "height": height,
        "bbox": list(alpha_bbox) if alpha_bbox else None,
        "coverage": coverage,
        "drift": drift,
        "attempts": attempts,
        "prompt": prompt,
        "source": source,
        "reference": reference,
    }
    if character is not None:
        entry["character"] = character
    if item is not None:
        entry["item"] = item
    if category is not None:
        entry["category"] = category
    if hair_stability is not None:
        entry["hairStability"] = hair_stability
    if cheek_delta_e is not None:
        entry["cheekDeltaE"] = cheek_delta_e
    with _MANIFEST_LOCK:
        manifest["outputs"][filename] = entry
    save_manifest(manifest)


def record_failure(manifest: dict, filename: str, reason: str) -> None:
    with _MANIFEST_LOCK:
        manifest["failures"] = [f for f in manifest["failures"] if f.get("file") != filename]
        manifest["failures"].append({"file": filename, "reason": reason})
    save_manifest(manifest)


# --------------------------------------------------------------------------
# Image helpers
# --------------------------------------------------------------------------

def alpha_array(image: Image.Image) -> np.ndarray:
    return np.asarray(image.convert("RGBA"))[:, :, 3]


def rgb_array(image: Image.Image) -> np.ndarray:
    return np.asarray(image.convert("RGBA"))[:, :, :3].astype(np.int32)


def save_webp(image: Image.Image, path: Path, quality: int = 90) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".part.webp")
    zero_faint_alpha(image).save(tmp, format="WEBP", quality=quality, method=6)
    tmp.replace(path)


def save_png_atomic(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".part.png")
    zero_faint_alpha(image).save(tmp, format="PNG")
    tmp.replace(path)


def _dilate_bool(mask: np.ndarray, pixels: int) -> np.ndarray:
    """Dilate a boolean mask by `pixels` using a box-max approach (no scipy dependency)."""
    if pixels <= 0:
        return mask
    result = mask.copy()
    # separable box dilation via cumulative max is complex; use simple iterative
    # PIL-based approach for correctness (bounded canvas sizes keep this fast).
    img = Image.fromarray((mask * 255).astype(np.uint8))
    img = img.filter(_make_maxfilter(pixels))
    return np.asarray(img) > 127


def _make_maxfilter(radius: int):
    from PIL import ImageFilter
    size = radius * 2 + 1
    return ImageFilter.MaxFilter(size if size % 2 == 1 else size + 1)


def mask_from_editable(editable_bool: np.ndarray) -> Image.Image:
    """Build an RGBA mask PNG: alpha 0 where editable, 255 elsewhere."""
    alpha = np.where(editable_bool, 0, 255).astype(np.uint8)
    rgb = np.zeros((*alpha.shape, 3), dtype=np.uint8)
    rgba = np.dstack([rgb, alpha])
    return Image.fromarray(rgba, mode="RGBA")


def changed_pixels(before: Image.Image, after: Image.Image, threshold: int = 28) -> np.ndarray:
    a = rgb_array(before)
    b = rgb_array(after)
    dist = np.sqrt(((a - b) ** 2).sum(axis=2))
    alpha_after = alpha_array(after)
    return (dist > threshold) & (alpha_after > 10)


def close_open(mask: np.ndarray, close_px: int = 3, open_px: int = 2) -> np.ndarray:
    img = Image.fromarray((mask * 255).astype(np.uint8))
    from PIL import ImageFilter
    if close_px > 0:
        img = img.filter(_make_maxfilter(close_px)).filter(ImageFilter.MinFilter(close_px * 2 + 1))
    if open_px > 0:
        img = img.filter(ImageFilter.MinFilter(open_px * 2 + 1)).filter(_make_maxfilter(open_px))
    return np.asarray(img) > 127


def feather(mask_bool: np.ndarray, radius: int = 1) -> np.ndarray:
    img = Image.fromarray((mask_bool * 255).astype(np.uint8))
    from PIL import ImageFilter
    img = img.filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(img).astype(np.float32) / 255.0


def zero_faint_alpha(image: Image.Image, threshold: int = 10) -> Image.Image:
    """Zero out any pixel whose alpha is below `threshold` (stray noise cleanup)."""
    rgba = np.asarray(image.convert("RGBA")).copy()
    faint = rgba[:, :, 3] < threshold
    rgba[faint] = 0
    return Image.fromarray(rgba, mode="RGBA")


def remove_small_fragments(layer: Image.Image, head_silhouette: np.ndarray | None = None,
                           min_area_fraction: float = 0.04) -> tuple[Image.Image, int]:
    """Keep a connected alpha component only if it is >=min_area_fraction of
    the largest component AND its bounding box intersects the head silhouette
    (dilated 24px) when one is supplied -- a floating piece with no contact to
    the head is a fragment regardless of size. Returns (layer, fragments_removed).
    """
    from scipy import ndimage

    arr = np.asarray(layer.convert("RGBA")).copy()
    alpha_mask = arr[:, :, 3] > 10
    labeled, count = ndimage.label(alpha_mask)
    if count <= 1:
        return layer, 0
    sizes = ndimage.sum(alpha_mask, labeled, index=range(1, count + 1))
    largest = sizes.max()
    size_threshold = largest * min_area_fraction

    head_dilated = _dilate_bool(head_silhouette, 24) if head_silhouette is not None else None

    keep_labels = []
    for i, size in enumerate(sizes):
        label_id = i + 1
        if size < size_threshold:
            continue
        if head_dilated is not None and not ((labeled == label_id) & head_dilated).any():
            continue
        keep_labels.append(label_id)
    removed = count - len(keep_labels)
    if removed == 0:
        return layer, 0
    keep_mask = np.isin(labeled, keep_labels)
    arr[~keep_mask, 3] = 0
    return Image.fromarray(arr, mode="RGBA"), removed


def extract_zone_layer(before: Image.Image, after: Image.Image, zone: np.ndarray) -> Image.Image:
    """Build a garment/hat/starter layer: changed pixels within `zone`, against
    the already-cleaned `before` image (alpha<10 zeroed), feathered at the edge."""
    before = zero_faint_alpha(before)
    after = zero_faint_alpha(after)
    changed = changed_pixels(before, after) & zone
    changed = close_open(changed, close_px=2, open_px=1)
    alpha_mask = feather(changed, radius=1)
    rgba = np.asarray(after).copy()
    rgba[:, :, 3] = np.clip(alpha_mask * 255, 0, 255).astype(np.uint8)
    layer = Image.fromarray(rgba, mode="RGBA")
    return zero_faint_alpha(layer)


# --------------------------------------------------------------------------
# QA metrics
# --------------------------------------------------------------------------

def clamp_to_mask(before: Image.Image, after: Image.Image, editable_bool: np.ndarray, dilate_px: int = 6) -> Image.Image:
    """Restore every pixel outside the (dilated) editable region from `before`,
    so the API's global color-grading drift never leaks outside the mask."""
    dilated = _dilate_bool(editable_bool, dilate_px)
    before_rgba = np.asarray(before.convert("RGBA"))
    after_rgba = np.asarray(after.convert("RGBA"))
    out = after_rgba.copy()
    out[~dilated] = before_rgba[~dilated]
    return Image.fromarray(out, mode="RGBA")


def qa_outside_mask_drift(before: Image.Image, after: Image.Image, editable_bool: np.ndarray, dilate_px: int = 6) -> float:
    dilated = _dilate_bool(editable_bool, dilate_px)
    outside = ~dilated
    a = rgb_array(before)
    b = rgb_array(after)
    dist = np.sqrt(((a - b) ** 2).sum(axis=2))
    total_outside = outside.sum()
    if total_outside == 0:
        return 0.0
    drifted = ((dist > 40) & outside).sum()
    return float(drifted) / float(total_outside)


def qa_coverage(before: Image.Image, after: Image.Image, editable_bool: np.ndarray) -> float:
    area = editable_bool.sum()
    if area == 0:
        return 0.0
    changed = changed_pixels(before, after) & editable_bool
    return float(changed.sum()) / float(area)


def qa_hat_crown(before: Image.Image, after: Image.Image, editable_bool: np.ndarray,
                 landmarks: dict) -> tuple[bool, dict]:
    """Crown-coverage checks for a hat edit, evaluated at the eyebrow row (not
    the mask edge): the hat layer must cover >=70% of the head-alpha width at
    that row, and the changed-pixel bbox width must be >=0.9x head width. If
    a short cap sits slightly above the eyebrows, accept a secondary check at
    eyebrow-0.03H with the same thresholds. Returns (ok, details).
    """
    fig = landmarks["figure"]
    fig_h = fig[3] - fig[1]
    face = landmarks["faceBox"]
    eyebrow = landmarks["eyebrow"]
    head_width = face[2] - face[0]
    changed = changed_pixels(before, after) & editable_bool
    ys, xs = np.where(changed)
    if len(xs) == 0:
        return False, {"bboxWidthRatio": 0.0, "brimCoverageRatio": 0.0}
    bbox_width = xs.max() - xs.min()
    bbox_ratio = bbox_width / head_width if head_width else 0.0

    before_alpha = alpha_array(before)

    def brim_ratio_at(row: int) -> float:
        row = max(0, min(H - 1, row))
        head_alpha_row = before_alpha[row, :] > 10
        head_cols = np.where(head_alpha_row)[0]
        head_row_width = (head_cols.max() - head_cols.min()) if len(head_cols) else head_width
        changed_row_width = changed[row, :].sum()
        return changed_row_width / head_row_width if head_row_width else 0.0

    primary_ratio = brim_ratio_at(eyebrow)
    secondary_ratio = brim_ratio_at(int(round(eyebrow - 0.03 * fig_h)))
    extended_ratio = brim_ratio_at(int(round(eyebrow + 0.06 * fig_h)))
    brim_ratio = max(primary_ratio, secondary_ratio, extended_ratio)

    ok = bbox_ratio >= 0.9 and brim_ratio >= 0.70
    return ok, {"bboxWidthRatio": float(bbox_ratio), "brimCoverageRatio": float(brim_ratio)}


def qa_hair_stability(landmarks: dict, images: dict[str, Image.Image]) -> float:
    # Exclude the eyebrow itself (mood expressions legitimately move eyebrows):
    # band is [eyebrow-0.12H, eyebrow-0.03H), clamped to the figure top.
    eyebrow = landmarks["eyebrow"]
    figure = landmarks["figure"]
    fig_h = figure[3] - figure[1]
    y0 = max(figure[1], int(round(eyebrow - 0.12 * fig_h)))
    y1 = max(y0 + 1, int(round(eyebrow - 0.03 * fig_h)))
    band = (slice(y0, y1), slice(figure[0], figure[2]))
    ref = rgb_array(images["neutral"])[band]
    diffs = []
    for mood in ("happy", "sad"):
        other = rgb_array(images[mood])[band]
        diffs.append(float(np.sqrt(((ref - other) ** 2).sum(axis=2)).mean()))
    return max(diffs)


def srgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """Vectorised sRGB (0-255, ..., 3) -> CIE Lab (D65) conversion, no scipy/skimage dependency."""
    srgb = rgb.astype(np.float64) / 255.0
    linear = np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)
    r, g, b = linear[..., 0], linear[..., 1], linear[..., 2]
    x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
    y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
    z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041
    # D65 white point
    xn, yn, zn = 0.95047, 1.0, 1.08883
    xr, yr, zr = x / xn, y / yn, z / zn

    def f(t):
        delta = 6.0 / 29.0
        return np.where(t > delta ** 3, np.cbrt(t), t / (3 * delta ** 2) + 4.0 / 29.0)

    fx, fy, fz = f(xr), f(yr), f(zr)
    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    b_ = 200.0 * (fy - fz)
    return np.stack([L, a, b_], axis=-1)


def qa_cheek_delta_e(landmarks: dict, images: dict[str, Image.Image]) -> float:
    """Max CIE76 Delta-E of the nose-bridge skin colour across happy/sad vs
    neutral. The nose bridge (between the eyes, above the nose tip) is the one
    small facial region that stays skin in every mood (unlike the wider cheeks,
    it does not get crossed by a smiling mouth or by hair/glasses-frame edges
    that shift slightly between independently generated moods and characters).
    """
    face = landmarks["faceBox"]
    fx0, fy0, fx1, fy1 = face
    face_w = fx1 - fx0
    face_h = fy1 - fy0
    cx = (fx0 + fx1) // 2
    by0 = fy0 + int(round(0.42 * face_h))
    by1 = fy0 + int(round(0.52 * face_h))
    bx0 = cx - int(round(0.045 * face_w))
    bx1 = cx + int(round(0.045 * face_w))

    def cheek_lab(image: Image.Image) -> np.ndarray:
        rgba = np.asarray(image.convert("RGBA"))
        rgb = rgba[:, :, :3].astype(np.int32)
        alpha = rgba[:, :, 3]
        patch_rgb = rgb[by0:by1, bx0:bx1].reshape(-1, 3)
        patch_alpha = alpha[by0:by1, bx0:bx1].reshape(-1)
        opaque = patch_alpha > 200
        if opaque.sum() == 0:
            raise RuntimeError("qa_cheek_delta_e: nose-bridge patch has no opaque pixels")
        # Drop the darkest quartile (glasses-frame bridge/shadow pixels are the
        # most likely intrusion here) before taking the median of what remains.
        opaque_rgb = patch_rgb[opaque]
        brightness = opaque_rgb.sum(axis=1)
        threshold = np.percentile(brightness, 25)
        kept = opaque_rgb[brightness >= threshold]
        sample = np.median(kept, axis=0, keepdims=True)
        lab = srgb_to_lab(sample)
        return lab[0]

    ref_lab = cheek_lab(images["neutral"])
    deltas = []
    for mood in ("happy", "sad"):
        other_lab = cheek_lab(images[mood])
        deltas.append(float(np.sqrt(((ref_lab - other_lab) ** 2).sum())))
    return max(deltas)


# --------------------------------------------------------------------------
# Stage: body
# --------------------------------------------------------------------------

BODY_PROMPT = (
    "Use the supplied reference image ONLY as a style guide (art style, "
    "head-to-body proportions, lighting) -- do NOT copy its face, hair, "
    "glasses or costume. " + STYLE_SNIPPET + "\n\n"
    "Generate a generic paper-doll BASE FIGURE (a mannequin) for a family "
    "fantasy game: standing straight, front-facing, feet shoulder-width "
    "apart, both arms hanging relaxed slightly away from the body with "
    "elbows softly bent, both hands open and relaxed with fingers gently "
    "curled so an item could be placed in either hand, exactly two arms "
    "and two hands, no extra limbs. Plain base clothing only: a fitted "
    "plain cream long-sleeve shirt, plain dark grey trousers, simple "
    "brown ankle boots. Generic short brown hair, calm neutral face, no "
    "glasses, no hat, no cloak, no belt, no props, no jewelry. Full body "
    "shown from hair to soles, centred in frame, not cropped at top or "
    "bottom. TRUE TRANSPARENT background, no floor, no cast shadow, no "
    "checkerboard painted in. No text, watermark, frame or scenery."
)


def stage_body(force: bool) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "mannequin.png"
    manifest = load_manifest()
    if path.is_file() and not force:
        print(f"body: {path} already exists, skipping (use --force to regenerate)", flush=True)
        return
    reference = Image.open(WIZARDS / "dad-neutral.webp").convert("RGBA")
    print("body: generating mannequin with", MODEL, flush=True)
    result = api_edit(BODY_PROMPT, [reference], None)
    if result.size != CANVAS:
        result = result.resize(CANVAS, Image.Resampling.LANCZOS)
    alpha = alpha_array(result)
    if alpha.max() == 0:
        raise RuntimeError("body: generated image is fully transparent")
    if alpha.min() == 255:
        raise RuntimeError("body: generated image has no transparency (opaque background)")
    bbox = Image.fromarray(alpha).point(lambda v: 255 if v > 20 else 0).getbbox()
    if bbox is None:
        raise RuntimeError("body: could not compute alpha bounding box")
    figure_height = bbox[3] - bbox[1]
    ratio = figure_height / H
    if ratio < 0.78:
        raise RuntimeError(f"body: figure height ratio {ratio:.3f} < 0.78 minimum")
    save_png_atomic(result, path)
    record_output(manifest, "mannequin.png", result, stage="body", prompt=BODY_PROMPT,
                  source="assets/wizards/dad-neutral.webp", reference=None,
                  coverage=None, drift=None, attempts=1)
    print(f"body: wrote {path}, figure height ratio={ratio:.3f}", flush=True)


# --------------------------------------------------------------------------
# Stage: landmarks
# --------------------------------------------------------------------------

def _column_alpha_extent(alpha: np.ndarray, y0: int, y1: int, threshold: int = 20):
    """Return per-column boolean 'has alpha' within [y0,y1)."""
    band = alpha[y0:y1, :] > threshold
    return band.any(axis=0)


def estimate_landmarks() -> dict:
    mannequin = Image.open(OUT / "mannequin.png").convert("RGBA")
    alpha = alpha_array(mannequin)
    mask = alpha > 20
    bbox = Image.fromarray((mask * 255).astype(np.uint8)).getbbox()
    x0, y0, x1, y1 = bbox
    fig_h = y1 - y0

    def y(frac):
        return int(round(y0 + frac * fig_h))

    # Neck refinement: scan rows below 0.15H for a sharp narrowing of alpha width.
    chin_guess = y(0.24)
    search_start = y(0.15)
    widths = []
    for row in range(search_start, min(chin_guess + int(0.1 * fig_h), y1)):
        row_mask = mask[row, x0:x1]
        widths.append((row, int(row_mask.sum())))
    chin = chin_guess
    if len(widths) > 4:
        arr = np.array([w for _, w in widths], dtype=np.float32)
        # find first index where width drops sharply relative to a following
        # local max (shoulders are wider than the neck).
        rolling_max = np.maximum.accumulate(arr[::-1])[::-1]
        for i in range(len(arr) - 1):
            if rolling_max[i] > 0 and arr[i] < 0.55 * rolling_max[i]:
                chin = widths[i][0]
                break

    eyebrow = y(0.13)
    shoulder = chin + int(round(0.05 * fig_h))
    waist = y(0.52)
    hip = y(0.6)
    knee = y(0.8)
    ankle = y(0.95)

    # Hand blobs: outer left/right alpha extremes in the band around waist.
    band_top = max(y0, int(round(waist - 0.05 * fig_h)))
    band_bottom = min(y1, int(round(hip + 0.08 * fig_h)))
    hand_h = int(round(0.11 * fig_h))
    hand_w = int(round(0.09 * fig_h))

    col_any = _column_alpha_extent(alpha, band_top, band_bottom)
    cols = np.where(col_any)[0]
    if len(cols) == 0:
        raise RuntimeError("landmarks: no alpha found in hand search band")
    left_col = int(cols.min())  # viewer's left = smallest x
    right_col = int(cols.max())  # viewer's right = largest x

    def hand_box(center_col, band_top, band_bottom, hand_w, hand_h):
        x_lo = max(x0, center_col - hand_w // 2)
        x_hi = min(x1, x_lo + hand_w)
        # locate the vertical center of the blob near this column
        col_alpha_rows = np.where(alpha[band_top:band_bottom, max(x0, center_col - 5):min(x1, center_col + 5)].max(axis=1) > 20)[0]
        if len(col_alpha_rows):
            mid = band_top + int((col_alpha_rows.min() + col_alpha_rows.max()) / 2)
        else:
            mid = (band_top + band_bottom) // 2
        y_lo = max(y0, mid - hand_h // 2)
        y_hi = min(y1, y_lo + hand_h)
        return [int(x_lo), int(y_lo), int(x_hi), int(y_hi)]

    left_hand = hand_box(left_col, band_top, band_bottom, hand_w, hand_h)
    right_hand = hand_box(right_col, band_top, band_bottom, hand_w, hand_h)

    # faceBox: central 62% width of the head between eyebrow-0.02H and chin.
    head_top = max(y0, int(round(eyebrow - 0.02 * fig_h)))
    head_w = x1 - x0
    face_margin = int(round(head_w * 0.19))
    face_box = [x0 + face_margin, head_top, x1 - face_margin, chin]

    # torso: columns continuous between shoulder..waist inside the arm gaps.
    torso_band = mask[shoulder:waist, x0:x1]
    col_full = torso_band.all(axis=0) if torso_band.size else np.zeros(x1 - x0, dtype=bool)
    # fallback: use columns where alpha coverage in the band is high (>85%)
    coverage = torso_band.mean(axis=0) if torso_band.size else np.zeros(x1 - x0)
    torso_cols = np.where(coverage > 0.85)[0]
    if len(torso_cols) == 0:
        torso_x0, torso_x1 = x0 + head_w // 3, x1 - head_w // 3
    else:
        torso_x0, torso_x1 = x0 + int(torso_cols.min()), x0 + int(torso_cols.max())
    torso = [int(torso_x0), int(shoulder), int(torso_x1), int(hip)]

    landmarks = {
        "canvas": [W, H],
        "figure": [int(x0), int(y0), int(x1), int(y1)],
        "chin": int(chin),
        "eyebrow": int(eyebrow),
        "shoulder": int(shoulder),
        "waist": int(waist),
        "hip": int(hip),
        "knee": int(knee),
        "ankle": int(ankle),
        "faceBox": [int(v) for v in face_box],
        "torso": torso,
        "leftHand": left_hand,
        "rightHand": right_hand,
        "wandHand": "right",
        "broomHand": "left",
    }
    return landmarks


def draw_overlay(landmarks: dict, mannequin: Image.Image) -> Image.Image:
    canvas = mannequin.convert("RGBA").copy()
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    def hline(y, color, label):
        draw.line([(0, y), (W, y)], fill=color, width=3)
        draw.text((6, y + 3), label, fill=color, font=font)

    def rect(box, color, label):
        draw.rectangle(box, outline=color, width=3)
        draw.text((box[0] + 3, box[1] - 16), label, fill=color, font=font)

    hline(landmarks["eyebrow"], (255, 0, 0, 255), "eyebrow")
    hline(landmarks["chin"], (255, 128, 0, 255), "chin")
    hline(landmarks["shoulder"], (255, 255, 0, 255), "shoulder")
    hline(landmarks["waist"], (0, 255, 0, 255), "waist")
    hline(landmarks["hip"], (0, 255, 255, 255), "hip")
    hline(landmarks["knee"], (0, 128, 255, 255), "knee")
    hline(landmarks["ankle"], (128, 0, 255, 255), "ankle")
    rect(landmarks["figure"], (255, 255, 255, 255), "figure")
    rect(landmarks["faceBox"], (255, 0, 255, 255), "face")
    rect(landmarks["torso"], (0, 200, 0, 255), "torso")
    rect(landmarks["leftHand"], (255, 0, 0, 255), "L-hand")
    rect(landmarks["rightHand"], (0, 0, 255, 255), "R-hand")
    return canvas


def stage_landmarks(force: bool) -> None:
    path = OUT / "landmarks.json"
    if path.is_file() and not force:
        print(f"landmarks: {path} already exists, skipping (use --force to regenerate)", flush=True)
        return
    mannequin_path = OUT / "mannequin.png"
    if not mannequin_path.is_file():
        raise RuntimeError("landmarks: run the `body` stage first")
    landmarks = estimate_landmarks()
    path.write_text(json.dumps(landmarks, indent=2) + "\n", encoding="utf-8")
    QA.mkdir(parents=True, exist_ok=True)
    overlay = draw_overlay(landmarks, Image.open(mannequin_path))
    overlay_path = QA / "landmarks-overlay.png"
    overlay.convert("RGB").save(overlay_path)
    print(f"landmarks: wrote {path} and {overlay_path}", flush=True)
    print(json.dumps(landmarks, indent=2), flush=True)


# --------------------------------------------------------------------------
# Stage: zones (library only)
# --------------------------------------------------------------------------

def load_landmarks() -> dict:
    return json.loads((OUT / "landmarks.json").read_text(encoding="utf-8"))


def zone_full_width(y_lo: int, y_hi: int) -> np.ndarray:
    z = np.zeros((H, W), dtype=bool)
    y_lo = max(0, y_lo)
    y_hi = min(H, y_hi)
    z[y_lo:y_hi, :] = True
    return z


def zone_box(box: list[int]) -> np.ndarray:
    z = np.zeros((H, W), dtype=bool)
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(W, x1), min(H, y1)
    z[y0:y1, x0:x1] = True
    return z


def build_zones(landmarks: dict) -> dict[str, np.ndarray]:
    fig = landmarks["figure"]
    fig_h = fig[3] - fig[1]
    chin, eyebrow, shoulder, waist, hip, knee, ankle = (
        landmarks["chin"], landmarks["eyebrow"], landmarks["shoulder"],
        landmarks["waist"], landmarks["hip"], landmarks["knee"], landmarks["ankle"],
    )
    torso = landmarks["torso"]
    left_hand = landmarks["leftHand"]
    right_hand = landmarks["rightHand"]

    zones = {}
    zones["head"] = zone_full_width(0, chin)  # zoneA
    zones["face"] = zone_box(landmarks["faceBox"])
    face_box = landmarks["faceBox"]
    face_shrunk = zone_box([face_box[0] + 6, face_box[1] + 6, face_box[2] - 6, face_box[3] - 6])
    hat_editable_top = zone_full_width(0, int(round(chin - 0.02 * fig_h)))
    neck_shoulder = zone_full_width(chin, H)  # excluded: nothing but hat pixels below chin
    zones["hat"] = hat_editable_top & ~face_shrunk & ~neck_shoulder

    left_hand_dil = _dilate_bool(zone_box(left_hand), 26)
    right_hand_dil = _dilate_bool(zone_box(right_hand), 26)
    hands_dilated = left_hand_dil | right_hand_dil

    headb = zone_full_width(chin, int(round(shoulder + 0.12 * fig_h)))
    zones["headB"] = headb

    zones["necklace"] = zone_box([torso[0] - 40, chin - 10, torso[2] + 40, int(round(waist - 0.05 * fig_h))])
    zones["vest"] = zone_box([torso[0], shoulder, torso[2], hip])

    cloak = zone_box([fig[0] - 60, shoulder - 30, fig[2] + 60, knee + 80])
    cloak = cloak & ~hands_dilated & ~zones["head"]
    zones["cloak"] = cloak

    # pants: use hip-band alpha extent +-30 (fall back to figure width).
    x_lo = max(fig[0], torso[0] - 30)
    x_hi = min(fig[2], torso[2] + 30)
    zones["pants"] = zone_box([x_lo, waist - 20, x_hi, ankle + 20])

    zones["gloves"] = _dilate_bool(zone_box(left_hand), 24) | _dilate_bool(zone_box(right_hand), 24)

    # wandHand/broomHand landmarks are in CHARACTER terms ("right"/"left"), but
    # the leftHand/rightHand landmark boxes are in VIEWER terms (estimated by
    # column position: leftHand = smaller x = viewer's left = character's
    # right hand). The wand goes in the character's right hand -> viewer's
    # left -> landmarks["leftHand"]; the broom in the character's left hand ->
    # viewer's right -> landmarks["rightHand"].
    wand_hand_box = left_hand
    broom_hand_box = right_hand

    wh_cx = (wand_hand_box[0] + wand_hand_box[2]) // 2
    wh_cy = (wand_hand_box[1] + wand_hand_box[3]) // 2
    # "outward" from the body for the character's right hand (viewer's left)
    # means extending further left (smaller x), not right.
    wand_rect = zone_box([wh_cx - 240, max(0, wh_cy - int(round(0.45 * fig_h))), wh_cx + 60, wand_hand_box[3]])
    zones["wand"] = _dilate_bool(zone_box(wand_hand_box), 24) | wand_rect

    broom_band = zone_box([broom_hand_box[0] - 40, fig[1] - 140, broom_hand_box[2] + 230, ankle + 40])
    zones["broom"] = _dilate_bool(zone_box(broom_hand_box), 24) | broom_band

    return zones


def build_hat_zone_wide(landmarks: dict) -> np.ndarray:
    """Hat zone for --flagged hat regeneration: same vertical rule as the
    normal hat zone (y < chin-0.02H, minus the shrunk faceBox, minus the neck
    /shoulders), but the horizontal extent is widened to figure-width +-80px
    instead of the full canvas width, so a wide brim/base can be drawn while
    keeping the API edit region anchored to the head.
    """
    fig = landmarks["figure"]
    fig_h = fig[3] - fig[1]
    chin = landmarks["chin"]
    face_box = landmarks["faceBox"]
    face_shrunk = zone_box([face_box[0] + 6, face_box[1] + 6, face_box[2] - 6, face_box[3] - 6])
    hat_editable_top = zone_full_width(0, int(round(chin - 0.02 * fig_h)))
    neck_shoulder = zone_full_width(chin, H)
    wide_band = zone_box([fig[0] - 80, 0, fig[2] + 80, H])
    return hat_editable_top & ~face_shrunk & ~neck_shoulder & wide_band


# --------------------------------------------------------------------------
# Generation helpers shared across stages
# --------------------------------------------------------------------------

def _qa_and_maybe_retry(key: str, category: str, before: Image.Image, editable_bool: np.ndarray,
                         gen_fn, manifest: dict, prompt: str) -> tuple[Image.Image, dict]:
    """Run gen_fn() -> Image, validate QA, retry once on failure, record + return."""
    attempt_notes = []
    for attempt in range(2):
        raw = gen_fn()
        result = clamp_to_mask(before, raw, editable_bool)
        drift = qa_outside_mask_drift(before, result, editable_bool)
        coverage = qa_coverage(before, result, editable_bool)
        min_cov = COVERAGE_MIN.get(category, 0.05)
        ok = drift < DRIFT_MAX and coverage >= min_cov
        attempt_notes.append({"attempt": attempt, "drift": drift, "coverage": coverage, "ok": ok})
        if ok:
            return result, {"status": "ok", "drift": drift, "coverage": coverage, "prompt": prompt, "attempts": attempt_notes}
    return result, {"status": "flagged", "drift": drift, "coverage": coverage, "prompt": prompt, "attempts": attempt_notes}


# --------------------------------------------------------------------------
# Stage: heads
# --------------------------------------------------------------------------

def head_swap_prompt(char: str) -> str:
    glasses_clause = (
        "wearing glasses matching the reference exactly" if char in GLASSES
        else "no glasses, matching the reference exactly"
    )
    antler_clause = " Keep the character's small antler circlet on the head, matching the reference." if char in ANTLERS else ""
    identity_refs_clause = (
        " Use every supplied reference image together to establish this character's "
        "identity (face shape, hairstyle silhouette, glasses shape) -- they all depict "
        "the same person." if char in CARICATURE_CROPS else ""
    )
    return (
        "Inside the masked area only, replace the head with THIS character "
        "from the reference image(s): identical face identity, hairstyle "
        "and hair colour, " + glasses_clause + "." + antler_clause + identity_refs_clause + " "
        + KOREAN_FEATURES_CLAUSE + " Calm "
        "friendly neutral expression. Scale the head proportionally to the "
        "body below the mask. " + STYLE_SNIPPET + " No hat. Keep everything "
        "outside the mask (body, pose, clothing) exactly unchanged. "
        "Transparent background."
    )


MOOD_PROMPT_TEMPLATES = {
    "happy": "Inside the masked face area only, change the expression to a joyful big smile, delighted eyes, cheeks lifted. Do not add or remove glasses or any accessory not already present. Keep hair, {glasses_clause}, head shape, skin tone and everything else in and outside the mask exactly unchanged. Transparent background.",
    "sad": "Inside the masked face area only, change the expression to gently sad: downturned mouth, worried eyebrows, no tears. Do not add or remove glasses or any accessory not already present. Keep hair, {glasses_clause}, head shape, skin tone and everything else in and outside the mask exactly unchanged. Transparent background.",
}


def mood_prompt(mood: str, char: str) -> str:
    glasses_clause = "glasses (this character wears glasses)" if char in GLASSES else "the absence of glasses (this character does NOT wear glasses)"
    return MOOD_PROMPT_TEMPLATES[mood].format(glasses_clause=glasses_clause)


def _kmeans_clusters(samples: np.ndarray, k: int):
    from sklearn.cluster import KMeans
    if len(samples) < k:
        k = max(1, len(samples))
    model = KMeans(n_clusters=k, n_init=4, random_state=0).fit(samples)
    return model.cluster_centers_


def extract_head_layer(mannequin: Image.Image, full: Image.Image, zones: dict, landmarks: dict) -> Image.Image:
    """Head layer extraction (0-Main's rule, replicated exactly):
    Below chin, keep a changed pixel (dRGB>45 or dAlpha>45 vs mannequin) only if
    it matches the character's hair palette (k-means 6 on the opaque region
    above eyebrow, discard clusters with mean>165, tolerance 40) OR, within
    faceBox.x +/-30 and rows chin..shoulder+8, the skin palette (k-means 4 on
    faceBox, tolerance 30). Exclude cream (min>165 & range<45). Hair candidates
    cut off below shoulder+170. Opening 1px, keep only components connected to
    the head region (rows<chin), closing 2px, feather rows chin-8..shoulder+8
    within faceBox.x+/-10 with sigma 1.6, zero alpha<10. Drop any
    entirely-below-chin component whose mean luminance is >130 as a final
    shaded-collar guard.
    """
    from scipy import ndimage
    from PIL import ImageFilter

    mannequin = zero_faint_alpha(mannequin)
    full = zero_faint_alpha(full)
    full_rgb = rgb_array(full)
    full_alpha = alpha_array(full)
    man_rgb = rgb_array(mannequin)
    man_alpha = alpha_array(mannequin)

    chin = landmarks["chin"]
    eyebrow = landmarks["eyebrow"]
    shoulder = landmarks["shoulder"]
    face = landmarks["faceBox"]
    fx0, fy0, fx1, fy1 = face

    opaque_above_chin = np.zeros((H, W), dtype=bool)
    opaque_above_chin[:chin, :] = full_alpha[:chin, :] > 10

    # dRGB>45 or dAlpha>45 vs mannequin
    rgb_dist = np.sqrt(((full_rgb.astype(np.int32) - man_rgb.astype(np.int32)) ** 2).sum(axis=2))
    alpha_dist = np.abs(full_alpha.astype(np.int32) - man_alpha.astype(np.int32))
    changed = ((rgb_dist > 45) | (alpha_dist > 45)) & (full_alpha > 10)

    # Cream exclusion
    channel_min = full_rgb.min(axis=2)
    channel_max = full_rgb.max(axis=2)
    near_cream = (channel_min > 165) & ((channel_max - channel_min) < 45)
    changed = changed & ~near_cream

    below_chin = np.zeros((H, W), dtype=bool)
    below_chin[chin:, :] = True
    changed_below = changed & below_chin

    # Hair palette: k-means 6 on opaque region above eyebrow, discard mean>165
    hair_region_alpha = full_alpha[:eyebrow, :] > 10
    hair_samples = full_rgb[:eyebrow, :][hair_region_alpha]
    hair_clusters = _kmeans_clusters(hair_samples, 6) if len(hair_samples) else np.zeros((0, 3))
    hair_clusters = hair_clusters[hair_clusters.mean(axis=1) <= 165]

    def matches_palette(pixels: np.ndarray, clusters: np.ndarray, tolerance: float) -> np.ndarray:
        if len(clusters) == 0:
            return np.zeros(len(pixels), dtype=bool)
        dists = np.sqrt(((pixels[:, None, :].astype(np.float64) - clusters[None, :, :]) ** 2).sum(axis=2))
        return dists.min(axis=1) <= tolerance

    hair_mask = np.zeros((H, W), dtype=bool)
    ys, xs = np.where(changed_below)
    if len(ys):
        pixels = full_rgb[ys, xs]
        ok = matches_palette(pixels, hair_clusters, 40.0)
        hair_mask[ys[ok], xs[ok]] = True
    hair_mask[shoulder + 170:, :] = False  # hair candidates cut off below shoulder+170

    # Skin palette: k-means 4 on faceBox, tolerance 30, restricted to
    # faceBox.x +/-30 and rows chin..shoulder+8
    face_alpha = full_alpha[fy0:fy1, fx0:fx1] > 10
    face_samples = full_rgb[fy0:fy1, fx0:fx1][face_alpha]
    skin_clusters = _kmeans_clusters(face_samples, 4) if len(face_samples) else np.zeros((0, 3))

    skin_region = np.zeros((H, W), dtype=bool)
    sk_y0, sk_y1 = chin, min(H, shoulder + 8)
    sk_x0, sk_x1 = max(0, fx0 - 30), min(W, fx1 + 30)
    skin_region[sk_y0:sk_y1, sk_x0:sk_x1] = True
    skin_candidates = changed_below & skin_region
    skin_mask = np.zeros((H, W), dtype=bool)
    ys, xs = np.where(skin_candidates)
    if len(ys):
        pixels = full_rgb[ys, xs]
        ok = matches_palette(pixels, skin_clusters, 30.0)
        skin_mask[ys[ok], xs[ok]] = True

    changed_kept = changed_below & (hair_mask | skin_mask)

    # opening 1px, closing 2px
    changed_kept = close_open(changed_kept, close_px=2, open_px=1)

    # keep only components connected to the head region (rows < chin)
    combined = opaque_above_chin | changed_kept
    labeled, count = ndimage.label(combined)
    if count:
        head_labels = set(np.unique(labeled[:chin, :])) - {0}
        keep = np.isin(labeled, list(head_labels)) if head_labels else np.zeros_like(combined)
    else:
        keep = combined

    # Final shaded-collar guard: drop any component entirely below chin whose
    # mean luminance is > 130.
    labeled2, count2 = ndimage.label(keep)
    if count2:
        for label_id in range(1, count2 + 1):
            comp = labeled2 == label_id
            comp_rows = np.where(comp.any(axis=1))[0]
            if len(comp_rows) == 0:
                continue
            if comp_rows.min() >= chin:  # entirely below chin
                mean_lum = full_rgb[comp].mean()
                if mean_lum > 130:
                    keep[comp] = False

    editable = keep.astype(np.float64)

    # feather rows chin-8..shoulder+8 within faceBox.x+/-10, sigma 1.6
    feather_band = np.zeros((H, W), dtype=bool)
    fb_y0, fb_y1 = max(0, chin - 8), min(H, shoulder + 8)
    fb_x0, fb_x1 = max(0, fx0 - 10), min(W, fx1 + 10)
    feather_band[fb_y0:fb_y1, fb_x0:fb_x1] = True

    hard_mask = editable.copy()
    blurred_img = Image.fromarray((editable * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))
    blurred = np.asarray(blurred_img).astype(np.float64) / 255.0
    alpha_mask = np.where(feather_band, blurred, hard_mask)

    rgba = np.asarray(full.convert("RGBA")).copy()
    rgba[:, :, 3] = np.clip(alpha_mask * 255, 0, 255).astype(np.uint8)
    result = Image.fromarray(rgba, mode="RGBA")
    result_arr = np.asarray(result).copy()
    result_arr[result_arr[:, :, 3] < 10] = 0
    return Image.fromarray(result_arr, mode="RGBA")


def portrait_crop(full: Image.Image, figure_box: list[int]) -> Image.Image:
    x0, y0, x1, y1 = figure_box
    cx = (x0 + x1) // 2
    size = 1024
    left = max(0, min(W - size, cx - size // 2))
    top = max(0, y0 - int(0.05 * size))
    top = max(0, min(H - size, top))
    return full.crop((left, top, left + size, top + size))


def stage_heads(only: str | None, force: bool) -> None:
    mannequin = Image.open(OUT / "mannequin.png").convert("RGBA")
    landmarks = load_landmarks()
    zones = build_zones(landmarks)
    head_editable = zones["head"] | zones["headB"]
    face_editable = zones["face"]
    manifest = load_manifest()

    chin = landmarks["chin"]
    body_path = OUT / "body.webp"
    if force or not body_path.is_file():
        body_rgba = np.asarray(mannequin).copy()
        body_rgba[:chin, :, 3] = 0
        body_image = Image.fromarray(body_rgba, mode="RGBA")
        save_webp(body_image, body_path)
        record_output(manifest, "body.webp", body_image, stage="body", prompt="erase head region (y<chin) from mannequin.png",
                      source="mannequin.png", reference=None, coverage=None, drift=None, attempts=1)
        print(f"heads: wrote {body_path}", flush=True)

    chars = [only] if only else list(CHARACTERS)
    for char in chars:
        try:
            neutral_full_path = OUT / f"{char}-neutral-full.png"
            head_qa = None
            if force or not neutral_full_path.is_file():
                reference = Image.open(WIZARDS / f"{char}-neutral.webp").convert("RGBA")
                identity_refs = [reference] + head_identity_references(char)
                prompt = head_swap_prompt(char)
                mask = mask_from_editable(head_editable)

                def gen(_refs=identity_refs):
                    return api_edit(prompt, [mannequin] + _refs, mask)

                result, head_qa = _qa_and_maybe_retry(f"{char}-neutral-full", "head", mannequin, head_editable, gen, manifest, prompt)
                save_png_atomic(result, neutral_full_path)
                print(f"heads: {char} neutral-full {head_qa['status']} drift={head_qa['drift']:.4f} coverage={head_qa['coverage']:.3f}", flush=True)
            neutral_full = Image.open(neutral_full_path).convert("RGBA")

            mood_fulls = {"neutral": neutral_full}
            mood_qa = {}
            for mood in ("happy", "sad"):
                mood_path = OUT / f"{char}-{mood}-full.png"
                if force or not mood_path.is_file():
                    prompt = mood_prompt(mood, char)
                    mask = mask_from_editable(face_editable)

                    def gen(_mood=mood, _prompt=prompt):
                        return api_edit(_prompt, [neutral_full], mask)

                    result, qa = _qa_and_maybe_retry(f"{char}-{mood}-full", "face", neutral_full, face_editable, gen, manifest, prompt)
                    save_png_atomic(result, mood_path)
                    mood_qa[mood] = qa
                    print(f"heads: {char} {mood}-full {qa['status']} drift={qa['drift']:.4f} coverage={qa['coverage']:.3f}", flush=True)
                mood_fulls[mood] = Image.open(mood_path).convert("RGBA")

            hair_metric = qa_hair_stability(landmarks, mood_fulls)
            print(f"heads: {char} hair stability mean-distance={hair_metric:.2f} ({'ok' if hair_metric < 6 else 'FLAGGED'})", flush=True)

            cheek_delta_e = qa_cheek_delta_e(landmarks, mood_fulls)
            cheek_ok = cheek_delta_e < 8.0
            print(f"heads: {char} cheek Delta-E (skin-tone stability across moods)={cheek_delta_e:.2f} ({'ok' if cheek_ok else 'FLAGGED'})", flush=True)

            for mood, full in mood_fulls.items():
                layer_path = OUT / f"{char}-{mood}.webp"
                if force or not layer_path.is_file():
                    layer = extract_head_layer(mannequin, full, zones, landmarks)
                    save_webp(layer, layer_path)
                else:
                    layer = Image.open(layer_path).convert("RGBA")
                qa = head_qa if mood == "neutral" else mood_qa.get(mood)
                coverage = qa["coverage"] if qa else None
                drift = qa["drift"] if qa else None
                attempts = len(qa["attempts"]) if qa else 1
                prompt_used = qa["prompt"] if qa else (head_swap_prompt(char) if mood == "neutral" else mood_prompt(mood, char))
                if mood == "neutral":
                    reference = "assets/wizards/" + char + "-neutral.webp"
                    if char in CARICATURE_CROPS:
                        reference += " + assets/family-characters.webp[crop]"
                else:
                    reference = f"{char}-neutral-full.png"
                record_output(manifest, f"{char}-{mood}.webp", layer, stage="head", prompt=prompt_used,
                              source="mannequin.png" if mood == "neutral" else f"{char}-neutral-full.png",
                              reference=reference, character=char, coverage=coverage, drift=drift, attempts=attempts,
                              hair_stability=hair_metric, cheek_delta_e=cheek_delta_e)

            portrait_path = OUT / f"{char}-portrait.webp"
            if force or not portrait_path.is_file():
                crop = portrait_crop(mood_fulls["neutral"], landmarks["figure"])
                save_webp(crop, portrait_path)
            else:
                crop = Image.open(portrait_path).convert("RGBA")
            record_output(manifest, f"{char}-portrait.webp", crop, stage="portrait",
                          prompt="1024x1024 head-and-shoulders crop from the top of the neutral full composite",
                          source=f"{char}-neutral-full.png", reference=None, character=char,
                          coverage=None, drift=None, attempts=1)
            print(f"heads: {char} done", flush=True)
        except Exception as error:
            record_failure(manifest, f"{char}-*", str(error))
            print(f"heads: FAILED {char}: {error}", flush=True)


# --------------------------------------------------------------------------
# Stage: hats
# --------------------------------------------------------------------------

def hat_prompt(strengthen: bool = False) -> str:
    size_clause = (
        " The hat is LARGE for the head -- its brim reaches the full skull "
        "width and covers the crown completely; only hair below the brim is "
        "visible." if strengthen else ""
    )
    return (
        "Put this exact hat (second reference image -- preserve its design, "
        "colours, materials and decorations) on the character's head, sized "
        "to fit the head, sitting naturally on the hair at a natural angle, "
        "brim resting on the hair. Hair may show only below the brim; the hat "
        "sits on the hair, not floating above it." + size_clause + " Keep the "
        "face, glasses, body and clothing unchanged. " + STYLE_SNIPPET +
        " Transparent background."
    )


# hat ids whose fix additionally needs the tall-wizard-cone clause (item 3 of
# the flagged-hat fix): a wide circular base enclosing the whole head, with
# the cone rising from that base -- not a small cone perched on the hair.
TALL_CONE_HAT_IDS = {"hat-05", "hat-11"}


def hat_fit_prompt(hat_id: str) -> str:
    """Prompt for the --flagged hat regeneration: uses THREE reference images
    (edited neutral-full body, shop design, fit exemplar) and instructs the
    model to fit the hat low and large using the third image as the sizing
    reference, instead of shrinking it to a small cone on the hair.
    """
    tall_cone_clause = (
        " This is a tall pointed wizard hat: the wide circular base encloses "
        "the whole top of the head; the cone rises from that base."
        if hat_id in TALL_CONE_HAT_IDS else ""
    )
    return (
        "Put this exact hat (second reference image -- preserve its design, "
        "colours, materials and decorations) on the character's head. Fit the "
        "hat like the third image: the hat is worn low and large -- its "
        "opening is as wide as the whole skull, the brim/base sits just above "
        "the eyebrows across the full head width, the crown of the head is "
        "completely hidden; scale the hat up to the head, never shrink it to "
        "a small cone on top of the hair. Keep the exact design, colours and "
        "decorations of the second image." + tall_cone_clause + " Keep the "
        "face, glasses, body and clothing unchanged. " + STYLE_SNIPPET +
        " Transparent background."
    )


def best_fit_exemplar(char: str, manifest: dict) -> Image.Image | None:
    """Pick this character's existing hat-XX.webp with the highest recorded
    brimCoverageRatio and composite it over body.webp + {char}-neutral.webp as
    a fit exemplar for the --flagged regeneration prompt."""
    best_id = None
    best_ratio = -1.0
    for i in range(1, 13):
        key = f"{char}-hat-{i:02d}.webp"
        entry = manifest.get("outputs", {}).get(key)
        if not entry or entry.get("category") != "hat":
            continue
        ratio = entry.get("brimCoverageRatio")
        if ratio is None:
            continue
        if ratio > best_ratio:
            best_ratio = ratio
            best_id = f"hat-{i:02d}"
    if best_id is None:
        return None
    hat_path = OUT / f"{char}-{best_id}.webp"
    if not hat_path.is_file():
        return None
    body = _safe_open(OUT / "body.webp")
    head = _safe_open(OUT / f"{char}-neutral.webp")
    hat_layer = Image.open(hat_path).convert("RGBA")
    layers = [layer for layer in (body, head, hat_layer) if layer is not None]
    if not layers:
        return None
    return composite_layers(*layers)


def stage_hats(only: str | None, force: bool, max_workers: int, flagged: bool = False) -> None:
    if flagged:
        stage_hats_flagged(max_workers)
        return

    landmarks = load_landmarks()
    zones = build_zones(landmarks)
    hat_zone_dilated = _dilate_bool(zones["hat"], 12)
    manifest = load_manifest()

    jobs = []
    if only:
        if "-" in only and only.split("-")[0] in CHARACTERS:
            char, hat_id = only.split("-", 1)
            jobs.append((char, hat_id))
        else:
            for i in range(1, 13):
                jobs.append((only, f"hat-{i:02d}"))
    else:
        for char in CHARACTERS:
            for i in range(1, 13):
                jobs.append((char, f"hat-{i:02d}"))

    def run(char: str, hat_id: str):
        out_path = OUT / f"{char}-{hat_id}.webp"
        if out_path.is_file() and not force:
            return (char, hat_id, "skipped")
        try:
            full_path = OUT / f"{char}-neutral-full.png"
            if not full_path.is_file():
                raise RuntimeError(f"{char}-neutral-full.png missing; run heads stage first")
            full = Image.open(full_path).convert("RGBA")
            design = Image.open(DESIGNS / f"{hat_id}.webp").convert("RGBA")
            prompt = hat_prompt()
            mask = mask_from_editable(hat_zone_dilated)

            attempt_notes = []
            result = None
            crown_ok = False
            crown_details = {}
            for attempt in range(2):
                raw = api_edit(prompt, [full, design], mask)
                result = clamp_to_mask(full, raw, hat_zone_dilated)
                drift = qa_outside_mask_drift(full, result, hat_zone_dilated)
                coverage = qa_coverage(full, result, hat_zone_dilated)
                crown_ok, crown_details = qa_hat_crown(full, result, hat_zone_dilated, landmarks)
                ok = bool(drift < DRIFT_MAX and coverage >= COVERAGE_MIN["hat"] and crown_ok)
                attempt_notes.append({"attempt": attempt, "drift": float(drift), "coverage": float(coverage),
                                       "crownOk": bool(crown_ok),
                                       **{k: float(v) for k, v in crown_details.items()}, "ok": ok})
                if ok:
                    break
            status = "ok" if attempt_notes[-1]["ok"] else "flagged"
            qa = {"status": status, "drift": attempt_notes[-1]["drift"], "coverage": attempt_notes[-1]["coverage"],
                  "prompt": prompt, "attempts": attempt_notes}

            layer = extract_zone_layer(full, result, hat_zone_dilated)
            save_webp(layer, out_path)
            record_output(manifest, f"{char}-{hat_id}.webp", layer, stage="hat", prompt=prompt,
                          source=f"{char}-neutral-full.png", reference=f"assets/shop-designs/{hat_id}.webp",
                          character=char, item=hat_id, category="hat", coverage=qa["coverage"],
                          drift=qa["drift"], attempts=len(attempt_notes))
            manifest["outputs"][f"{char}-{hat_id}.webp"]["crownOk"] = bool(crown_ok)
            manifest["outputs"][f"{char}-{hat_id}.webp"].update({k: float(v) for k, v in crown_details.items()})
            save_manifest(manifest)
            return (char, hat_id, qa["status"])
        except Exception as error:
            record_failure(manifest, f"{char}-{hat_id}.webp", str(error))
            raise

    _run_parallel(jobs, run, max_workers, "hats")


FLAGGED_HAT_QUALITY_MIN_BRIM = 0.70
FLAGGED_HAT_QUALITY_MIN_BBOX = 0.9
FLAGGED_HAT_MAX_ATTEMPTS = 4


def stage_hats_flagged(max_workers: int) -> None:
    """Regenerate exactly the hat outputs whose manifest record has
    crownOk=false: widened hat-zone mask, three-image fit-exemplar prompt,
    up to 4 attempts at quality 'high', keep the best brimCoverageRatio."""
    landmarks = load_landmarks()
    manifest = load_manifest()
    zones = build_zones(landmarks)
    head_silhouette = zones["head"]
    wide_hat_zone = _dilate_bool(build_hat_zone_wide(landmarks), 12)

    targets = []
    for key, entry in manifest.get("outputs", {}).items():
        if entry.get("category") == "hat" and entry.get("crownOk") is False:
            targets.append((entry["character"], entry["item"]))
    if not targets:
        print("hats --flagged: no crownOk=false hat outputs found in manifest", flush=True)
        return
    print(f"hats --flagged: regenerating {len(targets)} flagged hats: "
          f"{sorted(f'{c}-{i}' for c, i in targets)}", flush=True)

    def run(char: str, hat_id: str):
        out_path = OUT / f"{char}-{hat_id}.webp"
        try:
            full_path = OUT / f"{char}-neutral-full.png"
            if not full_path.is_file():
                raise RuntimeError(f"{char}-neutral-full.png missing; run heads stage first")
            full = Image.open(full_path).convert("RGBA")
            design = Image.open(DESIGNS / f"{hat_id}.webp").convert("RGBA")
            exemplar = best_fit_exemplar(char, manifest)
            ref_images = [full, design] + ([exemplar] if exemplar is not None else [])
            prompt = hat_fit_prompt(hat_id)
            mask = mask_from_editable(wide_hat_zone)

            best = None  # (brim_ratio, result, drift, coverage, crown_ok, crown_details, fragments_removed)
            attempt_notes = []
            for attempt in range(FLAGGED_HAT_MAX_ATTEMPTS):
                raw = api_edit(prompt, ref_images, mask)
                result = clamp_to_mask(full, raw, wide_hat_zone)
                drift = qa_outside_mask_drift(full, result, wide_hat_zone)
                coverage = qa_coverage(full, result, wide_hat_zone)
                crown_ok, crown_details = qa_hat_crown(full, result, wide_hat_zone, landmarks)
                ok = bool(drift < DRIFT_MAX and coverage >= COVERAGE_MIN["hat"]
                          and crown_details["brimCoverageRatio"] >= FLAGGED_HAT_QUALITY_MIN_BRIM
                          and crown_details["bboxWidthRatio"] >= FLAGGED_HAT_QUALITY_MIN_BBOX)
                attempt_notes.append({"attempt": attempt, "drift": float(drift), "coverage": float(coverage),
                                       "crownOk": bool(crown_ok),
                                       **{k: float(v) for k, v in crown_details.items()}, "ok": ok})
                brim_ratio = crown_details["brimCoverageRatio"]
                if best is None or brim_ratio > best[0]:
                    best = (brim_ratio, result, drift, coverage, crown_ok, crown_details)
                if ok:
                    break

            brim_ratio, result, drift, coverage, crown_ok, crown_details = best
            crown_ok = bool(crown_details["brimCoverageRatio"] >= FLAGGED_HAT_QUALITY_MIN_BRIM
                             and crown_details["bboxWidthRatio"] >= FLAGGED_HAT_QUALITY_MIN_BBOX)
            status = "ok" if crown_ok else "flagged"

            layer = extract_zone_layer(full, result, wide_hat_zone)
            layer, fragments_removed = remove_small_fragments(layer, head_silhouette=head_silhouette)
            save_webp(layer, out_path)
            record_output(manifest, f"{char}-{hat_id}.webp", layer, stage="hat", prompt=prompt,
                          source=f"{char}-neutral-full.png", reference=f"assets/shop-designs/{hat_id}.webp",
                          character=char, item=hat_id, category="hat", coverage=float(coverage),
                          drift=float(drift), attempts=len(attempt_notes))
            with _MANIFEST_LOCK:
                out_entry = manifest["outputs"][f"{char}-{hat_id}.webp"]
                out_entry["crownOk"] = crown_ok
                out_entry.update({k: float(v) for k, v in crown_details.items()})
                out_entry["fragmentsRemoved"] = fragments_removed
            save_manifest(manifest)
            print(f"hats --flagged: {char}-{hat_id} -> {status} "
                  f"brimCoverageRatio={crown_details['brimCoverageRatio']:.3f} "
                  f"bboxWidthRatio={crown_details['bboxWidthRatio']:.3f} "
                  f"(attempts={len(attempt_notes)})", flush=True)
            return (char, hat_id, status)
        except Exception as error:
            record_failure(manifest, f"{char}-{hat_id}.webp", str(error))
            raise

    _run_parallel(targets, run, max_workers, "hats --flagged")

    # Composite QA sheet: all regenerated hats over body + head.
    QA.mkdir(parents=True, exist_ok=True)
    body = _safe_open(OUT / "body.webp")
    cells = []
    if body is not None:
        for char, hat_id in sorted(targets):
            head = _safe_open(OUT / f"{char}-neutral.webp")
            hat_layer = _safe_open(OUT / f"{char}-{hat_id}.webp")
            layers = [layer for layer in (body, head, hat_layer) if layer is not None]
            if layers:
                cells.append((f"{char}-{hat_id}", composite_layers(*layers)))
    if cells:
        _grid_sheet(cells, columns=4).convert("RGB").save(QA / "hatfix.png")
        print(f"hats --flagged: wrote {QA / 'hatfix.png'} ({len(cells)} cells)", flush=True)



# --------------------------------------------------------------------------
# Stage: garments
# --------------------------------------------------------------------------

GARMENT_PROMPTS = {
    "cloak": "Dress the figure in this exact cloak/coat (second reference image -- preserve its exact design, colours, materials and decorations), fitted to the body and pose, draping naturally over the shoulders and arms and replacing the plain shirt where it covers. Hands and head untouched.",
    "vest": "Have the figure wear this exact vest (second reference image -- preserve its exact design, colours, materials and decorations) over the plain shirt, fitted to the torso.",
    "pants": "Replace the plain trousers with these exact trousers (second reference image -- preserve its exact design, colours, materials and decorations), fitted to the legs and boots.",
    "gloves": "Put this exact pair of gloves (second reference image -- preserve its exact design, colours, materials and decorations) on BOTH hands, fitted to the hand shapes and finger positions.",
    "necklace": "Have the figure wear this exact necklace (second reference image -- preserve its exact design, colours, materials and decorations) around the neck, with the pendant resting on the chest.",
    "wand": "Place this exact wand (second reference image -- preserve its exact design, colours, materials and decorations) in the character's right hand (viewer's left), gripped naturally with fingers wrapped around the handle, wand pointing up and outward. Hand position unchanged.",
    "broom": "Have the character hold this exact broom (second reference image -- preserve its exact design, colours, materials and decorations) upright in the left hand (viewer's right) beside the body, bristles near the ground, handle gripped naturally.",
}

COMMON_GARMENT_SUFFIX = " Same 3D style and lighting. Keep everything outside the mask unchanged. Transparent background."


def load_catalog() -> list[dict]:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def stage_garments(only: str | None, force: bool, max_workers: int) -> None:
    mannequin = Image.open(OUT / "mannequin.png").convert("RGBA")
    landmarks = load_landmarks()
    zones = build_zones(landmarks)
    manifest = load_manifest()
    catalog = load_catalog()
    items = [item for item in catalog if item["category"] != "hat"]
    if only:
        items = [item for item in items if item["id"] == only]
        if not items:
            raise RuntimeError(f"garments: unknown item id {only}")

    def run(item: dict):
        item_id = item["id"]
        category = item["category"]
        out_path = OUT / f"{item_id}.webp"
        if out_path.is_file() and not force:
            return (item_id, "skipped")
        try:
            zone = zones[category]
            design_path = DESIGNS / f"{item_id}.webp"
            design = Image.open(design_path).convert("RGBA")
            prompt = GARMENT_PROMPTS[category] + COMMON_GARMENT_SUFFIX
            mask = mask_from_editable(zone)

            def gen():
                return api_edit(prompt, [mannequin, design], mask)

            result, qa = _qa_and_maybe_retry(item_id, category, mannequin, zone, gen, manifest, prompt)
            layer = extract_zone_layer(mannequin, result, zone)
            save_webp(layer, out_path)
            record_output(manifest, f"{item_id}.webp", layer, stage="garment", prompt=qa["prompt"],
                          source="mannequin.png", reference=f"assets/shop-designs/{item_id}.webp",
                          item=item_id, category=category, coverage=qa["coverage"],
                          drift=qa["drift"], attempts=len(qa["attempts"]))
            return (item_id, qa["status"])
        except Exception as error:
            record_failure(manifest, f"{item_id}.webp", str(error))
            raise

    _run_parallel(items, run, max_workers, "garments", key_fn=lambda item: item["id"])


# --------------------------------------------------------------------------
# Stage: starters
# --------------------------------------------------------------------------

def stage_starters(only: str | None, force: bool, max_workers: int) -> None:
    mannequin = Image.open(OUT / "mannequin.png").convert("RGBA")
    landmarks = load_landmarks()
    zones = build_zones(landmarks)
    manifest = load_manifest()

    jobs = [only] if only else list(STARTER_ITEMS.keys())

    def run(key: str):
        char, category, description = STARTER_ITEMS[key]
        out_path = OUT / f"{key}.webp"
        if out_path.is_file() and not force:
            return (key, "skipped")
        try:
            reference = Image.open(WIZARDS / f"{char}-neutral.webp").convert("RGBA")
            source_name = "mannequin.png"
            if category == "hat":
                base_path = OUT / f"{char}-neutral-full.png"
                if not base_path.is_file():
                    raise RuntimeError(f"{base_path} missing; run heads stage first")
                base = Image.open(base_path).convert("RGBA")
                source_name = f"{char}-neutral-full.png"
                zone = zones["hat"]
                prompt = f"Give the character {description} (see reference image), sized to fit the head, sitting naturally on the hair." + COMMON_GARMENT_SUFFIX
            elif category == "cloak":
                base = mannequin
                zone = zones["cloak"]
                prompt = f"Dress the figure in {description} (see reference image), fitted to the body and pose, draping naturally over the shoulders and arms." + COMMON_GARMENT_SUFFIX
            elif category == "wand":
                base = mannequin
                zone = zones["wand"]
                prompt = f"Place {description} (see reference image) in the character's right hand (viewer's left), gripped naturally, pointing up and outward." + COMMON_GARMENT_SUFFIX
            elif category == "broom":
                base = mannequin
                zone = zones["broom"]
                prompt = f"Have the character hold {description} (see reference image) upright in the left hand (viewer's right) beside the body, bristles near the ground." + COMMON_GARMENT_SUFFIX
            else:
                raise RuntimeError(f"unknown starter category {category}")

            mask = mask_from_editable(zone)

            def gen():
                return api_edit(prompt, [base, reference], mask)

            result, qa = _qa_and_maybe_retry(key, category, base, zone, gen, manifest, prompt)
            layer = extract_zone_layer(base, result, zone)
            save_webp(layer, out_path)
            record_output(manifest, f"{key}.webp", layer, stage="starter", prompt=qa["prompt"],
                          source=source_name, reference=f"assets/wizards/{char}-neutral.webp",
                          character=char, category=category, coverage=qa["coverage"],
                          drift=qa["drift"], attempts=len(qa["attempts"]))
            return (key, qa["status"])
        except Exception as error:
            record_failure(manifest, f"{key}.webp", str(error))
            raise

    _run_parallel(jobs, run, max_workers, "starters", key_fn=lambda key: key)


# --------------------------------------------------------------------------
# Parallel runner
# --------------------------------------------------------------------------

def _run_parallel(jobs, run_fn, max_workers, label, key_fn=None):
    max_workers = max(1, min(4, max_workers))
    results = []
    failures = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for job in jobs:
            if isinstance(job, tuple):
                future = executor.submit(run_fn, *job)
                name = "/".join(str(part) for part in job)
            else:
                future = executor.submit(run_fn, job)
                name = key_fn(job) if key_fn else str(job)
            futures[future] = name
        for future in as_completed(futures):
            name = futures[future]
            try:
                result = future.result()
                results.append(result)
                print(f"{label}: {name} -> {result[-1] if isinstance(result, tuple) else result}", flush=True)
            except Exception as error:
                failures.append(name)
                print(f"{label}: FAILED {name}: {error}", flush=True)
    print(f"{label}: {len(results)}/{len(jobs)} done, {len(failures)} failures: {failures}", flush=True)


# --------------------------------------------------------------------------
# Stage: sheets
# --------------------------------------------------------------------------

def composite_layers(*layers: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    for layer in layers:
        if layer is not None:
            canvas.alpha_composite(layer.convert("RGBA"))
    return canvas


def _thumb(image: Image.Image, size: int = 220) -> Image.Image:
    scale = min(size / image.width, size / image.height)
    new_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def _grid_sheet(cells: list[tuple[str, Image.Image]], columns: int, cell_size: int = 240) -> Image.Image:
    rows = math.ceil(len(cells) / columns)
    sheet = Image.new("RGBA", (columns * cell_size, rows * cell_size + 24), (255, 255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None
    for index, (label, image) in enumerate(cells):
        x = (index % columns) * cell_size
        y = (index // columns) * cell_size
        thumb = _thumb(image, cell_size - 20)
        sheet.alpha_composite(thumb.convert("RGBA"), (x + (cell_size - thumb.width) // 2, y + (cell_size - thumb.height) // 2))
        draw.text((x + 4, y + cell_size - 16), label, fill=(0, 0, 0, 255), font=font)
    return sheet


def _safe_open(path: Path) -> Image.Image | None:
    return Image.open(path).convert("RGBA") if path.is_file() else None


def stage_sheets() -> None:
    QA.mkdir(parents=True, exist_ok=True)
    body = _safe_open(OUT / "body.webp")
    landmarks_path = OUT / "landmarks.json"
    landmarks = json.loads(landmarks_path.read_text(encoding="utf-8")) if landmarks_path.is_file() else None

    # heads.png: 6 chars x 3 moods full composites
    cells = []
    for char in CHARACTERS:
        for mood in MOODS:
            full = _safe_open(OUT / f"{char}-{mood}-full.png")
            if full is not None:
                cells.append((f"{char}-{mood}", full))
    if cells:
        _grid_sheet(cells, columns=3).convert("RGB").save(QA / "heads.png")
        print(f"sheets: wrote heads.png ({len(cells)} cells)", flush=True)

    # starters.png
    if body is not None:
        cells = []
        for char in CHARACTERS:
            head = _safe_open(OUT / f"{char}-neutral.webp")
            hat = _safe_open(OUT / f"{char}-base-hat.webp")
            cloak = _safe_open(OUT / f"{char}-base-cloak.webp")
            prop = _safe_open(OUT / f"{char}-base-wand.webp") or _safe_open(OUT / f"{char}-base-broom.webp")
            layers = [body, cloak, prop, head, hat]
            composite = composite_layers(*[layer for layer in layers if layer is not None])
            cells.append((char, composite))
        _grid_sheet(cells, columns=3).convert("RGB").save(QA / "starters.png")
        print(f"sheets: wrote starters.png ({len(cells)} cells)", flush=True)

    # per-category sheets: 12 items composited on body + dad head
    if body is not None:
        dad_head = _safe_open(OUT / "dad-neutral.webp")
        for category in CATEGORIES:
            cells = []
            for i in range(1, 13):
                item_id = f"{category}-{i:02d}"
                layer = _safe_open(OUT / f"{item_id}.webp") if category != "hat" else _safe_open(OUT / f"dad-{item_id}.webp")
                if layer is None:
                    continue
                layers = [body, layer, dad_head] if category != "hat" else [body, dad_head, layer]
                composite = composite_layers(*[l for l in layers if l is not None])
                cells.append((item_id, composite))
            if cells:
                _grid_sheet(cells, columns=4).convert("RGB").save(QA / f"{category}.png")
                print(f"sheets: wrote {category}.png ({len(cells)} cells)", flush=True)

    # stack.png: all six chars wearing item-12 of every category
    if body is not None:
        cells = []
        for char in CHARACTERS:
            head = _safe_open(OUT / f"{char}-neutral.webp")
            hat = _safe_open(OUT / f"{char}-hat-12.webp")
            pants = _safe_open(OUT / "pants-12.webp")
            vest = _safe_open(OUT / "vest-12.webp")
            cloak = _safe_open(OUT / "cloak-12.webp")
            necklace = _safe_open(OUT / "necklace-12.webp")
            wand = _safe_open(OUT / "wand-12.webp")
            broom = _safe_open(OUT / "broom-12.webp")
            gloves = _safe_open(OUT / "gloves-12.webp")
            # composite order: body, pants, vest, cloak, necklace, wand, broom, gloves, head, hat
            layers = [body, pants, vest, cloak, necklace, wand, broom, gloves, head, hat]
            composite = composite_layers(*[l for l in layers if l is not None])
            cells.append((char, composite))
        _grid_sheet(cells, columns=3).convert("RGB").save(QA / "stack.png")
        print(f"sheets: wrote stack.png ({len(cells)} cells)", flush=True)


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("stage", choices=("body", "landmarks", "zones", "heads", "hats", "garments", "starters", "sheets"))
    parser.add_argument("--only", default=None)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--max-workers", type=int, default=4)
    parser.add_argument("--flagged", action="store_true",
                        help="hats stage only: regenerate exactly the hat outputs whose "
                             "manifest record has crownOk=false, using the strengthened "
                             "fit-exemplar prompt/mask, instead of --only/--force selection")
    args = parser.parse_args()

    if args.stage in ("hats", "garments", "starters") and not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is not configured")

    if args.stage == "body":
        stage_body(args.force)
    elif args.stage == "landmarks":
        stage_landmarks(args.force)
    elif args.stage == "zones":
        landmarks = load_landmarks()
        zones = build_zones(landmarks)
        print(f"zones: built {len(zones)} zone masks: {sorted(zones)}")
    elif args.stage == "heads":
        stage_heads(args.only, args.force)
    elif args.stage == "hats":
        stage_hats(args.only, args.force, args.max_workers, flagged=args.flagged)
    elif args.stage == "garments":
        stage_garments(args.only, args.force, args.max_workers)
    elif args.stage == "starters":
        stage_starters(args.only, args.force, args.max_workers)
    elif args.stage == "sheets":
        stage_sheets()


if __name__ == "__main__":
    main()
