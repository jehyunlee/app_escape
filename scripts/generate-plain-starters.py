#!/usr/bin/env python3
"""Generate the two plain starter assets.

This is intentionally a two-edit job rather than a wardrobe batch generator:
one edit makes the isolated plain wand reference and one edit replaces the
trousers on the canonical grip-base pose.  The API responses are retained
verbatim; only alpha masks, registration, and transparent cropping are used
locally.  No pixels are painted or recoloured by this script.
"""
from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CANVAS = (1024, 1536)
W, H = CANVAS
MAX_ATTEMPTS = 2

GRIP_PATH = ROOT / "scripts" / "art-sources" / "doll-reference" / "prototypes" / "grips" / "grip-base.png"
WAND_REFERENCE_PATH = ROOT / "scripts" / "art-sources" / "shop-designs" / "wand-01.webp"
OWNERSHIP_PATH = ROOT / "assets" / "doll" / "rigged" / "native-pants-ownership.png"
BOOTS_PATH = ROOT / "assets" / "doll" / "rigged" / "boots.webp"
BODY_UPPER_PATH = ROOT / "assets" / "doll" / "rigged" / "body-upper.webp"
HANDS_PATH = ROOT / "assets" / "doll" / "rigged" / "hands-base.webp"
PANTS_01_PATH = ROOT / "assets" / "doll" / "rigged" / "clothing" / "pants-01.webp"

OUT = ROOT / "scripts" / "art-sources" / "plain-starters"
PANTS_OUT = ROOT / "assets" / "doll" / "rigged" / "starter-pants.webp"
QA_OUT = Path("/tmp/paper-doll-qa/plain-starters.png")

_API_SPEC = importlib.util.spec_from_file_location("plain_starter_image_api", ROOT / "scripts" / "image-api.py")
if _API_SPEC is None or _API_SPEC.loader is None:
    raise RuntimeError("could not load scripts/image-api.py")
_API = importlib.util.module_from_spec(_API_SPEC)
_API_SPEC.loader.exec_module(_API)


WAND_PROMPT = """Create one new isolated plain starter wand from the supplied wand product reference.
The reference is only a style and complexity comparison: the new wand MUST be clearly much simpler than it.
Output OBJECT ONLY on a true transparent 1024x1536 canvas, with one straight, slim, short vertical brown
wooden rod. It has plain matte natural brown wood grain, a narrow plain tip at the TOP, and only a slightly
thicker rounded wooden handle at the BOTTOM. The bottom end is the handle and the top end is the tip.
Absolutely no crystal, gem, stone, metal, metallic trim, gold, silver, bands, knots, branches, roots, carved
symbols, wrapped grip, glow, sparkles, or other decoration. No person, hand, body, clothing, stand, ground,
shadow, background, text, border, or second object. Keep the single rod fully visible, vertical and centered
with generous transparent margin. This is a simple starter prop, not a product-card redesign."""


PANTS_PROMPT = """Edit ONLY the leg-clothing pixels inside the supplied lower-body ownership mask on Image 1.
Image 1 is the authoritative full 1024x1536 transparent canonical two-fist paper-doll figure; it is the only
pose reference. Return the SAME whole figure on the SAME canvas, with the exact same camera, scale, body pose,
head, face, cream long-sleeve shirt, wrists, hands, arms, boots, lighting and alpha outside the mask. Do not
zoom, crop, reframe, turn the body, make a product-only cutout, or invent another mannequin.
Replace the existing trousers with one comfortable basic-fit pair of straight plain trousers: unpatterned
matte muted charcoal cloth, simple modest waistband/hem construction and natural soft folds only. They must
be visibly simpler than the supplied cheap patched-rags pants style. No belt, buckle, pocket, patch, button,
embroidery, decorative seam, piping, trim, visible external stitching, cargo details, skirt, shorts, leggings,
or exposed lower legs. Keep exactly two trousers legs in the existing coordinates and leave the unchanged
brown boots fully visible and identical. Do not include hands, arms, shirt, face, hair, props, text, shadow,
or background outside the lower-body mask. This is a pose-locked garment edit, not a new illustration."""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


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


