#!/usr/bin/env python3
"""Register isolated field-wardrobe garments on the canonical paper doll.

This is a local, technical registration pass.  It never calls an image API and
never paints body pixels into a garment.  Isolated product RGBA is warped with
premultiplied sampling so material colour, seams, and genuine openings survive.
The default output is the active rig. Use ``--output-dir`` to register a
separate candidate tree before reviewing and publishing its pixels locally.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import map_coordinates
from scipy.interpolate import PchipInterpolator

ROOT = Path(__file__).resolve().parents[1]
_VEST_SPEC = importlib.util.spec_from_file_location(
    "fitted_vests", ROOT / "scripts/register-fitted-vests.py"
)
_VESTS = importlib.util.module_from_spec(_VEST_SPEC)
_VEST_SPEC.loader.exec_module(_VESTS)
FIELD_ROOT = ROOT / "scripts" / "art-sources" / "field-wardrobe"
DEFAULT_OUT = ROOT / "assets" / "doll" / "rigged" / "clothing"
DEFAULT_QA = Path("/tmp/paper-doll-qa/field-release-clothing")
CANVAS = (1024, 1536)
W, H = CANVAS

# The canonical upper body ends at the wrists.  Hands are composited in front
# of sleeves; no garment pixels are copied from either body layer.
NECK_Y = 415
SHOULDER_Y = 485
WRIST_Y = 830
HIP_Y = 806
ANKLE_Y = 1354
WAIST_WIDTH = 285
ANKLE_LEFT = 365
ANKLE_RIGHT = 662

CLOAK_IDS = tuple(f"cloak-{i:02d}" for i in range(1, 13))
VEST_IDS = tuple(f"vest-{i:02d}" for i in range(1, 13))
PANTS_IDS = tuple(f"pants-{i:02d}" for i in range(1, 13))

# Source row fractions identify the garment's real structural controls.  The
# three short/cape silhouettes retain their source sleeve length; they are not
# stretched to a long-coat cuff.  Target hem controls keep each design's
# intended short, mid, or long silhouette instead of one shared bbox.
@dataclass(frozen=True)
class CloakPlan:
    shoulder_fraction: float
    cuff_fraction: float
    target_cuff_y: int
    target_hem_y: int
    target_cuff_x: tuple[int, int]
    target_hem_x: tuple[int, int]
    opening: bool
    name: str
    expected_segments: int
    source_cuff_row: int | None = None
    source_cuff_centres: tuple[float, float] | None = None


CLOAK_PLANS: dict[str, CloakPlan] = {
    "cloak-01": CloakPlan(.18, .80, 830, 1080, (270, 750), (382, 642), True, "short open-front coat", 4, source_cuff_row=470),
    # These three designs have real short sleeves, not horizontal wings.  The
    # source cuff rows are the authored lower sleeve seams (rather than a
    # convenient alpha-component row); their target envelopes are deliberately
    # wide enough for the hanging arm centre lines at the elbow.
    "cloak-02": CloakPlan(
        .18, .38, 690, 1055, (268, 756), (378, 646), False,
        "short-sleeve closed poncho", 3,
        source_cuff_row=250, source_cuff_centres=(48.0, 430.0),
    ),
    "cloak-03": CloakPlan(.18, .56, 830, 1150, (270, 750), (360, 664), True, "mid open-front cloak", 4),
    "cloak-04": CloakPlan(.18, .56, 830, 1190, (270, 750), (338, 686), True, "mid open-front cloak", 3),
    "cloak-05": CloakPlan(.18, .55, 830, 1250, (270, 750), (308, 716), True, "long open-front cloak", 4),
    "cloak-06": CloakPlan(.18, .56, 830, 1160, (270, 750), (338, 690), False, "closed diagonal wrap coat", 3, source_cuff_row=480),
    "cloak-07": CloakPlan(
        .18, .47, 700, 1215, (269, 755), (328, 696), False,
        "cape with short forearm sleeves", 1,
        source_cuff_row=430, source_cuff_centres=(58.0, 448.0),
    ),
    "cloak-08": CloakPlan(.18, .55, 830, 1270, (270, 750), (304, 720), True, "long open-front cloak", 4),
    "cloak-09": CloakPlan(
        .18, .26, 690, 1230, (288, 736), (310, 714), False,
        "short-sleeve closed wrap coat", 3,
        source_cuff_row=220, source_cuff_centres=(83.0, 385.0),
    ),
    "cloak-10": CloakPlan(.18, .50, 830, 1270, (270, 750), (304, 720), True, "long open-front cloak", 4),
    "cloak-11": CloakPlan(.18, .50, 830, 1260, (270, 750), (330, 694), False, "closed long coat", 3),
    "cloak-12": CloakPlan(.18, .54, 830, 1285, (270, 750), (300, 724), False, "long closed panel coat", 3, source_cuff_row=470),
}

@dataclass(frozen=True)
class SourceRecord:
    path: Path
    kind: str


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT.resolve()))
    except ValueError:
        return str(path)


def load_rgba(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    if image.width == 0 or image.height == 0:
        raise ValueError(f"empty image: {path}")
    return image


def alpha_array(image: Image.Image, threshold: int = 10) -> np.ndarray:
    return np.asarray(image.getchannel("A"), dtype=np.uint8) > threshold


def alpha_bbox(image: Image.Image, threshold: int = 10) -> tuple[int, int, int, int] | None:
    mask = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    return mask.getbbox()


def rgba_array(image: Image.Image) -> np.ndarray:
    return np.asarray(image.convert("RGBA"), dtype=np.uint8)


def write_lossless(image: Image.Image, path: Path) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGBA").save(path, format="WEBP", lossless=True, method=6)
    return sha256(path)


def component_envelope(mask: np.ndarray, row: int) -> tuple[float, float, float]:
    """Return alpha envelope center, width, and the row actually used."""
    height = mask.shape[0]
    row = int(np.clip(row, 0, height - 1))
    occupied = np.where(mask[row])[0]
    if not len(occupied):
        for distance in range(1, height):
            candidates = [row - distance, row + distance]
            for candidate in candidates:
                if 0 <= candidate < height:
                    occupied = np.where(mask[candidate])[0]
                    if len(occupied):
                        row = candidate
                        break
            if len(occupied):
                break
    if not len(occupied):
        raise ValueError("source alpha has no occupied registration row")
    return (float(occupied[0] + occupied[-1]) / 2.0, float(occupied[-1] - occupied[0] + 1), float(row))


def alpha_row_profile(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Return smooth outer-alpha centre/width profiles for every source row."""
    centres = np.full(mask.shape[0], np.nan, dtype=np.float32)
    widths = np.full(mask.shape[0], np.nan, dtype=np.float32)
    for row in range(mask.shape[0]):
        occupied = np.where(mask[row])[0]
        if len(occupied):
            centres[row] = (float(occupied[0]) + float(occupied[-1])) / 2.0
            widths[row] = float(occupied[-1] - occupied[0] + 1)
    valid = np.where(~np.isnan(centres))[0]
    if not len(valid):
        raise ValueError("source alpha has no row profile")
    all_rows = np.arange(mask.shape[0], dtype=np.float32)
    return (
        np.interp(all_rows, valid.astype(np.float32), centres[valid]).astype(np.float32),
        np.interp(all_rows, valid.astype(np.float32), widths[valid]).astype(np.float32),
    )


