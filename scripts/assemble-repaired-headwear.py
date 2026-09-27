"""Reassemble existing OpenAI head art with explicit jaw/neck ownership.

No generation or recolouring: use the recorded facial registration, remove
non-owned neck pixels, and apply the character's anatomical collar placement.
Historical API sources and their receipts remain immutable.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
REPAIR_ROOT = ROOT / "scripts/art-sources/neck-repair"
DEFAULT_OUTPUT = REPAIR_ROOT / "assembled/headwear"


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    result = importlib.util.module_from_spec(spec)
    sys.modules[name] = result
    spec.loader.exec_module(result)
    return result


repair = module("neck_repair", "repair-head-neck.py")
registration = module("head_registration", "register-doll-heads.py")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_pixels(image, path):
    """Keep an identical lossless raster rather than recompressing it."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_file():
        with Image.open(path) as previous:
            old = np.asarray(previous.convert("RGBA"))
        new = np.asarray(image.convert("RGBA"))
        if old.shape == new.shape and np.array_equal(old[:, :, 3], new[:, :, 3]):
            visible = new[:, :, 3] > 0
            if np.array_equal(old[:, :, :3][visible], new[:, :, :3][visible]):
                return
    image.save(path, format="WEBP", lossless=True, method=6)


def recipe_hash():
    inputs = (
        ROOT / "scripts/assemble-repaired-headwear.py",
        ROOT / "scripts/repair-head-neck.py",
        ROOT / "scripts/register-doll-heads.py",
        REPAIR_ROOT / "extra-profiles.json",
    )
    return hashlib.sha256(b"".join(path.read_bytes() for path in inputs)).hexdigest()


def character_spec(character):
    return next(spec for spec in repair.SPECS if spec.name == character)


def translate_head(image, dx, dy):
    result = Image.new("RGBA", registration.CANVAS)
    result.alpha_composite(image, (dx, dy))
    return result


def neck_exclusion(character):
    spec = character_spec(character)
    left = min(x for x, _ in spec.collar_anchors) - 8
    right = max(x for x, _ in spec.collar_anchors) + 8
    collar_y = max(y for _, y in spec.collar_anchors) + 8
    # Preserve the complete generated jaw. A short hidden joint overlap allows
    # the same anatomical neck to meet small jaw-shape differences across hats.
    points = [*((x, y + 18) for x, y in spec.jaw_curve), (right, collar_y),
              (right, 1536), (left, 1536), (left, collar_y)]
    mask = Image.new("L", registration.CANVAS)
    ImageDraw.Draw(mask).polygon([(x, y + registration.PAD) for x, y in points], fill=255)
    return mask.filter(ImageFilter.GaussianBlur(2))


def apply_expression(image, character, mood, dx, dy):
    if mood == "neutral":
        return image.copy()
    jaw_y = max(y for _, y in character_spec(character).jaw_curve)
    patch = translate_head(registration.expression_patch(character, mood, jaw_y), dx, dy)
    patch.putalpha(Image.fromarray(np.minimum(
        np.asarray(patch.getchannel("A")), np.asarray(image.getchannel("A"))
    )))
    result = image.copy()
    result.alpha_composite(patch)
    return result


def split_registered(character, aligned, item):
    """Keep all original jaw/neck pixels in an exact front/back alpha partition."""
    image = aligned.convert("RGBA").copy()
    pixels = np.asarray(image).copy()
    original = pixels.copy()
    excluded = np.asarray(neck_exclusion(character), dtype=np.float32) / 255.0
    if item == "hat-09":
        # This design has a real green chin cord and dark knot across the neck.
        # Those are headwear, not a second skin/neck owner.
        rgb = pixels[:, :, :3].astype(np.float32)
        cord = (rgb.max(axis=2) < 125) | (
            (rgb[:, :, 1] >= rgb[:, :, 0] * 0.95)
            & (rgb[:, :, 1] > rgb[:, :, 2])
            & (rgb.max(axis=2) < 170)
        )
        excluded[cord] = 0
    pixels[:, :, 3] = np.round(pixels[:, :, 3] * (1.0 - excluded)).astype(np.uint8)
    pixels[pixels[:, :, 3] < 10] = 0
    rear = original.copy()
    rear[:, :, 3] = original[:, :, 3] - pixels[:, :, 3]
    rear[rear[:, :, 3] == 0] = 0
    return Image.fromarray(pixels), Image.fromarray(rear)


