"""Generate a four-edit fixed-grip paper-doll prototype.

This prototype is intentionally separate from the production paper-doll stages.  It
uses one masked OpenAI image edit for each requested artifact (grip base, gloves,
wand and broom), retries an edit at most once when geometry QA detects a moved
hand, and clamps the returned image to the authored editable mask.  Every source
pixel outside an editable region is therefore restored exactly in the composited
artifact; the un-clamped API drift is retained in provenance for review.

Only this script and assets/doll/prototypes/grips/ are owned by this task.  The
script writes all durable artifacts below the latter directory and writes the
human-review contact sheet to /tmp/paper-doll-qa/fixed-grips.png.
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import os
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MANNEQUIN_PATH = ROOT / "assets" / "doll" / "mannequin.png"
LANDMARKS_PATH = ROOT / "assets" / "doll" / "landmarks.json"
DESIGN_DIR = ROOT / "assets" / "shop-designs"
OUT = ROOT / "assets" / "doll" / "prototypes" / "grips"
RAW_OUT = OUT / "api-raw"
MASK_OUT = OUT / "api-input-masks"
QA_OUT = Path("/tmp/paper-doll-qa")

MODEL = "gpt-image-2.5-sunburst"
CANVAS = (1024, 1536)
W, H = CANVAS

# These are authored viewer-coordinate regions, not character-left/right labels.
# They follow the complete existing hand silhouettes (including the low outer
# finger edges that the coarse landmark boxes clip).  The cuff boundary remains
# protected above y=818; no arm pixels are admitted.
HAND_POLYGONS = {
    "viewer-left": [
        (242, 820), (291, 818), (312, 826), (325, 844), (330, 867),
        (329, 887), (340, 906), (342, 930), (335, 949), (320, 968),
        (282, 969), (259, 956), (243, 936), (235, 908), (235, 877),
        (239, 850), (243, 834),
    ],
    "viewer-right": [
        (707, 819), (754, 818), (770, 829), (779, 849), (783, 875),
        (783, 900), (778, 924), (767, 948), (748, 968), (718, 969),
        (696, 958), (686, 933), (686, 904), (689, 875), (696, 847),
        (701, 830),
    ],
}

# The gloves edit may replace the existing knit cuff and a few pixels around the
# cuff edge, but never receives a broad arm/sleeve region.
GLOVE_CUFF_POLYGONS = {
    "viewer-left": [(245, 783), (326, 782), (334, 840), (243, 843)],
    "viewer-right": [(705, 784), (768, 785), (776, 840), (702, 842)],
}

HAND_ANCHORS = {
    "viewer-left": (285, 865),
    "viewer-right": (750, 865),
}

# The corridors are intentionally outside the body after their hand contact.
# Their first point is in the existing fist; later points leave the silhouette.
WAND_CORRIDOR = [
    (285, 865), (266, 806), (236, 742), (205, 668), (175, 565),
    (145, 435), (115, 300), (91, 170), (84, 78),
]
# The first wand edit's two raw outputs contained a complete OpenAI-rendered
# wand, but the service placed the hand high.  When that edit is flagged, this
# wider, authored empty-space corridor is used only to recover the OpenAI wand
# pixels while the fixed grip-base hand is restored over the contact area.
WAND_RAW_SALVAGE_CORRIDOR = [
    (320, 860), (305, 770), (280, 650), (250, 540), (220, 420),
    (180, 300), (140, 190), (100, 70),
]
BROOM_CORRIDOR = [
    (750, 865), (786, 940), (818, 1030), (850, 1130),
    (883, 1235), (918, 1335), (941, 1405),
]
BROOM_BRISTLE_POLYGON = [
    (866, 1306), (1002, 1282), (1023, 1325), (1023, 1515),
    (950, 1515), (875, 1475), (833, 1418),
]

BASE_PROMPT = """Use the supplied transparent 1024x1536 mannequin as the canonical image. Inside ONLY the two authored viewer-coordinate hand regions (viewer-left approximately x=235..342, y=818..969; viewer-right approximately x=686..783, y=818..969), replace the two open hanging skin hands with compact, anatomically correct closed fists. Each fist has curled fingers and a thumb visibly wrapped around an imaginary vertical slim handle, with the fist centred exactly on the current wrist/hand centre and still hanging low beside the hips. Keep the existing wrist junction, cuffs, sleeves, arms, elbows, shoulders, torso, head, legs, lighting, proportions, alpha silhouette and every pixel outside the two hand regions exactly unchanged. Do not change arm position. Do not add a wand, broom, glove, prop, raised arm, shoulder, elbow, extra finger, extra hand or floating object. The final image must show exactly two arms and exactly two hands. Preserve transparent background and the supplied polished stylized 3D animated-feature art style. This is a precise masked inpaint, not a redraw of the figure."""

GLOVE_PROMPT = """Use the supplied grip-base image as the canonical image and the supplied gloves-12 product reference for exact product identity. Inside ONLY the two authored viewer-coordinate hand-plus-small-cuff regions (viewer-left x=235..342, y=782..969; viewer-right x=686..783, y=784..969), put one complete matching glove on each existing closed fist. Render the full glove and hand replacement, including all curled fingers, thumb and the dark navy constellation material, gold edging, stars, blue gems and the short cuff from the product reference. Keep each fist centre, wrist junction, finger anatomy, hanging pose and arm/sleeve position unchanged. Do not extend the cuff beyond the small masked cuff margin. Do not redraw any shirt, arm, shoulder, torso, head, legs or background, and do not add any prop or extra limb. Exactly two hands and two arms. Preserve every pixel outside the masks and preserve transparent background."""

WAND_PROMPT = """Use the supplied grip-base image as the canonical image and the supplied wand-12 product reference for exact product identity and materials. Place exactly one wand through the existing viewer-left closed fist at approximately (x=285, y=865). The fist stays low beside the hip and at the same wrist centre. The slender shaft passes through that fist and angles upward/outward toward viewer-left; its ornate sunburst tip may extend high outside the body's silhouette. Use only the existing viewer-left hand box and the marked empty corridor beside the body. Existing arm and sleeve pixels are protected and must not be redrawn, extended or moved. Do not raise the arm, alter the shoulder or elbow, add another hand/arm, or add a broom/glove/body fragment. Return the wand plus the single closed gripping hand, with exactly two arms and two hands overall, preserving transparent background and the polished stylized 3D material identity of wand-12."""

