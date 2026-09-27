#!/usr/bin/env python3
"""Generate three hat/head replacement prototypes with bounded image-edit calls.

Each request edits a transparent, full head-only sprite.  The face and neck are
protected by the mask; hair, hat, and the transparent canvas remain editable so
an output cannot succeed by simply painting a tiny hat over the old hairstyle.
The script deliberately has one primary request per prototype and at most one
retry for that prototype.
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
WIZARDS = ROOT / "assets" / "wizards"
DESIGNS = ROOT / "assets" / "shop-designs"
OUT = DOLL / "prototypes"
QA = Path("/tmp/paper-doll-qa")
MODEL = "gpt-image-2.5-sunburst"
CANVAS = (1024, 1536)
MAX_ATTEMPTS = 2
LANDMARKS_FACE_BOX = (344, 199, 683, 396)

# This is intentionally a fixed, auditable list: exactly three prototypes and
# no bulk wardrobe generation.
PROTOTYPES = (
    ("dad", "hat-05"),
    ("suan", "hat-11"),
    ("yewon", "hat-01"),
)

# Face positions were checked against each current head sprite's alpha bounds.
# The inner ellipse begins below the hairline so the forehead/crown remains
# editable, while its lower edge and the neck ellipse protect identity pixels.
FACE_ELLIPSES = {
    "dad": (344, 224, 682, 404),
    "suan": (347, 224, 680, 408),
    "yewon": (347, 224, 680, 408),
}
NECK_ELLIPSES = {
    "dad": (426, 374, 600, 452),
    "suan": (426, 378, 602, 468),
    "yewon": (426, 376, 602, 466),
}
# The current sprites are head-only but have different hair lengths.  These
# limits keep a model from adding torso/shirt pixels while retaining each
# character's existing hair silhouette as a reference for the edit.
HEAD_MAX_Y_PADDING = {"dad": 28, "suan": 28, "yewon": 28}

# Existing starter outfits used only for the QA composites.  They are never
# sent to the image API, so the API input remains a head-only image.
OUTFIT_LAYERS = {
    "dad": ("dad-base-cloak.webp", "dad-base-wand.webp"),
    "suan": ("suan-base-cloak.webp", "suan-base-broom.webp"),
    "yewon": ("yewon-base-cloak.webp", "yewon-base-wand.webp"),
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGBA").save(buffer, format="PNG")
    return buffer.getvalue()


def multipart(fields: dict[str, str], images: list[tuple[str, bytes]], mask: bytes) -> tuple[bytes, str]:
    """Build the multipart form used by /v1/images/edits.

    This mirrors scripts/paper-doll.py's helper but is kept local so this
    prototype script cannot invoke another pipeline stage or batch job.
    """
    boundary = "hat-head-prototype-" + hashlib.sha256(os.urandom(24)).hexdigest()[:24]
    chunks: list[bytes] = []

    def field(name: str, value: str) -> None:
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )

    for name, value in fields.items():
        field(name, value)
    for filename, data in images:
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="{filename}"\r\n'
            "Content-Type: image/png\r\n\r\n".encode()
        )
        chunks.extend((data, b"\r\n"))
    chunks.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="mask"; filename="mask.png"\r\n'
        "Content-Type: image/png\r\n\r\n".encode()
    )
    chunks.extend((mask, b"\r\n", f"--{boundary}--\r\n".encode()))
    return b"".join(chunks), boundary


def api_edit(prompt: str, references: list[Image.Image], mask: Image.Image) -> tuple[Image.Image, bytes]:
    """Perform one authorized image edit and return decoded image + raw PNG bytes."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    fields = {
        "model": MODEL,
        "prompt": prompt,
        "size": f"{CANVAS[0]}x{CANVAS[1]}",
        "quality": "high",
        "background": "transparent",
        "output_format": "png",
        "n": "1",
    }
    image_payload = [(f"reference-{index}.png", png_bytes(image)) for index, image in enumerate(references)]
    payload, boundary = multipart(fields, image_payload, png_bytes(mask))
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
    encoded = result["data"][0]["b64_json"]
    raw_png = base64.b64decode(encoded, validate=True)
    return Image.open(io.BytesIO(raw_png)).convert("RGBA"), raw_png


def load_rgba(path: Path) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(path)
    image = Image.open(path).convert("RGBA")
    if image.size != CANVAS:
        raise ValueError(f"{path} must be {CANVAS}, got {image.size}")
    return image


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 10 else 0)
    return alpha.getbbox()


