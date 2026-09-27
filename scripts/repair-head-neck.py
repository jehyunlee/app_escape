#!/usr/bin/env python3
"""Recover six characters' anatomical head/neck parts from intact source art.

This is a deterministic registration and alpha-partition pass.  It does not
call an image model, paint replacement anatomy, use mannequin RGB differences,
or write runtime assets.  The intact OpenAI full figures remain the only owner
of face, jaw, hair, and neck colour.  The canonical rig remains the only owner
of the shirt and body.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / "scripts" / "art-sources" / "doll-reference"
RIG = ROOT / "assets" / "doll" / "rigged"
DEFAULT_OUTPUT = ROOT / "scripts" / "art-sources" / "neck-repair"
DEFAULT_QA = Path("/tmp/paper-doll-qa/neck-repair-prototypes.png")

WIDTH = 1024
HEIGHT = 1536
HEAD_PAD = 768
HEAD_CANVAS = (WIDTH, HEIGHT + HEAD_PAD)
BODY_CANVAS = (WIDTH, HEIGHT)

# This polygon follows the canonical collar's inner edge and the complete
# mannequin chin/neck stub.  Clearing it changes no pixel outside the joint.
BODY_NECK_REMOVAL = (
    (444, 386),
    (580, 386),
    (580, 414),
    (568, 424),
    (558, 444),
    (556, 452),
    (562, 458),
    (568, 462),
    (570, 468),
    (565, 475),
    (558, 481),
    (548, 488),
    (530, 493),
    (492, 493),
    (475, 490),
    (460, 486),
    (450, 480),
    (444, 475),
    (440, 470),
    (441, 465),
    (449, 460),
    (453, 457),
    (457, 452),
    (454, 445),
    (454, 424),
    (444, 414),
)

TARGET_COLLAR_ANCHORS = ((449, 460), (511, 492), (563, 460))





@dataclass(frozen=True)
class CharacterSpec:
    name: str
    # Source-space points on the actual skin/shirt contact, left/centre/right.
    collar_anchors: tuple[tuple[int, int], ...]
    # Source-space points tracing the mandibular curve.  These are recorded
    # anatomical anchors, not alpha-bounding-box measurements.
    jaw_curve: tuple[tuple[int, int], ...]
    # Hidden anatomical seam where the neck passes behind the complete jaw.
    # Keeping this inside the mandible leaves outer jaw skin and hair in head.
    neck_seam_curve: tuple[tuple[int, int], ...]
    # Regions whose source alpha may belong to head/jaw/hair.  Neck ownership
    # is unioned separately; these regions never extend into the source shirt.
    anatomy_regions: tuple[tuple[tuple[int, int], ...], ...]
    # Polygon below the jaw and above the collar.  Its intersection with the
    # anatomy mask is the neck owner; all remaining anatomy belongs to head.
    neck_owner_region: tuple[tuple[int, int], ...]
    # Interior source skin used when the collar-contact registration needs
    # more coverage than the rigid source silhouette supplies.
    skin_sample_region: tuple[tuple[int, int], ...]


SPECS = (
    CharacterSpec(
        name="dad",
        collar_anchors=((449, 430), (511, 463), (573, 430)),
        jaw_curve=((451, 393), (465, 402), (485, 410), (512, 414), (540, 410), (559, 403), (573, 393)),
        neck_seam_curve=((470, 403), (490, 413), (512, 416), (535, 412), (554, 403)),
        anatomy_regions=(
            ((0, 0), (1023, 0), (1023, 416), (0, 416)),
        ),
        neck_owner_region=(
            (485, 408), (539, 408), (539, 450), (485, 450),
        ),
        skin_sample_region=(
            (485, 408), (539, 408), (539, 450), (485, 450),
        ),
    ),
    CharacterSpec(
        name="mom",
        collar_anchors=((449, 420), (512, 452), (575, 420)),
        jaw_curve=((463, 353), (474, 370), (492, 382), (512, 389), (532, 382), (550, 370), (563, 351)),
        neck_seam_curve=((475, 365), (490, 382), (512, 391), (534, 382), (549, 365)),
        anatomy_regions=(
            ((0, 0), (1023, 0), (1023, 401), (0, 401)),
            # Preserve the full lower curls instead of applying a rectangular
            # head crop.  The contours stop above the shirt shoulders.
            ((276, 300), (470, 300), (463, 382), (450, 402), (430, 414), (405, 425), (370, 432), (330, 435), (296, 425), (276, 405)),
            ((554, 300), (750, 300), (750, 405), (728, 423), (680, 432), (628, 429), (600, 410), (568, 398)),
        ),
        neck_owner_region=(
            (485, 385), (539, 385), (539, 440), (485, 440),
        ),
        skin_sample_region=(
            (485, 385), (539, 385), (539, 440), (485, 440),
        ),
    ),
    CharacterSpec(
        name="hunho",
        collar_anchors=((449, 387), (511, 419), (575, 387)),
        jaw_curve=((443, 337), (465, 352), (490, 361), (511, 365), (534, 361), (553, 351), (575, 334)),
        neck_seam_curve=((470, 345), (490, 356), (511, 361), (533, 356), (550, 345)),
        anatomy_regions=(
            ((0, 0), (1023, 0), (1023, 374), (0, 374)),
            ((425, 320), (599, 320), (590, 350), (570, 370), (548, 384), (530, 390), (492, 390), (474, 384), (452, 370), (434, 350)),
            ((390, 320), (465, 320), (460, 370), (448, 382), (430, 386), (408, 378)),
            ((559, 320), (634, 320), (616, 378), (594, 386), (576, 382), (564, 370)),
        ),
        neck_owner_region=(
            (485, 370), (539, 370), (539, 410), (485, 410),
        ),
        skin_sample_region=(
            (485, 370), (539, 370), (539, 410), (485, 410),
        ),
    ),
)


EXTRA_PROFILES = DEFAULT_OUTPUT / "extra-profiles.json"
extra_profiles = json.loads(EXTRA_PROFILES.read_text(encoding="utf-8"))
SPECS = SPECS + tuple(
    CharacterSpec(**extra_profiles[name]) for name in ("jeongan", "suan", "yewon")
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def rgba(path: Path, expected_size: tuple[int, int] = BODY_CANVAS) -> np.ndarray:
    image = Image.open(path).convert("RGBA")
    if image.size != expected_size:
        raise ValueError(f"{path}: expected {expected_size}, got {image.size}")
    return np.asarray(image).copy()


def polygon_mask(regions: Iterable[Iterable[tuple[int, int]]]) -> np.ndarray:
    image = Image.new("L", BODY_CANVAS, 0)
    draw = ImageDraw.Draw(image)
    for points in regions:
        draw.polygon(tuple(points), fill=255)
    return np.asarray(image) > 0


def save_rgba(array: np.ndarray, path: Path) -> None:
    clean = np.asarray(array, dtype=np.uint8).copy()
    clean[clean[:, :, 3] == 0] = 0
    Image.fromarray(clean, "RGBA").save(path, format="PNG", optimize=True)


def save_mask(mask: np.ndarray, path: Path) -> None:
    Image.fromarray(mask.astype(np.uint8) * 255, "L").save(path, format="PNG", optimize=True)


def translate(array: np.ndarray, dx: int, dy: int) -> np.ndarray:
    """Integer translation with no interpolation or colour replacement."""
    result = np.zeros_like(array)
    source_x0 = max(0, -dx)
    source_y0 = max(0, -dy)
    source_x1 = min(WIDTH, WIDTH - dx)
    source_y1 = min(HEIGHT, HEIGHT - dy)
    target_x0 = source_x0 + dx
    target_y0 = source_y0 + dy
    target_x1 = source_x1 + dx
    target_y1 = source_y1 + dy
    result[target_y0:target_y1, target_x0:target_x1] = array[source_y0:source_y1, source_x0:source_x1]
    return result


def register_neck_contact(
    source_neck: np.ndarray,
    jaw_curve: Iterable[tuple[int, int]],
    body_removal: np.ndarray,
    dx: int,
    dy: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Continuously fit source neck skin into the actual canonical shirt opening.

    The upper silhouette stays source-authored. Only the lower joint widens
    smoothly into the removed native-neck region. No skin is added to the
    background and no source collar or arbitrary backing triangle is painted.
    """
    rigid = translate(source_neck, dx, dy)
    original_body = rgba(DEFAULT_OUTPUT / "before/body-upper.webp")
    body_alpha = original_body[:, :, 3]
    opening = body_removal & (body_alpha > 0)
    source_opaque = rigid[:, :, 3] >= 200
    valid_rows = np.where(source_opaque.any(axis=1))[0]
    if not len(valid_rows):
        raise ValueError("source neck has no opaque skin")
    jaw_bottom = max(y + dy for x, y in jaw_curve)
    start_y = max(int(valid_rows[0]), int(jaw_bottom) + 2)
    contact_y = 458
    end_y = int(np.where(opening.any(axis=1))[0][-1])
    neck = rigid.copy()
    for y in range(start_y, end_y + 1):
        target_columns = np.where(opening[y])[0]
        if not len(target_columns):
            continue
        source_y = int(valid_rows[np.argmin(np.abs(valid_rows - y))])
        source_columns = np.where(source_opaque[source_y])[0]
        t = float(np.clip((y - start_y) / max(1, contact_y - start_y), 0, 1))
        t = t * t * (3 - 2*t)
        left = int(round((1-t)*source_columns[0] + t*target_columns[0]))
        right = int(round((1-t)*source_columns[-1] + t*target_columns[-1]))
        columns = np.arange(left, right + 1)
        if y >= 448:
            columns = columns[body_alpha[y, columns] > 0]
        if y >= contact_y:
            columns = target_columns
        if not len(columns):
            continue
        sample_indices = np.rint(np.linspace(0, len(source_columns)-1, len(columns))).astype(int)
        neck[y] = 0
        neck[y, columns] = rigid[source_y, source_columns[sample_indices]]
        if y >= contact_y:
            neck[y, columns, 3] = np.minimum(neck[y, columns, 3], body_alpha[y, columns])
    neck[end_y + 1:] = 0
    required = opening & (np.arange(HEIGHT)[:, None] >= contact_y) & (body_alpha >= 200)
    if np.any(required & (neck[:, :, 3] < 200)):
        raise AssertionError("a removed visible collar-contact pixel remains uncovered")
    return neck, neck[:, :, 3] > 0, required