BROOM_PROMPT = """Use the supplied grip-base image as the canonical image and the supplied broom-12 product reference for exact product identity and materials. Place exactly one broom through the existing viewer-right closed fist at approximately (x=750, y=865). Keep that fist low beside the hip at the same wrist centre and keep the arm, sleeve, shoulder and elbow unchanged. The shaft runs upright with a gentle lean toward viewer-right beside the body; the recognizable grey bristle fan reaches the ground outside the body's viewer-right edge. Use only the existing viewer-right hand box and the marked empty corridor beside the body. Existing arm and sleeve pixels are protected and must not be redrawn or moved. Do not raise the arm, add another hand/arm, add a wand/glove/body fragment, or alter the person. Return the broom plus one closed gripping hand, exactly two arms and two hands overall, with transparent background and the polished navy-and-gold product identity of broom-12 preserved."""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def rgba(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    if image.size != CANVAS:
        raise RuntimeError(f"{path} has size {image.size}; expected {CANVAS}")
    return image


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".part")
    image.convert("RGBA").save(temporary, format="PNG")
    temporary.replace(path)


def save_json(payload: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".part")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def alpha_array(image: Image.Image) -> np.ndarray:
    return np.asarray(image.convert("RGBA"))[:, :, 3]


def rgba_array(image: Image.Image) -> np.ndarray:
    return np.asarray(image.convert("RGBA"))


def polygon_mask(polygons: list[list[tuple[int, int]]]) -> np.ndarray:
    layer = Image.new("L", CANVAS, 0)
    draw = ImageDraw.Draw(layer)
    for polygon in polygons:
        draw.polygon(polygon, fill=255)
    return np.asarray(layer) > 0


def line_mask(points: list[tuple[int, int]], width: int) -> np.ndarray:
    layer = Image.new("L", CANVAS, 0)
    draw = ImageDraw.Draw(layer)
    draw.line(points, fill=255, width=width, joint="curve")
    return np.asarray(layer) > 0


def hand_mask() -> np.ndarray:
    return polygon_mask(list(HAND_POLYGONS.values()))


def glove_mask() -> np.ndarray:
    return polygon_mask(list(HAND_POLYGONS.values()) + list(GLOVE_CUFF_POLYGONS.values()))


def prop_mask(kind: str, source: Image.Image) -> np.ndarray:
    body = alpha_array(source) > 10
    if kind == "wand":
        corridor = line_mask(WAND_CORRIDOR, width=42)
        hand = polygon_mask([HAND_POLYGONS["viewer-left"]])
    elif kind == "broom":
        corridor = line_mask(BROOM_CORRIDOR, width=54)
        bristles = polygon_mask([BROOM_BRISTLE_POLYGON])
        corridor |= bristles
        hand = polygon_mask([HAND_POLYGONS["viewer-right"]])
    else:
        raise ValueError(kind)
    # Outside the hand contact, only transparent space is editable.  This is the
    # hard protection against a prop replacing a sleeve, arm, boot or torso.
    empty_corridor = corridor & ~(body & ~hand)
    return hand | empty_corridor


def mask_input_image(editable: np.ndarray) -> Image.Image:
    # OpenAI edits use an RGBA mask with alpha 0 at editable pixels and 255 at
    # protected pixels, matching scripts/paper-doll.py's mask_from_editable.
    alpha = np.where(editable, 0, 255).astype(np.uint8)
    rgb = np.zeros((H, W, 3), dtype=np.uint8)
    return Image.fromarray(np.dstack((rgb, alpha)), mode="RGBA")