def checked_head_inputs(char: str, hat_id: str) -> tuple[Image.Image, Image.Image, Image.Image]:
    """Load and validate the full-head base, exact product, and style identity."""
    base = load_rgba(DOLL / f"{char}-neutral.webp")
    identity = Image.open(WIZARDS / f"{char}-neutral.webp").convert("RGBA")
    design = Image.open(DESIGNS / f"{hat_id}.webp").convert("RGBA")
    bbox = alpha_bbox(base)
    if bbox is None or bbox[2] - bbox[0] < 300 or bbox[3] - bbox[1] < 250:
        raise ValueError(f"{char}-neutral.webp does not look like a full head sprite: {bbox}")
    if bbox[3] <= FACE_ELLIPSES[char][1]:
        raise ValueError(f"{char} head alpha does not reach protected face region: {bbox}")
    return base, design, identity


def build_mask(char: str) -> tuple[Image.Image, np.ndarray, dict[str, list[int]]]:
    """Return an API mask: opaque protected face/neck, transparent elsewhere."""
    protected = Image.new("L", CANVAS, 0)
    draw = ImageDraw.Draw(protected)
    face_box = FACE_ELLIPSES[char]
    neck_box = NECK_ELLIPSES[char]
    draw.ellipse(face_box, fill=255)
    draw.ellipse(neck_box, fill=255)
    protected_array = np.asarray(protected, dtype=np.uint8) > 127
    # API edit masks use alpha 0 for editable and alpha 255 for protected.
    mask_rgba = np.zeros((CANVAS[1], CANVAS[0], 4), dtype=np.uint8)
    mask_rgba[:, :, 3] = np.where(protected_array, 255, 0).astype(np.uint8)
    geometry = {"protectedFaceEllipse": list(face_box), "protectedNeckEllipse": list(neck_box)}
    return Image.fromarray(mask_rgba, mode="RGBA"), protected_array, geometry


def pixel_drift(before: Image.Image, after: Image.Image, protected: np.ndarray) -> float:
    """Fraction of protected pixels changed by the raw API output.

    This is intentionally measured before clamping/restoring protected pixels;
    provenance must not claim zero drift merely because postprocessing hid it.
    """
    if after.size != CANVAS:
        after = after.resize(CANVAS, Image.Resampling.LANCZOS)
    # int32 is required here: int16 subtraction wraps before the Euclidean
    # distance is taken, producing invalid/underreported drift values.
    before_rgba = np.asarray(before.convert("RGBA"), dtype=np.int32)
    after_rgba = np.asarray(after.convert("RGBA"), dtype=np.int32)
    # Only count protected pixels that belong to the base head/neck.  Transparent
    # pixels in the ellipse are not face identity and should not penalize a hat.
    valid = protected & (before_rgba[:, :, 3] > 10)
    if not valid.any():
        return 0.0
    distance = np.sqrt(((before_rgba[:, :, :3] - after_rgba[:, :, :3]) ** 2).sum(axis=2))
    alpha_changed = np.abs(before_rgba[:, :, 3] - after_rgba[:, :, 3]) > 20
    changed = (distance > 40) | alpha_changed
    return float((changed & valid).sum()) / float(valid.sum())


def editable_change_fraction(before: Image.Image, after: Image.Image, protected: np.ndarray) -> float:
    """Measure non-trivial edit pixels outside the protected identity region."""
    if after.size != CANVAS:
        after = after.resize(CANVAS, Image.Resampling.LANCZOS)
    a = np.asarray(before.convert("RGBA"), dtype=np.int32)
    b = np.asarray(after.convert("RGBA"), dtype=np.int32)
    distance = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha_changed = np.abs(a[:, :, 3] - b[:, :, 3]) > 20
    changed = (distance > 28) | alpha_changed
    editable = ~protected
    # A bounded denominator prevents a large transparent canvas from making a
    # visibly substantial hat look like a zero-change result.
    bbox = alpha_bbox(before)
    if bbox:
        x0, y0, x1, y1 = bbox
        region = np.zeros_like(editable)
        region[max(0, y0 - 120) : min(CANVAS[1], y1 + 120), max(0, x0 - 240) : min(CANVAS[0], x1 + 240)] = True
        editable &= region
    count = int(editable.sum())
    return float((changed & editable).sum()) / float(count) if count else 0.0


