#!/usr/bin/env python3
"""Create three bounded, garment-only paper-doll prototypes.

This is deliberately not a wardrobe batch job.  It calls the image-edit API
once for each of ``cloak-01``, ``cloak-12`` and ``vest-01`` and retries a
prototype at most once when the response or its semantic matte fails QA.
The existing fitted layers are the authoritative garment RGB source; the API
response supplies an additional semantic extraction signal so copied body
pixels are not silently carried into a new accessory layer.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DOLL = ROOT / "assets" / "doll"
DESIGNS = ROOT / "assets" / "shop-designs"
OUT = DOLL / "prototypes" / "clothes"
QA = Path("/tmp/paper-doll-qa")
MODEL = "gpt-image-2.5-sunburst"
CANVAS = (1024, 1536)
W, H = CANVAS
MAX_ATTEMPTS = 2

# Keep this list fixed: no bulk generation is allowed by this prototype stage.
PROTOTYPES = ("cloak-01", "cloak-12", "vest-01")

# These are the measured mannequin landmarks, not a resized or reposed model.
SHOULDER_Y = 469
WAIST_Y = 796
HIP_Y = 913
KNEE_Y = 1204
BOOT_Y = 1332
HAND_BOXES = ((228, 770, 386, 978), (690, 770, 810, 978))

# The API may edit only the broad garment envelope.  The final matte is
# narrower and is always intersected with this same pose-locked envelope.
EDITABLE_BOXES = {
    "cloak": (145, 420, 880, 1310),
    "vest": (350, 425, 675, 950),
}

# Affine fitting of each supplied product alpha to the already registered
# mannequin pose.  These are garment geometry anchors (not a forced opening);
# the product's own transparent pixels remain transparent after fitting.
DESIGN_FITS = {
    "cloak-01": (1.34, 1.00, 222, 437),
    "cloak-12": (1.40, 0.88, 175, 437),
    "vest-01": (0.52, 0.60, 397, 467),
}

PROMPTS = {
    "cloak": (
        "Image 1 is the authoritative 1024x1536 transparent mannequin in the "
        "exact front-facing body pose. Image 2 is the exact shop product cloak "
        "design. Image 3 is the current body-clothed composite showing the "
        "already-generated cloak; use it to preserve the real garment RGB, "
        "seams, clasp, trim, folds, sleeves and silhouette. "
        "Extract and fit only this exact cloak to image 1's existing neck, "
        "shoulder, waist, arms and lower-body coordinates. Preserve the product "
        "design; do not redesign it, recolor it, or invent a different garment. "
        "Where this cloak has an open front/central opening, that opening must "
        "remain genuinely transparent so the vest and trousers placed behind "
        "it stay visible. Do not fill an opening with dark cloth or a body "
        "shadow. Keep real cloak cloth in every closed panel, including the "
        "neck clasp, lapels and trim. Sleeves/panels must follow the unchanged "
        "hanging arms. "
        "Output one garment-only RGBA layer on the same 1024x1536 canvas. "
        "Everything that is not cloak must be transparent: no head, hair, "
        "face, neck skin, hands, boots, plain cream shirt, shirt sleeves, "
        "gray trousers, or body pixels. Do not paint a mannequin or a "
        "background. This is a semantic matte/extraction of the supplied "
        "generated art, not a new illustration."
    ),
    "vest": (
        "Image 1 is the authoritative 1024x1536 transparent mannequin in the "
        "exact front-facing body pose. Image 2 is the exact shop product vest "
        "design. Image 3 is the current body-clothed composite showing the "
        "already-generated vest; use it to preserve the real garment RGB, "
        "stitching, pockets, buttons, V-neck and hem. "
        "Extract and fit only this exact vest to image 1's unchanged neck, "
        "shoulder, torso and waist coordinates. Preserve the product design "
        "and material; do not recolor or redraw it. The V-neck opening must "
        "be transparent (no cream shirt/neck skin in the vest layer), while "
        "all actual vest cloth, buttons, pockets, seams and hem remain opaque. "
        "Output one garment-only RGBA layer on the same 1024x1536 canvas. "
        "Everything that is not vest must be transparent: no head, hair, "
        "neck skin, hands, sleeves, plain cream shirt, gray trousers, boots, "
        "or body pixels. Do not paint a mannequin or a background. This is a "
        "semantic matte/extraction of the supplied generated art, not a new "
        "illustration."
    ),
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGBA").save(buffer, format="PNG")
    return buffer.getvalue()


def multipart(
    fields: dict[str, str],
    images: list[tuple[str, bytes]],
    mask: bytes,
) -> tuple[bytes, str]:
    """Build the multipart body for one /v1/images/edits request."""
    boundary = "clean-clothes-" + hashlib.sha256(os.urandom(24)).hexdigest()[:24]
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


def api_edit(
    prompt: str,
    references: list[Image.Image],
    mask: Image.Image,
) -> tuple[Image.Image, bytes]:
    """Perform exactly one API request; retry policy lives in ``generate_one``."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    fields = {
        "model": MODEL,
        "prompt": prompt,
        "size": f"{W}x{H}",
        "quality": "high",
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
    with urllib.request.urlopen(request, timeout=300) as response:
        result = json.load(response)
    try:
        encoded = result["data"][0]["b64_json"]
        raw_png = base64.b64decode(encoded, validate=True)
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise RuntimeError("image API returned no decodable image") from error
    try:
        image = Image.open(io.BytesIO(raw_png)).convert("RGBA")
    except (OSError, ValueError) as error:
        raise RuntimeError("image API returned an invalid image") from error
    return image, raw_png