def alpha_over(bottom: np.ndarray, top: np.ndarray) -> np.ndarray:
    base = Image.fromarray(bottom, "RGBA")
    base.alpha_composite(Image.fromarray(top, "RGBA"))
    return np.asarray(base).copy()


def layer_from_source(source: np.ndarray, owner: np.ndarray) -> np.ndarray:
    result = source.copy()
    result[:, :, 3] = np.where(owner, source[:, :, 3], 0)
    result[result[:, :, 3] == 0] = 0
    return result


def source_neck_owner(source: np.ndarray, spec: CharacterSpec) -> np.ndarray:
    """Trace the neck's outer skin contour, keeping every pixel inside it.

    Colour only locates the skin/cream-shirt boundary in this small known neck
    region. Unlike legacy extraction, no mannequin difference or per-pixel
    skin-colour deletion is applied to the face, jaw, or interior neck shading.
    """
    rgb = source[:, :, :3].astype(np.int16)
    x0 = max(0, min(x for x, _ in spec.collar_anchors) - 16)
    x1 = min(WIDTH, max(x for x, _ in spec.collar_anchors) + 17)
    centre = spec.collar_anchors[1][0]
    y0 = min(y for _, y in spec.neck_seam_curve)
    y1 = max(y for _, y in spec.collar_anchors) + 1
    seam = np.asarray(spec.neck_seam_curve, dtype=float)
    if np.any(np.diff(seam[:, 0]) < 0):
        raise ValueError(f"{spec.name}: neck seam must run left to right")
    seam_x = np.unique(seam[:, 0])
    seam_y = np.array([seam[seam[:, 0] == x, 1].max() for x in seam_x])
    boundary = np.interp(np.arange(WIDTH), seam_x, seam_y)
    below_seam = np.arange(HEIGHT)[:, None] >= boundary[None, :]
    owner = np.zeros((HEIGHT, WIDTH), dtype=bool)
    for y in range(y0, y1):
        row = rgb[y, x0:x1]
        candidates = np.where(
            (source[y, x0:x1, 3] > 180)
            & (row[:, 0] > 150)
            & (row[:, 0] - row[:, 1] > 32)
        )[0] + x0
        if not len(candidates):
            continue
        runs = np.split(candidates, np.where(np.diff(candidates) > 1)[0] + 1)
        central = [run for run in runs if len(run) >= 10 and run[0] - 3 <= centre <= run[-1] + 3]
        if not central:
            continue
        run = max(central, key=len)
        owner[y, run[0]:run[-1] + 1] = True
    return owner & below_seam & (source[:, :, 3] > 0)


