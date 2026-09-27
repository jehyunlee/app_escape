#!/usr/bin/env python3
"""Register the twelve vest products against the canonical torso.

This is a local fit-correction pass.  It only samples the supplied OpenAI
product artwork and never paints, regenerates, or copies canonical body pixels
into a vest layer.  The source products are already transparent outside their
silhouettes, but several include a photographed back/neck/armhole lining.  A
small, explicit alpha registration mask removes those phantom interior panels
before a piecewise torso warp.

The pure ``fit_vest`` function is used by the field-clothing registrar.
Running this module stages candidates under
``scripts/art-sources/fit-correction/clothing`` and writes the two requested QA
sheets under ``/tmp/paper-doll-qa``; it does not edit or publish runtime assets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Iterable, Sequence

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "scripts" / "art-sources" / "field-wardrobe" / "designs"
DEFAULT_OUTPUT_ROOT = ROOT / "scripts" / "art-sources" / "fit-correction" / "clothing"
DEFAULT_QA_ROOT = Path("/tmp/paper-doll-qa")
CANVAS = (1024, 1536)
W, H = CANVAS
VEST_IDS = tuple(f"vest-{index:02d}" for index in range(1, 13))

# The canonical body was measured from body-upper.webp, not inherited from the
# former 395..630 sticker box.  The vest runs from shoulder/neck level through
# the shirt waist hem, with a curved silhouette that follows the torso as the
# arms descend.  Profile rows are fractions through each product source.
TOP_Y = 452
HEM_Y = 830
PROFILE_LOW = np.asarray(
    [
        (0.00, 435, 590),
        (0.08, 393, 629),
        (0.15, 374, 644),
        (0.25, 380, 641),
        (0.40, 393, 627),
        (0.55, 393, 623),
        (0.70, 390, 628),
        (0.82, 380, 640),
        (0.94, 369, 652),
        (1.00, 377, 645),
    ],
    dtype=np.float32,
)
PROFILE_HIGH = np.asarray(
    [
        (0.00, 456, 568),
        (0.08, 393, 629),
        (0.15, 374, 644),
        (0.25, 380, 641),
        (0.40, 393, 627),
        (0.55, 393, 623),
        (0.70, 390, 628),
        (0.82, 380, 640),
        (0.94, 369, 652),
        (1.00, 377, 645),
    ],
    dtype=np.float32,
)
LOW_PROFILE_IDS = {1, 2, 4, 6, 9, 10, 12}

# These are source-space opening contours measured on each product.  They cut
# only the photographed interior/back-facing panel; front plackets, belts,
# buttons, pockets, lacing, and outer bindings remain source pixels.
OPENING_POLYGONS: dict[int, tuple[tuple[float, float], ...]] = {
    1: (
        (0.29, 0.03), (0.71, 0.03), (0.70, 0.10), (0.64, 0.19),
        (0.55, 0.31), (0.50, 0.40), (0.45, 0.31), (0.36, 0.19), (0.30, 0.10),
    ),
    # Vest 02 remains open to the shirt below its V; its long centre gap is
    # deliberately widened separately in build_source_mask.
    2: (
        (0.30, 0.03), (0.70, 0.03), (0.66, 0.14), (0.59, 0.28),
        (0.55, 0.46), (0.50, 0.68), (0.47, 0.88), (0.43, 0.88),
        (0.42, 0.68), (0.43, 0.46), (0.40, 0.28), (0.34, 0.14),
    ),
    3: (
        (0.30, 0.04), (0.70, 0.04), (0.70, 0.08), (0.62, 0.15),
        (0.54, 0.20), (0.50, 0.22), (0.46, 0.20), (0.38, 0.15), (0.30, 0.08),
    ),
    4: (
        (0.29, 0.03), (0.72, 0.03), (0.70, 0.11), (0.64, 0.20),
        (0.53, 0.34), (0.49, 0.42), (0.45, 0.34), (0.36, 0.20), (0.30, 0.11),
    ),
    5: (
        (0.28, 0.04), (0.72, 0.04), (0.72, 0.08), (0.63, 0.14),
        (0.56, 0.18), (0.50, 0.20), (0.44, 0.18), (0.37, 0.14), (0.28, 0.08),
    ),
    6: (
        (0.29, 0.00), (0.71, 0.00), (0.71, 0.11), (0.64, 0.18),
        (0.55, 0.26), (0.50, 0.38), (0.45, 0.26), (0.36, 0.18), (0.29, 0.11),
    ),
    7: (
        (0.30, 0.04), (0.70, 0.04), (0.70, 0.08), (0.62, 0.14),
        (0.55, 0.18), (0.50, 0.20), (0.45, 0.18), (0.38, 0.14), (0.30, 0.08),
    ),
    8: (
        (0.29, 0.04), (0.71, 0.04), (0.71, 0.08), (0.63, 0.14),
        (0.56, 0.17), (0.50, 0.18), (0.44, 0.17), (0.37, 0.14), (0.29, 0.08),
    ),
    9: (
        (0.34, 0.03), (0.67, 0.03), (0.67, 0.11), (0.61, 0.18),
        (0.56, 0.29), (0.51, 0.41), (0.47, 0.30), (0.40, 0.18), (0.34, 0.11),
    ),
    10: (
        (0.34, 0.03), (0.67, 0.03), (0.67, 0.11), (0.61, 0.18),
        (0.56, 0.29), (0.51, 0.41), (0.47, 0.30), (0.40, 0.18), (0.34, 0.11),
    ),
    11: (
        (0.29, 0.04), (0.71, 0.04), (0.71, 0.08), (0.63, 0.14),
        (0.56, 0.18), (0.50, 0.21), (0.44, 0.18), (0.37, 0.14), (0.29, 0.08),
    ),
    12: (
        (0.29, 0.00), (0.71, 0.00), (0.71, 0.13), (0.65, 0.22),
        (0.56, 0.32), (0.51, 0.42), (0.47, 0.32), (0.35, 0.22), (0.29, 0.13),
    ),
}

# The remaining dark top/back insert is cleared after the warp in target
# coordinates.  Wide variants 03 and 11 stay open until their first visible
# closure, so the cream shirt—not a black source insert—fills that gap.
NECK_CLEANUP: dict[int, tuple[int, int, int, int, int, int, int]] = {
    3: (425, 599, 445, 580, 455, 565, 558),
    5: (438, 586, 454, 566, 468, 550, 532),
    11: (425, 599, 445, 580, 455, 565, 585),
}
DEFAULT_NECK_CLEANUP = (445, 579, 464, 560, 479, 545, 492)

CLOSED_COLLAR_KEYS = {5, 7, 8}

# Stand collars have a real front collar and a dark photographed interior.
# These small cavities clear only the interior; unlike the open V products,
# their collar fronts and centre plackets stay source-authored.
def source_opening(index: int) -> tuple[tuple[float, float], ...]:
    if index in CLOSED_COLLAR_KEYS:
        return (
            (0.29, 0.00), (0.71, 0.00), (0.68, 0.045),
            (0.59, 0.075), (0.54, 0.10), (0.52, 0.18),
            (0.43, 0.18), (0.41, 0.10), (0.34, 0.075),
            (0.30, 0.045),
        )
    original = OPENING_POLYGONS[index]
    return ((original[0][0], 0.0), (original[1][0], 0.0), *original[2:])

# Measured canonical-body anchors recorded in every receipt.  The profile
# itself is the registration control; these named landmarks make the fit
# reviewable without treating opaque-pixel counts as anatomical proof.
BODY_ANCHORS = {
    "neck": [512, 466],
    "shoulderRoots": [[390, 520], [638, 520]],
    "armholeRoots": [[386, 620], [638, 620]],
    "sideSeams": [[397, 650], [616, 650]],
    # HEM_Y is the exclusive row of the raster span; probe the last populated
    # row while retaining the semantic hem control at HEM_Y in registration.
    "waistHem": [[380, HEM_Y - 1], [644, HEM_Y - 1]],
}






def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def load_rgba(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    if image.width < 2 or image.height < 2:
        raise ValueError(f"{path}: image is too small")
    return image


def alpha_bbox(image: Image.Image, threshold: int = 10) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    return alpha.getbbox()


def clear_transparent_rgb(image: Image.Image, threshold: int = 3) -> Image.Image:
    array = np.asarray(image.convert("RGBA")).copy()
    array[array[:, :, 3] < threshold, :3] = 0
    return Image.fromarray(array, mode="RGBA")


def write_lossless(image: Image.Image, path: Path) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    clean = clear_transparent_rgb(image)
    clean.save(path, format="WEBP", lossless=True, method=6)
    return sha256(path)


def build_source_mask(source: Image.Image, index: int) -> np.ndarray:
    """Return source alpha with photographed interior panels removed."""
    original = np.asarray(source.getchannel("A"), dtype=np.uint8)
    height, width = original.shape
    mask_image = Image.fromarray(original, mode="L")
    draw = ImageDraw.Draw(mask_image)

    def scaled(points: Sequence[tuple[float, float]]) -> list[tuple[int, int]]:
        return [(round(x * (width - 1)), round(y * (height - 1))) for x, y in points]

    draw.polygon(scaled(source_opening(index)), fill=0)
    if index == 2:
        # The laced vest has a genuine long front opening.  Its source lining
        # is opaque and dark, so keep only the two authored front panels.
        draw.polygon(
            scaled(((0.40, 0.28), (0.60, 0.28), (0.56, 0.90), (0.44, 0.90))),
            fill=0,
        )

    # Remove only the interior side of each U-shaped armhole.  A narrow outer
    # binding remains in the source; no new arm or sleeve pixels are created.
    draw.polygon(
        scaled(((0.00, 0.10), (0.085, 0.11), (0.090, 0.17), (0.090, 0.24),
                (0.085, 0.31), (0.075, 0.40), (0.030, 0.48), (0.00, 0.50))),
        fill=0,
    )
    draw.polygon(
        scaled(((1.00, 0.10), (0.915, 0.11), (0.910, 0.17), (0.910, 0.24),
                (0.915, 0.31), (0.925, 0.40), (0.970, 0.48), (1.00, 0.50))),
        fill=0,
    )
    return np.asarray(mask_image, dtype=np.uint8)


def premultiplied_source(source: Image.Image, alpha: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    array = np.asarray(source.convert("RGBA"), dtype=np.float32)
    alpha_float = alpha.astype(np.float32) / 255.0
    array[:, :, 3] = alpha.astype(np.float32)
    premultiplied = array[:, :, :3] * alpha_float[:, :, None]
    return premultiplied, alpha_float


def sample_row(
    premultiplied: np.ndarray,
    alpha: np.ndarray,
    sx: np.ndarray,
    sy: float,
) -> np.ndarray:
    """Bilinearly sample RGBA without transparent-RGB halos."""
    height, width = alpha.shape
    sx = np.clip(sx.astype(np.float32), 0.0, width - 1.0)
    sy = float(np.clip(sy, 0.0, height - 1.0))
    x0 = np.floor(sx).astype(np.int32)
    x1 = np.minimum(x0 + 1, width - 1)
    y0 = int(np.floor(sy))
    y1 = min(y0 + 1, height - 1)
    wx = sx - x0
    wy = sy - y0

    def bilinear(values: np.ndarray) -> np.ndarray:
        weights = wx[:, None] if values.ndim == 3 else wx
        top = values[y0, x0] * (1.0 - weights) + values[y0, x1] * weights
        bottom = values[y1, x0] * (1.0 - weights) + values[y1, x1] * weights
        return top * (1.0 - wy) + bottom * wy

    sampled_rgb = bilinear(premultiplied)
    sampled_alpha = bilinear(alpha) * 255.0
    unpremultiplied = np.divide(
        sampled_rgb,
        np.maximum(sampled_alpha[:, None] / 255.0, 1e-5),
    )
    unpremultiplied[sampled_alpha < 0.5] = 0.0
    return np.clip(
        np.concatenate([unpremultiplied, sampled_alpha[:, None]], axis=1),
        0.0,
        255.0,
    ).astype(np.uint8)


def profile_for(index: int) -> np.ndarray:
    return PROFILE_LOW if index in LOW_PROFILE_IDS else PROFILE_HIGH


def interpolate_profile(profile: np.ndarray, fraction: float) -> tuple[float, float]:
    left = float(np.interp(fraction, profile[:, 0], profile[:, 1]))
    right = float(np.interp(fraction, profile[:, 0], profile[:, 2]))
    return left, right


def source_row_bounds(mask: np.ndarray, row: int) -> tuple[int, int]:
    occupied = np.where(mask[row] > 10)[0]
    if len(occupied) == 0:
        return 0, mask.shape[1] - 1
    return int(occupied[0]), int(occupied[-1])


def apply_neck_cleanup(output: np.ndarray, index: int) -> None:
    if index in CLOSED_COLLAR_KEYS:
        return
    lx, rx, l1, r1, l2, r2, apex = NECK_CLEANUP.get(index, DEFAULT_NECK_CLEANUP)
    alpha = Image.fromarray(output[:, :, 3], mode="L")
    draw = ImageDraw.Draw(alpha)
    draw.polygon(
        [(lx, 448), (rx, 448), (r1, 470), (r2, 490), (512, apex), (l2, 490), (l1, 470)],
        fill=0,
    )
    output[:, :, 3] = np.asarray(alpha, dtype=np.uint8)








def fit_vest(source: Image.Image, index: int) -> tuple[Image.Image, dict[str, object]]:
    if not 1 <= index <= 12:
        raise ValueError(f"invalid vest index: {index}")
    bbox = alpha_bbox(source)
    if bbox is None:
        raise ValueError(f"vest-{index:02d}: source has no alpha")
    # Work in the original source crop so all product pixels retain their
    # authored material detail.  Transparent margins are harmless because the
    # premultiplied sampler clears them.
    source_crop = source.crop(bbox)
    source_alpha = build_source_mask(source_crop, index)
    premultiplied, alpha_float = premultiplied_source(source_crop, source_alpha)
    source_height, source_width = source_alpha.shape
    shoulder_bounds = source_row_bounds(
        source_alpha, round((source_height - 1) * 0.18)
    )

    profile = profile_for(index)
    output = np.zeros((H, W, 4), dtype=np.uint8)
    output_rows: list[tuple[int, int]] = []
    for target_y in range(TOP_Y, HEM_Y):
        fraction = (target_y - TOP_Y) / max(1.0, HEM_Y - TOP_Y - 1.0)
        left, right = interpolate_profile(profile, fraction)
        left_pixel = max(0, int(np.floor(left)))
        right_pixel = min(W - 1, int(np.ceil(right)))
        if right_pixel < left_pixel:
            continue
        target_x = np.arange(left_pixel, right_pixel + 1, dtype=np.float32)
        target_width = max(1.0, right - left)
        source_y = fraction * max(1, source_height - 1)
        row0 = int(np.floor(source_y))
        row1 = min(row0 + 1, source_height - 1)
        row_fraction = source_y - row0
        bounds0 = source_row_bounds(source_alpha, row0)
        bounds1 = source_row_bounds(source_alpha, row1)
        # Keep the collar and shoulder mapping continuous. Measure the front
        # panel after removing back-facing lining, not the empty product shell.
        blend = float(np.clip((fraction - 0.20) / 0.25, 0.0, 1.0))
        blend = blend * blend * (3.0 - 2.0 * blend)
        envelope_left = bounds0[0] * (1.0 - row_fraction) + bounds1[0] * row_fraction
        envelope_right = bounds0[1] * (1.0 - row_fraction) + bounds1[1] * row_fraction
        source_left = shoulder_bounds[0] * (1.0 - blend) + envelope_left * blend
        source_right = shoulder_bounds[1] * (1.0 - blend) + envelope_right * blend
        source_x = (target_x - left) / target_width * (source_right - source_left) + source_left
        output[target_y, left_pixel : right_pixel + 1] = sample_row(
            premultiplied,
            alpha_float,
            source_x,
            source_y,
        )
        output_rows.append((left_pixel, right_pixel))

    cleanup = NECK_CLEANUP.get(index, DEFAULT_NECK_CLEANUP)
    apply_neck_cleanup(output, index)
    output[output[:, :, 3] < 3, :3] = 0
    image = Image.fromarray(output, mode="RGBA")
    target_bbox = alpha_bbox(image)
    if target_bbox is None:
        raise ValueError(f"vest-{index:02d}: fit produced no alpha")
    target_widths = [
        [round(float(value), 2) for value in interpolate_profile(profile, fraction)]
        for fraction in profile[:, 0]
    ]
    registration = {
        "method": "torso-conforming-piecewise-source-warp",
        "sourceBbox": list(bbox),
        "sourceCropSize": [source_width, source_height],
        "targetTopY": TOP_Y,
        "targetHemY": HEM_Y,
        "targetProfile": [[round(float(row[0]), 3), int(round(row[1])), int(round(row[2]))] for row in profile],
        "targetWidthsByControl": target_widths,
        "neckAnchor": BODY_ANCHORS["neck"],
        "shoulderRoots": BODY_ANCHORS["shoulderRoots"],
        "armholeRoots": BODY_ANCHORS["armholeRoots"],
        "sideSeams": BODY_ANCHORS["sideSeams"],
        "waistHem": BODY_ANCHORS["waistHem"],
        "openingSourcePolygonNormalized": [
            [round(x, 4), round(y, 4)]
            for x, y in source_opening(index)
        ],
        "openingSourceKind": "closed-collar-cavity" if index in CLOSED_COLLAR_KEYS else "front-opening",
        "neckCleanupTargetPolygon": None if index in CLOSED_COLLAR_KEYS else [
            [cleanup[0], 448],
            [cleanup[1], 448],
            [cleanup[3], 470],
            [cleanup[5], 490],
            [512, cleanup[6]],
            [cleanup[4], 490],
            [cleanup[2], 470],
        ],
        "armholeInteriorRemoved": True,
        "fitProbes": {
            "fabric": [[390, 520], [638, 520], [405, 650], [610, 650]],
            "underlayer": [[375, 570], [650, 570], [512, 500]],
        },
        "sourcePixelsOnly": True,
        "newBodyPixels": False,
        "sourcePreserved": True,
        "targetAlphaBbox": list(target_bbox),
        "registeredRows": len(output_rows),
    }
    return image, registration





def source_record(path: Path, image: Image.Image) -> dict[str, object]:
    bbox = alpha_bbox(image)
    return {
        "path": rel(path),
        "sha256": sha256(path),
        "size": list(image.size),
        "alphaBbox": list(bbox) if bbox else None,
    }


def output_record(path: Path, image: Image.Image, output_hash: str) -> dict[str, object]:
    bbox = alpha_bbox(image)
    return {
        "path": rel(path),
        "sha256": output_hash,
        "size": list(image.size),
        "alphaBbox": list(bbox) if bbox else None,
    }


def load_qa_head() -> Image.Image:
    source = load_rgba(ROOT / "assets" / "doll" / "headwear" / "dad-neutral-bare.webp")
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(source, (0, -768))
    return canvas


def compose(layers: Iterable[Image.Image]) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS, (239, 239, 235, 255))
    for layer in layers:
        canvas.alpha_composite(layer.convert("RGBA"))
    return canvas


def fit_to_cell(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    cell_w, cell_h = size
    rgba = image.convert("RGBA")
    bbox = alpha_bbox(rgba)
    if bbox is None:
        return Image.new("RGBA", size, (239, 239, 235, 255))
    crop = rgba.crop(bbox)
    scale = min((cell_w - 24) / crop.width, (cell_h - 48) / crop.height)
    scaled = crop.resize(
        (max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
        Image.Resampling.LANCZOS,
    )
    cell = Image.new("RGBA", size, (239, 239, 235, 255))
    cell.alpha_composite(scaled, ((cell_w - scaled.width) // 2, 34 + (cell_h - 34 - scaled.height) // 2))
    return cell


def add_text(image: Image.Image, text: str, xy: tuple[int, int], size: int = 16) -> None:
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", size)
    except OSError:
        font = ImageFont.load_default()
    draw.text(xy, text, fill=(35, 42, 46, 255), font=font)


def body_layers(garment: Image.Image) -> list[Image.Image]:
    head = load_qa_head()
    starter = load_rgba(ROOT / "assets" / "doll" / "rigged" / "starter-pants.webp")
    neck = load_rgba(ROOT / "assets" / "doll" / "rigged" / "necks/dad.webp")
    upper = load_rgba(ROOT / "assets" / "doll" / "rigged" / "body-upper.webp")
    hands = load_rgba(ROOT / "assets" / "doll" / "rigged" / "hands-base.webp")
    return [starter, neck, upper, garment, hands, head]


def render_prototypes(layers: dict[str, Image.Image], qa_root: Path) -> Path:
    items = ["vest-01", "vest-06", "vest-12"]
    cell = (390, 620)
    sheet = Image.new("RGBA", (cell[0] * 3, cell[1] * 2), (239, 239, 235, 255))
    for index, key in enumerate(items):
        layer_cell = fit_to_cell(layers[key], cell)
        body_cell = fit_to_cell(compose(body_layers(layers[key])), cell)
        x = index * cell[0]
        sheet.alpha_composite(layer_cell, (x, 0))
        sheet.alpha_composite(body_cell, (x, cell[1]))
        add_text(sheet, f"{key} — fitted layer", (x + 12, 10), 16)
        add_text(sheet, f"{key} — canonical body", (x + 12, cell[1] + 10), 16)
    qa_root.mkdir(parents=True, exist_ok=True)
    path = qa_root / "vest-fit-correction-prototypes.png"
    sheet.convert("RGB").save(path, format="PNG")
    return path


def render_all(layers: dict[str, Image.Image], qa_root: Path) -> Path:
    columns = 4
    rows = (len(VEST_IDS) + columns - 1) // columns
    cell = (360, 560)
    sheet = Image.new("RGBA", (columns * cell[0], rows * cell[1]), (239, 239, 235, 255))
    for index, key in enumerate(VEST_IDS):
        if key not in layers:
            continue
        thumb = fit_to_cell(compose(body_layers(layers[key])), cell)
        x = (index % columns) * cell[0]
        y = (index // columns) * cell[1]
        sheet.alpha_composite(thumb, (x, y))
        add_text(sheet, key, (x + 12, y + 10), 16)
    qa_root.mkdir(parents=True, exist_ok=True)
    path = qa_root / "vest-fit-correction-all.png"
    sheet.convert("RGB").save(path, format="PNG")
    return path


def requested_ids(items: Sequence[str] | None) -> list[str]:
    if not items:
        return list(VEST_IDS)
    result: list[str] = []
    for value in items:
        key = value if value.startswith("vest-") else f"vest-{int(value):02d}"
        if key not in VEST_IDS:
            raise ValueError(f"{value}: not a vest id")
        if key not in result:
            result.append(key)
    return result


def register_fitted_vests(
    items: Sequence[str] | None = None,
    output_dir: Path = DEFAULT_OUTPUT_ROOT,
    qa_dir: Path = DEFAULT_QA_ROOT,
    render_qa: bool = True,
) -> dict[str, object]:
    """Fit requested vests and return the handoff receipt.

    ``output_dir`` is intentionally outside ``assets``.  A parent registrar may
    consume the returned layer paths after visual review; this function never
    replaces canonical runtime clothing.
    """
    output_dir = Path(output_dir).expanduser()
    qa_dir = Path(qa_dir).expanduser()
    keys = requested_ids(items)
    output_dir.mkdir(parents=True, exist_ok=True)
    layers: dict[str, Image.Image] = {}
    records: dict[str, dict[str, object]] = {}
    for key in keys:
        index = int(key.rsplit("-", 1)[1])
        source_path = SOURCE_ROOT / f"{key}.webp"
        if not source_path.is_file():
            raise FileNotFoundError(f"missing vest source: {source_path}")
        source = load_rgba(source_path)
        fitted, registration = fit_vest(source, index)
        output_path = output_dir / f"{key}.webp"
        output_hash = write_lossless(fitted, output_path)
        layers[key] = fitted
        records[key] = {
            "key": key,
            "category": "vest",
            "source": source_record(source_path, source),
            "output": output_record(output_path, fitted, output_hash),
            "registration": registration,
            "review": "pending-visual-review",
        }

    qa: dict[str, str] = {}
    if render_qa:
        if all(key in layers for key in ("vest-01", "vest-06", "vest-12")):
            qa["prototypes"] = rel(render_prototypes(layers, qa_dir))
        if len(layers) == len(VEST_IDS):
            qa["all"] = rel(render_all(layers, qa_dir))

    receipt: dict[str, object] = {
        "schema": "vest-fit-correction-v1",
        "canvas": list(CANVAS),
        "sourceRoot": rel(SOURCE_ROOT),
        "outputRoot": rel(output_dir),
        "canonicalBody": {
            "bodyUpper": rel(ROOT / "assets" / "doll" / "rigged" / "body-upper.webp"),
            "handsBase": rel(ROOT / "assets" / "doll" / "rigged" / "hands-base.webp"),
            "qaHead": rel(ROOT / "assets" / "doll" / "headwear" / "dad-neutral-bare.webp"),
            "qaHeadOffset": [0, -768],
        },
        "anchors": BODY_ANCHORS,
        "fit": {
            "topY": TOP_Y,
            "hemY": HEM_Y,
            "lowProfileIds": sorted(LOW_PROFILE_IDS),
            "piecewiseRows": True,
            "sourcePixelsOnly": True,
            "newBodyPixels": False,
            "apiCalls": 0,
        },
        "items": {key: records[key] for key in sorted(records)},
        "qa": qa,
        "review": "pending-visual-review",
    }
    receipt_path = output_dir / "vest-fit.json"
    receipt["receiptPath"] = rel(receipt_path)
    receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return receipt


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--items", help="comma-separated vest ids or numbers; default is all twelve")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_ROOT)
    parser.add_argument("--qa-dir", type=Path, default=DEFAULT_QA_ROOT)
    parser.add_argument("--no-qa", action="store_true", help="skip contact-sheet rendering")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    values = [value.strip() for value in args.items.split(",") if value.strip()] if args.items else None
    receipt = register_fitted_vests(
        values,
        output_dir=args.output_dir,
        qa_dir=args.qa_dir,
        render_qa=not args.no_qa,
    )
    print(json.dumps({"outputRoot": receipt["outputRoot"], "items": sorted(receipt["items"]), "qa": receipt["qa"]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