def renderer_mask_image(replacement: np.ndarray) -> Image.Image:
    # Renderer-facing masks are white/opaque where the old layer must be removed.
    alpha = np.where(replacement, 255, 0).astype(np.uint8)
    rgb = np.full((H, W, 3), 255, dtype=np.uint8)
    rgb[~replacement] = 0
    return Image.fromarray(np.dstack((rgb, alpha)), mode="RGBA")


def build_multipart(fields: dict[str, str], images: list[tuple[str, bytes]], mask: bytes) -> tuple[bytes, str]:
    boundary = "fixed-grip-" + uuid.uuid4().hex
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
            f"Content-Type: image/png\r\n\r\n".encode()
        )
        chunks.append(data)
        chunks.append(b"\r\n")
    chunks.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="mask"; filename="mask.png"\r\n'
        f"Content-Type: image/png\r\n\r\n".encode()
    )
    chunks.append(mask)
    chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), boundary


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGBA").save(buffer, format="PNG")
    return buffer.getvalue()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def api_edit_once(prompt: str, images: list[Image.Image], mask: Image.Image) -> tuple[Image.Image, dict]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    image_payload = [(f"reference-{index}.png", png_bytes(image)) for index, image in enumerate(images)]
    mask_payload = png_bytes(mask)
    fields = {
        "model": MODEL,
        "prompt": prompt,
        "size": f"{W}x{H}",
        "quality": "high",
        "background": "transparent",
        "output_format": "png",
        "n": "1",
    }
    payload, boundary = build_multipart(fields, image_payload, mask_payload)
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
            response_data = json.load(response)
    except urllib.error.HTTPError as error:
        # Never include request headers or the secret in a durable error.
        body = error.read()
        try:
            detail = json.loads(body).get("error", {}).get("message", "image API error")
        except ValueError:
            detail = "image API error"
        raise RuntimeError(f"HTTP {error.code}: {detail}") from None
    encoded = response_data.get("data", [{}])[0].get("b64_json")
    if not encoded:
        raise RuntimeError("image API response did not contain b64_json")
    raw_bytes = base64.b64decode(encoded, validate=True)
    image = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
    # The response should already be 1024x1536.  Preserve the raw file and only
    # resize as a defensive normalization for the later exact-mask composite.
    if image.size != CANVAS:
        image = image.resize(CANVAS, Image.Resampling.LANCZOS)
    metadata = {
        "responseKeys": sorted(response_data.keys()),
        "created": response_data.get("created"),
        "rawPngSha256": sha256_bytes(raw_bytes),
        "rawPngBytes": len(raw_bytes),
        "responseDataCount": len(response_data.get("data", [])),
    }
    return image, metadata


def clamp_to_mask(before: Image.Image, after: Image.Image, editable: np.ndarray) -> Image.Image:
    source = rgba_array(before).copy()
    generated = rgba_array(after)
    source[editable] = generated[editable]
    return Image.fromarray(source, mode="RGBA")


def raw_outside_mask_drift(before: Image.Image, after: Image.Image, editable: np.ndarray) -> float:
    a = rgba_array(before).astype(np.int32)
    b = rgba_array(after).astype(np.int32)
    rgb_distance = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha_distance = np.abs(a[:, :, 3] - b[:, :, 3])
    outside = ~editable
    changed = ((rgb_distance > 40) | (alpha_distance > 40)) & outside
    return float(changed.sum()) / float(max(1, outside.sum()))


def clamped_outside_exact(before: Image.Image, after: Image.Image, editable: np.ndarray) -> bool:
    a = rgba_array(before)
    b = rgba_array(after)
    return bool(np.array_equal(a[~editable], b[~editable]))


def coverage(before: Image.Image, after: Image.Image, editable: np.ndarray) -> float:
    a = rgba_array(before).astype(np.int32)
    b = rgba_array(after).astype(np.int32)
    rgb_distance = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha_distance = np.abs(a[:, :, 3] - b[:, :, 3])
    changed = ((rgb_distance > 28) | (alpha_distance > 28)) & editable
    return float(changed.sum()) / float(max(1, editable.sum()))