def rgba(path: Path, *, canvas: bool = True) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    if canvas and image.size != CANVAS:
        raise ValueError(f"{path}: expected {CANVAS}, got {image.size}")
    return image


def alpha_bbox(image: Image.Image, threshold: int = 10) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    return alpha.getbbox()


def alpha_array(image: Image.Image, threshold: int = 10) -> np.ndarray:
    return np.asarray(image.getchannel("A")) > threshold


def save_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".part")
    temporary.write_bytes(data)
    temporary.replace(path)


def save_png(path: Path, image: Image.Image) -> bytes:
    data = png_bytes(image)
    save_bytes(path, data)
    return data


def save_json(path: Path, payload: dict) -> None:
    save_bytes(path, (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def source_record(path: Path, image: Image.Image | None = None) -> dict[str, object]:
    if image is None:
        image = rgba(path, canvas=False)
    return {
        "path": rel(path),
        "sha256": sha256_file(path),
        "size": list(image.size),
        "alphaBbox": list(alpha_bbox(image) or ()),
    }


def mask_from_ownership(ownership: Image.Image) -> Image.Image:
    """OpenAI mask: transparent pixels are editable; opaque pixels are protected."""
    owner = np.asarray(ownership.convert("L")) > 10
    alpha = np.where(owner, 0, 255).astype(np.uint8)
    rgb = np.zeros((H, W, 3), dtype=np.uint8)
    return Image.fromarray(np.dstack((rgb, alpha)), mode="RGBA")


def blank_mask() -> Image.Image:
    return Image.new("RGBA", CANVAS, (0, 0, 0, 0))


def place_wand_reference(reference: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    """Normalize the tiny shop swatch to the API canvas without painting it."""
    source_alpha = reference.getchannel("A")
    box = source_alpha.point(lambda value: 255 if value > 10 else 0).getbbox()
    if box is None:
        raise ValueError("wand-01 reference has no alpha")
    crop = reference.crop(box)
    target_height = 1080
    target_width = max(1, round(crop.width * target_height / crop.height))
    fitted = crop.resize((target_width, target_height), Image.Resampling.LANCZOS)
    x = (W - target_width) // 2
    y = (H - target_height) // 2
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(fitted, (x, y))
    return canvas, {
        "method": "transparent-registration-only",
        "sourceBbox": list(box),
        "targetBbox": [x, y, x + target_width, y + target_height],
        "targetSize": [target_width, target_height],
    }


def raw_drift(before: Image.Image, after: Image.Image, protected: np.ndarray) -> dict[str, object]:
    a = np.asarray(before.convert("RGBA"), dtype=np.int32)
    b = np.asarray(after.convert("RGBA"), dtype=np.int32)
    if a.shape != b.shape:
        return {"comparable": False, "reason": "size-mismatch"}
    rgb = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha = np.abs(a[:, :, 3] - b[:, :, 3])
    changed = ((rgb > 40) | (alpha > 40)) & protected
    return {
        "comparable": True,
        "protectedPixels": int(protected.sum()),
        "changedPixels": int(changed.sum()),
        "changedFraction": float(changed.sum()) / float(max(1, protected.sum())),
    }


def bbox_alignment(source: Image.Image, raw: Image.Image) -> dict[str, object]:
    source_box = alpha_bbox(source)
    raw_box = alpha_bbox(raw)
    if source_box is None or raw_box is None:
        return {"ok": False, "sourceBbox": list(source_box or ()), "rawBbox": list(raw_box or ()), "reason": "missing-alpha"}
    source_w = source_box[2] - source_box[0]
    source_h = source_box[3] - source_box[1]
    raw_w = raw_box[2] - raw_box[0]
    raw_h = raw_box[3] - raw_box[1]
    scales = [raw_w / max(1, source_w), raw_h / max(1, source_h)]
    delta = [raw_box[i] - source_box[i] for i in range(4)]
    ok = (
        raw.size == CANVAS
        and all(abs(value) <= 36 for value in delta)
        and all(0.88 <= value <= 1.12 for value in scales)
    )
    return {
        "ok": bool(ok),
        "sourceBbox": list(source_box),
        "rawBbox": list(raw_box),
        "bboxDelta": delta,
        "scale": scales,
        "reason": None if ok else "raw canvas pose/scale differs from canonical",
    }


def register_to_source(raw: Image.Image, source: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    """Register a zoomed full-figure response before applying the ownership mask."""
    raw_box = alpha_bbox(raw)
    source_box = alpha_bbox(source)
    if raw_box is None or source_box is None:
        raise ValueError("cannot register an alpha-empty response")
    crop = raw.crop(raw_box)
    target_size = (source_box[2] - source_box[0], source_box[3] - source_box[1])
    fitted = crop.resize(target_size, Image.Resampling.LANCZOS)
    registered = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    registered.alpha_composite(fitted, source_box[:2])
    return registered, {
        "method": "alpha-bbox-registration",
        "rawBbox": list(raw_box),
        "targetBbox": list(source_box),
        "targetSize": list(target_size),
        "translation": [source_box[0] - raw_box[0], source_box[1] - raw_box[1]],
        "scale": [
            target_size[0] / max(1, raw_box[2] - raw_box[0]),
            target_size[1] / max(1, raw_box[3] - raw_box[1]),
        ],
    }


def clamp_to_mask(source: Image.Image, edited: Image.Image, editable: np.ndarray) -> Image.Image:
    original = np.asarray(source.convert("RGBA")).copy()
    generated = np.asarray(edited.convert("RGBA"))
    original[editable] = generated[editable]
    return Image.fromarray(original, mode="RGBA")


def boots_preserved(
    image: Image.Image,
    source: Image.Image,
    boots: Image.Image,
) -> tuple[Image.Image, dict[str, object]]:
    """Restore only the authored boot pixels; no RGB is synthesized locally."""
    result = np.asarray(image.convert("RGBA")).copy()
    source_arr = np.asarray(source.convert("RGBA"))
    boot_mask = alpha_array(boots)
    result[boot_mask] = source_arr[boot_mask]
    return Image.fromarray(result, mode="RGBA"), {
        "source": rel(BOOTS_PATH),
        "sha256": sha256_file(BOOTS_PATH),
        "pixels": int(boot_mask.sum()),
        "exact": bool(np.array_equal(result[boot_mask], source_arr[boot_mask])),
    }


def shirt_hem_preserved(
    image: Image.Image,
    source: Image.Image,
    body_upper: Image.Image,
    ownership: np.ndarray,
) -> tuple[Image.Image, dict[str, object]]:
    """Keep the authored shirt/hem pixels where the ownership mask includes them."""
    result = np.asarray(image.convert("RGBA")).copy()
    source_arr = np.asarray(source.convert("RGBA"))
    shirt_mask = ownership & alpha_array(body_upper)
    result[shirt_mask] = source_arr[shirt_mask]
    return Image.fromarray(result, mode="RGBA"), {
        "source": rel(BODY_UPPER_PATH),
        "sha256": sha256_file(BODY_UPPER_PATH),
        "pixels": int(shirt_mask.sum()),
        "exact": bool(np.array_equal(result[shirt_mask], source_arr[shirt_mask])),
    }


def pants_change_stats(
    source: Image.Image,
    raw: Image.Image,
    owner: np.ndarray,
    boots: np.ndarray,
) -> dict[str, object]:
    a = np.asarray(source.convert("RGBA"), dtype=np.int32)
    b = np.asarray(raw.convert("RGBA"), dtype=np.int32)
    source_alpha = a[:, :, 3] > 10
    pants = owner & ~boots & source_alpha
    rgb = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha = np.abs(a[:, :, 3] - b[:, :, 3])
    changed = (rgb > 24) | (alpha > 24)
    changed_pixels = int((changed & pants).sum())
    total = int(pants.sum())
    return {
        "sourcePantsPixels": total,
        "changedPantsPixels": changed_pixels,
        "changedFraction": changed_pixels / float(max(1, total)),
    }


def central_gap_stats(image: Image.Image, owner: np.ndarray) -> dict[str, object]:
    alpha = alpha_array(image)
    rows = alpha[950:1260]
    gap = ~rows[:, 490:540]
    owner_rows = owner[950:1260, 490:540]
    visible_gap = gap & owner_rows
    return {
        "checkedRows": int(rows.shape[0]),
        "centralOwnerPixels": int(owner_rows.sum()),
        "transparentCentralPixels": int(visible_gap.sum()),
        "transparentFraction": float(visible_gap.sum()) / float(max(1, owner_rows.sum())),
        "ok": bool(visible_gap.sum() > 250),
    }


def validate_pants(
    final: Image.Image,
    source: Image.Image,
    ownership: np.ndarray,
    boots: Image.Image,
    change: dict[str, object],
) -> dict[str, object]:
    alpha = alpha_array(final)
    source_alpha = alpha_array(source)
    bbox = alpha_bbox(final)
    boot_mask = alpha_array(boots)
    source_pants = ownership & ~boot_mask & source_alpha
    covered_pants = int((alpha & source_pants).sum())
    expected = int(source_pants.sum())
    outside = int((alpha & ~ownership).sum())
    boot_exact = bool(np.array_equal(np.asarray(final)[boot_mask], np.asarray(source)[boot_mask]))
    alignment = bool(
        bbox
        and bbox[1] <= 790
        and bbox[3] >= 1480
        and bbox[0] >= 225
        and bbox[2] <= 810
    )
    gap = central_gap_stats(final, ownership)
    result = {
        "alphaPixels": int(alpha.sum()),
        "alphaBbox": list(bbox or ()),
        "ownershipOutsidePixels": outside,
        "pantsCoveragePixels": covered_pants,
        "pantsCoverageFraction": covered_pants / float(max(1, expected)),
        "changedPantsFraction": change["changedFraction"],
        "bootsExact": boot_exact,
        "alignmentOk": alignment,
        "centralLegGap": gap,
        "upperBodyTransparent": not alpha[:774].any(),
    }
    result["ok"] = bool(
        alignment
        and outside == 0
        and boot_exact
        and result["upperBodyTransparent"]
        and result["pantsCoverageFraction"] >= 0.62
        and float(change["changedFraction"]) >= 0.10
        and gap["ok"]
    )
    return result


def wand_crop(raw: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    alpha = raw.getchannel("A").point(lambda value: 255 if value > 20 else 0)
    box = alpha.getbbox()
    if box is None:
        raise ValueError("wand response has no visible object")
    crop = raw.crop(box)
    crop_alpha = np.asarray(crop.getchannel("A")) > 20
    ys, xs = np.where(crop_alpha)
    if len(xs) < 900:
        raise ValueError("wand response has too few opaque pixels")
    width = box[2] - box[0]
    height = box[3] - box[1]
    if height < width * 2.0:
        raise ValueError("wand response is not a single slim vertical object")
    top_band = crop_alpha[: max(1, height // 12)]
    bottom_start = max(0, height - max(1, height // 12))
    bottom_band = crop_alpha[bottom_start:]
    if not top_band.any() or not bottom_band.any():
        raise ValueError("wand response does not expose both tip and handle ends")
    top_y, top_x = np.where(top_band)
    bottom_y, bottom_x = np.where(bottom_band)
    handle = [float(np.mean(bottom_x)), float(np.mean(bottom_y) + bottom_start)]
    tip = [float(np.mean(top_x)), float(np.mean(top_y))]
    return crop, {
        "cropBoxOnApiCanvas": list(box),
        "size": list(crop.size),
        "alphaPixels": int(crop_alpha.sum()),
        "orientation": "tip-top-handle-bottom",
        "tipEnd": "top",
        "handleEnd": "bottom",
        "tipAnchorInCrop": tip,
        "handleAnchorInCrop": handle,
        "mountAnchor": {
            "end": "handle",
            "point": handle,
            "normalized": [handle[0] / max(1, crop.width), handle[1] / max(1, crop.height)],
        },
    }


def run_wand() -> dict[str, object]:
    reference = rgba(WAND_REFERENCE_PATH, canvas=False)
    reference_canvas, reference_registration = place_wand_reference(reference)
    mask = blank_mask()
    save_png(OUT / "wand-base-input-mask.png", mask)
    attempts: list[dict[str, object]] = []
    selected: tuple[Image.Image, bytes, dict[str, object], dict[str, object]] | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.time()
        raw_path = OUT / f"wand-base-raw-attempt-{attempt}.png"
        try:
            raw, raw_bytes = _API.api_edit(WAND_PROMPT, [reference_canvas], mask)
            save_bytes(raw_path, raw_bytes)
            alignment = bbox_alignment(reference_canvas, raw)
            crop, crop_info = wand_crop(raw)
            note = {
                "attempt": attempt,
                "status": "accepted",
                "elapsedSeconds": round(time.time() - started, 3),
                "rawPath": raw_path.name,
                "rawSha256": sha256_bytes(raw_bytes),
                "rawSize": list(raw.size),
                "rawAlphaBbox": list(alpha_bbox(raw) or ()),
                "rawPoseAlignment": alignment,
                "cropped": crop_info,
            }
            attempts.append(note)
            selected = (crop, raw_bytes, note, alignment)
            break
        except Exception as error:
            attempts.append(
                {
                    "attempt": attempt,
                    "status": "rejected",
                    "elapsedSeconds": round(time.time() - started, 3),
                    "rawPath": raw_path.name,
                    "error": str(error),
                }
            )
            if attempt == MAX_ATTEMPTS:
                break
    if selected is None:
        metadata = {
            "schema": "plain-starter-wand-v1",
            "status": "failed",
            "model": _API.MODEL,
            "quality": "high",
            "size": list(CANVAS),
            "background": "transparent",
            "prompt": WAND_PROMPT,
            "attempts": attempts,
        }
        save_json(OUT / "wand-base.json", metadata)
        raise RuntimeError("wand: no valid object-only response after two attempts")

    crop, raw_bytes, selected_note, alignment = selected
    final_bytes = save_png(OUT / "wand-base.png", crop)
    raw_selected = OUT / "wand-base-raw.png"
    save_bytes(raw_selected, raw_bytes)
    metadata = {
        "schema": "plain-starter-wand-v1",
        "status": "visual-review-pending",
        "model": _API.MODEL,
        "quality": "high",
        "size": list(CANVAS),
        "background": "transparent",
        "outputFormat": "png",
        "prompt": WAND_PROMPT,
        "promptSha256": sha256_bytes(WAND_PROMPT.encode()),
        "maxAttempts": MAX_ATTEMPTS,
        "createdAt": now_iso(),
        "sources": {
            "wand01StyleReference": source_record(WAND_REFERENCE_PATH, reference),
            "apiReferenceRegistration": reference_registration,
            "mask": {
                "path": rel(OUT / "wand-base-input-mask.png"),
                "sha256": sha256_file(OUT / "wand-base-input-mask.png"),
                "editable": "entire transparent API canvas",
            },
        },
        "attempts": attempts,
        "selectedAttempt": int(selected_note["attempt"]),
        "rawApiPath": raw_selected.name,
        "rawApiSha256": sha256_file(raw_selected),
        "rawApiSize": list(raw.size),
        "rawPoseAlignment": alignment,
        "finalPath": "wand-base.png",
        "finalSha256": sha256_bytes(final_bytes),
        "finalSize": list(crop.size),
        "registration": selected_note["cropped"],
        "handle": {
            "end": "bottom",
            "anchor": selected_note["cropped"]["handleAnchorInCrop"],
            "tipEnd": "top",
            "tipAnchor": selected_note["cropped"]["tipAnchorInCrop"],
            "note": "The bottom/rounded end is the handle; mount using handleAnchorInCrop.",
        },
    }
    save_json(OUT / "wand-base.json", metadata)
    return metadata


def run_pants() -> dict[str, object]:
    source = rgba(GRIP_PATH)
    ownership_image = Image.open(OWNERSHIP_PATH).convert("L")
    if ownership_image.size != CANVAS:
        raise ValueError(f"{OWNERSHIP_PATH}: expected {CANVAS}")
    owner = np.asarray(ownership_image) > 10
    editable_mask = mask_from_ownership(ownership_image)
    save_png(OUT / "starter-pants-input-mask.png", editable_mask)
    boots = rgba(BOOTS_PATH)
    body_upper = rgba(BODY_UPPER_PATH)
    boots_mask = alpha_array(boots)
    attempts: list[dict[str, object]] = []
    selected: tuple[Image.Image, bytes, dict[str, object], dict[str, object]] | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.time()
        raw_path = OUT / f"starter-pants-raw-attempt-{attempt}.png"
        try:
            # The full canonical grip-base is deliberately the only API image
            # input: it prevents a product-card crop from defining the pose.
            raw, raw_bytes = _API.api_edit(PANTS_PROMPT, [source], editable_mask)
            save_bytes(raw_path, raw_bytes)
            alignment = bbox_alignment(source, raw)
            raw_for_extract = raw
            registration = {"method": "direct-canvas", "applied": False}
            if not alignment["ok"]:
                raw_for_extract, registration = register_to_source(raw, source)
                registration["applied"] = True
            drift = raw_drift(source, raw, ~owner)
            change = pants_change_stats(source, raw_for_extract, owner, boots_mask)
            clamped = clamp_to_mask(source, raw_for_extract, owner)
            clamped, boot_restore = boots_preserved(clamped, source, boots)
            clamped, shirt_restore = shirt_hem_preserved(clamped, source, body_upper, owner)
            output_arr = np.asarray(clamped.convert("RGBA")).copy()
            output_arr[~owner] = 0
            output_arr[output_arr[:, :, 3] < 10] = 0
            final = Image.fromarray(output_arr, mode="RGBA")
            validation = validate_pants(final, source, owner, boots, change)
            note = {
                "attempt": attempt,
                "status": "accepted" if validation["ok"] else "rejected",
                "elapsedSeconds": round(time.time() - started, 3),
                "rawPath": raw_path.name,
                "rawSha256": sha256_bytes(raw_bytes),
                "rawSize": list(raw.size),
                "rawAlphaBbox": list(alpha_bbox(raw) or ()),
                "rawPoseAlignment": alignment,
                "rawBeforeClampDrift": drift,
                "registrationBeforeExtract": registration,
                "change": change,
                "bootRestore": boot_restore,
                "shirtHemRestore": shirt_restore,
                "validation": validation,
            }
            attempts.append(note)
            if validation["ok"] or attempt == MAX_ATTEMPTS:
                selected = (final, raw_bytes, note, registration)
                break
        except Exception as error:
            attempts.append(
                {
                    "attempt": attempt,
                    "status": "error",
                    "elapsedSeconds": round(time.time() - started, 3),
                    "rawPath": raw_path.name,
                    "error": str(error),
                }
            )
            if attempt == MAX_ATTEMPTS:
                break
    if selected is None:
        metadata = {
            "schema": "plain-starter-pants-v1",
            "status": "failed",
            "model": _API.MODEL,
            "quality": "high",
            "size": list(CANVAS),
            "background": "transparent",
            "prompt": PANTS_PROMPT,
            "attempts": attempts,
        }
        save_json(OUT / "starter-pants.json", metadata)
        raise RuntimeError("pants: no API response after two attempts")

    final, raw_bytes, selected_note, registration = selected
    final_data = webp_bytes(final)
    save_bytes(PANTS_OUT, final_data)
    raw_selected = OUT / "starter-pants-raw.png"
    save_bytes(raw_selected, raw_bytes)
    ownership_data = OWNERSHIP_PATH.read_bytes()
    metadata = {
        "schema": "plain-starter-pants-v1",
        "status": "visual-review-pending" if selected_note["validation"]["ok"] else "flagged-visual-review",
        "model": _API.MODEL,
        "quality": "high",
        "size": list(CANVAS),
        "background": "transparent",
        "outputFormat": "webp",
        "prompt": PANTS_PROMPT,
        "promptSha256": sha256_bytes(PANTS_PROMPT.encode()),
        "maxAttempts": MAX_ATTEMPTS,
        "createdAt": now_iso(),
        "sources": {
            "canonicalGripBase": source_record(GRIP_PATH, source),
            "lowerBodyOwnership": {
                "path": rel(OWNERSHIP_PATH),
                "sha256": sha256_bytes(ownership_data),
                "size": list(ownership_image.size),
                "pixels": int(owner.sum()),
                "semantics": "lower-body owner; preserves shirt hem and excludes hands",
            },
            "boots": source_record(BOOTS_PATH, boots),
            "bodyUpper": source_record(BODY_UPPER_PATH, body_upper),
        },
        "mask": {
            "path": rel(OUT / "starter-pants-input-mask.png"),
            "sha256": sha256_file(OUT / "starter-pants-input-mask.png"),
            "editablePixels": int(owner.sum()),
            "protectedPixels": int((~owner).sum()),
        },
        "attempts": attempts,
        "selectedAttempt": int(selected_note["attempt"]),
        "rawApiPath": raw_selected.name,
        "rawApiSha256": sha256_file(raw_selected),
        "rawApiSize": list(raw.size),
        "rawBeforeClampDrift": selected_note.get("rawBeforeClampDrift", {}),
        "registrationBeforeExtract": registration,
        "finalPath": rel(PANTS_OUT),
        "finalSha256": sha256_bytes(final_data),
        "finalSize": list(final.size),
        "ownershipExtraction": {
            "maskApplied": True,
            "bootsRestoredExactly": bool(selected_note["bootRestore"]["exact"]),
            "shirtHemRestoredExactly": bool(selected_note["shirtHemRestore"]["exact"]),
            "upperBodyExcluded": True,
            "wholePantsReplacement": True,
            "notOverlayNativePants": True,
        },
        "validation": selected_note["validation"],
    }
    save_json(OUT / "starter-pants.json", metadata)
    return metadata


def alpha_composite(*layers: Image.Image) -> Image.Image:
    result = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    for layer in layers:
        result = Image.alpha_composite(result, layer.convert("RGBA"))
    return result


def head_only(source: Image.Image) -> Image.Image:
    arr = np.asarray(source.convert("RGBA")).copy()
    arr[396:] = 0
    return Image.fromarray(arr, mode="RGBA")


def panel(image: Image.Image, size: tuple[int, int] = (320, 480)) -> Image.Image:
    scale = min(size[0] / image.width, size[1] / image.height)
    fitted = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (239, 234, 226, 255))
    canvas.alpha_composite(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    return canvas


def labelled(image: Image.Image, text: str) -> Image.Image:
    output = image.convert("RGBA")
    draw = ImageDraw.Draw(output)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    draw.rectangle((0, 0, output.width - 1, 32), fill=(37, 33, 42, 235))
    draw.text((8, 8), text, fill="white", font=font)
    return output


def make_qa_sheet() -> Path:
    starter = rgba(PANTS_OUT)
    body_upper = rgba(BODY_UPPER_PATH)
    hands = rgba(HANDS_PATH)
    boots = rgba(BOOTS_PATH)
    pants_01 = rgba(PANTS_01_PATH)
    face = head_only(rgba(GRIP_PATH))
    starter_stack = alpha_composite(boots, starter, body_upper, hands, face)
    paid_stack = alpha_composite(boots, pants_01, body_upper, hands, face)

    plain_wand = rgba(OUT / "wand-base.png", canvas=False)
    plain_wand_canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    plain_wand_canvas.alpha_composite(plain_wand, ((W - plain_wand.width) // 2, (H - plain_wand.height) // 2))
    wand_01 = rgba(ROOT / "assets" / "doll" / "rigged" / "wand-01.webp")

    items = (
        (starter_stack, "plain starter stack"),
        (paid_stack, "pants-01 comparison"),
        (plain_wand_canvas, "plain wand source"),
        (wand_01, "wand-01 comparison"),
    )
    cell_w, cell_h = 320, 480
    sheet = Image.new("RGBA", (cell_w * 2, cell_h * 2), (216, 210, 201, 255))
    for index, (image, text) in enumerate(items):
        x = (index % 2) * cell_w
        y = (index // 2) * cell_h
        sheet.alpha_composite(labelled(panel(image, (cell_w, cell_h)), text), (x, y))
    QA_OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(QA_OUT, format="PNG")
    return QA_OUT


def existing_metadata(metadata_path: Path, required: tuple[Path, ...]) -> dict[str, object] | None:
    if not all(path.is_file() for path in required) or not metadata_path.is_file():
        return None
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if metadata.get("status") in {"failed", "error"}:
        return None
    return metadata


def clean_trouser_components(metadata: dict) -> dict:
    """Discard detached source-hand fragments, retaining the connected legs/boots."""
    from scipy import ndimage
    image = rgba(PANTS_OUT)
    pixels = np.asarray(image).copy()
    labels, count = ndimage.label(pixels[:, :, 3] > 20, structure=np.ones((3,3)))
    if not count:
        raise ValueError("Starter trousers are empty")
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    main = labels == int(sizes.argmax())
    keep = ndimage.binary_dilation(main, iterations=2)
    removed = int(((pixels[:,:,3]>0) & ~keep).sum())
    pixels[~keep] = 0
    data = webp_bytes(Image.fromarray(pixels))
    save_bytes(PANTS_OUT, data)
    metadata["finalSha256"] = sha256_bytes(data)
    metadata["componentCleanup"] = {
        "method": "8-connected lower-body silhouette with two-pixel antialias margin",
        "removedDetachedPixels": removed + metadata.get("componentCleanup",{}).get("removedDetachedPixels",0),
    }
    save_json(OUT / "starter-pants.json", metadata)
    return metadata


def main() -> int:
    for path in (GRIP_PATH, WAND_REFERENCE_PATH, OWNERSHIP_PATH, BOOTS_PATH, BODY_UPPER_PATH, HANDS_PATH, PANTS_01_PATH):
        if not path.is_file():
            raise FileNotFoundError(path)
    OUT.mkdir(parents=True, exist_ok=True)
    # Durable raw/provenance files make reruns read-only.  This prevents a
    # convenience rerun from silently spending another API edit; deleting an
    # output is the explicit signal that a fresh two-edit job is required.
    wand = existing_metadata(
        OUT / "wand-base.json",
        (OUT / "wand-base.png", OUT / "wand-base-raw.png"),
    )
    if wand is None:
        wand = run_wand()
    pants = existing_metadata(
        OUT / "starter-pants.json",
        (PANTS_OUT, OUT / "starter-pants-raw.png"),
    )
    if pants is None:
        pants = run_pants()
    pants = clean_trouser_components(pants)
    qa_path = make_qa_sheet()
    summary = {
        "schema": "plain-starters-v1",
        "createdAt": now_iso(),
        "wand": {"metadata": "wand-base.json", "sha256": wand["finalSha256"]},
        "pants": {"metadata": "starter-pants.json", "path": rel(PANTS_OUT), "sha256": pants["finalSha256"]},
        "qa": {"path": str(qa_path), "sha256": sha256_file(qa_path)},
        "apiPolicy": {"edits": 2, "maxAttemptsPerEdit": MAX_ATTEMPTS, "keyNeverLogged": True},
    }
    save_json(OUT / "provenance.json", summary)
    print(f"wand: {wand['status']} {wand['finalPath']}", flush=True)
    print(f"pants: {pants['status']} {pants['finalPath']}", flush=True)
    print(f"qa: {qa_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