def registered_translation(spec: CharacterSpec) -> tuple[int, int]:
    source = np.asarray(spec.collar_anchors, dtype=np.int32)
    target = np.asarray(TARGET_COLLAR_ANCHORS, dtype=np.int32)
    delta = np.median(target - source, axis=0)
    return int(round(float(delta[0]))), int(round(float(delta[1])))


def pad_head(head: np.ndarray) -> np.ndarray:
    result = np.zeros((HEAD_CANVAS[1], HEAD_CANVAS[0], 4), dtype=np.uint8)
    result[HEAD_PAD:HEAD_PAD + HEIGHT] = head
    return result


def displayed_head(padded_head: np.ndarray) -> np.ndarray:
    return padded_head[HEAD_PAD:HEAD_PAD + HEIGHT].copy()


def compose_runtime(
    pants: np.ndarray,
    hands: np.ndarray,
    neck: np.ndarray,
    body: np.ndarray,
    head: np.ndarray,
) -> np.ndarray:
    # Proposed ownership order: neck is behind canonical shirt and all future
    # clothing/jewellery; the partitioned face/hair owner is last.
    result = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
    for layer in (pants, neck, body, hands, head):
        result = alpha_over(result, layer)
    return result


def colour_preservation(source: np.ndarray, output: np.ndarray, dx: int, dy: int) -> dict[str, int]:
    restored = translate(output, -dx, -dy)
    visible = restored[:, :, 3] > 0
    if not np.any(visible):
        return {"ownedPixels": 0, "changedOwnedRgbPixels": 0, "maxOwnedRgbDelta": 0}
    delta = np.abs(restored[:, :, :3].astype(np.int16) - source[:, :, :3].astype(np.int16))
    changed = np.any(delta > 0, axis=2) & visible
    return {
        "ownedPixels": int(np.count_nonzero(visible)),
        "changedOwnedRgbPixels": int(np.count_nonzero(changed)),
        "maxOwnedRgbDelta": int(delta[visible].max()),
    }