def assemble_registered(character, aligned, mood="neutral", item=None):
    spec = character_spec(character)
    image, _ = split_registered(character, aligned, item)
    dx, dy = repair.registered_translation(spec)
    placed = translate_head(image, dx, dy)
    return apply_expression(placed, character, mood, dx, dy)


def assemble_neck(character, aligned, item):
    """Pair the generated jaw with its own skin, over the canonical collar joint."""
    _, rear = split_registered(character, aligned, item)
    dx, dy = repair.registered_translation(character_spec(character))
    rear = translate_head(rear, dx, dy).crop((0, 768, 1024, 2304))
    neck = Image.open(REPAIR_ROOT / f"{character}-neck.png").convert("RGBA")
    neck.alpha_composite(rear)
    pixels = np.asarray(neck).copy()
    # Generated hats can shorten the jaw a few pixels despite facial
    # registration. Extend only existing neck columns to that actual contour;
    # never erase the jaw or draw a generic replacement chin.
    head, _ = split_registered(character, aligned, item)
    head_alpha = np.asarray(
        translate_head(head, dx, dy).crop((0, 768, 1024, 2304))
    )[:, :, 3]
    jaw_y = int(max(y for _, y in character_spec(character).jaw_curve) + dy)
    lo, hi = max(0, jaw_y - 35), min(500, jaw_y + 35)
    extensions = []
    for x in range(420, 610):
        rows = np.where(pixels[lo:hi, x, 3] >= 200)[0]
        if not len(rows):
            continue
        top = int(rows[0]) + lo
        head_rows = np.where(head_alpha[lo:top, x] >= 180)[0]
        if not len(head_rows):
            continue
        jaw = int(head_rows[-1]) + lo
        gap = top - jaw - 1
        if 0 < gap <= 12:
            pixels[jaw+1:top, x] = pixels[top, x]
            extensions.append(gap)
    pixels[500:] = 0  # the shirt owns anatomy below its neckline
    image = Image.fromarray(pixels)
    evidence = {
        "method": "existing-neck-column registration to actual generated jaw contour",
        "extendedColumns": len(extensions),
        "maxExtensionPixels": max(extensions, default=0),
        "registeredPixels": sum(extensions),
        "headPixelsChanged": 0,
    }
    return image, evidence


def write_neck(character, item, aligned, output):
    path = output.parent / "rigged/necks" / f"{character}-{item}.webp"
    path.parent.mkdir(parents=True, exist_ok=True)
    neck, evidence = assemble_neck(character, aligned, item)
    save_pixels(neck, path)
    return path, evidence


def aligned_raw(raw, metrics):
    scale = metrics["sourceToGeneratedScale"]
    angle = metrics["rotationRadians"]
    tx, ty = metrics["translation"]
    c, sn = math.cos(angle), math.sin(angle)
    pad = registration.PAD
    transform = (scale*c, -scale*sn, tx+scale*sn*pad,
                 scale*sn, scale*c, ty-scale*c*pad)
    pixels = np.asarray(raw.convert("RGBA")).copy()
    pixels[pixels[:, :, 3] < 10] = 0
    return Image.fromarray(pixels).transform(
        registration.CANVAS, Image.Transform.AFFINE, transform,
        Image.Resampling.BICUBIC,
    )