def region_stats(image: Image.Image, region: np.ndarray) -> dict:
    alpha = alpha_array(image).astype(np.float64)
    occupied = (alpha > 10) & region
    ys, xs = np.where(occupied)
    if len(xs) == 0:
        return {"pixels": 0, "bbox": None, "centroid": None}
    weights = alpha[occupied]
    cx = float(np.average(xs, weights=weights))
    cy = float(np.average(ys, weights=weights))
    return {
        "pixels": int(len(xs)),
        "bbox": [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
        "centroid": [cx, cy],
    }


def hand_position_qa(before: Image.Image, after: Image.Image, masks: dict[str, np.ndarray]) -> dict:
    details: dict[str, dict] = {}
    all_ok = True
    for side, region in masks.items():
        old = region_stats(before, region)
        new = region_stats(after, region)
        old_centroid = old["centroid"]
        new_centroid = new["centroid"]
        if old_centroid is None or new_centroid is None:
            side_ok = False
            delta = None
        else:
            delta = [new_centroid[0] - old_centroid[0], new_centroid[1] - old_centroid[1]]
            old_bbox = old["bbox"]
            new_bbox = new["bbox"]
            old_center = [(old_bbox[0] + old_bbox[2]) / 2, (old_bbox[1] + old_bbox[3]) / 2]
            new_center = [(new_bbox[0] + new_bbox[2]) / 2, (new_bbox[1] + new_bbox[3]) / 2]
            center_delta = [new_center[0] - old_center[0], new_center[1] - old_center[1]]
            old_area = max(1, old["pixels"])
            area_ratio = new["pixels"] / old_area
            side_ok = bool(
                abs(delta[0]) <= 18
                and abs(delta[1]) <= 18
                and abs(center_delta[0]) <= 24
                and abs(center_delta[1]) <= 24
                and 0.35 <= area_ratio <= 2.8
            )
            details[side] = {
                "before": old,
                "after": new,
                "centroidDelta": delta,
                "bboxCenterDelta": center_delta,
                "areaRatio": area_ratio,
                "ok": side_ok,
            }
        if old_centroid is None or new_centroid is None:
            details[side] = {"before": old, "after": new, "ok": side_ok}
        all_ok = all_ok and side_ok
    return {"ok": all_ok, "sides": details}


def prop_presence_qa(before: Image.Image, after: Image.Image, editable: np.ndarray, hand: np.ndarray) -> dict:
    prop_region = editable & ~hand
    old = region_stats(before, prop_region)
    new = region_stats(after, prop_region)
    # Props must produce a substantial opaque region outside the old hand.  The
    # exact shape/material is left for the human visual gate; this only catches a
    # missing/floating-free output or a mask that never received the product.
    minimum = 800 if prop_region.sum() < 35000 else 1800
    return {"before": old, "after": new, "minimumPixels": minimum, "ok": new["pixels"] >= minimum}


def extract_replacement_layer(result: Image.Image, replacement: np.ndarray) -> Image.Image:
    arr = rgba_array(result).copy()
    arr[~replacement] = 0
    # Do not retain faint alpha speckles from the service around the hard mask.
    arr[arr[:, :, 3] < 10] = 0
    return Image.fromarray(arr, mode="RGBA")


def replace_region(base: Image.Image, result: Image.Image, region: np.ndarray) -> Image.Image:
    arr = rgba_array(base).copy()
    generated = rgba_array(result)
    arr[region] = generated[region]
    return Image.fromarray(arr, mode="RGBA")


def prop_overlay_region(
    base: Image.Image,
    prop_result: Image.Image,
    replacement: np.ndarray,
    hand_regions: np.ndarray,
) -> np.ndarray:
    """Overlay prop pixels outside the hand plus only the shaft contact inside.

    The standalone prop result contains the bare grip-base hand.  In the final
    paid-glove composition that bare hand must not cover the gloves, but the
    actual shaft pixels that run through the fist must remain visible.
    """
    a = rgba_array(base).astype(np.int32)
    b = rgba_array(prop_result).astype(np.int32)
    rgb_distance = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha_distance = np.abs(a[:, :, 3] - b[:, :, 3])
    changed = (rgb_distance > 8) | (alpha_distance > 8)
    return (replacement & ~hand_regions) | (changed & hand_regions)


def salvage_flagged_wand(
    grip_base: Image.Image,
    raw: Image.Image,
    design: Image.Image,
) -> tuple[Image.Image, np.ndarray, dict]:
    """Recover a fixed-position OpenAI product after a moved-hand edit.

    Both wand attempts rendered a complete product but also moved the hand
    upward.  The raw attempts remain under ``api-raw/`` and remain flagged; the
    final prototype uses the supplied OpenAI-rendered wand product as a
    transparent, affine-transformed composite anchored to the fixed fist.  No
    pixels from the moved raw hand/body survive.  This is mask/compositing of
    OpenAI art, not manual/vector painting.
    """
    hand = polygon_mask([HAND_POLYGONS["viewer-left"]])
    body = alpha_array(grip_base) > 10

    # Scale and rotate the transparent OpenAI product around its shaft grip
    # point.  The marker is transformed with the product so the shaft crosses
    # the existing fist at the authored anchor (not at the moved raw hand).
    scale = 1.05
    scaled_size = (round(design.width * scale), round(design.height * scale))
    scaled = design.resize(scaled_size, Image.Resampling.LANCZOS)
    marker = Image.new("L", design.size, 0)
    ImageDraw.Draw(marker).ellipse((110, 758, 114, 762), fill=255)
    marker = marker.resize(scaled_size, Image.Resampling.NEAREST)
    angle = 10
    rotated = scaled.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    marker_rotated = marker.rotate(angle, expand=True, resample=Image.Resampling.NEAREST)
    marker_y, marker_x = np.where(np.asarray(marker_rotated) > 0)
    marker_center = (float(marker_x.mean()), float(marker_y.mean()))
    anchor = HAND_ANCHORS["viewer-left"]
    placement = (
        int(round(anchor[0] - marker_center[0])),
        int(round(anchor[1] - marker_center[1])),
    )
    product = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    product.alpha_composite(rotated, placement)
    product_rgba = rgba_array(product)
    product_opaque = product_rgba[:, :, 3] > 10

    # Product pixels may replace only the hand and transparent space beside the
    # body.  Sleeve, arm, torso and all other source pixels are protected.
    replacement = hand | (product_opaque & ~(body & ~hand))
    product_pixels = product_opaque & ~(body & ~hand)
    output = rgba_array(grip_base).copy()
    output[product_pixels] = product_rgba[product_pixels]

    # Restore the closed fist around the shaft, leaving a narrow shaft window
    # visible through the grip so the handle visibly enters and exits the hand.
    shaft_window = line_mask(
        [(260, 760), (267, 820), (279, 872), (286, 930), (300, 990)],
        width=30,
    )
    grip_front = hand & ~shaft_window
    output[grip_front] = rgba_array(grip_base)[grip_front]
    details = {
        "status": "flagged-salvaged",
        "sourceRaw": "api-raw/wand-12-attempt-2.png",
        "sourceOpenAIProductReference": "assets/shop-designs/wand-12.webp",
        "method": "Affine-composited OpenAI wand reference; fixed grip-base restored around shaft",
        "rawHandRepositionStillFlagged": True,
        "rawCorridor": WAND_RAW_SALVAGE_CORRIDOR,
        "productAffineScale": scale,
        "productAffineRotationDegrees": angle,
        "productGripSourcePoint": [112, 760],
        "productGripTargetPoint": list(anchor),
        "productPlacement": list(placement),
        "replacementMaskPixels": int(replacement.sum()),
        "productPixelsKept": int(product_pixels.sum()),
        "shaftWindowWidth": 30,
    }
    return Image.fromarray(output, mode="RGBA"), replacement, details


def compose_reference_broom(
    grip_base: Image.Image,
    design: Image.Image,
) -> tuple[Image.Image, np.ndarray, dict]:
    """Place the OpenAI-rendered broom reference through the fixed right fist.

    The first masked broom response kept the hand but fragmented the shaft when
    body protection clipped it.  This transparent product composite preserves
    the exact OpenAI product identity while giving the renderer one continuous
    shaft and a grounded right-side bristle fan.  Body/sleeve pixels remain
    protected; only the hand and empty space receive product pixels.
    """
    hand = polygon_mask([HAND_POLYGONS["viewer-right"]])
    body = alpha_array(grip_base) > 10
    hand_stats = region_stats(grip_base, hand)
    anchor = tuple(round(value) for value in hand_stats["centroid"])

    scale = 1.08
    scaled_size = (round(design.width * scale), round(design.height * scale))
    scaled = design.resize(scaled_size, Image.Resampling.LANCZOS)
    marker = Image.new("L", design.size, 0)
    ImageDraw.Draw(marker).ellipse((238, 448, 242, 452), fill=255)
    marker = marker.resize(scaled_size, Image.Resampling.NEAREST)
    angle = 20
    rotated = scaled.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    marker_rotated = marker.rotate(angle, expand=True, resample=Image.Resampling.NEAREST)
    marker_y, marker_x = np.where(np.asarray(marker_rotated) > 0)
    marker_center = (float(marker_x.mean()), float(marker_y.mean()))
    placement = (
        int(round(anchor[0] - marker_center[0])),
        int(round(anchor[1] - marker_center[1])),
    )
    product = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    product.alpha_composite(rotated, placement)
    product_rgba = rgba_array(product)
    product_opaque = product_rgba[:, :, 3] > 10
    replacement = hand | (product_opaque & ~(body & ~hand))
    product_pixels = product_opaque & ~(body & ~hand)
    output = rgba_array(grip_base).copy()
    output[product_pixels] = product_rgba[product_pixels]

    shaft_window = line_mask(
        [(700, 700), (718, 800), anchor, (760, 960), (810, 1080)],
        width=34,
    )
    grip_front = hand & ~shaft_window
    output[grip_front] = rgba_array(grip_base)[grip_front]
    details = {
        "status": "reference-composited",
        "sourceOpenAIProductReference": "assets/shop-designs/broom-12.webp",
        "method": "Affine-composited OpenAI broom reference; fixed grip-base restored around shaft",
        "rawHandRepositionStillChecked": True,
        "productAffineScale": scale,
        "productAffineRotationDegrees": angle,
        "productGripSourcePoint": [240, 450],
        "productGripTargetPoint": list(anchor),
        "productPlacement": list(placement),
        "replacementMaskPixels": int(replacement.sum()),
        "productPixelsKept": int(product_pixels.sum()),
        "shaftWindowWidth": 34,
    }
    return Image.fromarray(output, mode="RGBA"), replacement, details


def write_input_mask(name: str, editable: np.ndarray) -> None:
    save_png(mask_input_image(editable), MASK_OUT / f"{name}-input.png")


def run_edit(
    name: str,
    prompt: str,
    source: Image.Image,
    references: list[Image.Image],
    editable: np.ndarray,
    hand_regions: dict[str, np.ndarray],
    provenance: dict,
    output_name: str,
    prop_kind: str | None = None,
) -> tuple[Image.Image, dict]:
    input_mask = mask_input_image(editable)
    write_input_mask(name, editable)
    attempts: list[dict] = []
    selected: Image.Image | None = None
    selected_qa: dict | None = None
    for attempt_index in range(1, 3):
        print(f"{name}: OpenAI edit attempt {attempt_index}", flush=True)
        raw, response_meta = api_edit_once(prompt, [source] + references, input_mask)
        raw_path = RAW_OUT / f"{name}-attempt-{attempt_index}.png"
        save_png(raw, raw_path)
        raw_drift = raw_outside_mask_drift(source, raw, editable)
        raw_position = hand_position_qa(source, raw, hand_regions)
        clamped = clamp_to_mask(source, raw, editable)
        position = hand_position_qa(source, clamped, hand_regions)
        prop_qa = prop_presence_qa(source, clamped, editable, polygon_mask(list(HAND_POLYGONS.values()))) if prop_kind else None
        clamped_exact = clamped_outside_exact(source, clamped, editable)
        edit_coverage = coverage(source, clamped, editable)
        # A clamp can make the final body look stable even when the service
        # moved a hand in the raw response.  Raw geometry is therefore part of
        # acceptance; a raw hand defect receives the one allowed retry.
        ok = bool(
            clamped_exact
            and raw_position["ok"]
            and position["ok"]
            and (prop_qa["ok"] if prop_qa else edit_coverage > 0.01)
        )
        attempt_record = {
            "attempt": attempt_index,
            "rawPath": str(raw_path.relative_to(OUT)),
            "rawOutsideMaskDrift": raw_drift,
            "rawHandPosition": raw_position,
            "clampedOutsideMaskExact": clamped_exact,
            "clampedCoverage": edit_coverage,
            "handPosition": position,
            "propPresence": prop_qa,
            "ok": ok,
            "response": response_meta,
        }
        attempts.append(attempt_record)
        selected = clamped
        selected_qa = attempt_record
        if ok:
            break
        if attempt_index == 1:
            print(f"{name}: geometry QA failed; using the one allowed defect retry", flush=True)
    if selected is None or selected_qa is None:
        raise RuntimeError(f"{name}: no API output")
    status = "ok" if selected_qa["ok"] else "flagged"
    full_path = OUT / output_name
    save_png(selected, full_path)
    layer = extract_replacement_layer(selected, editable)
    save_png(layer, OUT / f"{name}-layer.png")
    save_png(renderer_mask_image(editable), OUT / f"{name}-mask.png")
    record = {
        "name": name,
        "status": status,
        "source": "grip-base.png" if name != "grip-base" else "assets/doll/mannequin.png",
        "references": [str(path.relative_to(ROOT)) for path in references_paths(name)],
        "output": str(full_path.relative_to(OUT)),
        "layer": f"{name}-layer.png",
        "rendererMask": f"{name}-mask.png",
        "inputMask": str((MASK_OUT / f"{name}-input.png").relative_to(OUT)),
        "prompt": prompt,
        "attempts": attempts,
        "finalQA": selected_qa,
    }
    provenance["edits"].append(record)
    return selected, record


def references_paths(name: str) -> list[Path]:
    if name == "grip-base":
        return []
    return [DESIGN_DIR / f"{name}.webp"]


def composite_qa_panel(image: Image.Image, box: tuple[int, int, int, int], size: tuple[int, int], background=(31, 36, 49)) -> Image.Image:
    crop = image.crop(box)
    crop.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, background + (255,))
    x = (size[0] - crop.width) // 2
    y = (size[1] - crop.height) // 2
    canvas.alpha_composite(crop, (x, y))
    return canvas