def horizontal_segments(mask: np.ndarray, row: int, minimum_width: int = 3) -> list[tuple[int, int, int]]:
    """Return substantial alpha runs on one source row."""
    occupied = np.where(mask[int(np.clip(row, 0, mask.shape[0] - 1))])[0]
    if not len(occupied):
        return []
    segments: list[tuple[int, int, int]] = []
    start = previous = int(occupied[0])
    for value in occupied[1:]:
        value = int(value)
        if value > previous + 1:
            width = previous - start + 1
            if width >= minimum_width:
                segments.append((start, previous, width))
            start = value
        previous = value
    width = previous - start + 1
    if width >= minimum_width:
        segments.append((start, previous, width))
    return segments


def find_cuff_row(mask: np.ndarray, authored_fraction: float, expected_segments: int) -> int:
    """Find the sleeve-end row near the authored control, not a hem row."""
    height = mask.shape[0]
    authored = int(round(np.clip(authored_fraction, 0.0, 1.0) * (height - 1)))
    radius = max(12, int(round(height * 0.08)))
    start = max(0, authored - radius)
    stop = min(height - 1, authored + radius)
    candidates = [
        row for row in range(start, stop + 1)
        if len(horizontal_segments(mask, row)) >= expected_segments
    ]
    if not candidates:
        raise ValueError(
            f"no cuff row near authored fraction {authored_fraction:.3f} "
            f"with {expected_segments} segments"
        )
    return max(candidates)


def cuff_centres(
    mask: np.ndarray,
    cuff_row: int,
    expected_segments: int,
    manual: tuple[float, float] | None = None,
) -> tuple[float, float, list[int]]:
    """Average the outer sleeve centres over a stable band near the cuff."""
    if manual is not None:
        return float(manual[0]), float(manual[1]), [int(cuff_row)]
    rows = []
    for row in range(max(0, cuff_row - 9), min(mask.shape[0] - 1, cuff_row) + 1):
        segments = horizontal_segments(mask, row)
        if len(segments) >= expected_segments:
            left, right = segments[0], segments[-1]
            rows.append((float(left[0] + left[1]) / 2.0, float(right[0] + right[1]) / 2.0, row))
    if not rows:
        raise ValueError(f"no stable sleeve components near source cuff row {cuff_row}")
    return (
        float(np.mean([row[0] for row in rows])),
        float(np.mean([row[1] for row in rows])),
        [int(row[2]) for row in rows],
    )


def structural_bottom(mask: np.ndarray) -> int:
    """Ignore one-pixel crop/alpha tails when choosing a garment hem row."""
    widths = np.zeros(mask.shape[0], dtype=np.int32)
    for row in range(mask.shape[0]):
        occupied = np.where(mask[row])[0]
        widths[row] = int(occupied[-1] - occupied[0] + 1) if len(occupied) else 0
    maximum = int(widths.max())
    if maximum <= 0:
        raise ValueError("source alpha has no structural rows")
    # Ignore the narrow antialiased/tip tail that many isolated product
    # renders leave below the authored hem.  Mapping that tail to a broad
    # target hem collapses source X and repeats one pixel across the full
    # cloak, producing a false skirt/plate.  A stable 45% envelope keeps the
    # actual lower panel/hem construction while retaining pointed source
    # silhouettes through the preceding profile rows.
    threshold = max(20, int(round(maximum * 0.45)))
    candidates = np.where(widths >= threshold)[0]
    if not len(candidates):
        return int(np.argmax(widths))
    return int(candidates[-1])


def premultiplied_sample(source: np.ndarray, sx: np.ndarray, sy: np.ndarray) -> np.ndarray:
    """Sample RGBA while avoiding transparent-RGB halos."""
    source_float = source.astype(np.float32)
    alpha = source_float[:, :, 3] / 255.0
    sampled_alpha = map_coordinates(alpha, [sy, sx], order=1, mode="constant", cval=0.0)
    output = np.zeros((*sx.shape, 4), dtype=np.uint8)
    for channel in range(3):
        premultiplied = source_float[:, :, channel] * alpha
        sampled = map_coordinates(premultiplied, [sy, sx], order=1, mode="constant", cval=0.0)
        output[:, :, channel] = np.clip(sampled / np.maximum(sampled_alpha, 1e-5), 0, 255).astype(np.uint8)
    output[:, :, 3] = np.clip(sampled_alpha * 255.0, 0, 255).astype(np.uint8)
    output[:, :, 3][output[:, :, 3] < 10] = 0
    return output