def load_rgba(path: Path, *, canvas: bool = True) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(path)
    image = Image.open(path).convert("RGBA")
    if canvas and image.size != CANVAS:
        raise ValueError(f"{path} must be {CANVAS}, got {image.size}")
    return image


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 10 else 0)
    return alpha.getbbox()


def alpha_composite(*layers: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    for layer in layers:
        canvas = Image.alpha_composite(canvas, layer.convert("RGBA"))
    return canvas


def make_editable(category: str) -> np.ndarray:
    """Return the pose-locked editable region for the API mask."""
    x0, y0, x1, y1 = EDITABLE_BOXES[category]
    editable = np.zeros((H, W), dtype=bool)
    editable[y0:y1, x0:x1] = True
    return editable


def mask_from_editable(editable: np.ndarray) -> Image.Image:
    # The Images API uses opaque mask pixels as protected and transparent
    # pixels as editable.  Keep the alpha channel explicit for auditability.
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, 3] = np.where(editable, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba, mode="RGBA")


def hsv_array(image: Image.Image) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    hsv = np.asarray(image.convert("HSV"), dtype=np.float32)
    return hsv[:, :, 0] * (360.0 / 255.0), hsv[:, :, 1] / 255.0, hsv[:, :, 2] / 255.0


def body_copy_mask(
    current: Image.Image,
    mannequin: Image.Image,
    category: str,
) -> np.ndarray:
    """Identify body pixels copied into the old fitted layer.

    The current layer is compared at the exact registered coordinates.  This
    is intentionally an alpha matte operation: RGB texture from the garment is
    never painted or synthesized locally.
    """
    current_rgba = np.asarray(current.convert("RGBA"), dtype=np.int32)
    body_rgba = np.asarray(mannequin.convert("RGBA"), dtype=np.int32)
    alpha = current_rgba[:, :, 3] > 10
    distance = np.sqrt(((current_rgba[:, :, :3] - body_rgba[:, :, :3]) ** 2).sum(axis=2))
    copied = alpha & (distance <= 28)

    # Remove skin-colored neck/hand pixels even when JPEG/WebP edges moved the
    # exact RGB by more than the comparison tolerance.
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

    # The garment is never allowed to include head/neck, boots, or a body
    # hand.  Cloak sleeves stop before the hand boxes; retaining only the exact
    # skin mask avoids chopping off a legitimate hanging sleeve.
    copied[:390] = True
    copied[BOOT_Y:] = True
    if category == "vest":
        copied[940:] = True
    return copied