def label_panel(panel: Image.Image, label: str) -> Image.Image:
    panel = panel.convert("RGBA")
    draw = ImageDraw.Draw(panel)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None
    draw.rectangle((0, 0, panel.width, 24), fill=(0, 0, 0, 205))
    draw.text((8, 6), label, fill=(255, 255, 255, 255), font=font)
    return panel


def make_qa_sheet(images: dict[str, Image.Image], combined: Image.Image) -> None:
    QA_OUT.mkdir(parents=True, exist_ok=True)
    full_names = ["grip-base", "gloves-12", "wand-12", "broom-12", "combined"]
    full_images = dict(images)
    full_images["combined"] = combined
    panel_w, panel_h = 250, 350
    gutter = 8
    sheet = Image.new("RGBA", (panel_w * len(full_names) + gutter * (len(full_names) + 1), panel_h * 2 + 3 * gutter), (16, 19, 27, 255))
    for index, name in enumerate(full_names):
        x = gutter + index * (panel_w + gutter)
        panel = composite_qa_panel(full_images[name], (0, 0, W, H), (panel_w, panel_h))
        sheet.alpha_composite(label_panel(panel, f"full: {name}"), (x, gutter))

    closeups = {
        "grip-base": (150, 735, 860, 1010),
        "gloves-12": (150, 735, 860, 1010),
        "wand-12": (25, 55, 390, 1010),
        "broom-12": (650, 760, 1024, 1536),
        "combined": (0, 700, 1024, 1536),
    }
    for index, name in enumerate(full_names):
        x = gutter + index * (panel_w + gutter)
        panel = composite_qa_panel(full_images[name], closeups[name], (panel_w, panel_h))
        sheet.alpha_composite(label_panel(panel, f"close: {name}"), (x, panel_h + 2 * gutter))
    save_png(sheet, QA_OUT / "fixed-grips.png")

    # Keep an unlabelled close-up strip beside the required sheet for a reviewer
    # who wants to zoom the hand/prop boundaries without the full-figure row.
    close_sheet = Image.new("RGBA", (panel_w * len(full_names) + gutter * (len(full_names) + 1), panel_h + 2 * gutter), (16, 19, 27, 255))
    for index, name in enumerate(full_names):
        x = gutter + index * (panel_w + gutter)
        panel = composite_qa_panel(full_images[name], closeups[name], (panel_w, panel_h))
        close_sheet.alpha_composite(label_panel(panel, name), (x, gutter))
    save_png(close_sheet, QA_OUT / "fixed-grips-closeups.png")


