"""Fit isolated shop garments onto the six authored wizard poses.

The shop images are source art, not colour swatches: every output preserves the
source garment's alpha, embroidery, folds and construction detail.  A pose mask
only clips an item's edge to the authored body so that the face and fingers are
never regenerated or painted over.  This script deliberately fails/report an
unfit source rather than substituting a fake layer.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "shop-designs"
OUT_DIR = ROOT / "assets" / "garments"
CATALOG_FILE = ROOT / "assets" / "wardrobe-catalog.json"

CHARACTERS = ("dad", "mom", "jeongan", "suan", "yewon", "hunho")
MOODS = ("neutral", "happy", "sad")
CATEGORIES = ("hat", "necklace", "cloak", "wand", "broom", "gloves", "pants", "vest")
CANVAS = (512, 1024)

# (face-bottom, torso-centre-x, waist-y, ankle-y, face protection box,
#  left/right hand boxes).  These are measured against the current 512x1024
# pose sprites and intentionally remain pose-specific.
POSES = {
    "dad": [
        (375, 260, 570, 805, (145, 192, 384, 384), [(62, 447, 139, 558), (285, 566, 402, 637)]),
        (372, 256, 556, 799, (145, 183, 385, 380), [(34, 174, 130, 296), (374, 351, 474, 474)]),
        (402, 245, 570, 806, (126, 210, 382, 410), [(86, 620, 192, 720), (289, 543, 419, 637)]),
    ],
    "mom": [
        (426, 280, 560, 841, (180, 276, 391, 434), [(117, 476, 207, 567), (299, 467, 378, 568)]),
        (420, 272, 552, 817, (180, 276, 390, 430), [(94, 474, 194, 564), (331, 362, 414, 477)]),
        (438, 272, 571, 850, (178, 288, 398, 447), [(97, 478, 193, 561), (294, 501, 397, 584)]),
    ],
    "jeongan": [
        (442, 270, 550, 856, (148, 245, 405, 451), [(91, 485, 167, 575), (379, 619, 490, 701)]),
        (437, 265, 554, 863, (150, 240, 405, 449), [(85, 349, 163, 459), (345, 377, 414, 467)]),
        (463, 278, 591, 866, (162, 269, 426, 470), [(222, 629, 322, 715)]),
    ],
    "suan": [
        (387, 269, 525, 769, (164, 218, 391, 398), [(119, 432, 204, 535), (364, 563, 481, 676)]),
        (379, 265, 520, 797, (153, 217, 394, 390), [(105, 451, 192, 535), (329, 318, 407, 439)]),
        (409, 267, 553, 780, (161, 237, 398, 419), [(170, 508, 290, 651)]),
    ],
    "yewon": [
        (304, 245, 504, 810, (142, 125, 372, 315), [(91, 314, 158, 432), (220, 420, 329, 499)]),
        (300, 237, 504, 826, (131, 118, 374, 312), [(78, 307, 146, 400), (327, 266, 405, 384)]),
        (336, 263, 524, 841, (152, 156, 392, 347), [(141, 591, 224, 676), (254, 435, 349, 497)]),
    ],
    "hunho": [
        (271, 265, 493, 790, (174, 117, 371, 286), [(101, 351, 160, 437), (310, 492, 411, 570)]),
        (288, 253, 507, 811, (157, 117, 379, 302), [(111, 355, 172, 442), (356, 243, 420, 338)]),
        (300, 262, 517, 823, (168, 144, 386, 313), [(132, 347, 192, 425), (317, 501, 419, 579)]),
    ],
}


def _entries(catalog: object) -> list[dict]:
    if isinstance(catalog, list):
        return catalog
    if not isinstance(catalog, dict):
        raise ValueError("wardrobe-catalog.json must be an array or object")
    values = catalog.get("items", catalog.get("paidItems", []))
    starters = catalog.get("starters", catalog.get("starterItems", []))
    return [*starters, *values]


def load_catalog() -> list[dict]:
    entries = _entries(json.loads(CATALOG_FILE.read_text(encoding="utf-8")))
    paid = [entry for entry in entries if isinstance(entry, dict) and entry.get("price", 0) > 0]
    by_category = {category: [entry for entry in paid if entry.get("category") == category] for category in CATEGORIES}
    problems: list[str] = []
    for category, items in by_category.items():
        ids = {entry.get("id") for entry in items}
        expected = {f"{category}-{index:02d}" for index in range(1, 13)}
        if ids != expected:
            problems.append(f"{category}: expected 12 IDs, found {sorted(ids)}")
    if problems:
        raise ValueError("Invalid wardrobe catalog: " + "; ".join(problems))
    return [entry for category in CATEGORIES for entry in by_category[category]]


def bool_region(shape: tuple[int, int], boxes: Iterable[tuple[int, int, int, int]]) -> np.ndarray:
    result = np.zeros(shape, dtype=bool)
    height, width = shape
    for x0, y0, x1, y1 in boxes:
        result[max(0, y0) : min(height, y1), max(0, x0) : min(width, x1)] = True
    return result


def _safe_box(box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = box
    return (max(0, x0), max(0, y0), min(CANVAS[0], x1), min(CANVAS[1], y1))


def _source_content(source: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    rgba = source.convert("RGBA")
    alpha = np.asarray(rgba.getchannel("A"), dtype=np.uint8)
    visible = np.argwhere(alpha > 12)
    if visible.size == 0:
        raise ValueError("source has no visible alpha")
    y0, x0 = visible.min(axis=0)
    y1, x1 = visible.max(axis=0) + 1
    return rgba.crop((int(x0), int(y0), int(x1), int(y1))), (int(x0), int(y0), int(x1), int(y1))


def _remove_alpha_specks(source: Image.Image) -> Image.Image:
    """Drop disconnected generation noise while retaining garment structure."""
    rgba = source.convert("RGBA")
    alpha = np.asarray(rgba.getchannel("A"), dtype=np.uint8)
    mask = alpha > 12
    height, width = mask.shape
    visited = np.zeros(mask.shape, dtype=bool)
    components: list[list[int]] = []
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or visited[y, x]:
                continue
            stack = [(y, x)]
            visited[y, x] = True
            pixels: list[int] = []
            while stack:
                cy, cx = stack.pop()
                pixels.append(cy * width + cx)
                for ny, nx in (
                    (cy - 1, cx),
                    (cy + 1, cx),
                    (cy, cx - 1),
                    (cy, cx + 1),
                    (cy - 1, cx - 1),
                    (cy - 1, cx + 1),
                    (cy + 1, cx - 1),
                    (cy + 1, cx + 1),
                ):
                    if (
                        0 <= ny < height
                        and 0 <= nx < width
                        and mask[ny, nx]
                        and not visited[ny, nx]
                    ):
                        visited[ny, nx] = True
                        stack.append((ny, nx))
            components.append(pixels)
    if not components:
        return rgba
    largest = max(len(component) for component in components)
    minimum = max(256, int(largest * 0.01))
    keep = np.zeros(mask.shape, dtype=bool)
    for component in components:
        if len(component) >= minimum:
            indexes = np.asarray(component, dtype=np.int64)
            keep[indexes // width, indexes % width] = True
    alpha = alpha.copy()
    alpha[~keep] = 0
    rgba.putalpha(Image.fromarray(alpha, mode="L"))
    return rgba


def _fit_source(source: Image.Image, target: tuple[int, int, int, int]) -> Image.Image:
    """Place a cropped source into target while preserving its proportions."""
    content, _ = _source_content(source)
    tx0, ty0, tx1, ty1 = _safe_box(target)
    tw, th = max(1, tx1 - tx0), max(1, ty1 - ty0)
    scale = min(tw / content.width, th / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    resized = content.resize((width, height), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", CANVAS)
    result.alpha_composite(resized, (tx0 + (tw - width) // 2, ty0 + (th - height) // 2))
    return result


def _fit_glove_pair(
    source: Image.Image, hands: list[tuple[int, int, int, int]]
) -> Image.Image:
    """Split the authored side-by-side pair and fit each glove to its hand.

    A pair must not be squeezed into one union rectangle: that turns two
    gloves into a tiny central prop on poses whose hands are far apart.
    """
    content, _ = _source_content(source)
    midpoint = content.width // 2
    halves = (
        content.crop((0, 0, midpoint, content.height)),
        content.crop((midpoint, 0, content.width, content.height)),
    )
    output = Image.new("RGBA", CANVAS)
    for hand, half in zip(sorted(hands, key=lambda box: box[0]), halves):
        x0, y0, x1, y1 = hand
        target = (x0 - 12, y0 - 24, x1 + 12, y1 + 34)
        output.alpha_composite(_fit_source(half, target))
    return output


def _alpha_composite_mask(layer: Image.Image, allowed: np.ndarray, *, feather: float = 0.7) -> Image.Image:
    rgba = np.asarray(layer.convert("RGBA"), dtype=np.uint8).copy()
    alpha = rgba[:, :, 3].astype(np.float32)
    allowed_alpha = (allowed.astype(np.uint8) * 255)
    if feather:
        allowed_alpha = np.asarray(
            Image.fromarray(allowed_alpha, mode="L").filter(ImageFilter.GaussianBlur(feather)),
            dtype=np.float32,
        )
    alpha = np.minimum(alpha, allowed_alpha)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    rgba[rgba[:, :, 3] == 0, :3] = 0
    return Image.fromarray(rgba, mode="RGBA")


def _targets(category: str, facebox: tuple[int, int, int, int], cx: int, waist: int, ankle: int) -> tuple[int, int, int, int]:
    face_x0, face_y0, face_x1, face_y1 = facebox
    neck = face_y1
    if category == "hat":
        return (face_x0 - 48, max(0, face_y0 - 175), face_x1 + 48, face_y0 + 8)
    if category == "necklace":
        return (cx - 72, neck - 12, cx + 72, neck + 94)
    if category == "cloak":
        return (cx - 152, neck - 4, cx + 152, ankle + 18)
    if category == "wand":
        return (cx - 112, max(neck, waist - 165), cx + 150, min(ankle, waist + 105))
    if category == "broom":
        return (18, max(100, neck - 40), 494, min(990, ankle + 110))
    if category == "pants":
        return (cx - 118, waist - 18, cx + 118, ankle + 12)
    if category == "vest":
        return (cx - 92, neck + 18, cx + 92, waist + 10)
    if category == "gloves":
        raise AssertionError("gloves use the paired hand bounds")
    raise ValueError(category)

HAT_INSET = {"dad": 53, "mom": 43, "jeongan": 50, "suan": 55, "yewon": 42, "hunho": 30}

def _fit_hat(source: Image.Image, facebox: tuple[int, int, int, int], inset: int) -> Image.Image:
    """Fit the brim to the head, not to the centre of empty space above it."""
    content, _ = _source_content(source)
    x0, y0, x1, _ = facebox
    brim = y0 + inset
    width = min(440, round((x1 - x0) * 1.42))
    height = min(max(60, brim - 10), round(width * content.height / content.width))
    fitted = content.resize((width, height), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", CANVAS)
    result.alpha_composite(fitted, (round((x0 + x1 - width) / 2), brim - height))
    return result

def _hatless_base(base: Image.Image, character: str, facebox, hands) -> Image.Image:
    """Remove only native headwear pigments; never cut a rectangle from a face."""
    rgba = np.asarray(base.convert("RGBA")).copy()
    hsv = np.asarray(base.convert("HSV"), dtype=float)
    hue, sat = hsv[:, :, 0] * 360 / 255, hsv[:, :, 1] / 255
    yy, xx = np.indices(rgba.shape[:2])
    x0, y0, x1, _ = facebox
    protected_face=(x0, y0 + HAT_INSET[character], x1, facebox[3])
    protected = bool_region(rgba.shape[:2], [protected_face, *hands])
    region = (yy < y0 + 100) & (xx > x0 - 50) & (xx < x1 + 50)
    # Staffs and raised hands beside the head are not part of the hat.
    region &= ~((xx < x0) & (yy < y0 - 15))
    if character in ("dad", "yewon"):
        pigment = (hue > 175) & (hue < 285) & (sat > .10)
    elif character == "mom":
        pigment = (hue > 60) & (hue < 190) & (sat > .09)
    elif character == "jeongan":
        pigment = (hue > 200) & (hue < 325) & (sat > .1)
    elif character == "suan":
        pigment = ((hue < 18) | (hue > 345)) & (sat > .2)
    else:
        pigment = (hue > 8) & (hue < 60) & (sat > .2)
    headwear = Image.fromarray((region & pigment).astype(np.uint8) * 255)
    headwear = headwear.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.MinFilter(17))
    remove = (np.asarray(headwear) > 128) & region & ~protected
    rgba[remove] = 0
    return Image.fromarray(rgba, mode="RGBA")


def fit_layer(
    source: Image.Image,
    category: str,
    base_alpha: np.ndarray,
    facebox: tuple[int, int, int, int],
    hands: list[tuple[int, int, int, int]],
    cx: int,
    waist: int,
    ankle: int,
    hat_inset: int = 40,
) -> tuple[Image.Image, dict]:
    height, width = base_alpha.shape
    yy, xx = np.indices((height, width))
    protected = bool_region((height, width), [facebox])
    if category == "hat":
        protected = bool_region((height,width),[(facebox[0],facebox[1]+hat_inset,facebox[2],facebox[3])])
    hand_region = bool_region((height, width), hands)
    opaque = base_alpha > 22
    neck = facebox[3]
    if category == "gloves":
        fitted = _fit_glove_pair(source, hands)
        expanded_hands = [
            (box[0] - 16, box[1] - 28, box[2] + 16, box[3] + 38)
            for box in hands
        ]
        target = (
            min(box[0] for box in expanded_hands),
            min(box[1] for box in expanded_hands),
            max(box[2] for box in expanded_hands),
            max(box[3] for box in expanded_hands),
        )
        allowed = bool_region((height, width), expanded_hands) & opaque & ~protected
    elif category == "hat":
        target = _targets(category, facebox, cx, waist, ankle)
        # The source hat is allowed above the head; its lower edge stops at the
        # face protection box rather than hiding hair/eyes.
        allowed = (yy < facebox[1] + hat_inset) & ~protected
    elif category == "necklace":
        target = _targets(category, facebox, cx, waist, ankle)
        allowed = opaque & ~protected & (yy >= neck - 18) & (yy <= neck + 110)
    elif category == "broom":
        target = _targets(category, facebox, cx, waist, ankle)
        # Broom is deliberately first in SVG order and may pass behind the body.
        allowed = np.ones((height, width), dtype=bool)
    elif category == "wand":
        target = _targets(category, facebox, cx, waist, ankle)
        allowed = ~protected & (yy >= neck - 10) & (yy <= ankle + 45)
    else:
        target = _targets(category, facebox, cx, waist, ankle)
        body = opaque & ~protected & ~hand_region
        if category == "cloak":
            allowed = body & (yy >= neck - 4) & (yy <= ankle + 18)
        elif category == "vest":
            allowed = body & (yy >= neck + 12) & (yy <= waist + 12) & (np.abs(xx - cx) <= 112)
        else:  # pants
            allowed = body & (yy >= waist - 18) & (yy <= ankle + 14) & (np.abs(xx - cx) <= 130)
    if category == "hat":
        fitted = _fit_hat(source, facebox, hat_inset)
    elif category != "gloves":
        fitted = _fit_source(source, target)
    result = _alpha_composite_mask(fitted, allowed)
    rgba = np.asarray(result, dtype=np.uint8).copy()
    # Absolute face safety is intentional even when a malformed pose box clips
    # through a source accessory. Broom remains behind the authored base.
    rgba[protected, 3] = 0
    rgba[rgba[:, :, 3] == 0, :3] = 0
    result = Image.fromarray(rgba, mode="RGBA")
    pixels = int(np.count_nonzero(rgba[:, :, 3] > 40))
    if pixels < 40:
        raise ValueError(f"fitted layer has only {pixels} visible pixels")
    return result, {
        "pixels": pixels,
        "faceOverlap": int(np.count_nonzero(rgba[protected, 3] > 0)),
        "handOverlap": int(np.count_nonzero(rgba[hand_region, 3] > 0)) if category != "gloves" else pixels,
        "size": list(CANVAS),
        "target": list(target),
        "method": "source-alpha-preserving pose mask with soft seam",
    }


def _save_webp(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="WEBP", lossless=True, method=6)


def make_contact_sheet(previews: dict[tuple[str, str, str], Image.Image]) -> None:
    """Write a compact contact sheet of actual base+garment composites.

    Both the cheapest and luxury design in every category are shown for every
    character and mood. This is intentionally generated from the same layers
    shipped to the browser, rather than from source thumbnails.
    """
    samples = []
    for category in CATEGORIES:
        for index in (1, 12):
            item_id = f"{category}-{index:02d}"
            for character in CHARACTERS:
                for mood in MOODS:
                    image = previews.get((character, mood, item_id))
                    if image is not None:
                        samples.append((category, item_id, character, mood, image))
    thumb_w, thumb_h = 96, 192
    cols = 24
    rows = (len(samples) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * thumb_w, rows * thumb_h), (19, 18, 28, 255))
    for index, (_, _, _, _, image) in enumerate(samples):
        thumb = ImageOps.contain(image, (thumb_w - 6, thumb_h - 6), Image.Resampling.LANCZOS)
        x = (index % cols) * thumb_w + (thumb_w - thumb.width) // 2
        y = (index // cols) * thumb_h + (thumb_h - thumb.height) // 2
        sheet.alpha_composite(thumb, (x, y))
    # The sheet is a review artifact (not a runtime layer). PNG avoids a
    # platform-specific WebP encoder allocation failure for this large grid.
    sheet.save(OUT_DIR / "contact-sheet.png", format="PNG", optimize=True)


def main() -> None:
    items = load_catalog()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report: dict[str, object] = {
        "method": "Source garment alpha fitted to authored pose landmarks; no recolouring or fallback layers",
        "model": "gpt-image-2.5-flare",
        "canvas": list(CANVAS),
        "characters": list(CHARACTERS),
        "moods": list(MOODS),
        "categories": list(CATEGORIES),
        "files": {},
        "unfit": [],
    }
    previews: dict[tuple[str, str, str], Image.Image] = {}
    source_cache: dict[Path, Image.Image] = {}
    unfit: list[dict] = report["unfit"]  # type: ignore[assignment]
    files: dict[str, dict] = report["files"]  # type: ignore[assignment]
    for character in CHARACTERS:
        for mood_index, mood in enumerate(MOODS):
            base_path = ROOT / "assets" / "wizards" / f"{character}-{mood}.webp"
            base = Image.open(base_path).convert("RGBA")
            if base.size != CANVAS:
                raise ValueError(f"{base_path.name}: expected {CANVAS}, got {base.size}")
            base_alpha = np.asarray(base.getchannel("A"), dtype=np.uint8)
            pose = POSES[character][mood_index]
            _, cx, waist, ankle, facebox, hands = pose
            hatless = _hatless_base(base, character, facebox, hands)
            _save_webp(hatless, OUT_DIR / f"{character}-{mood}-hatless.webp")
            for entry in items:
                item_id = str(entry["id"])
                source_path = SOURCE_DIR / f"{item_id}.webp"
                filename = f"{character}-{mood}-{item_id}.webp"
                if not source_path.exists():
                    unfit.append({"file": filename, "source": str(source_path.relative_to(ROOT)), "reason": "missing source garment"})
                    continue
                try:
                    source = source_cache.get(source_path)
                    if source is None:
                        source = _remove_alpha_specks(Image.open(source_path).convert("RGBA"))
                        if item_id == "vest-06" and source.width > source.height:
                            source = source.crop((0, 0, source.width // 2, source.height))
                        source_cache[source_path] = source
                    source_alpha = np.asarray(source.getchannel("A"), dtype=np.uint8)
                    if not np.any(source_alpha > 12):
                        raise ValueError("source has transparent alpha")
                    layer, coverage = fit_layer(source, entry["category"], base_alpha, facebox, hands, cx, waist, ankle, HAT_INSET[character])
                    path = OUT_DIR / filename
                    _save_webp(layer, path)
                    coverage.update({
                        "category": entry["category"],
                        "item": item_id,
                        "source": str(source_path.relative_to(ROOT)),
                        "price": entry["price"],
                    })
                    files[filename] = coverage
                    # Contact previews compose the layer onto the real authored
                    # mood sprite. No opaque placeholder is ever used.
                    if entry["price"] in (1, 100):
                        preview = (hatless if entry["category"] == "hat" else base).copy()
                        preview.alpha_composite(layer)
                        # Keep only the review thumbnail in memory. Holding
                        # 288 full 512x1024 RGBA previews makes WebP encoding
                        # need hundreds of megabytes for no visual benefit.
                        previews[(character, mood, item_id)] = ImageOps.contain(
                            preview, (96, 192), Image.Resampling.LANCZOS
                        )
                except (OSError, ValueError) as error:
                    unfit.append({"file": filename, "source": str(source_path.relative_to(ROOT)), "reason": str(error)})
    report["count"] = len(files)
    report["unfitCount"] = len(unfit)
    (OUT_DIR / "fit-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    manifest = {
        "model": "gpt-image-2.5-flare",
        "method": report["method"],
        "sourceDirectory": "assets/shop-designs",
        "outputDirectory": "assets/garments",
        "canvas": list(CANVAS),
        "characters": list(CHARACTERS),
        "moods": list(MOODS),
        "categories": list(CATEGORIES),
        "items": len(items),
        "files": len(files),
        "unfit": len(unfit),
        "generatedDesigns": len(items),
        "generatedLayers": len(files),
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    make_contact_sheet(previews)
    if unfit:
        raise SystemExit(f"{len(unfit)} garment fits were unfit; see assets/garments/fit-report.json")
    if len(files) != len(CHARACTERS) * len(MOODS) * len(items):
        raise SystemExit(f"expected {len(CHARACTERS) * len(MOODS) * len(items)} files, wrote {len(files)}")
    print(f"Fitted {len(files)} source garments for {len(CHARACTERS)} characters and {len(MOODS)} moods")


if __name__ == "__main__":
    main()