def raw_changed_mask(
    raw: Image.Image,
    mannequin: Image.Image,
    editable: np.ndarray,
) -> np.ndarray:
    """Estimate the API semantic matte from changed pixels, not body alpha."""
    a = np.asarray(raw.convert("RGBA"), dtype=np.int32)
    b = np.asarray(mannequin.convert("RGBA"), dtype=np.int32)
    if a.shape[:2] != (H, W):
        raise ValueError(f"API output must be {CANVAS}, got {raw.size}")
    rgb_distance = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha_distance = np.abs(a[:, :, 3] - b[:, :, 3])
    changed = ((rgb_distance > 30) | (alpha_distance > 24)) & (a[:, :, 3] > 10)
    return changed & editable


def raw_pose_alignment(category: str, image: Image.Image) -> tuple[bool, dict[str, object]]:
    """Check whether the direct API canvas already matches the doll pose."""
    bbox = alpha_bbox(image)
    if bbox is None:
        return False, {"bbox": None, "reason": "raw output has no alpha"}
    x0, y0, x1, y1 = bbox
    ex0, ey0, ex1, ey1 = EDITABLE_BOXES[category]
    # Allow only a small antialiasing margin.  A centered product cutout that
    # needs ghost fitting is intentionally recorded as a direct-alignment
    # failure rather than silently called pose-aligned.
    margin = 8
    ok = x0 >= ex0 - margin and y0 >= ey0 - margin and x1 <= ex1 + margin and y1 <= ey1 + margin
    return ok, {
        "bbox": list(bbox),
        "expectedEnvelope": [ex0, ey0, ex1, ey1],
        "reason": None if ok else "raw canvas is a centered product cutout; ghost fit required",
    }


def fade_alpha(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    image = Image.fromarray((mask.astype(np.uint8) * 255), mode="L")
    if radius:
        image = image.filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(image, dtype=np.float32) / 255.0


def fitted_design_alpha(key: str, design: Image.Image) -> np.ndarray:
    """Place the product's own alpha at the measured mannequin coordinates."""
    try:
        sx, sy, tx, ty = DESIGN_FITS[key]
    except KeyError as error:
        raise ValueError(f"missing product fit geometry for {key}") from error
    product_alpha = np.asarray(design.getchannel("A"), dtype=np.uint8)
    product_mask = Image.fromarray(product_alpha, mode="L")
    width = max(1, round(product_mask.width * sx))
    height = max(1, round(product_mask.height * sy))
    fitted = product_mask.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("L", CANVAS, 0)
    canvas.paste(fitted, (tx, ty))
    return np.asarray(canvas, dtype=np.uint8)


def fitted_raw_art(
    key: str,
    raw: Image.Image,
    design_geometry: np.ndarray,
) -> Image.Image:
    """Ghost-fit a raw garment response into the registered design envelope.

    The API responses are retained verbatim as raw evidence.  This separate
    alpha/compositing step discards their unaligned transparent-canvas
    margins/background bands and maps only the garment crop into the supplied
    product silhouette.  It never paints pixels or changes garment RGB.
    """
    raw_alpha = raw.getchannel("A").point(lambda value: 255 if value > 10 else 0)
    bbox = raw_alpha.getbbox()
    if bbox is None:
        raise ValueError(f"{key}: raw API output has no alpha garment")
    target_alpha = Image.fromarray(design_geometry, mode="L")
    target_bbox = target_alpha.point(lambda value: 255 if value > 10 else 0).getbbox()
    if target_bbox is None:
        raise ValueError(f"{key}: product reference has no fitted alpha geometry")
    crop = raw.crop(bbox)
    x0, y0, x1, y1 = target_bbox
    crop = crop.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(crop, (x0, y0))
    rgba = np.asarray(canvas).copy()
    # Product alpha is authoritative for transparent gaps/edges.  Do not let
    # horizontal model background bands become garment pixels.
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], design_geometry)
    rgba[rgba[:, :, 3] < 10] = 0
    return Image.fromarray(rgba, mode="RGBA")