def close_sleeve_gaps(
    source_mask: np.ndarray,
    source_rows: list[int],
    source_centres: list[float],
    source_widths: list[float],
    target_rows: list[int],
    target_centres: list[float],
    target_widths: list[float],
    source_x: np.ndarray,
    source_y: np.ndarray,
    opening: bool,
    stop_target_row: int,
) -> int:
    """Close only side sleeve/torso gaps by warping existing segments.

    Isolated product crops often leave transparent underarm wedges between a
    sleeve and the torso.  On the canonical body those wedges reveal the
    cream upper arm.  For closed garments the wedges are not design openings;
    for open garments only the two sleeve-side wedges close and the center
    front opening stays transparent.  Each segment is resampled from its own
    source pixels, so no body colour or painted fill is introduced.
    """
    changed_rows = 0
    first_target, last_target = target_rows[0], target_rows[-1]
    source_width_curve = PchipInterpolator(source_rows, source_widths)
    source_center_curve = PchipInterpolator(source_rows, source_centres)
    target_width_curve = PchipInterpolator(target_rows, target_widths)
    target_center_curve = PchipInterpolator(target_rows, target_centres)
    for target_y in range(first_target, min(last_target, stop_target_row) + 1):
        source_y_value = int(round(float(source_y[target_y, W // 2])))
        segments = horizontal_segments(source_mask, source_y_value)
        if len(segments) < 3:
            continue
        # The source row can have tiny detached alpha islands.  Keep the
        # substantial runs; the first/last runs are always sleeve candidates.
        control = next(
            (
                index for index in range(len(target_rows) - 1)
                if target_rows[index] <= target_y <= target_rows[index + 1]
            ),
            len(target_rows) - 2,
        )
        y0, y1 = target_rows[control], target_rows[control + 1]
        t = np.clip((target_y - y0) / max(1.0, float(y1 - y0)), 0.0, 1.0)
        source_centre = float(source_center_curve(source_y_value))
        source_width = float(source_width_curve(source_y_value))
        target_centre = float(target_center_curve(target_y))
        target_width = float(target_width_curve(target_y))
        mapped = [
            (
                target_centre + (start - source_centre) * target_width / max(1.0, source_width),
                target_centre + (end - source_centre) * target_width / max(1.0, source_width),
                start,
                end,
            )
            for start, end, _ in segments
        ]
        # Fill only the intended underarm gaps.  Leave every existing mapped
        # garment segment untouched; overwriting the body segment here creates
        # a false horizontal trim seam at the cuff control.  The central gap
        # of open-front designs remains an untouched source opening.
        row_changed = False
        for index in range(len(mapped) - 1):
            if opening and index not in (0, len(mapped) - 2):
                continue
            target_start = mapped[index][1]
            target_end = mapped[index + 1][0]
            left_source_end = mapped[index][3]
            right_source_start = mapped[index + 1][2]
            if target_end <= target_start:
                continue
            lo = max(0, int(np.floor(target_start)))
            hi = min(W, int(np.ceil(target_end)) + 1)
            if hi <= lo:
                continue
            target_values = np.arange(lo, hi, dtype=np.float32)
            # The source gap is transparent underarm/background, so a direct
            # interpolation would sample transparency and leave the cream arm
            # exposed.  Extend each neighboring garment edge a few source
            # pixels into its half of the gap; this is a segmented warp of
            # existing material, not a painted fill or body fallback.
            left_edge = left_source_end - min(4.0, max(0.0, float(segments[index][2] - 1)))
            right_edge = right_source_start + min(4.0, max(0.0, float(segments[index + 1][2] - 1)))
            midpoint = (target_start + target_end) / 2.0
            source_values = np.where(
                target_values <= midpoint,
                left_edge,
                right_edge,
            )
            source_x[target_y, lo:hi] = source_values
            row_changed = True
        if row_changed:
            changed_rows += 1
    return changed_rows


def source_info(path: Path, image: Image.Image) -> dict[str, object]:
    bbox = alpha_bbox(image)
    return {
        "path": rel(path),
        "sha256": sha256(path),
        "size": list(image.size),
        "alphaBbox": list(bbox or ()),
        "alphaPixels": int(alpha_array(image).sum()),
    }


def target_alpha_landmarks(image: Image.Image) -> dict[str, object]:
    bbox = alpha_bbox(image)
    alpha = alpha_array(image)
    ys, xs = np.where(alpha)
    return {
        "alphaBbox": list(bbox or ()),
        "alphaPixels": int(alpha.sum()),
        "topY": int(ys.min()) if len(ys) else None,
        "bottomY": int(ys.max() + 1) if len(ys) else None,
        "leftAtWristY": int(xs[(ys >= WRIST_Y - 3) & (ys <= WRIST_Y + 3)].min()) if np.any((ys >= WRIST_Y - 3) & (ys <= WRIST_Y + 3)) else None,
        "rightAtWristY": int(xs[(ys >= WRIST_Y - 3) & (ys <= WRIST_Y + 3)].max()) if np.any((ys >= WRIST_Y - 3) & (ys <= WRIST_Y + 3)) else None,
    }


def warp_cloak(source: Image.Image, key: str) -> tuple[Image.Image, dict[str, object]]:
    if key in {"cloak-02", "cloak-07"}:
        return warp_api_short_cloak(source, key)
    plan = CLOAK_PLANS[key]
    source_arr = rgba_array(source)
    bbox = alpha_bbox(source)
    if bbox is None:
        raise ValueError(f"{key}: isolated source has no alpha")
    # Keep the complete isolated crop, including genuine open-front holes.
    cropped = source_arr[bbox[1]:bbox[3], bbox[0]:bbox[2]]
    mask = cropped[:, :, 3] > 10
    sh, _ = mask.shape
    shoulder_row = int(round(plan.shoulder_fraction * (sh - 1)))
    shoulder_centre, shoulder_width, shoulder_used_row = component_envelope(mask, shoulder_row)
    cuff_row = (
        plan.source_cuff_row
        if plan.source_cuff_row is not None
        else find_cuff_row(mask, plan.cuff_fraction, plan.expected_segments)
    )
    cuff_left, cuff_right, cuff_band_rows = cuff_centres(
        mask,
        cuff_row,
        plan.expected_segments,
        plan.source_cuff_centres,
    )
    if cuff_right <= cuff_left:
        raise ValueError(f"{key}: source cuff centres are not ordered")
    hem_row = structural_bottom(mask)
    profile_centres, profile_widths = alpha_row_profile(mask)
    hem_centre, hem_width, hem_used_row = component_envelope(mask, hem_row)
    source_rows = [
        0,
        shoulder_row,
        int(round(float(np.mean(cuff_band_rows)))),
        hem_row,
    ]
    target_rows = [NECK_Y, SHOULDER_Y, plan.target_cuff_y, plan.target_hem_y]
    # The hood's horizontal mapping MUST be the shoulder mapping.  Sampling
    # the one-pixel top alpha envelope and expanding it to a garment width
    # turns the hood into a flat plate.  Reusing the shoulder centre/width
    # keeps the transform smooth while the source Y silhouette remains curved.
    source_centres = [
        shoulder_centre,
        shoulder_centre,
        (cuff_left + cuff_right) / 2.0,
        hem_centre,
    ]
    source_widths = [
        shoulder_width,
        shoulder_width,
        cuff_right - cuff_left,
        hem_width,
    ]
    target_widths = [
        360.0,
        360.0,
        float(plan.target_cuff_x[1] - plan.target_cuff_x[0]),
        float(plan.target_hem_x[1] - plan.target_hem_x[0]),
    ]
    target_centres = [
        512.0,
        512.0,
        (plan.target_cuff_x[0] + plan.target_cuff_x[1]) / 2.0,
        (plan.target_hem_x[0] + plan.target_hem_x[1]) / 2.0,
    ]
    # Use a shape-preserving C1 curve through the structural controls.  In
    # particular, the cuff is a real seam/anchor, not a warp breakpoint: a
    # linear slope reversal there creates an artificial trim kink on cloak-12
    # and similar garments.  PCHIP keeps every anchor exact and leaves the
    # equal hood/shoulder controls perfectly horizontal.
    target_width_curve = PchipInterpolator(target_rows, target_widths)
    target_center_curve = PchipInterpolator(target_rows, target_centres)
    source_center_curve = PchipInterpolator(source_rows, source_centres)
    source_width_curve = PchipInterpolator(source_rows, source_widths)
    source_y_curve = PchipInterpolator(target_rows, source_rows)
    target_profile_rows = np.arange(H, dtype=np.float32)
    target_width_profile = np.asarray(target_width_curve(target_profile_rows), dtype=np.float32)
    target_center_profile = np.asarray(target_center_curve(target_profile_rows), dtype=np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    active = (yy >= target_rows[0]) & (yy <= target_rows[-1])
    src_y = np.zeros((H, W), dtype=np.float32)
    src_x = np.zeros((H, W), dtype=np.float32)
    for index in range(len(target_rows) - 1):
        y0, y1 = target_rows[index], target_rows[index + 1]
        if y1 <= y0:
            raise ValueError(f"{key}: non-monotonic cloak controls")
        region = active & (yy >= y0) & (yy <= y1)
        t = np.clip((yy.astype(np.float32) - y0) / float(y1 - y0), 0.0, 1.0)
        source_y_region = np.asarray(source_y_curve(yy.astype(np.float32)), dtype=np.float32)
        # Shape-preserving curves through the shoulder/cuff controls keep the
        # hood horizontal and the sleeve centers anchored.  Below the cuff,
        # follow the source's real outer-alpha profile instead of interpolating
        # from a narrow cuff-center distance to a broad hem target (which
        # falsely flares a long coat to the canvas edge).
        if index < 2:
            centre = np.asarray(source_center_curve(source_y_region), dtype=np.float32)
            width = np.maximum(
                1.0,
                np.asarray(source_width_curve(source_y_region), dtype=np.float32),
            )
        else:
            profile_row = np.clip(np.rint(source_y_region).astype(np.int32), 0, sh - 1)
            profile_centre = profile_centres[profile_row]
            profile_width = profile_widths[profile_row]
            source_curve_centre = np.asarray(source_center_curve(source_y_region), dtype=np.float32)
            source_curve_width = np.maximum(
                1.0,
                np.asarray(source_width_curve(source_y_region), dtype=np.float32),
            )
            transition = np.clip(
                (source_y_region - (source_rows[index] + 32.0)) / 128.0,
                0.0,
                1.0,
            )
            transition = transition * transition * (3.0 - 2.0 * transition)
            centre = source_curve_centre * (1.0 - transition) + profile_centre * transition
            width = np.maximum(
                1.0,
                source_curve_width * (1.0 - transition) + profile_width * transition,
            )
        target_width = np.broadcast_to(
            target_width_profile[np.clip(yy, 0, H - 1)],
            (H, W),
        )
        target_center = np.broadcast_to(
            target_center_profile[np.clip(yy, 0, H - 1)],
            (H, W),
        )
        src_y[region] = source_y_region[region]
        src_x[region] = (
            centre[region]
            + (
                (xx.astype(np.float32)[region] - target_center[region])
                * width[region]
                / np.maximum(target_width[region], 1.0)
            )
        )
    segmented_rows = close_sleeve_gaps(
        mask,
        source_rows,
        source_centres,
        source_widths,
        target_rows,
        target_centres,
        target_widths,
        src_x,
        src_y,
        plan.opening,
        target_rows[2],
    )
    output = np.zeros((H, W, 4), dtype=np.uint8)
    sampled = premultiplied_sample(cropped, src_x, src_y)
    output[active] = sampled[active]
    alpha_adjustments: list[str] = []
    if key == "cloak-04":
        # The isolated crop retained the dark interior behind this tied
        # front-opening design as opaque alpha.  Remove only that semantic
        # opening below the two closures; no body RGB is inserted.
        for row in range(700, plan.target_hem_y + 1):
            progress = (row - 700) / max(1.0, plan.target_hem_y - 700)
            half_gap = int(round(38 + 14 * progress))
            output[row, 512 - half_gap:512 + half_gap + 1, :] = 0
        alpha_adjustments.append("cloak-04:transparent-center-opening-below-closures")
    # Never retain alpha outside the explicit garment controls; this also
    # removes transparent-border noise from API-isolated product crops.
    output[:NECK_Y] = 0
    output[plan.target_hem_y + 1:] = 0
    image = Image.fromarray(output, mode="RGBA")
    alpha = alpha_array(image)
    landmarks = {
        "method": "piecewise-cloak-control-warp",
        "sourceBbox": list(bbox),
        "sourceControlRows": source_rows,
        "sourceShoulderRowUsed": int(shoulder_used_row),
        "sourceCuffRow": int(cuff_row),
        "sourceCuffSamplingRow": int(source_rows[2]),
        "sourceCuffBandRows": cuff_band_rows,
        "sourceHemRowUsed": int(hem_used_row),
        "sourceControlFractions": [0.0, plan.shoulder_fraction, plan.cuff_fraction, 1.0],
        "targetControlRows": target_rows,
        "structuralBottomRow": int(source_rows[-1]),
        "targetWidths": [int(round(value)) for value in target_widths],
        "targetCentres": [round(value, 2) for value in target_centres],
        "sourceShoulder": [round(shoulder_centre, 2), round(shoulder_width, 2)],
        "sourceCuffCentres": [round(cuff_left, 2), round(cuff_right, 2)],
        "sourceHem": [round(hem_centre, 2), round(hem_width, 2)],
        "collar": [512, NECK_Y],
        "shoulders": [[332, SHOULDER_Y], [692, SHOULDER_Y]],
        "cuffs": [[plan.target_cuff_x[0], plan.target_cuff_y], [plan.target_cuff_x[1], plan.target_cuff_y]],
        "hem": [
            [round(target_centres[-1] - target_widths[-1] / 2.0, 2), plan.target_hem_y],
            [round(target_centres[-1] + target_widths[-1] / 2.0, 2), plan.target_hem_y],
        ],
        "silhouette": plan.name,
        "designOpening": plan.opening,
        "alphaAdjustments": alpha_adjustments,
        "segmentedSleeveWarpRows": segmented_rows,
        "sourcePreserved": True,
    }
    # A visual registration guard, not an acceptance claim: the requested
    # wrist control must actually have alpha near each sleeve endpoint.
    for x in plan.target_cuff_x:
        window = alpha[max(0, plan.target_cuff_y - 8):plan.target_cuff_y + 9, max(0, x - 18):min(W, x + 19)]
        if not window.any():
            raise ValueError(f"{key}: cuff control {x},{plan.target_cuff_y} has no garment alpha")
    if key == "cloak-09":
        landmarks["fitProbes"] = {
            "fabric": [[350, 600], [665, 600], [512, 700]],
            "underlayer": [[319, 750], [710, 750]],
        }
    return image, landmarks


def warp_api_short_cloak(source: Image.Image, key: str) -> tuple[Image.Image, dict[str, object]]:
    """Register real cuff fronts and a continuous torso without arm-window cuts."""
    if key not in {"cloak-02", "cloak-07"} or source.size != CANVAS:
        raise ValueError(f"{key}: expected a canonical API poncho source")
    pixels = rgba_array(source)
    mask = pixels[:, :, 3] > 180
    source_box = alpha_bbox(source)
    if source_box is None:
        raise ValueError(f"{key}: empty poncho source")
    is_brown = key == "cloak-02"
    hem = 1055 if is_brown else 1215
    panel_rows = np.where(mask[:, 512] & (mask.sum(axis=1) > 100))[0]
    if not len(panel_rows):
        raise ValueError(f"{key}: no opaque torso panel")
    source_hem = int(panel_rows[-1])
    target_rows = np.array([415, 485, 560, 620, 650], dtype=float)
    source_rows = np.array([264 if is_brown else 208, 390 if is_brown else 350, 520, 640, 700 if is_brown else 660], dtype=float)
    source_x_controls = np.array([0, 63, 141.5, 220, 512, 804, 882.5, 961, 1023], dtype=float)
    target_x_controls = np.array([
        [300, 305, 315, 330, 512, 680, 710, 740, 760],
        [290, 295, 310, 330, 512, 680, 710, 740, 750],
        [230, 240, 275, 330, 512, 670, 710, 750, 790],
        [200, 230, 285, 350, 512, 650, 700, 750, 800],
        [240, 294, 337, 381, 505.5, 630, 674, 718, 780],
    ], dtype=float)
    sx = np.zeros((H, W), dtype=np.float32)
    sy = np.zeros((H, W), dtype=np.float32)
    active = np.zeros((H, W), dtype=bool)
    xs = np.arange(W, dtype=float)
    for y in range(415, 651):
        controls = np.array([np.interp(y, target_rows, target_x_controls[:, n]) for n in range(9)])
        sx[y] = np.interp(xs, controls, source_x_controls)
        sy[y] = np.interp(y, target_rows, source_rows)
        active[y] = True
    for y in range(651, hem + 1):
        source_y = float(np.interp(y, [651, 750, hem], [source_rows[-1], 900, source_hem]))
        left = float(np.interp(y, [651, hem], [381, 378]))
        right = float(np.interp(y, [651, hem], [630, 646]))
        panel = (xs >= left) & (xs <= right)
        blend = float(np.clip((y - 651) / 80.0, 0.0, 1.0))
        blend = blend * blend * (3.0 - 2.0 * blend)
        inner_left, inner_right = (235, 790) if is_brown else (280, 745)
        source_left = 220 * (1 - blend) + inner_left * blend
        source_right = 804 * (1 - blend) + inner_right * blend
        sx[y, panel] = np.interp(xs[panel], [left, right], [source_left, source_right])
        sy[y] = source_y
        active[y, panel] = True
    sampled = premultiplied_sample(pixels, sx, sy)
    output = np.zeros((H, W, 4), dtype=np.uint8)
    output[active] = sampled[active]
    return Image.fromarray(output), {
        "method": "continuous-poncho-torso-and-cuff-registration",
        "sourceBbox": list(source_box),
        "sourceControlRows": source_rows.tolist(),
        "targetControlRows": target_rows.tolist(),
        "sourceXControls": source_x_controls.tolist(),
        "targetSleeveXControls": target_x_controls.tolist(),
        "cuffFrontHemY": 650,
        "targetCuffCentres": [[337, 650], [674, 650]],
        "targetHemY": hem,
        "sourcePreserved": True,
        "bodyAlphaConsulted": False,
        "bodyRgbCopied": False,
        "alphaAdjustments": [],
        "textureAdjustments": [],
        "fitProbes": {
            "fabric": [[337, 630], [674, 630], [512, 700]],
            "underlayer": [[317, 700], [695, 700]],
        },
    }



def trouser_bands(mask: np.ndarray) -> tuple[tuple[float, float], tuple[float, float]]:
    h, w = mask.shape
    top = mask[int(round(h * 0.025)):max(int(round(h * 0.11)), 1)].sum(axis=0)
    occupied = np.where(top > max(1.0, top.max() * 0.04))[0]
    if len(occupied) < 2:
        raise ValueError("no distinct trouser waistband")
    waist = ((float(occupied[0] + occupied[-1]) / 2.0), float(occupied[-1] - occupied[0] + 1))
    bottom = mask[int(round(h * 0.83)):max(int(round(h * 0.98)), int(round(h * 0.83)) + 1)].sum(axis=0).astype(float)
    midpoint = w // 2
    left_weights = bottom[:midpoint]
    right_weights = bottom[midpoint:]
    if left_weights.sum() <= 0 or right_weights.sum() <= 0:
        raise ValueError("no distinct trouser cuffs")
    left = float(np.average(np.arange(midpoint), weights=left_weights))
    right = float(midpoint + np.average(np.arange(w - midpoint), weights=right_weights))
    if right - left < 10:
        raise ValueError("trouser cuffs are not separated")
    return waist, (left, right)


def register_pants(source: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    bbox = alpha_bbox(source)
    if bbox is None:
        raise ValueError("pants source has no alpha")
    cropped = rgba_array(source)[bbox[1]:bbox[3], bbox[0]:bbox[2]]
    mask = cropped[:, :, 3] > 10
    (waist_mid, waist_width), (left, right) = trouser_bands(mask)
    waist_scale = WAIST_WIDTH / max(1.0, waist_width)
    cuff_scale = (ANKLE_RIGHT - ANKLE_LEFT) / max(1.0, right - left)
    sh, sw = mask.shape
    yy, xx = np.mgrid[HIP_Y:ANKLE_Y, 0:W]
    t = (yy.astype(np.float32) - HIP_Y) / max(1, ANKLE_Y - HIP_Y - 1)
    blend = np.power(t, 0.85)
    scale = waist_scale * (1.0 - blend) + cuff_scale * blend
    source_mid = waist_mid * (1.0 - blend) + ((left + right) / 2.0) * blend
    target_mid = 510.0 * (1.0 - blend) + ((ANKLE_LEFT + ANKLE_RIGHT) / 2.0) * blend
    sx = (xx.astype(np.float32) - target_mid) / np.maximum(scale, 1e-5) + source_mid
    sy = t * max(1, sh - 1)
    fitted = premultiplied_sample(cropped, sx, sy)
    output = np.zeros((H, W, 4), dtype=np.uint8)
    output[HIP_Y:ANKLE_Y] = fitted
    output[output[:, :, 3] < 10] = 0
    image = Image.fromarray(output, mode="RGBA")
    return image, {
        "method": "raw-garment-hip-ankle-registration",
        "sourceBbox": list(bbox),
        "waistY": HIP_Y,
        "ankleY": ANKLE_Y,
        "waistWidth": WAIST_WIDTH,
        "ankleCentres": [ANKLE_LEFT, ANKLE_RIGHT],
        "rawWaist": [waist_mid, waist_width],
        "rawCuffCentres": [left, right],
        "horizontalScale": [waist_scale, cuff_scale],
        "sourcePreserved": True,
    }


def choose_source(category: str, index: int, use_raw_pants: bool = True) -> SourceRecord:
    key = f"{category}-{index:02d}"
    if category == "cloak" and index in (2, 7):
        raw = FIELD_ROOT / "fit-correction-sources" / f"{key}-openai-raw.png"
        if not raw.is_file():
            raise FileNotFoundError(f"corrected poncho source missing: {raw}")
        return SourceRecord(raw, "openai-pose-corrected-poncho")
    if category == "pants" and use_raw_pants and index in (6, 12):
        raw = FIELD_ROOT / "clothing-raw" / f"{key}-raw.png"
        if not raw.is_file():
            raise FileNotFoundError(f"approved trouser source missing: {raw}")
        return SourceRecord(raw, "raw-api-candidate")
    design = FIELD_ROOT / "designs" / f"{key}.webp"
    if not design.is_file():
        raise FileNotFoundError(f"field design source missing: {design}")
    return SourceRecord(design, "isolated-field-master")


def archive_existing(path: Path, archive_dir: Path) -> str | None:
    if not path.exists():
        return None
    archive_dir.mkdir(parents=True, exist_ok=True)
    destination = archive_dir / path.name
    if destination.exists():
        destination = archive_dir / f"{path.stem}-{sha256(path)[:12]}{path.suffix}"
    shutil.copy2(path, destination)
    return rel(destination)


def load_layer(path: Path) -> Image.Image:
    image = load_rgba(path)
    if image.size != CANVAS:
        raise ValueError(f"{path}: expected canonical canvas {CANVAS}, got {image.size}")
    return image


def load_qa_head() -> Image.Image:
    """Apply the exact runtime head placement to the QA canvas."""
    path = ROOT / "assets" / "doll" / "headwear" / "dad-neutral-bare.webp"
    source = load_rgba(path)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    # Headwear sprites intentionally retain their 1024x2304 source canvas.
    # The live rig composites that full canvas at (0, -768); do not recenter
    # a crop, since that moves the neck relative to the fixed body.
    canvas.alpha_composite(source, (0, -768))
    return canvas


def compose(layers: Iterable[Image.Image]) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS, (239, 239, 235, 255))
    for layer in layers:
        canvas.alpha_composite(layer.convert("RGBA"))
    return canvas


def fit_to_cell(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    cell_w, cell_h = size
    image = image.convert("RGBA")
    bbox = alpha_bbox(image)
    if bbox is None:
        return Image.new("RGBA", size, (239, 239, 235, 255))
    crop = image.crop(bbox)
    scale = min((cell_w - 18) / crop.width, (cell_h - 42) / crop.height)
    scaled = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", size, (239, 239, 235, 255))
    cell.alpha_composite(scaled, ((cell_w - scaled.width) // 2, 30 + (cell_h - 30 - scaled.height) // 2))
    return cell


def add_text(image: Image.Image, text: str, xy: tuple[int, int], size: int = 16) -> None:
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", size)
    except OSError:
        font = ImageFont.load_default()
    draw.text(xy, text, fill=(35, 42, 46, 255), font=font)


def qa_body_layers(category: str, garment: Image.Image) -> list[Image.Image]:
    head = load_qa_head()
    upper = load_layer(ROOT / "assets" / "doll" / "rigged" / "body-upper.webp")
    hands = load_layer(ROOT / "assets" / "doll" / "rigged" / "hands-base.webp")
    neck = load_layer(ROOT / "assets" / "doll" / "rigged" / "necks/dad.webp")
    boots = load_layer(ROOT / "assets" / "doll" / "rigged" / "boots.webp")
    if category == "pants":
        # Paid pants are tested with boots only.  Do not include starter-pants,
        # pants-base, legs-under, or any other native pants underlay here.
        return [boots, garment, neck, upper, hands, head]
    starter = load_layer(ROOT / "assets" / "doll" / "rigged" / "starter-pants.webp")
    return [starter, neck, upper, garment, hands, head]


def render_qa(category: str, items: list[str], layers_by_key: dict[str, Image.Image], qa_dir: Path, label: str) -> Path:
    columns = 3 if len(items) > 5 else len(items)
    columns = max(1, columns)
    rows = (len(items) + columns - 1) // columns
    cell = (340, 500)
    sheet = Image.new("RGBA", (columns * cell[0], rows * cell[1]), (239, 239, 235, 255))
    for index, key in enumerate(items):
        garment = layers_by_key[key]
        body = compose(qa_body_layers(category, garment))
        thumbnail = fit_to_cell(body, cell)
        x = (index % columns) * cell[0]
        y = (index // columns) * cell[1]
        sheet.alpha_composite(thumbnail, (x, y))
        add_text(sheet, key, (x + 10, y + 8), 16)
    qa_dir.mkdir(parents=True, exist_ok=True)
    path = qa_dir / f"{label}-{category}.png"
    sheet.convert("RGB").save(path, format="PNG")
    return path


def render_prototype(layers: dict[str, Image.Image], qa_dir: Path) -> Path:
    # Exactly the requested five non-empty prototype cells: three cloaks and
    # two trousers.  Pants use the boots-only composition above.
    items = [("cloak", "cloak-01"), ("cloak", "cloak-06"), ("cloak", "cloak-12"), ("pants", "pants-06"), ("pants", "pants-12")]
    cell = (350, 570)
    sheet = Image.new("RGBA", (cell[0] * len(items), cell[1]), (239, 239, 235, 255))
    for index, (category, key) in enumerate(items):
        body = compose(qa_body_layers(category, layers[key]))
        thumb = fit_to_cell(body, cell)
        x = index * cell[0]
        sheet.alpha_composite(thumb, (x, 0))
        add_text(sheet, key, (x + 10, 8), 16)
    qa_dir.mkdir(parents=True, exist_ok=True)
    path = qa_dir / "field-clothing-prototype.png"
    sheet.convert("RGB").save(path, format="PNG")
    return path


def item_ids(category: str, requested: list[str] | None) -> list[str]:
    available = {"cloak": CLOAK_IDS, "vest": VEST_IDS, "pants": PANTS_IDS}[category]
    if not requested:
        return list(available)
    result = []
    for value in requested:
        key = value if "-" in value else f"{category}-{int(value):02d}"
        if key not in available:
            raise ValueError(f"{key}: not a {category} id")
        if key not in result:
            result.append(key)
    return result


def process_item(category: str, key: str, out_dir: Path, archive_dir: Path, use_raw_pants: bool) -> tuple[Image.Image, dict[str, object]]:
    index = int(key.rsplit("-", 1)[1])
    source = choose_source(category, index, use_raw_pants)
    source_image = load_rgba(source.path)
    if category == "cloak":
        registered, registration = warp_cloak(source_image, key)
    elif category == "vest":
        registered, registration = _VESTS.fit_vest(source_image, index)
    else:
        registered, registration = register_pants(source_image)
    output_path = out_dir / f"{key}.webp"
    archive_path = archive_existing(output_path, archive_dir)
    output_hash = write_lossless(registered, output_path)
    validation = target_alpha_landmarks(registered)
    if category == "cloak":
        plan = CLOAK_PLANS[key]
        cuff_windows = []
        alpha = alpha_array(registered)
        cuffs = registration.get("targetCuffCentres") or registration["cuffs"]
        for x, y in cuffs:
            x, y = int(round(x)), int(round(y))
            window = alpha[max(0, y - 8):y + 9, max(0, x - 18):min(W, x + 19)]
            cuff_windows.append(bool(window.any()))
        center_window = alpha[SHOULDER_Y + 80:max(SHOULDER_Y + 81, plan.target_hem_y - 5), 480:545]
        opening_fraction = float((~center_window).mean()) if plan.opening else None
        validation.update({
            "collarY": NECK_Y,
            "shoulderY": SHOULDER_Y,
            "cuffY": cuffs[0][1],
            "cuffCentres": cuffs,
            "cuffWindowsPresent": cuff_windows,
            "openingCenterTransparent": bool((not plan.opening) or opening_fraction >= 0.08),
            "openingCenterTransparentFraction": opening_fraction,
        })
    elif category == "pants":
        validation.update({
            "hipY": HIP_Y,
            "ankleY": ANKLE_Y,
            "ankleCentres": [ANKLE_LEFT, ANKLE_RIGHT],
            "basePantsUnderlay": False,
        })
    else:
        validation.update({
            "collarY": registration["neckAnchor"][1],
            "torsoHemY": registration["targetHemY"],
        })
    record = {
        "key": key,
        "category": category,
        "source": {**source_info(source.path, source_image), "kind": source.kind},
        "output": {"path": rel(output_path), "sha256": output_hash, "size": list(registered.size)},
        "registration": registration,
        "validation": validation,
        "archiveOfPreviousOutput": archive_path,
        "review": "pending-visual-review",
    }
    return registered, record


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", choices=("cloak", "vest", "pants", "all"), default="all")
    parser.add_argument("--items", help="comma-separated ids or numbers; category must be singular")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--qa-dir", type=Path, default=DEFAULT_QA)
    parser.add_argument("--prototype", action="store_true", help="register cloak 01/06/12 and pants 06/12 only")
    parser.add_argument("--no-raw-pants", action="store_true", help="use isolated field masters for pants 06/12 instead of raw candidates")
    parser.add_argument("--review", choices=("passed", "failed"), help="record completed visual review without regenerating")
    parser.add_argument("--review-note", help="specific visual review evidence")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    out_dir = args.output_dir.expanduser()
    qa_dir = args.qa_dir.expanduser()
    archive_dir = FIELD_ROOT / "registration-archive"
    out_dir.mkdir(parents=True, exist_ok=True)
    if args.prototype:
        jobs = [("cloak", key) for key in ("cloak-01", "cloak-06", "cloak-12")] + [("pants", key) for key in ("pants-06", "pants-12")]
    elif args.category == "all":
        if args.items:
            raise SystemExit("--items requires a singular --category")
        jobs = [(category, key) for category in ("cloak", "vest", "pants") for key in item_ids(category, None)]
    else:
        requested = [value.strip() for value in args.items.split(",") if value.strip()] if args.items else None
        jobs = [(args.category, key) for key in item_ids(args.category, requested)]
    if args.review:
        if not args.review_note:
            raise ValueError("--review-note is required with --review")
        path = out_dir / "manifest.json"
        manifest = json.loads(path.read_text(encoding="utf-8"))
        for _, key in jobs:
            record = manifest["items"][key]
            if args.review == "passed":
                if sha256(out_dir / f"{key}.webp") != record["output"]["sha256"]:
                    raise ValueError(f"{key}: review raster has changed")
                if sha256(ROOT / record["source"]["path"]) != record["source"]["sha256"]:
                    raise ValueError(f"{key}: source provenance has changed")
            record["review"] = f"visual-review-{args.review}"
            record["reviewNote"] = args.review_note
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Recorded {args.review} visual review for {len(jobs)} garments")
        return 0
    layers: dict[str, Image.Image] = {}
    records: dict[str, dict[str, object]] = {}
    for category, key in jobs:
        layer, record = process_item(category, key, out_dir, archive_dir, not args.no_raw_pants)
        layers[key] = layer
        records[key] = record
    # Keep each output's registration receipt alongside the candidate layers;
    # no category sheet has blank cells because every requested id is rendered.
    qa: dict[str, str] = {}
    for category in ("cloak", "vest", "pants"):
        category_items = [key for job_category, key in jobs if job_category == category]
        if category_items:
            qa[category] = rel(render_qa(category, category_items, layers, qa_dir, "field-release"))
    if args.prototype:
        qa["prototype"] = rel(render_prototype(layers, qa_dir))
    prior_items: dict[str, dict[str, object]] = {}
    prior_qa: dict[str, str] = {}
    if (out_dir / "manifest.json").is_file():
        try:
            prior_manifest = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
        except (OSError, ValueError):
            prior_manifest = {}
        if isinstance(prior_manifest, dict):
            if isinstance(prior_manifest.get("items"), dict):
                prior_items = {
                    str(key): value
                    for key, value in prior_manifest["items"].items()
                    if isinstance(value, dict)
                }
            if isinstance(prior_manifest.get("qa"), dict):
                prior_qa = {
                    str(key): str(value)
                    for key, value in prior_manifest["qa"].items()
                }
    all_items = {**prior_items, **records}
    all_qa = {**prior_qa, **qa}
    manifest = {
        "schema": "field-rigged-clothing-v1",
        "canvas": list(CANVAS),
        "sourceRoot": rel(FIELD_ROOT),
        "outputRoot": rel(out_dir),
        "canonicalBody": {
            "bodyUpper": rel(ROOT / "assets" / "doll" / "rigged" / "body-upper.webp"),
            "handsBase": rel(ROOT / "assets" / "doll" / "rigged" / "hands-base.webp"),
            "qaHead": rel(ROOT / "assets" / "doll" / "headwear" / "dad-neutral-bare.webp"),
            "qaHeadOffset": [0, -768],
        },
        "landmarks": {
            "neckY": NECK_Y,
            "shoulderY": SHOULDER_Y,
            "wristY": WRIST_Y,
            "hipY": HIP_Y,
            "ankleY": ANKLE_Y,
            "ankleCentres": [ANKLE_LEFT, ANKLE_RIGHT],
        },
        "apiCalls": 0,
        "items": {key: all_items[key] for key in sorted(all_items)},
        "qa": all_qa,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": rel(out_dir), "items": list(records), "qa": qa}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