def clamp_and_trim(base: Image.Image, raw: Image.Image, protected: np.ndarray, char: str) -> Image.Image:
    """Restore identity pixels and erase anything outside a head-only envelope."""
    raw_canvas = raw.resize(CANVAS, Image.Resampling.LANCZOS) if raw.size != CANVAS else raw
    raw_array = np.asarray(raw_canvas.convert("RGBA")).copy()
    base_array = np.asarray(base.convert("RGBA"))
    bbox = alpha_bbox(base)
    if bbox is None:
        raise ValueError(f"{char} base has no alpha bbox")
    # Hats may widen the silhouette, but no generated pixels may descend into
    # the mannequin's torso.  The character-specific base hair bottom is the
    # conservative anchor for this head-only prototype.
    x0, y0, x1, y1 = bbox
    max_y = min(CANVAS[1], y1 + HEAD_MAX_Y_PADDING[char])
    allowed = np.zeros((CANVAS[1], CANVAS[0]), dtype=bool)
    allowed[:max_y, max(0, x0 - 240) : min(CANVAS[0], x1 + 240)] = True
    raw_array[~allowed, 3] = 0
    # Identity protection is exact, including glasses and neck alpha.
    raw_array[protected] = base_array[protected]
    # Below the face, keep only pixels plausibly belonging to the character's
    # existing hair silhouette.  This is a hard head-only guard against the
    # model interpreting a broad hat brim as a cape, robe, or shirt.  It does
    # not constrain the hat itself above the face ellipse.
    face_bottom = FACE_ELLIPSES[char][3] - 8
    yy, xx = np.mgrid[: CANVAS[1], : CANVAS[0]]
    hair_samples = (
        (base_array[:, :, 3] > 10)
        & (yy < FACE_ELLIPSES[char][1])
    )
    if hair_samples.any():
        samples = base_array[:, :, :3][hair_samples].astype(np.int32)
        # A handful of evenly sampled colours tolerates highlights/shadows
        # without allocating a (height x width x sample-count) tensor.
        palette = samples[:: max(1, len(samples) // 48)][:48]
        pixels = raw_array[:, :, :3].astype(np.int32)
        nearest = np.full((CANVAS[1], CANVAS[0]), np.inf, dtype=np.float32)
        for colour in palette:
            distance = np.sqrt(((pixels - colour) ** 2).sum(axis=2))
            nearest = np.minimum(nearest, distance)
        hair_colour = nearest <= 42
        if char in {"dad", "suan"}:
            # Their supplied hair is warm brown; purple/blue hat fabric
            # should not survive as a faux long-hair strand.
            hair_colour &= (
                (pixels[:, :, 0] - pixels[:, :, 2] >= 20)
                & (pixels[:, :, 1] - pixels[:, :, 2] >= 4)
            )
    else:
        hair_colour = np.zeros((CANVAS[1], CANVAS[0]), dtype=bool)
    # Keep the original head silhouette as the below-face guard.  The API
    # remains free to redraw the crown/side hair above the face, but a model
    # generated cape or shirt cannot survive below the known long-hair tips.
    base_alpha = Image.fromarray((base_array[:, :, 3] > 10).astype(np.uint8) * 255, mode="L")
    base_dilated = np.asarray(base_alpha) > 127
    below_face = yy >= face_bottom
    raw_array[below_face & ~(hair_colour & base_dilated), 3] = 0
    # The lower edge of the ellipse overlaps the chin/neck rows; restore it
    # after the below-face guard as well, so the protected face/neck contract
    # is exact in the final file (not only before cleanup).
    raw_array[protected] = base_array[protected]
    raw_array[raw_array[:, :, 3] < 10] = 0
    return Image.fromarray(raw_array.astype(np.uint8), mode="RGBA")


def prototype_prompt(char: str, hat_id: str) -> str:
    long_hair = " Flatten the hair at the crown under the brim and let the long hair fall naturally from beneath the brim." if char in {"suan", "yewon"} else " Keep the shorter hair naturally flattened under the brim."
    glasses = " Preserve the existing glasses exactly." if char in {"dad", "yewon"} else " Preserve the existing eyes, nose, mouth and face proportions exactly; this character has no glasses."
    hat_shape = {
        "hat-05": "This product has a tall purple wizard crown and a broad purple brim; show the full broad brim, not a cone alone.",
        "hat-11": "This product has a tall purple starry crown and a scalloped broad brim; show the complete scalloped brim around the skull.",
        "hat-01": "This product is a floppy brown pointed hat; its floppy brim is one hat brim around the skull, never a cape or shoulder garment.",
    }[hat_id]
    return (
        "Image 1 is the authoritative 1024x1536 transparent head-only sprite for this Korean family member. "
        "Image 2 is the exact shop product hat design; preserve its silhouette, colors, materials, stitching and decorations. "
        "Image 3 is the original style/identity reference; use it only to anchor this known character's facial identity and the established polished 3D family art style, not its clothing or body. "
        f"Replace the entire un-hatted hairstyle and head hair on image 1 with a newly drawn hairstyle that is designed to wear {hat_id}; do not overlay a tiny hat on the old hair. "
        "Render one complete transparent head + exact hat + restyled hair, aligned to the original face. "
        "The hat opening/brim must be wide enough for the FULL skull width, sit low and naturally just above the eyebrows, and fully cover the crown; never leave old hair tufts above the brim and never make a small cone perched on hair. "
        f"{hat_shape} "
        "Keep the protected eyes, nose, mouth, glasses, skin shading, face-feature positions, and neck unchanged. "
        "This is a Korean family reference: stay identity-faithful to the supplied references and art style; do not infer ethnicity from skin color and do not substitute a generic Western or generic Disney face. "
        f"{glasses}{long_hair} "
        "Treat all pixels outside the head as transparent blank canvas. Output ONLY one head silhouette containing the face, hat, and hair. "
        "No torso, shirt, collar, cape, shawl, robe, shoulders, arms, hands, wand, body, or limbs. "
        "The lower hat brim must end around the head/neck and must never continue as a garment. Do not copy any full-body clothing from image 3. "
        "Keep the same canvas framing and lighting."
    )


def font() -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 22)
    except OSError:
        return ImageFont.load_default()


def face_patch(char: str, mood: str) -> Image.Image:
    """Extract only an elliptical interior-face expression patch from an existing head."""
    source = load_rgba(DOLL / f"{char}-{mood}.webp")
    # This inset ellipse captures the eyes, brows, nose and mouth but excludes
    # the surrounding hairstyle/neck, so it cannot replace the hatted hair.
    fx0, fy0, fx1, fy1 = FACE_ELLIPSES[char]
    patch_mask = Image.new("L", CANVAS, 0)
    draw = ImageDraw.Draw(patch_mask)
    draw.ellipse((fx0 + 20, fy0 + 2, fx1 - 20, fy1 - 18), fill=255)
    patch_mask = patch_mask.filter(ImageFilter.GaussianBlur(1.0))
    rgba = np.asarray(source).copy()
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], np.asarray(patch_mask))
    rgba[rgba[:, :, 3] < 10] = 0
    return Image.fromarray(rgba, mode="RGBA")