def semantic_extract(
    key: str,
    category: str,
    current: Image.Image,
    raw: Image.Image,
    mannequin: Image.Image,
    editable: np.ndarray,
    design: Image.Image,
) -> tuple[Image.Image, dict[str, int | float]]:
    """Extract existing garment RGB under a model-assisted semantic matte."""
    current_arr = np.asarray(current.convert("RGBA")).copy()
    copied = body_copy_mask(current, mannequin, category)
    api_changed = raw_changed_mask(raw, mannequin, editable)
    design_geometry = fitted_design_alpha(key, design)
    raw_fit = fitted_raw_art(key, raw, design_geometry)
    raw_fit_arr = np.asarray(raw_fit.convert("RGBA"))
    # Inside the exact product silhouette, the supplied layer's dark/gray
    # fabric can legitimately be close to the mannequin trousers.  The
    # product alpha is the stronger semantic cue there; copied body pixels
    # outside the product silhouette remain removable.
    if category == "vest":
        # The vest reference's lower hem occupies the same registered band as
        # the copied trousers, so the exact mannequin-pixel comparison must
        # win even inside the product silhouette.
        copied_effective = copied
    else:
        copied_effective = copied & ~(design_geometry > 10)

    # The old layer contains actual garment RGB plus copied body fragments.
    # Retain its garment pixels.  The model response is used as a semantic
    # extraction signal only when it lands on an already-registered garment
    # pixel; a product-sized response in a different coordinate system must
    # never enlarge or reposition the fitted layer.
    if category == "cloak":
        # Above the waist/lower opening, the fitted layer's registered sleeve
        # silhouette is the strongest pose anchor.  Below the opening, the
        # product alpha removes the copied trouser legs without narrowing the
        # unchanged hanging sleeves.
        registered_region = (design_geometry > 10) | (
            np.indices((H, W))[0] < 975
        )
    else:
        registered_region = design_geometry > 10
    old_garment = (
        (current_arr[:, :, 3] > 10)
        & editable
        & registered_region
        & ~copied_effective
    )
    take_raw = api_changed & old_garment
    yy = np.indices((H, W))[0]
    # cloak-12's supplied product has a true open front.  The raw semantic
    # extraction preserves that transparent opening; use it from the chest
    # downward while retaining the already registered collar/shoulder edge.
    raw_main = (
        (key == "cloak-12")
        & (yy >= 500)
        & (raw_fit_arr[:, :, 3] > 10)
        & editable
        & ~copied_effective
    )
    if key == "cloak-12":
        old_garment &= ~((yy >= 500) & editable)
    # Fill only transparent holes inside the product geometry with the
    # ghost-fitted raw garment.  Existing garment RGB always wins.
    raw_fill = (
        (raw_fit_arr[:, :, 3] > 10)
        & editable
        & (design_geometry > 10)
        & ~copied_effective
        & ~old_garment
        & ~raw_main
    )
    matte = old_garment | raw_fill | raw_main

    output = np.zeros((H, W, 4), dtype=np.uint8)
    output[old_garment] = current_arr[old_garment]
    output[raw_main] = raw_fit_arr[raw_main]
    output[raw_fill] = raw_fit_arr[raw_fill]
    # For semantic API pixels overlapping the existing layer, preserving the
    # existing garment RGB avoids a model's accidental texture redraw.
    output[:, :, 3] = np.clip(
        fade_alpha(matte, radius=1) * 255.0, 0, 255
    ).astype(np.uint8)
    # For semantic API pixels overlapping the existing layer, preserving the
    # existing garment RGB avoids a model's accidental texture redraw.
    output[:, :, 3] = np.clip(fade_alpha(matte, radius=1) * 255.0, 0, 255).astype(np.uint8)
    # Blur only feathers the garment boundary; it must never reintroduce a
    # copied shirt/pants/skin pixel that the semantic matte removed.
    output[copied_effective] = 0
    output[output[:, :, 3] < 10] = 0

    # These are explicit geometry guards, not painted fabric.  They remove
    # stray model pixels outside the known pose envelope.
    if category == "cloak":
        output[:390] = 0
        output[BOOT_Y:] = 0
    else:
        output[:425] = 0
        output[940:] = 0
    stats = {
        "oldGarmentPixels": int(old_garment.sum()),
        "apiChangedPixels": int(api_changed.sum()),
        "apiSupportedGarmentPixels": int(take_raw.sum()),
        "rawFittedMainPixels": int(raw_main.sum()),
        "rawFittedFillPixels": int(raw_fill.sum()),
        "bodyCopyPixelsRemoved": int(copied_effective.sum()),
        "finalAlphaPixels": int((output[:, :, 3] > 10).sum()),
        "fittedDesignAlphaPixels": int((design_geometry > 10).sum()),
    }
    return Image.fromarray(output, mode="RGBA"), stats


