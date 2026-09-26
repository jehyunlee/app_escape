"""Generate texture-preserving wardrobe overlays for the six wizard sprites.

Each character/mood/category target is edited once with the supplied full-body
sprite.  Four palette files are then derived locally from that one textured
master, so this script has at most 6 * 3 * 8 = 144 image API calls.  Existing
masters and complete palette sets are skipped, which makes interrupted runs
resumable.

The API key is read from OPENAI_API_KEY and is never included in logs or the
manifest.  Start long runs outside this script with a detached tmux session,
for example::

    tmux new -d -s garment-layers 'python3 scripts/generate-garment-layers.py --workers 4 > garment-layers.log 2>&1'
"""
from __future__ import annotations

import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import io
import json
import math
import os
import subprocess
import sys
from pathlib import Path
import threading
import time
import urllib.error
import urllib.request
import uuid

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
WIZARD_ROOT = ROOT / "assets" / "wizards"
OUT = ROOT / "assets" / "garments"
MODEL = "gpt-image-2.5-flare"
QUALITY = "medium"
CHARACTERS = ("dad", "mom", "jeongan", "suan", "yewon", "hunho")
MOODS = ("neutral", "happy", "sad")
CATEGORIES = ("hat", "necklace", "cloak", "wand", "broom", "gloves", "pants", "vest")

# These are the existing catalog colors, in price order (1/10/35/100 GOLD).
PALETTES = {
    "hat": (("sapphire", "#3155a6"), ("burgundy", "#8e304d"), ("emerald", "#2e8267"), ("silver", "#aabfe5")),
    "necklace": (("moon", "#7ba4e8"), ("star", "#e6ba58"), ("emerald", "#45b982"), ("pearl", "#f1e6da")),
    "cloak": (("sapphire", "#263d87"), ("burgundy", "#7d2944"), ("emerald", "#286c59"), ("silver", "#7692c8")),
    "wand": (("willow", "#a96c3b"), ("crystal", "#83b8ef"), ("ember", "#e47a43"), ("silver", "#d9e6f7")),
    "broom": (("sky", "#77a9cf"), ("ember", "#d26943"), ("jade", "#3da47b"), ("lunar", "#b8c5e9")),
    "gloves": (("cream", "#e8d2b4"), ("burgundy", "#8a3d4d"), ("sapphire", "#3b5fb1"), ("emerald", "#33856a")),
    "pants": (("navy", "#283d70"), ("burgundy", "#713344"), ("forest", "#315d4e"), ("silver", "#7186aa")),
    "vest": (("gold", "#b8873c"), ("silver", "#9aaac0"), ("teal", "#327e83"), ("burgundy", "#813749")),
}

# Broad edit masks keep a model from inventing a replacement face or body. The
# final difference pass against the supplied base removes any unchanged body
# pixels that an image edit may have returned alongside the garment.
MASK_BOXES = {
    "hat": (4, 8, 508, 300),
    "necklace": (82, 286, 430, 520),
    "cloak": (12, 300, 500, 940),
    "wand": (248, 250, 510, 900),
    "broom": (12, 240, 510, 1000),
    "gloves": (36, 440, 476, 760),
    "pants": (74, 610, 438, 952),
    "vest": (76, 300, 436, 700),
}

PROMPT_DETAILS = {
    "hat": "a tailored pointed wizard hat fitted to the head, including brim, fabric weave and small tasteful trim",
    "necklace": "one clearly visible necklace resting on the upper chest, with chain and one pendant",
    "cloak": "a full-length outer cloak draped from the shoulders, with believable front opening and rich fabric folds",
    "wand": "one slender additional magical wand naturally held in the visible hand, following the hand's existing grip while preserving the family's native tool",
    "broom": "one distinct additional flying broom placed in the existing prop position, behind the body and never crossing the hands incorrectly while preserving the family's native tool",
    "gloves": "a matching pair of fitted gloves covering only the existing hands, with natural fingers and cuffs",
    "pants": "tailored trousers covering the existing legs from waist to ankles, with seams and woven fabric texture",
    "vest": "a fitted waistcoat over the torso, with armholes, front opening, buttons and woven textile texture",
}