def alpha_composite(*layers: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    for layer in layers:
        if layer is not None:
            canvas = Image.alpha_composite(canvas, layer.convert("RGBA"))
    return canvas


def outfit_composite(char: str, head: Image.Image) -> Image.Image:
    layers = [load_rgba(DOLL / "body.webp")]
    layers.extend(load_rgba(DOLL / filename) for filename in OUTFIT_LAYERS[char])
    layers.append(head)
    return alpha_composite(*layers)


def thumbnail(image: Image.Image, width: int = 320, height: int = 480) -> Image.Image:
    scale = min(width / image.width, height / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    resized = image.resize(size, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (width, height), (245, 241, 233, 255))
    left = (width - size[0]) // 2
    top = (height - size[1]) // 2
    cell.alpha_composite(resized, (left, top))
    return cell


def write_png(image: Image.Image, path: Path) -> bytes:
    data = png_bytes(image)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data


def existing_record(key: str) -> dict | None:
    path = OUT / f"{key}.json"
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def generate_one(char: str, hat_id: str, force: bool) -> dict:
    key = f"{char}-{hat_id}"
    final_path = OUT / f"{key}-final.png"
    raw_path = OUT / f"{key}-raw.png"
    record_path = OUT / f"{key}.json"
    if not force and final_path.is_file() and raw_path.is_file() and record_path.is_file():
        return existing_record(key) or {"key": key, "status": "skipped-existing"}
    prior = existing_record(key)
    if force and prior:
        prior_attempts = prior.get("attempts", [])
        if len(prior_attempts) >= MAX_ATTEMPTS:
            raise RuntimeError(
                f"{key}: API attempt budget exhausted ({MAX_ATTEMPTS}); "
                "use --rebuild-final for deterministic postprocessing only"
            )

    base, design, identity = checked_head_inputs(char, hat_id)
    mask, protected, mask_geometry = build_mask(char)
    prompt = prototype_prompt(char, hat_id)
    attempts: list[dict] = []
    candidates: list[tuple[float, Image.Image, bytes, float]] = []
    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.time()
        try:
            raw, raw_png = api_edit(prompt, [base, design, identity], mask)
            drift = pixel_drift(base, raw, protected)
            change = editable_change_fraction(base, raw, protected)
            bbox = alpha_bbox(raw)
            base_bbox = alpha_bbox(base)
            raw_alpha = np.asarray(raw.getchannel("A")) > 10
            tail_limit = (base_bbox[3] + 60) if base_bbox else CANVAS[1]
            alpha_count = int(raw_alpha.sum())
            tail_fraction = (
                float(raw_alpha[tail_limit:, :].sum()) / float(alpha_count)
                if alpha_count else 1.0
            )
            # A response that paints a torso/robe below the known head extent
            # is retried once rather than silently presented as a good edit.
            usable = bbox is not None and change >= 0.005 and tail_fraction <= 0.08
            note = {
                "attempt": attempt,
                "status": "received",
                "elapsedSeconds": round(time.time() - started, 3),
                "rawSha256": sha256_bytes(raw_png),
                "rawSize": list(raw.size),
                "preClampProtectedDrift": drift,
                "editableChangeFraction": change,
                "rawAlphaBbox": list(bbox) if bbox else None,
                "rawTailAlphaFraction": tail_fraction,
                "usableHeuristic": usable,
            }
            attempts.append(note)
            candidates.append((change, raw, raw_png, drift))
            if usable:
                break
            if attempt < MAX_ATTEMPTS:
                time.sleep(2)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, RuntimeError, KeyError, ValueError) as error:
            attempts.append({
                "attempt": attempt,
                "status": "error",
                "elapsedSeconds": round(time.time() - started, 3),
                "error": str(error),
            })
            if attempt < MAX_ATTEMPTS:
                time.sleep(2)

    if not candidates:
        raise RuntimeError(f"{key}: image edit failed after {MAX_ATTEMPTS} attempts")
    _, raw, raw_png, preclamp_drift = max(candidates, key=lambda item: item[0])
    final = clamp_and_trim(base, raw, protected, char)
    final_png = write_png(final, final_path)
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    raw_path.write_bytes(raw_png)

    patch_paths: dict[str, str] = {}
    mood_images: dict[str, Image.Image] = {"neutral": final}
    for mood in ("happy", "sad"):
        patch = face_patch(char, mood)
        patch_name = f"{key}-{mood}-face-patch.png"
        patch_bytes = write_png(patch, OUT / patch_name)
        patch_paths[mood] = patch_name
        mood_image = alpha_composite(final, patch)
        mood_name = f"{key}-{mood}.png"
        write_png(mood_image, OUT / mood_name)
        mood_images[mood] = mood_image

    base_path = DOLL / f"{char}-neutral.webp"
    design_path = DESIGNS / f"{hat_id}.webp"
    identity_path = WIZARDS / f"{char}-neutral.webp"
    record = {
        "schema": "hat-head-prototype-v1",
        "key": key,
        "status": "ok" if attempts[-1].get("usableHeuristic") else "flagged",
        "character": char,
        "hatId": hat_id,
        "model": MODEL,
        "quality": "high",
        "size": list(CANVAS),
        "background": "transparent",
        "endpoint": "/v1/images/edits",
        "attempts": attempts,
        "selectedAttempt": max(range(len(candidates)), key=lambda index: candidates[index][0]) + 1,
        "rawPreClampProtectedDrift": preclamp_drift,
        "rawSha256": sha256_bytes(raw_png),
        "finalSha256": sha256_bytes(final_png),
        "rawPath": raw_path.name,
        "finalPath": final_path.name,
        "moodPatchPaths": patch_paths,
        "mask": mask_geometry,
        "landmarksFaceBox": list(LANDMARKS_FACE_BOX),
        "verifiedHeadAlphaBbox": list(alpha_bbox(base) or ()),
        "sources": {
            "headBase": {"path": str(base_path.relative_to(ROOT)), "sha256": sha256_file(base_path), "size": list(base.size), "alphaBbox": list(alpha_bbox(base) or ())},
            "hatProduct": {"path": str(design_path.relative_to(ROOT)), "sha256": sha256_file(design_path), "size": list(design.size)},
            "styleIdentity": {"path": str(identity_path.relative_to(ROOT)), "sha256": sha256_file(identity_path), "size": list(identity.size)},
            "maskPngSha256": sha256_bytes(png_bytes(mask)),
        },
        "prompt": prompt,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return record


def rebuild_final_from_raw(char: str, hat_id: str) -> dict:
    """Reapply deterministic face protection/head trimming without an API call."""
    key = f"{char}-{hat_id}"
    record_path = OUT / f"{key}.json"
    raw_path = OUT / f"{key}-raw.png"
    if not record_path.is_file() or not raw_path.is_file():
        raise FileNotFoundError(f"{key}: raw/provenance files required for --rebuild-final")
    record = json.loads(record_path.read_text(encoding="utf-8"))
    base, _design, _identity = checked_head_inputs(char, hat_id)
    _mask, protected, geometry = build_mask(char)
    raw_png = raw_path.read_bytes()
    raw = Image.open(io.BytesIO(raw_png)).convert("RGBA")
    final = clamp_and_trim(base, raw, protected, char)
    final_png = write_png(final, OUT / f"{key}-final.png")
    patch_paths: dict[str, str] = {}
    for mood in ("happy", "sad"):
        patch = face_patch(char, mood)
        patch_name = f"{key}-{mood}-face-patch.png"
        write_png(patch, OUT / patch_name)
        patch_paths[mood] = patch_name
        write_png(alpha_composite(final, patch), OUT / f"{key}-{mood}.png")
    record["finalSha256"] = sha256_bytes(final_png)
    record["rawSha256"] = sha256_bytes(raw_png)
    record["finalPath"] = f"{key}-final.png"
    record["moodPatchPaths"] = patch_paths
    record["mask"] = geometry
    record["landmarksFaceBox"] = list(LANDMARKS_FACE_BOX)
    record["verifiedHeadAlphaBbox"] = list(alpha_bbox(base) or ())
    record["postprocess"] = "rebuild-final: restore protected face/neck and remove non-hair pixels below face"
    record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return record


def make_qa_sheet(records: list[dict]) -> Path:
    QA.mkdir(parents=True, exist_ok=True)
    cell_w, cell_h = 320, 480
    label_h = 34
    sheet = Image.new("RGB", (cell_w * 3, (cell_h + label_h) * len(records)), "#e9e2d7")
    draw = ImageDraw.Draw(sheet)
    text_font = font()
    for row, record in enumerate(records):
        char = record["character"]
        key = record["key"]
        final = load_rgba(OUT / record["finalPath"])
        mood_paths = {
            # The prototype files stay head-only; the QA sheet deliberately
            # paints each hatted head over the existing body/starter outfit.
            "neutral": outfit_composite(char, final),
            "happy": outfit_composite(char, load_rgba(OUT / f"{key}-happy.png")),
            "sad": outfit_composite(char, load_rgba(OUT / f"{key}-sad.png")),
        }
        for column, mood in enumerate(("neutral", "happy", "sad")):
            x = column * cell_w
            y = row * (cell_h + label_h)
            draw.rectangle((x, y, x + cell_w - 1, y + label_h - 1), fill="#2c2630")
            draw.text((x + 10, y + 7), f"{char} · {record['hatId']} · {mood}", fill="white", font=text_font)
            sheet.paste(thumbnail(mood_paths[mood], cell_w, cell_h).convert("RGB"), (x, y + label_h))
    qa_path = QA / "hat-head-prototypes.png"
    sheet.save(qa_path, format="PNG")
    return qa_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="regenerate missing/overwritten prototypes (still max two attempts each)")
    parser.add_argument("--rebuild-final", action="store_true", help="rebuild final/mood derivatives from saved raw outputs without API calls")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    failures: list[dict[str, str]] = []
    for char, hat_id in PROTOTYPES:
        try:
            record = (
                rebuild_final_from_raw(char, hat_id)
                if args.rebuild_final
                else generate_one(char, hat_id, args.force)
            )
            records.append(record)
            print(f"{char}-{hat_id}: {record.get('status', 'ok')} attempts={len(record.get('attempts', []))}", flush=True)
        except Exception as error:
            failures.append({"key": f"{char}-{hat_id}", "error": str(error)})
            print(f"{char}-{hat_id}: FAILED: {error}", flush=True)
    if records:
        qa_path = make_qa_sheet(records)
        qa_hash = sha256_file(qa_path)
        for record in records:
            record["qaSheetPath"] = str(qa_path)
            record["qaSheetSha256"] = qa_hash
            (OUT / f"{record['key']}.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"QA sheet: {qa_path}", flush=True)
    if failures:
        print(json.dumps({"failures": failures}, ensure_ascii=False), flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