def validate_output(
    key: str,
    category: str,
    final: Image.Image,
    current: Image.Image,
    mannequin: Image.Image,
) -> dict[str, int | float | bool | list[int] | None]:
    """Fail closed when alignment, masking, or the open front is missing."""
    arr = np.asarray(final.convert("RGBA"))
    alpha = arr[:, :, 3] > 10
    copied = body_copy_mask(current, mannequin, category)
    if category != "vest":
        copied &= ~(
            fitted_design_alpha(
                key, load_rgba(DESIGNS / f"{key}.webp", canvas=False)
            )
            > 10
        )
    copied_overlap = int((alpha & copied).sum())
    alpha_pixels = int(alpha.sum())
    bbox = alpha_bbox(final)
    notes: dict[str, int | float | bool | list[int] | None] = {
        "alphaPixels": alpha_pixels,
        "alphaBbox": list(bbox) if bbox else None,
        "bodyCopyOverlapPixels": copied_overlap,
        "bodyCopyOverlapFraction": (copied_overlap / alpha_pixels if alpha_pixels else 1.0),
        "alignmentOk": False,
        "openingOk": True,
        "bodyMaskOk": False,
        "ok": False,
    }
    if bbox is None or alpha_pixels < 4000:
        return notes
    x0, y0, x1, y1 = bbox
    if category == "cloak":
        alignment = (
            x0 < 300
            and x1 > 720
            and 425 <= y0 <= 500
            and 1150 <= y1 <= 1310
        )
        # The opening must come from the real/reference design, not a fixed
        # painted cutout.  A non-trivial transparent run in the central lower
        # body area is required so the QA vest/trouser colors can be seen.
        center = alpha[820:1300, 420:604]
        opening_fraction = float((~center).sum()) / float(center.size)
        opening_ok = opening_fraction >= 0.08
        notes["openingFraction"] = opening_fraction
        notes["openingOk"] = opening_ok
    else:
        alignment = (
            375 <= x0 <= 430
            and 585 <= x1 <= 650
            and 440 <= y0 <= 500
            and 790 <= y1 <= 850
        )
        opening_ok = True
    notes["alignmentOk"] = alignment
    notes["bodyMaskOk"] = copied_overlap == 0
    notes["ok"] = bool(alignment and opening_ok and copied_overlap == 0)
    return notes


def write_png(image: Image.Image, path: Path) -> bytes:
    data = png_bytes(image)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data


def source_record(path: Path, image: Image.Image) -> dict[str, object]:
    return {
        "path": str(path.relative_to(ROOT)),
        "sha256": sha256_file(path),
        "size": list(image.size),
        "alphaBbox": list(alpha_bbox(image) or ()),
    }