PROMPT_ORDER = (
    "Use the supplied transparent full-body wizard sprite as an exact position and identity reference. "
    "Return only the newly designed accessory pixels on transparent background; do not redraw, repaint, or include the person's face, hair, skin, body, boots, native costume, tools, scene, shadow, text, border, or background. "
    "The final image must align exactly with the supplied 512x1024 sprite after central crop. Preserve the character's body position, proportions, camera, expression and hand placement. "
)

MANIFEST = OUT / "manifest.json"
_PRINT_LOCK = threading.Lock()
_COUNT_LOCK = threading.Lock()
_API_CALLS = 0


def log(message: str) -> None:
    with _PRINT_LOCK:
        print(message, flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--characters", nargs="+", choices=CHARACTERS, default=list(CHARACTERS))
    parser.add_argument("--moods", nargs="+", choices=MOODS, default=list(MOODS))
    parser.add_argument("--categories", nargs="+", choices=CATEGORIES, default=list(CATEGORIES))
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--timeout", type=int, default=300)
    parser.add_argument("--reclean", action="store_true", help="reapply conservative alpha masks without API calls")
    return parser.parse_args()


def hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def padded_reference(character: str, mood: str) -> tuple[bytes, Image.Image]:
    source_path = WIZARD_ROOT / f"{character}-{mood}.webp"
    if not source_path.is_file():
        raise FileNotFoundError(f"missing reference sprite: {source_path}")
    source = Image.open(source_path).convert("RGBA")
    if source.size != (512, 1024):
        raise ValueError(f"{source_path}: expected 512x1024, got {source.size}")
    # The edit reference is 768x1536 centered in a transparent 1024x1536 canvas.
    reference = Image.new("RGBA", (1024, 1536), (0, 0, 0, 0))
    reference.alpha_composite(source.resize((768, 1536), Image.Resampling.LANCZOS), (128, 0))
    memory = io.BytesIO()
    reference.save(memory, format="PNG")
    return memory.getvalue(), source


def category_mask(category: str) -> bytes:
    mask = Image.new("RGBA", (1024, 1536), (255, 255, 255, 255))
    x0, y0, x1, y1 = MASK_BOXES[category]
    # Transparent means editable in the image edits API. Scale the 512x1024
    # boxes into the centered 768x1536 reference inside the 1024px canvas.
    mask.paste((255, 255, 255, 0), (128 + x0 * 3 // 2, y0 * 3 // 2, 128 + x1 * 3 // 2, y1 * 3 // 2))
    memory = io.BytesIO()
    mask.save(memory, format="PNG")
    return memory.getvalue()


def multipart(fields: dict[str, str], image: bytes, mask: bytes, category: str) -> tuple[bytes, str]:
    boundary = "garment-" + uuid.uuid4().hex
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    chunks.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="wizard-reference.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
    )
    chunks.append(image)
    chunks.append(b"\r\n")
    chunks.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="mask"; filename="{category}-edit-mask.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
    )
    chunks.append(mask)
    chunks.append(f"\r\n--{boundary}--\r\n".encode())
    return b"".join(chunks), boundary


def prompt_for(character: str, mood: str, category: str) -> str:
    pose = {"neutral": "calm neutral", "happy": "joyful smiling", "sad": "gently worried"}[mood]
    return (
        PROMPT_ORDER
        + f"This is the {pose} pose of {character}. Generate exactly {PROMPT_DETAILS[category]}. "
        + "Keep the new item physically connected to the existing body or prop, use natural occlusion and lighting, and keep all other pixels fully transparent. "
        + "No duplicate body part, no alternate pose, no second accessory, no floating sticker, and no words."
    )


def transient(error: Exception) -> bool:
    if isinstance(error, urllib.error.HTTPError):
        return error.code in {408, 409, 425, 429} or error.code >= 500
    return isinstance(error, (TimeoutError, urllib.error.URLError, ConnectionError))


def call_image_edit(character: str, mood: str, category: str, timeout: int) -> bytes:
    global _API_CALLS
    image, _ = padded_reference(character, mood)
    mask = category_mask(category)
    fields = {
        "model": MODEL,
        "prompt": prompt_for(character, mood, category),
        "size": "1024x1536",
        "quality": QUALITY,
        "background": "transparent",
        "output_format": "png",
        "n": "1",
    }
    payload, boundary = multipart(fields, image, mask, category)
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/edits",
        data=payload,
        headers={
            "Authorization": "Bearer " + os.environ["OPENAI_API_KEY"],
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    for attempt in range(3):
        try:
            with _COUNT_LOCK:
                _API_CALLS += 1
                call_number = _API_CALLS
            log(f"{character}/{mood}/{category}: image edit {call_number} (attempt {attempt + 1})")
            with urllib.request.urlopen(request, timeout=timeout) as response:
                result = json.load(response)
            encoded = result.get("data", [{}])[0].get("b64_json")
            if not encoded:
                raise ValueError("image API returned no b64_json")
            return base64.b64decode(encoded, validate=True)
        except Exception as error:
            if attempt < 2 and transient(error):
                time.sleep(2 ** attempt)
                continue
            if isinstance(error, urllib.error.HTTPError):
                # Never print request headers or the key. API error bodies can
                # contain useful rate-limit details but are not trusted as HTML.
                try:
                    detail = json.loads(error.read()).get("error", {}).get("message", "image API error")
                except (ValueError, UnicodeDecodeError):
                    detail = "image API error"
                raise RuntimeError(f"{character}/{mood}/{category}: HTTP {error.code}: {detail}") from None
            raise
    raise AssertionError("unreachable")


def central_crop(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    if image.size != (1024, 1536):
        # Keep the contract strict rather than silently shifting a model output.
        raise ValueError(f"image edit returned {image.size}, expected 1024x1536")
    return image.crop((128, 0, 896, 1536)).resize((512, 1024), Image.Resampling.LANCZOS)


def remove_base_pixels(output: Image.Image, source: Image.Image, category: str) -> Image.Image:
    """Keep changed pixels in the target region and remove regenerated body.

    Image edits occasionally return a composite despite the transparent prompt.
    Comparing to the exact source base is deterministic and leaves textured new
    pixels while dropping unchanged face, hair, hands, boots and native clothes.
    """
    output = output.convert("RGBA")
    source = source.convert("RGBA")
    if output.size != source.size:
        raise ValueError(f"cropped layer {output.size} does not match source {source.size}")
    target = Image.new("L", source.size, 0)
    x0, y0, x1, y1 = MASK_BOXES[category]
    target.paste(255, (x0, y0, x1, y1))
    alpha = output.getchannel("A")
    source_alpha = source.getchannel("A")
    difference = ImageChops.difference(output.convert("RGB"), source.convert("RGB")).convert("L")
    # Preserve antialiased garment edges while dropping near-identical base art.
    difference = difference.point(lambda value: 0 if value < 24 else min(255, value * 3))
    difference = ImageChops.multiply(difference, target)
    difference = ImageChops.multiply(difference, alpha)
    # Never add pixels outside the original character silhouette except for
    # tools, whose handles intentionally extend beyond the body.
    if category not in {"wand", "broom", "hat"}:
        difference = ImageChops.multiply(difference, source_alpha)
    result = output.copy()
    result.putalpha(difference)
    return result


def surgical_mask(image: Image.Image, category: str) -> Image.Image:
    """Constrain an edit to the requested silhouette after model cleanup.

    The image edit endpoint can return a partially regenerated reference even
    with a transparent mask. These conservative shape masks remove duplicate
    eyes, torso, tools and hands while retaining the actual generated item.
    """
    alpha = image.getchannel("A")
    if category == "wand":
        # Some edits center a wand despite the supplied hand position. Move
        # that unmistakable centered result into the left-hand corridor rather
        # than allowing it to sit through the torso.
        bbox = alpha.getbbox()
        if bbox and bbox[0] >= 210 and bbox[2] <= 430:
            shifted = Image.new("RGBA", image.size, (0, 0, 0, 0))
            shifted.alpha_composite(image, (-170, 0))
            image = shifted
            alpha = image.getchannel("A")
    keep = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(keep)
    if category == "hat":
        draw.polygon(((82, 238), (106, 190), (194, 126), (255, 8), (350, 18), (424, 190), (452, 252), (420, 278), (92, 278)), fill=255)
        # The native head remains the only face layer under the brim.
        draw.rectangle((128, 244, 390, 318), fill=0)
    elif category == "necklace":
        draw.rectangle((158, 382, 305, 505), fill=255)
        # Preserve a narrow chain/pendant zone, not the regenerated shoulders.
        draw.rectangle((158, 500, 305, 530), fill=0)
        draw.rectangle((275, 430, 305, 520), fill=0)
    elif category == "gloves":
        draw.rectangle((48, 450, 158, 650), fill=255)
        draw.rectangle((366, 548, 468, 730), fill=255)
        draw.rectangle((350, 500, 470, 604), fill=0)
    elif category == "wand":
        # Existing sprites place a wand in one of the hands. Keep both side
        # corridors and never allow a regenerated central torso to survive.
        draw.rectangle((0, 250, 182, 900), fill=255)
        draw.rectangle((330, 250, 512, 900), fill=255)
    elif category == "broom":
        # A broom is a long diagonal prop plus its bristle fan, behind the
        # body. This keeps it distinct from hands and clothing.
        draw.polygon(((330, 420), (444, 228), (492, 232), (360, 450)), fill=255)
        draw.polygon(((0, 680), (166, 738), (190, 846), (0, 938)), fill=255)
    elif category == "pants":
        draw.rectangle((100, 590, 440, 960), fill=255)
    elif category == "vest":
        draw.rectangle((116, 330, 440, 710), fill=255)
    elif category == "cloak":
        draw.polygon(((32, 300), (480, 300), (512, 960), (18, 960)), fill=255)
    image.putalpha(ImageChops.multiply(alpha, keep))
    return image


def recolor(master: Image.Image, color: str) -> Image.Image:
    """Map hue/value while retaining per-pixel folds, highlights and grain."""
    target = hex_rgb(color)
    pixels = master.convert("RGBA")
    rgba = pixels.load()
    for y in range(pixels.height):
        for x in range(pixels.width):
            red, green, blue, alpha = rgba[x, y]
            if alpha == 0:
                continue
            luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
            # Keep generated shading texture, with enough contrast to survive
            # palette changes and a gentle warm highlight floor.
            factor = 0.35 + luminance * 0.92
            peak = max(target)
            if peak:
                factor *= max(0.64, min(1.18, max(red, green, blue) / peak))
            rgba[x, y] = tuple(max(0, min(255, round(channel * factor))) for channel in target) + (alpha,)
    return pixels


def write_webp(image: Image.Image, path: Path) -> None:
    temporary = path.with_suffix(path.suffix + ".part")
    image.save(temporary, format="WEBP", lossless=True, method=6)
    temporary.replace(path)


def complete_paths(character: str, mood: str, category: str) -> list[Path]:
    return [OUT / f"{character}-{mood}-{category}-{name}.webp" for name, _ in PALETTES[category]]


def generate_one(character: str, mood: str, category: str, timeout: int, reclean: bool = False) -> str:
    master_path = OUT / f"{character}-{mood}-{category}.master.png"
    paths = complete_paths(character, mood, category)
    if all(path.is_file() for path in paths) and not reclean:
        return f"{character}/{mood}/{category}: skipped (complete)"
    source_bytes, source = padded_reference(character, mood)
    del source_bytes
    if master_path.is_file():
        master = surgical_mask(Image.open(master_path).convert("RGBA"), category)
        master.save(master_path, format="PNG", optimize=True)
    else:
        raw = call_image_edit(character, mood, category, timeout)
        master = surgical_mask(
            remove_base_pixels(central_crop(Image.open(io.BytesIO(raw))), source, category),
            category,
        )
        master_path.parent.mkdir(parents=True, exist_ok=True)
        master.save(master_path, format="PNG", optimize=True)
    for path, (_, color) in zip(paths, PALETTES[category]):
        if not path.is_file() or reclean:
            write_webp(recolor(master, color), path)
    return f"{character}/{mood}/{category}: ready"


def write_manifest(selected: tuple[str, ...], moods: tuple[str, ...], categories: tuple[str, ...]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "model": MODEL,
        "quality": QUALITY,
        "source": "assets/wizards/<character>-<mood>.webp",
        "canvas": "512x1024 transparent overlay",
        "reference_canvas": "1024x1536 output, central 768x1536 crop",
        "generated_designs": len(selected) * len(moods) * len(categories),
        "palette_variants_per_design": 4,
        "characters": list(selected),
        "moods": list(moods),
        "categories": list(categories),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "palette_names": {category: [name for name, _ in PALETTES[category]] for category in categories},
    }
    temporary = MANIFEST.with_suffix(".json.part")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(MANIFEST)


def contact_sheet(characters: tuple[str, ...], moods: tuple[str, ...], categories: tuple[str, ...]) -> None:
    """Write a small review sheet of the first (1 GOLD) variant per target."""
    thumbs: list[tuple[str, Image.Image]] = []
    for character in characters:
        for mood in moods:
            for category in categories:
                path = OUT / f"{character}-{mood}-{category}-{PALETTES[category][0][0]}.webp"
                if path.is_file():
                    image = Image.open(path).convert("RGBA")
                    image.thumbnail((128, 256), Image.Resampling.LANCZOS)
                    card = Image.new("RGBA", (160, 288), (24, 20, 40, 255))
                    card.alpha_composite(image, ((160 - image.width) // 2, 4))
                    thumbs.append((f"{character} {mood}\n{category}", card))
    if not thumbs:
        return
    columns = 8
    rows = math.ceil(len(thumbs) / columns)
    sheet = Image.new("RGB", (columns * 160, rows * 288), (18, 15, 30))
    for index, (_, card) in enumerate(thumbs):
        sheet.paste(card.convert("RGB"), ((index % columns) * 160, (index // columns) * 288))
    sheet.save(OUT / "contact-sheet.webp", format="WEBP", quality=88, method=6)


def main() -> None:
    args = parse_args()
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is not configured")
    workers = max(1, min(4, args.workers))
    selected = tuple(args.characters)
    moods = tuple(args.moods)
    categories = tuple(args.categories)
    OUT.mkdir(parents=True, exist_ok=True)
    write_manifest(selected, moods, categories)
    jobs = [(character, mood, category) for character in selected for mood in moods for category in categories]
    failures: list[str] = []
    log(f"garment generation: {len(jobs)} designs, max {workers} workers; palette variants are local")
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(generate_one, character, mood, category, args.timeout, args.reclean):
            (character, mood, category)
            for character, mood, category in jobs
        }
        for future in as_completed(futures):
            character, mood, category = futures[future]
            try:
                log(future.result())
            except Exception as error:
                failures.append(f"{character}/{mood}/{category}: {error}")
                log(f"FAILED {failures[-1]}")
    log(f"finished {len(jobs) - len(failures)}/{len(jobs)} designs; api_calls={_API_CALLS}; failures={len(failures)}")
    if failures:
        raise SystemExit(1)
    if selected == CHARACTERS and moods == MOODS and categories == CATEGORIES:
        # Raw edits are design sources, not shippable full-body composites.
        # Always refit them to measured pose anatomy before writing review art.
        if not all((OUT / f"clean-{category}.webp").is_file() for category in ("wand", "broom", "necklace")):
            subprocess.run([sys.executable, str(ROOT / "scripts" / "generate-clean-accessories.py")], check=True)
        subprocess.run([sys.executable, str(ROOT / "scripts" / "fit-garment-layers.py")], check=True)
    contact_sheet(selected, moods, categories)


if __name__ == "__main__":
    main()