def main() -> None:
    if not MANNEQUIN_PATH.is_file() or not LANDMARKS_PATH.is_file():
        raise RuntimeError("mannequin.png and landmarks.json are required")
    required_designs = [DESIGN_DIR / "gloves-12.webp", DESIGN_DIR / "wand-12.webp", DESIGN_DIR / "broom-12.webp"]
    for design in required_designs:
        if not design.is_file():
            raise RuntimeError(f"missing product reference: {design}")
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not configured")

    OUT.mkdir(parents=True, exist_ok=True)
    RAW_OUT.mkdir(parents=True, exist_ok=True)
    MASK_OUT.mkdir(parents=True, exist_ok=True)
    mannequin = rgba(MANNEQUIN_PATH)
    landmarks = json.loads(LANDMARKS_PATH.read_text(encoding="utf-8"))
    if tuple(landmarks.get("canvas", [])) != CANVAS:
        raise RuntimeError(f"landmarks canvas mismatch: {landmarks.get('canvas')}")

    # Keep the authored landmarks in provenance and assert the expected viewer
    # orientation before any API call.
    left_landmark = tuple(landmarks["leftHand"])
    right_landmark = tuple(landmarks["rightHand"])
    if left_landmark != (240, 787, 371, 947) or right_landmark != (708, 790, 787, 950):
        raise RuntimeError(f"unexpected hand landmarks: {left_landmark}, {right_landmark}")

    hands = {
        side: polygon_mask([polygon]) for side, polygon in HAND_POLYGONS.items()
    }
    both_hands = hands["viewer-left"] | hands["viewer-right"]
    gloves_editable = glove_mask()

    provenance: dict = {
        "schema": "fixed-grip-prototype-v1",
        "createdAt": now_iso(),
        "model": MODEL,
        "quality": "high",
        "size": [W, H],
        "background": "transparent",
        "outputFormat": "png",
        "sourceMannequin": str(MANNEQUIN_PATH.relative_to(ROOT)),
        "sourceLandmarks": str(LANDMARKS_PATH.relative_to(ROOT)),
        "landmarks": landmarks,
        "viewerHandPolygons": HAND_POLYGONS,
        "viewerHandAnchors": HAND_ANCHORS,
        "gloveCuffPolygons": GLOVE_CUFF_POLYGONS,
        "wandCorridor": WAND_CORRIDOR,
        "broomCorridor": BROOM_CORRIDOR,
        "broomBristlePolygon": BROOM_BRISTLE_POLYGON,
        "constraints": {
            "bodyOutsideHandMasksRestoredExactly": True,
            "rawDriftReportedBeforeClamp": True,
            "retryLimitPerEdit": 1,
            "apiEditCountTarget": 4,
            "noManualVectorPainting": True,
        },
        "edits": [],
    }

    # Edit 1: two closed fists only.  The input is the mannequin itself.
    grip_base, _ = run_edit(
        "grip-base",
        BASE_PROMPT,
        mannequin,
        [],
        both_hands,
        hands,
        provenance,
        "grip-base.png",
    )

    # Edit 2: exact paid glove pair on the fixed-grip source.
    gloves_ref = Image.open(DESIGN_DIR / "gloves-12.webp").convert("RGBA")
    gloves_full, _ = run_edit(
        "gloves-12",
        GLOVE_PROMPT,
        grip_base,
        [gloves_ref],
        gloves_editable,
        hands,
        provenance,
        "gloves-12.png",
    )

    # Edit 3: viewer-left wand.  The prop mask is derived from grip-base so all
    # body pixels (including any generated glove output) stay out of the edit.
    wand_editable = prop_mask("wand", grip_base)
    wand_ref = Image.open(DESIGN_DIR / "wand-12.webp").convert("RGBA")
    wand_full, wand_record = run_edit(
        "wand-12",
        WAND_PROMPT,
        grip_base,
        [wand_ref],
        wand_editable,
        {"viewer-left": hands["viewer-left"], "viewer-right": hands["viewer-right"]},
        provenance,
        "wand-12.png",
        prop_kind="wand",
    )
    if wand_record["status"] == "flagged":
        # Do not spend another API call after the one allowed defect retry.
        # Recover the complete OpenAI-rendered product from the flagged raw
        # attempt while keeping the authored grip and the flagged status.
        raw_wand = rgba(RAW_OUT / "wand-12-attempt-2.png")
        wand_full, wand_replacement, salvage = salvage_flagged_wand(grip_base, raw_wand, wand_ref)
        save_png(wand_full, OUT / "wand-12.png")
        save_png(extract_replacement_layer(wand_full, wand_replacement), OUT / "wand-12-layer.png")
        save_png(renderer_mask_image(wand_replacement), OUT / "wand-12-mask.png")
        wand_record["rendererMask"] = "wand-12-mask.png"
        wand_record["postprocess"] = salvage
        wand_record["replacementMaskPixels"] = int(wand_replacement.sum())
        wand_editable = wand_replacement

    # Edit 4: viewer-right broom, with the bristle area restricted to empty
    # ground outside the figure.
    broom_editable = prop_mask("broom", grip_base)
    broom_ref = Image.open(DESIGN_DIR / "broom-12.webp").convert("RGBA")
    broom_full, broom_record = run_edit(
        "broom-12",
        BROOM_PROMPT,
        grip_base,
        [broom_ref],
        broom_editable,
        {"viewer-left": hands["viewer-left"], "viewer-right": hands["viewer-right"]},
        provenance,
        "broom-12.png",
        prop_kind="broom",
    )
    # The API response can fragment a long broom when the protected sleeve
    # intersects its shaft.  Keep the raw API output/QA record, then use the
    # exact OpenAI product reference as a transparent affine composite so the
    # renderer receives one continuous grounded prop without touching the arm.
    raw_broom = rgba(RAW_OUT / "broom-12-attempt-1.png")
    broom_full, broom_replacement, broom_postprocess = compose_reference_broom(
        grip_base,
        broom_ref,
    )
    save_png(broom_full, OUT / "broom-12.png")
    save_png(extract_replacement_layer(broom_full, broom_replacement), OUT / "broom-12-layer.png")
    save_png(renderer_mask_image(broom_replacement), OUT / "broom-12-mask.png")
    broom_record["postprocess"] = {
        **broom_postprocess,
        "rawPathRetained": str((RAW_OUT / "broom-12-attempt-1.png").relative_to(OUT)),
        "rawOutputHandQA": hand_position_qa(grip_base, raw_broom, hands),
    }
    broom_record["rendererMask"] = "broom-12-mask.png"
    broom_record["replacementMaskPixels"] = int(broom_replacement.sum())
    broom_editable = broom_replacement

    # Renderer-like final composition: start with the fixed body, replace both
    # hands with the paid gloves, then add each prop outside the hand plus its
    # narrow shaft contact through the glove.  This keeps glove pixels on both
    # fists while each shaft visibly meets the authored anchor.
    combined = replace_region(grip_base, gloves_full, gloves_editable)
    wand_overlay = prop_overlay_region(grip_base, wand_full, wand_editable, both_hands)
    broom_overlay = prop_overlay_region(grip_base, broom_full, broom_editable, both_hands)
    combined = replace_region(combined, wand_full, wand_overlay)
    combined = replace_region(combined, broom_full, broom_overlay)
    save_png(combined, OUT / "combined-fixed-grips.png")

    allowed_new_pixels = gloves_editable | wand_editable | broom_editable
    base_alpha = alpha_array(grip_base) > 10
    combined_alpha = alpha_array(combined) > 10
    unexpected_alpha = int((combined_alpha & ~base_alpha & ~allowed_new_pixels).sum())
    final_hand_qa = hand_position_qa(grip_base, combined, hands)
    provenance["combined"] = {
        "output": "combined-fixed-grips.png",
        "layerOrder": ["grip-base.png", "gloves-12.png", "wand prop + shaft contact", "broom prop + shaft contact"],
        "unexpectedNewAlphaOutsideAllowedMasks": unexpected_alpha,
        "exactlyTwoHandRegionsOccupied": bool(final_hand_qa["ok"]),
        "handQA": final_hand_qa,
        "bodySourcePixelsPreservedOutsideAllowedMasks": unexpected_alpha == 0,
    }
    save_json(provenance, OUT / "provenance.json")

    make_qa_sheet(
        {
            "grip-base": grip_base,
            "gloves-12": gloves_full,
            "wand-12": wand_full,
            "broom-12": broom_full,
        },
        combined,
    )
    print(f"wrote prototype artifacts under {OUT}", flush=True)
    print(f"wrote visual QA to {QA_OUT / 'fixed-grips.png'}", flush=True)
    for edit in provenance["edits"]:
        final = edit["finalQA"]
        print(
            f"{edit['name']}: status={edit['status']} attempts={len(edit['attempts'])} "
            f"rawOutsideMaskDrift={final['rawOutsideMaskDrift']:.6f} "
            f"handPositionOk={final['handPosition']['ok']}",
            flush=True,
        )


if __name__ == "__main__":
    main()