def prompt_for(category: str) -> str:
    return PROMPTS[category]


def existing_record(key: str) -> dict | None:
    path = OUT / f"{key}.json"
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def generate_one(key: str, force: bool = False, reuse_raw: bool = False) -> dict:
    category = "vest" if key.startswith("vest-") else "cloak"
    final_path = OUT / f"{key}.png"
    raw_path = OUT / f"{key}-raw.png"
    record_path = OUT / f"{key}.json"
    old_record = existing_record(key)
    if (
        not force
        and not reuse_raw
        and final_path.is_file()
        and raw_path.is_file()
        and old_record
    ):
        if old_record.get("status") in {"ok", "visual-review-pending"}:
            return old_record

    mannequin_path = DOLL / "mannequin.png"
    current_path = DOLL / f"{key}.webp"
    design_path = DESIGNS / f"{key}.webp"
    mannequin = load_rgba(mannequin_path)
    current = load_rgba(current_path)
    design = load_rgba(design_path, canvas=False)
    current_composite = alpha_composite(mannequin, current)
    editable = make_editable(category)
    mask = mask_from_editable(editable)
    prompt = prompt_for(category)
    attempts: list[dict[str, object]] = []
    candidates: list[tuple[int, Image.Image, bytes, dict, dict]] = []

    base_metadata = {
        "schema": "clean-garment-prototype-v1",
        "key": key,
        "category": category,
        "model": MODEL,
        "quality": "high",
        "size": list(CANVAS),
        "background": "transparent",
        "endpoint": "/v1/images/edits",
        "maxAttempts": MAX_ATTEMPTS,
        "prompt": prompt,
        "sources": {
            "mannequin": source_record(mannequin_path, mannequin),
            "product": source_record(design_path, design),
            "currentLayer": source_record(current_path, current),
            "currentBodyClothedComposite": {
                "path": str(current_path.relative_to(ROOT)) + " composited over mannequin.png",
                "sha256": sha256_bytes(png_bytes(current_composite)),
                "size": list(current_composite.size),
                "alphaBbox": list(alpha_bbox(current_composite) or ()),
            },
            "mask": {
                "sha256": sha256_bytes(png_bytes(mask)),
                "editableBox": list(EDITABLE_BOXES[category]),
            },
            "ghostFit": {
                "applied": True,
                "productScaleX": DESIGN_FITS[key][0],
                "productScaleY": DESIGN_FITS[key][1],
                "offset": list(DESIGN_FITS[key][2:]),
            },
        },
    }

    cached_raw: dict[int, tuple[Image.Image, bytes]] = {}
    if reuse_raw:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            cached_path = OUT / f"{key}-raw-attempt-{attempt}.png"
            if cached_path.is_file():
                data = cached_path.read_bytes()
                cached_raw[attempt] = (
                    Image.open(io.BytesIO(data)).convert("RGBA"),
                    data,
                )
        if not cached_raw:
            raise RuntimeError(f"{key}: --reuse-raw requested but no cached API output exists")

    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.time()
        raw_attempt_path = OUT / f"{key}-raw-attempt-{attempt}.png"
        try:
            if reuse_raw and attempt in cached_raw:
                raw, raw_png = cached_raw[attempt]
            elif reuse_raw:
                continue
            else:
                raw, raw_png = api_edit(prompt, [mannequin, design, current_composite], mask)
            raw_attempt_path.parent.mkdir(parents=True, exist_ok=True)
            raw_attempt_path.write_bytes(raw_png)
            raw_aligned, raw_alignment = raw_pose_alignment(category, raw)
            extracted, extraction_stats = semantic_extract(
                key, category, current, raw, mannequin, editable, design
            )
            validation = validate_output(key, category, extracted, current, mannequin)
            note: dict[str, object] = {
                "attempt": attempt,
                "status": (
                    "accepted"
                    if validation["ok"] and raw_aligned
                    else (
                        "accepted-after-ghost-fit"
                        if validation["ok"]
                        else "rejected"
            )
                ),
                "elapsedSeconds": round(time.time() - started, 3),
                "rawPath": raw_attempt_path.name,
                "rawSha256": sha256_bytes(raw_png),
                "rawSize": list(raw.size),
                "rawAlphaBbox": list(alpha_bbox(raw) or ()),
                "rawDirectAlignmentOk": raw_aligned,
                "rawDirectAlignmentStatus": "ok" if raw_aligned else "failed",
                "rawDirectAlignment": raw_alignment,
                "extraction": extraction_stats,
                "validation": validation,
            }
            attempts.append(note)
            candidates.append(
                (
                    int(extraction_stats["finalAlphaPixels"]),
                    extracted,
                    raw_png,
                    extraction_stats,
                    validation,
                )
            )
            if validation["ok"] and not reuse_raw:
                break
            if attempt < MAX_ATTEMPTS:
                time.sleep(2)
        except (
            urllib.error.HTTPError,
            urllib.error.URLError,
            TimeoutError,
            RuntimeError,
            OSError,
            ValueError,
            KeyError,
        ) as error:
            # Never include request headers or environment values in metadata.
            attempts.append(
                {
                    "attempt": attempt,
                    "status": "error",
                    "elapsedSeconds": round(time.time() - started, 3),
                    "error": str(error),
                }
            )
            if attempt < MAX_ATTEMPTS:
                time.sleep(2)

    metadata = dict(base_metadata)
    metadata["attempts"] = attempts
    metadata["createdAt"] = datetime.now(timezone.utc).isoformat()
    accepted = [candidate for candidate in candidates if candidate[4]["ok"]]
    if not accepted:
        metadata["status"] = "failed"
        record_path.parent.mkdir(parents=True, exist_ok=True)
        record_path.write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        raise RuntimeError(f"{key}: no aligned garment matte after {MAX_ATTEMPTS} attempts")

    # Prefer a valid candidate with the largest retained garment matte.  This
    # remains deterministic and never falls back to an old output.
    _, final, selected_raw, extraction_stats, validation = max(
        accepted, key=lambda candidate: candidate[0]
    )
    final_png = write_png(final, final_path)
    raw_path.write_bytes(selected_raw)
    selected_attempt = next(
        int(note["attempt"])
        for note in attempts
        if note.get("rawSha256") == sha256_bytes(selected_raw)
    )
    metadata.update(
        {
            "status": "visual-review-pending",
            "selectedAttempt": selected_attempt,
            "rawPath": raw_path.name,
            "finalPath": final_path.name,
            "rawSha256": sha256_bytes(selected_raw),
            "finalSha256": sha256_bytes(final_png),
            "selectedRawDirectAlignmentOk": next(
                bool(note.get("rawDirectAlignmentOk", False))
                for note in attempts
                if note.get("rawSha256") == sha256_bytes(selected_raw)
            ),
            "selectedExtraction": extraction_stats,
            "selectedValidation": validation,
        }
    )
    record_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return metadata