def source_palette_preservation(source: np.ndarray, source_owner: np.ndarray, output: np.ndarray) -> dict[str, int]:
    """Prove that registration reused source RGB triplets without recolouring."""
    source_rgb = source[:, :, :3][source_owner & (source[:, :, 3] > 0)]
    output_visible = output[:, :, 3] > 0
    output_rgb = output[:, :, :3][output_visible]
    source_codes = set(
        (source_rgb[:, 0].astype(np.uint32) << 16)
        | (source_rgb[:, 1].astype(np.uint32) << 8)
        | source_rgb[:, 2].astype(np.uint32)
    )
    output_codes = (
        (output_rgb[:, 0].astype(np.uint32) << 16)
        | (output_rgb[:, 1].astype(np.uint32) << 8)
        | output_rgb[:, 2].astype(np.uint32)
    )
    novel = sum(int(code) not in source_codes for code in output_codes)
    return {
        "ownedPixels": int(len(output_rgb)),
        "novelRgbPixels": int(novel),
        "sourceOwnedRgbPaletteSize": int(len(source_codes)),
    }


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    names = ("DejaVuSans-Bold.ttf", "Arial Bold.ttf") if bold else ("DejaVuSans.ttf", "Arial.ttf")
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def on_background(image: np.ndarray, colour: str) -> Image.Image:
    background = Image.new("RGBA", BODY_CANVAS, colour)
    background.alpha_composite(Image.fromarray(image, "RGBA"))
    return background.convert("RGB")