def write_image(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    save_pixels(image, path)
    box = image.getchannel("A").getbbox()
    if box is None:
        raise ValueError(f"Empty repaired head: {path}")
    return {"sha256": digest(path), "bbox": [box[0], box[1]-registration.PAD,
            box[2], box[3]-registration.PAD], "offsetY": -registration.PAD,
            "width": image.width, "height": image.height}


def build_bare(character, output):
    manifest = json.loads((REPAIR_ROOT / "manifest.json").read_text())
    if manifest["repairScriptSha256"] != digest(ROOT / "scripts/repair-head-neck.py"):
        raise ValueError("Anatomy reconstruction is stale; run repair-head-neck.py first")
    if manifest["profilesSha256"] != digest(REPAIR_ROOT / "extra-profiles.json"):
        raise ValueError("Anatomical profiles changed; rebuild the source partition first")
    original = manifest["prototypes"][character]["sources"]["intactFull"]
    if digest(ROOT / original["path"]) != original["sha256"]:
        raise ValueError(f"{character}: intact original changed")
    path = REPAIR_ROOT / f"{character}-neutral-head-front.png"
    expected = manifest["prototypes"][character]["outputs"]["headFront"]["sha256"]
    if digest(path) != expected:
        raise ValueError(f"{character}: head-front snapshot is stale")
    neutral = Image.open(path).convert("RGBA")
    dx, dy = repair.registered_translation(character_spec(character))
    for mood in ("neutral", "happy", "sad"):
        image = apply_expression(neutral, character, mood, dx, dy)
        write_image(image, output / f"{character}-{mood}-bare.webp")


def build_hat(character, item, output):
    key = f"{character}-{item}"
    metadata_path = ROOT / "assets/doll/headwear" / f"{key}.json"
    record = json.loads(metadata_path.read_text())
    metadata_hash = digest(metadata_path)
    archive = REPAIR_ROOT / "generation-records" / f"{key}-{metadata_hash[:16]}.json"
    archive.parent.mkdir(parents=True, exist_ok=True)
    if not archive.exists():
        archive.write_bytes(metadata_path.read_bytes())
    for role in ("product", "identity", "headReference"):
        source = record["sources"][role]
        if digest(ROOT / source["path"]) != source["sha256"]:
            raise ValueError(f"{key}: generation source changed: {role}")
    raw_path = ROOT / record["raw"]
    if digest(raw_path) != record["rawSha256"]:
        raise ValueError(f"{key}: original API source hash mismatch")
    aligned = aligned_raw(Image.open(raw_path), record["registration"])
    neck_path, neck_registration = write_neck(character, item, aligned, output)
    files = {}
    for mood in ("neutral", "happy", "sad"):
        filename = f"{character}-{mood}-{item}.webp"
        image = assemble_registered(character, aligned, mood, item)
        files[filename] = write_image(image, output / filename)
    spec = character_spec(character)
    record["files"] = files
    record["status"] = "needs-visual-review"
    record["visualReview"] = None
    record["assembly"] = {
        "method": "anatomical-jaw-partition-with-separate-character-neck",
        "originalMetadataSha256": metadata_hash,
        "originalMetadata": str(archive.relative_to(ROOT)),
        "rawSha256": digest(raw_path),
        "repairScriptSha256": digest(ROOT / "scripts/repair-head-neck.py"),
        "translation": list(repair.registered_translation(spec)),
        "sourceJawCurve": [list(point) for point in spec.jaw_curve],
        "jawJointOverlap": 18,
        "neckOwner": f"rigged/necks/{character}-{item}.webp",
        "neckSha256": digest(neck_path),
        "neckJointRegistration": neck_registration,
        "usesOpaqueBottomAttachment": False,
        "newApiCalls": 0,
        "recipeSha256": recipe_hash(),
    }
    (output / f"{key}.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")


def review_grids(output, qa_dir, characters):
    qa_dir.mkdir(parents=True, exist_ok=True)
    body = Image.open(REPAIR_ROOT / "body-shirt-only.png").convert("RGBA")
    for character in characters:
        sheet = Image.new("RGB", (1440, 1750), "#20303a")
        draw = ImageDraw.Draw(sheet)
        cases = [(hat, mood) for hat in ["bare"] + [f"hat-{i:02d}" for i in range(1, 13)]
                 for mood in ("neutral", "happy", "sad")]
        for n, (hat, mood) in enumerate(cases):
            source = output / f"{character}-{mood}-{hat}.webp"
            if not source.exists():
                raise FileNotFoundError(f"Incomplete review grid: {source}")
            figure = Image.new("RGBA", (1024, 1536))
            neck_path = (REPAIR_ROOT / f"{character}-neck.png") if hat == "bare" else (
                output.parent / "rigged/necks" / f"{character}-{hat}.webp"
            )
            neck = Image.open(neck_path).convert("RGBA")
            figure.alpha_composite(neck)
            figure.alpha_composite(body)
            figure.alpha_composite(Image.open(source).convert("RGBA"), (0, -768))
            crop = figure.crop((340, 230, 685, 535))
            crop.thumbnail((232, 220))
            x, y = (n % 6)*240, (n // 6)*250
            sheet.paste(crop, (x+4, y+25), crop)
            draw.text((x+4, y+4), f"{hat} {mood}", fill="white")
        sheet.save(qa_dir / f"{character}-all-neck-joins.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--characters", nargs="+", default=[spec.name for spec in repair.SPECS])
    parser.add_argument("--hats", nargs="*", default=[f"hat-{i:02d}" for i in range(1, 13)])
    parser.add_argument("--qa-dir", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for character in args.characters:
        build_bare(character, args.output)
        for item in args.hats:
            build_hat(character, item, args.output)
        print(f"{character}: bare and {len(args.hats)} hats assembled without API calls", flush=True)
    if args.qa_dir:
        review_grids(args.output, args.qa_dir, args.characters)


if __name__ == "__main__":
    main()