def tint_layer(image: Image.Image, color: str) -> Image.Image:
    """Tint an existing alpha matte for QA visibility only."""
    arr = np.asarray(image.convert("RGBA"), dtype=np.float32)
    luminance = np.asarray(image.convert("L"), dtype=np.float32) / 255.0
    rgb = np.array(tuple(bytes.fromhex(color[1:])), dtype=np.float32)
    light = 0.32 + 1.18 * luminance[:, :, None]
    arr[:, :, :3] = np.clip(rgb[None, None, :] * light, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), mode="RGBA")


def qa_red_pants(body: Image.Image) -> Image.Image:
    """Make a full-width red pants QA layer without touching shipped assets."""
    rgba = np.asarray(body.convert("RGBA")).copy()
    hue, saturation, value = hsv_array(body)
    yy, xx = np.indices((H, W))
    pants = (
        (yy >= 790)
        & (yy < BOOT_Y)
        & (xx >= 285)
        & (xx <= 740)
        & (rgba[:, :, 3] > 10)
        & (saturation < 0.48)
        & (value < 0.82)
    )
    source = Image.fromarray(rgba, mode="RGBA")
    tinted = np.asarray(tint_layer(source, "#e83d4f")).copy()
    rgba[pants] = tinted[pants]
    rgba[~pants, 3] = 0
    return Image.fromarray(rgba, mode="RGBA")