def fit_crop(image: Image.Image, box: tuple[int, int, int, int], size: tuple[int, int]) -> Image.Image:
    crop = image.crop(box)
    crop.thumbnail(size, Image.Resampling.LANCZOS)
    panel = Image.new("RGB", size, image.getpixel((0, 0)))
    panel.paste(crop, ((size[0] - crop.width) // 2, (size[1] - crop.height) // 2))
    return panel


def make_qa(records: list[dict], qa_path: Path) -> None:
    panel_w = 470
    panel_h = 285
    full_w = 310
    gutter = 24
    header = 88
    row_h = 410
    width = gutter * 5 + panel_w * 3 + full_w
    height = header + row_h * len(records) + gutter
    sheet = Image.new("RGB", (width, height), "#17242c")
    draw = ImageDraw.Draw(sheet)
    draw.text((gutter, 18), "Head / neck ownership recovery — neutral bare prototypes", font=font(30, True), fill="#ffffff")
    draw.text((gutter, 55), "BEFORE: legacy flat attachment   AFTER: intact source jaw + one neck owner + canonical shirt", font=font(18), fill="#bcd0d8")

    for row, record in enumerate(records):
        y0 = header + row * row_h
        label_y = y0 + 3
        content_y = y0 + 42
        before = record["beforeComposite"]
        after = record["afterComposite"]
        dark_before = on_background(before, "#20313a")
        dark_after = on_background(after, "#20313a")
        light_after = on_background(after, "#eee9df")
        crop_box = (278, 285, 746, 575)
        panels = (
            fit_crop(dark_before, crop_box, (panel_w, panel_h)),
            fit_crop(dark_after, crop_box, (panel_w, panel_h)),
            fit_crop(light_after, crop_box, (panel_w, panel_h)),
        )
        x_positions = (gutter, gutter * 2 + panel_w, gutter * 3 + panel_w * 2)
        labels = ("BEFORE · dark", "AFTER · dark", "AFTER · light")
        draw.text((gutter, label_y), record["character"].upper(), font=font(25, True), fill="#ffd37a")
        dx, dy = record["translation"]
        anchor_text = f"collar-anchor translation ({dx:+d}, {dy:+d}); jaw curve retained"
        draw.text((gutter + 125, label_y + 3), anchor_text, font=font(17), fill="#d2dde1")
        for x, label, panel in zip(x_positions, labels, panels):
            sheet.paste(panel, (x, content_y))
            draw.text((x + 10, content_y + 8), label, font=font(17, True), fill="#ffffff", stroke_width=2, stroke_fill="#142027")

        full_x = gutter * 4 + panel_w * 3
        full = on_background(after, "#e7e2d8")
        full_panel = fit_crop(full, (190, 20, 835, 1520), (full_w, panel_h + 72))
        sheet.paste(full_panel, (full_x, content_y))
        draw.text((full_x + 10, content_y + 8), "AFTER · full figure", font=font(17, True), fill="#17242c", stroke_width=2, stroke_fill="#ffffff")
        draw.line((gutter, y0 + row_h - 12, width - gutter, y0 + row_h - 12), fill="#38505b", width=1)

    qa_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(qa_path, format="PNG", optimize=True)


def build(output: Path, qa_path: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)

    body_source_path = DEFAULT_OUTPUT / "before/body-upper.webp"
    body_source = rgba(body_source_path)
    body_removal = polygon_mask((BODY_NECK_REMOVAL,))
    body_candidate = body_source.copy()
    body_candidate[body_removal] = 0
    body_path = output / "body-shirt-only.png"
    body_mask_path = output / "body-neck-removal-mask.png"
    save_rgba(body_candidate, body_path)
    save_mask(body_removal, body_mask_path)

    changed = np.any(body_candidate != body_source, axis=2)
    outside_changed = changed & ~body_removal
    if np.any(outside_changed):
        raise AssertionError("body changed outside the declared neck joint")

    pants = rgba(RIG / "starter-pants.webp")
    hands = rgba(RIG / "hands-base.webp")
    records: list[dict] = []
    prototypes: dict[str, dict] = {}

    for spec in SPECS:
        source_path = REFERENCE / f"{spec.name}-neutral-full.png"
        current_path = DEFAULT_OUTPUT / "before" / f"{spec.name}-neutral-bare.webp"
        source = rgba(source_path)
        current_padded = rgba(current_path, HEAD_CANVAS)
        current_head = displayed_head(current_padded)
        dx, dy = registered_translation(spec)

        source_alpha = source[:, :, 3] > 0
        head_geometry = polygon_mask(spec.anatomy_regions)
        colour = source[:, :, :3].astype(np.int16)
        source_shirt = (
            (np.arange(HEIGHT)[:, None] >= min(y for _, y in spec.collar_anchors) - 8)
            & (colour[:, :, 0] > 165)
            & (colour[:, :, 1] > 150)
            & (colour[:, :, 0] - colour[:, :, 1] < 28)
        )
        head_geometry &= ~source_shirt
        neck_geometry = source_neck_owner(source, spec)
        skin_samples = polygon_mask((spec.skin_sample_region,)) & source_alpha
        neck_owner = neck_geometry & source_alpha
        anatomy = (head_geometry | neck_owner) & source_alpha
        head_owner = anatomy & ~neck_owner
        if np.any(head_owner & neck_owner):
            raise AssertionError(f"{spec.name}: owner masks overlap")
        if not np.array_equal(head_owner | neck_owner, anatomy):
            raise AssertionError(f"{spec.name}: owner masks do not reconstruct anatomy")

        source_head = layer_from_source(source, head_owner)
        source_neck = layer_from_source(source, neck_owner)
        head = translate(source_head, dx, dy)
        neck, registered_neck_owner, required_contact = register_neck_contact(
            source_neck,
            spec.jaw_curve,
            body_removal,
            dx,
            dy,
        )
        padded_head = pad_head(head)

        head_path = output / f"{spec.name}-neutral-head-front.png"
        neck_path = output / f"{spec.name}-neck.png"
        anatomy_mask_path = output / f"{spec.name}-anatomy-mask.png"
        head_mask_path = output / f"{spec.name}-head-owner-mask.png"
        source_neck_mask_path = output / f"{spec.name}-source-neck-mask.png"
        skin_sample_mask_path = output / f"{spec.name}-skin-sample-mask.png"
        neck_mask_path = output / f"{spec.name}-neck-owner-mask.png"
        contact_mask_path = output / f"{spec.name}-collar-contact-mask.png"
        save_rgba(padded_head, head_path)
        save_rgba(neck, neck_path)
        save_mask(anatomy, anatomy_mask_path)
        save_mask(head_owner, head_mask_path)
        save_mask(neck_owner, source_neck_mask_path)
        save_mask(skin_samples, skin_sample_mask_path)
        save_mask(registered_neck_owner, neck_mask_path)
        save_mask(required_contact, contact_mask_path)

        after = compose_runtime(pants, hands, neck, body_candidate, head)
        before = compose_runtime(pants, hands, np.zeros_like(neck), body_source, current_head)
        preview_path = output / f"{spec.name}-neutral-composite.png"
        save_rgba(after, preview_path)

        reconstruction = alpha_over(source_neck, source_head)
        expected = layer_from_source(source, anatomy)
        reconstruction_mismatch = int(np.count_nonzero(np.any(reconstruction != expected, axis=2)))
        if reconstruction_mismatch:
            raise AssertionError(f"{spec.name}: source owner partition changed {reconstruction_mismatch} pixels")

        source_collar = np.asarray(spec.collar_anchors, dtype=np.int32)
        registered_collar = source_collar + np.asarray((dx, dy), dtype=np.int32)
        source_jaw = np.asarray(spec.jaw_curve, dtype=np.int32)
        registered_jaw = source_jaw + np.asarray((dx, dy), dtype=np.int32)
        source_neck_seam = np.asarray(spec.neck_seam_curve, dtype=np.int32)
        registered_neck_seam = source_neck_seam + np.asarray((dx, dy), dtype=np.int32)
        head_colour = colour_preservation(source, head, dx, dy)
        neck_colour = source_palette_preservation(source, neck_owner | skin_samples, neck)
        if head_colour["changedOwnedRgbPixels"] or neck_colour["novelRgbPixels"]:
            raise AssertionError(f"{spec.name}: registration introduced non-source RGB pixels")

        files = {
            "headFront": head_path,
            "neck": neck_path,
            "composite": preview_path,
            "anatomyMask": anatomy_mask_path,
            "headOwnerMask": head_mask_path,
            "sourceNeckMask": source_neck_mask_path,
            "skinSampleMask": skin_sample_mask_path,
            "neckOwnerMask": neck_mask_path,
            "collarContactMask": contact_mask_path,
        }
        prototypes[spec.name] = {
            "scope": "neutral bare-head prototype only",
            "sources": {
                "intactFull": {"path": relative(source_path), "sha256": sha256(source_path)},
                "legacyCurrentHead": {"path": relative(current_path), "sha256": sha256(current_path)},
            },
            "anchors": {
                "sourceCollarLeftCentreRight": source_collar.tolist(),
                "targetCanonicalCollarLeftCentreRight": [list(point) for point in TARGET_COLLAR_ANCHORS],
                "registeredCollarLeftCentreRight": registered_collar.tolist(),
                "sourceJawCurve": source_jaw.tolist(),
                "registeredJawCurve": registered_jaw.tolist(),
                "sourceNeckBehindJawSeam": source_neck_seam.tolist(),
                "registeredNeckBehindJawSeam": registered_neck_seam.tolist(),
            },
            "registration": {
                "kind": "integer rigid head registration plus anatomical collar-contact extension from the registered source neck",
                "translation": [dx, dy],
                "usesAlphaBoundingBox": False,
                "usesMannequinRgbDifference": False,
                "interpolation": "none; uncovered collar-contact pixels reuse the exact RGBA of the nearest opaque pixel in the registered source-neck owner",
            },
            "ownership": {
                "headFront": "intact source face, complete jaw, identity features, glasses/antlers, and all retained hair; renders above clothing/jewellery",
                "neck": "rigid intact-source interior plus exact source-pixel reuse inside the anatomical collar-contact mask; one mood-invariant owner; renders below shirt/clothing/jewellery",
                "sourceShirt": "unowned and excluded by the recorded anatomical mask",
            },
            "structuralEvidence": {
                "ownerPartitionMismatchPixels": reconstruction_mismatch,
                "headColourPreservation": head_colour,
                "neckColourPreservation": neck_colour,
                "requiredCollarContactPixels": int(np.count_nonzero(required_contact)),
                "uncoveredCollarContactPixels": int(np.count_nonzero(required_contact & (neck[:, :, 3] < 200))),
            },
            "outputs": {
                role: {"path": relative(path), "sha256": sha256(path)}
                for role, path in files.items()
            },
        }
        records.append({
            "character": spec.name,
            "translation": (dx, dy),
            "beforeComposite": before,
            "afterComposite": after,
        })

    make_qa(records, qa_path)

    body_changed_rows, body_changed_columns = np.where(changed)
    manifest = {
        "schemaVersion": 1,
        "repairScriptSha256": sha256(Path(__file__)),
        "profilesSha256": sha256(EXTRA_PROFILES),
        "status": "prototype-awaiting-parent-and-architect-visual-review",
        "scope": {
            "included": [f"{spec.name} neutral bare" for spec in SPECS],
            "excluded": ["happy/sad expression patches", "all hats", "runtime/public asset promotion"],
        },
        "rootCause": [
            "Legacy extract_head_layer treated mannequin RGB/alpha difference and skin/hair palette guesses as anatomy ownership below y=396, so valid jaw/neck pixels were dropped while some source collar pixels survived.",
            "Legacy attach_neck then aligned the lowest opaque central pixel to y=430. That pixel was not an anatomical collar anchor and varied between jaw, neck, and misclassified collar by character.",
            "The resulting head was composited last over body-upper.webp, whose independent mannequin chin/neck stub still owns y=396..about 490. Two anatomy owners therefore produced flat jaw cuts, skin gaps, and double collars.",
        ],
        "renderContract": {
            "bodyCanvas": [WIDTH, HEIGHT],
            "headCanvas": [WIDTH, HEIGHT + HEAD_PAD],
            "headOffset": [0, -HEAD_PAD],
            "requiredRelativeOrder": [
                "pants/back props",
                "character neck",
                "body-shirt-only",
                "vest/cloak",
                "necklace",
                "wand/hands/grip",
                "character head-front/hair",
            ],
            "neckOwner": "exactly one per character; reuse the same character neck file for neutral, happy, and sad",
            "expressionRule": "future moods may replace only expression-feature pixels inside the source face interior; jaw, neck, hair silhouette, glasses/antlers ownership and registration remain unchanged",
            "hatRule": "not prototyped here; a promoted hatted head must use the same jaw partition/neck owner instead of attaching by opaque bounds",
        },
        "bodyCandidate": {
            "source": {"path": relative(body_source_path), "sha256": sha256(body_source_path)},
            "output": {"path": relative(body_path), "sha256": sha256(body_path)},
            "removalMask": {"path": relative(body_mask_path), "sha256": sha256(body_mask_path)},
            "actualOwnership": "canonical shirt/arms outside the declared neck joint are byte-identical RGBA; mannequin chin/neck inside the joint has zero ownership",
            "changedPixelCount": int(np.count_nonzero(changed)),
            "changedOutsideDeclaredJoint": int(np.count_nonzero(outside_changed)),
            "changedBoundsInclusive": [
                int(body_changed_columns.min()), int(body_changed_rows.min()),
                int(body_changed_columns.max()), int(body_changed_rows.max()),
            ],
        },
        "prototypes": prototypes,
        "qa": {"path": str(qa_path), "sha256": sha256(qa_path)},
        "knownIssues": [
            "This is deliberately only a three-neutral-bare proof. It does not assert that hats or mood interiors have been propagated.",
            "The source collar and canonical collar are not identical curves; canonical shirt pixels intentionally render above the translated source neck and hide the lower overlap. Parent/architect visual review must confirm each contact before promotion.",
            "Structural pixel checks prove ownership partition and no recolouring, not subjective anatomical acceptance; the QA sheet is the acceptance evidence.",
        ],
    }
    manifest_path = output / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {manifest_path}")
    print(f"wrote {qa_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--qa", type=Path, default=DEFAULT_QA)
    args = parser.parse_args()
    build(args.output, args.qa)


if __name__ == "__main__":
    main()