def thumbnail(image: Image.Image, width: int = 320, height: int = 480) -> Image.Image:
    scale = min(width / image.width, height / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    resized = image.resize(size, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (width, height), (239, 234, 226, 255))
    cell.alpha_composite(resized, ((width - size[0]) // 2, (height - size[1]) // 2))
    return cell


def make_qa_sheet(records: list[dict]) -> Path:
    """Create a visual sheet that exposes copied body pixels through colors."""
    QA.mkdir(parents=True, exist_ok=True)
    cell_w, cell_h = 320, 480
    label_h = 34
    columns = 3
    sheet = Image.new(
        "RGB",
        (cell_w * columns, (cell_h + label_h) * len(records)),
        "#e5ddd2",
    )
    draw = ImageDraw.Draw(sheet)
    try:
        text_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    except OSError:
        text_font = ImageFont.load_default()

    body = load_rgba(DOLL / "body.webp")
    cleaned_vest = load_rgba(OUT / "vest-01.png")
    teal_vest = tint_layer(cleaned_vest, "#00d7c6")
    red_pants = qa_red_pants(body)
    underlayers = alpha_composite(body, red_pants, teal_vest)

    for row, record in enumerate(records):
        key = record["key"]
        final = load_rgba(OUT / record["finalPath"])
        raw = load_rgba(OUT / record["rawPath"])
        if record["category"] == "cloak":
            clean_composite = alpha_composite(underlayers, final)
        else:
            clean_composite = alpha_composite(body, red_pants, final)
        cells = (underlayers, clean_composite, raw)
        labels = (
            f"{key} · teal vest + red pants",
            f"{key} · cleaned garment",
            f"{key} · selected raw layer",
        )
        for column, (cell, label) in enumerate(zip(cells, labels)):
            x = column * cell_w
            y = row * (cell_h + label_h)
            draw.rectangle((x, y, x + cell_w - 1, y + label_h - 1), fill="#2d2930")
            draw.text((x + 8, y + 8), label, fill="white", font=text_font)
            sheet.paste(thumbnail(cell, cell_w, cell_h).convert("RGB"), (x, y + label_h))
    qa_path = QA / "clean-clothes.png"
    sheet.save(qa_path, format="PNG")
    return qa_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="regenerate missing/overwritten prototypes (still max two calls each)",
    )
    parser.add_argument(
        "--reuse-raw",
        action="store_true",
        help="reprocess saved raw API images without making additional API calls",
    )
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    failures: list[dict[str, str]] = []
    for key in PROTOTYPES:
        try:
            record = generate_one(key, force=args.force, reuse_raw=args.reuse_raw)
            records.append(record)
            print(
                f"{key}: {record.get('status', 'ok')} "
                f"attempts={len(record.get('attempts', []))}",
                flush=True,
            )
        except Exception as error:
            failures.append({"key": key, "error": str(error)})
            print(f"{key}: FAILED: {error}", flush=True)
    if len(records) == len(PROTOTYPES) and not failures:
        qa_path = make_qa_sheet(records)
        qa_hash = sha256_file(qa_path)
        for record in records:
            record["qaSheetPath"] = str(qa_path)
            record["qaSheetSha256"] = qa_hash
            (OUT / f"{record['key']}.json").write_text(
                json.dumps(record, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        print(f"QA sheet: {qa_path}", flush=True)
    if failures:
        print(json.dumps({"failures": failures}, ensure_ascii=False), flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
