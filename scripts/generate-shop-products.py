"""Generate the 32 paid wardrobe product thumbnails.

Five isolated category templates are requested from the OpenAI Images API.  The
three prop templates already generated for the avatar renderer are reused, then
each template is recoloured and fitted into a consistent transparent square.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import io
import json
import os
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "shop-items"
MODEL = "gpt-image-2.5-flare"
SOURCE_SIZE = "1024x1024"
THUMBNAIL_SIZE = 384
PADDING = 0.12


COLORS = {
    "hat": [
        ("hat-sapphire", "#3155a6"),
        ("hat-burgundy", "#8e304d"),
        ("hat-emerald", "#2e8267"),
        ("hat-silver", "#aabfe5"),
    ],
    "necklace": [
        ("necklace-moon", "#7ba4e8"),
        ("necklace-star", "#e6ba58"),
        ("necklace-emerald", "#45b982"),
        ("necklace-pearl", "#f1e6da"),
    ],
    "cloak": [
        ("cloak-sapphire", "#263d87"),
        ("cloak-burgundy", "#7d2944"),
        ("cloak-emerald", "#286c59"),
        ("cloak-silver", "#7692c8"),
    ],
    "wand": [
        ("wand-willow", "#a96c3b"),
        ("wand-crystal", "#83b8ef"),
        ("wand-ember", "#e47a43"),
        ("wand-silver", "#d9e6f7"),
    ],
    "broom": [
        ("broom-sky", "#77a9cf"),
        ("broom-ember", "#d26943"),
        ("broom-jade", "#3da47b"),
        ("broom-lunar", "#b8c5e9"),
    ],
    "gloves": [
        ("gloves-cream", "#e8d2b4"),
        ("gloves-burgundy", "#8a3d4d"),
        ("gloves-sapphire", "#3b5fb1"),
        ("gloves-emerald", "#33856a"),
    ],
    "pants": [
        ("pants-navy", "#283d70"),
        ("pants-burgundy", "#713344"),
        ("pants-forest", "#315d4e"),
        ("pants-silver", "#7186aa"),
    ],
    "vest": [
        ("vest-gold", "#b8873c"),
        ("vest-silver", "#9aaac0"),
        ("vest-teal", "#327e83"),
        ("vest-burgundy", "#813749"),
    ],
}

PROMPTS = {
    "hat": (
        "One single isolated wizard hat, centered and shown in full on a transparent "
        "background. A complete tall, softly bent pointed wool felt hat with a broad "
        "structured brim, subtle woven texture, stitched edge, and a tasteful narrow "
        "decorative band. Hogwarts-like scholarly fantasy wardrobe, stylized realistic "
        "3D game asset, believable cloth folds and soft studio lighting. No logo or text."
    ),
    "cloak": (
        "One single isolated full-length wizard cloak garment, centered and shown in full "
        "on a transparent background. A complete unoccupied tailored travel cloak with a "
        "clear high standing collar, broad shoulders, long draping hem and visible front "
        "opening, clasp, and realistic weighty wool folds. Hogwarts-like scholarly fantasy "
        "wardrobe, stylized realistic 3D game asset, refined woven fabric, soft studio "
        "lighting. The garment is empty inside, with no person or mannequin."
    ),
    "gloves": (
        "One single isolated matching pair of wizard gloves, centered and shown in full "
        "on a transparent background. Two complete gloves arranged side by side with "
        "fingers and thumbs clearly separated, cuffs visible, natural leather seams and "
        "subtle stitched detail. Hogwarts-like scholarly fantasy wardrobe, stylized "
        "realistic 3D game asset, soft studio lighting. Empty gloves only, no hands inside."
    ),
    "pants": (
        "One single isolated pair of tailored wizard trousers, centered and shown in full "
        "on a transparent background. A complete empty pair of high-waisted trousers with "
        "two legs, waistband, fly, cuffs and believable fabric folds, arranged front-facing "
        "as a product asset. Hogwarts-like scholarly fantasy wardrobe, stylized realistic "
        "3D game asset, refined woven cloth and soft studio lighting. No body or mannequin."
    ),
    "vest": (
        "One single isolated wizard waistcoat vest, centered and shown in full on a "
        "transparent background. A complete unoccupied tailored vest with two front panels, "
        "a V neckline, armholes, hem, back panel edge and a clearly visible neat row of "
        "small buttons. Hogwarts-like scholarly fantasy wardrobe, stylized realistic 3D "
        "game asset, rich woven fabric and soft studio lighting. No person or mannequin."
    ),
}

NEGATIVE = (
    "Absolutely no humans, person, face, head, hair, skin, hands, fingers, arms, legs, "
    "body, clothing model, mannequin, hanger, extra objects, duplicate item, scene, "
    "floor, cast shadow, text, logo, border, frame, or background. Output only the one "
    "requested isolated product with transparent pixels around it."
)

REUSED = {
    "wand": ROOT / "assets" / "garments" / "clean-wand.webp",
    "broom": ROOT / "assets" / "garments" / "clean-broom.webp",
    "necklace": ROOT / "assets" / "garments" / "clean-necklace.webp",
}


def parse_hex(value: str) -> tuple[int, int, int]:
    value = value.removeprefix("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def request_template(category: str) -> bytes:
    payload = json.dumps(
        {
            "model": MODEL,
            "prompt": f"{PROMPTS[category]} {NEGATIVE}",
            "size": SOURCE_SIZE,
            "quality": "medium",
            "background": "transparent",
            "output_format": "png",
            "n": 1,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=payload,
        headers={
            "Authorization": "Bearer " + os.environ["OPENAI_API_KEY"],
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read()).get("error", {}).get("message", "image API error")
        except (ValueError, UnicodeDecodeError):
            detail = "image API error"
        raise RuntimeError(f"{category}: HTTP {error.code}: {detail}") from None
    encoded = result.get("data", [{}])[0].get("b64_json")
    if not encoded:
        raise RuntimeError(f"{category}: image API returned no b64_json")
    return base64.b64decode(encoded, validate=True)


def object_crop(image: Image.Image, name: str) -> Image.Image:
    image = image.convert("RGBA")
    if image.size != (1024, 1024):
        raise ValueError(f"{name}: expected {SOURCE_SIZE}, got {image.size}")
    alpha = image.getchannel("A")
    if alpha.getextrema()[0] > 0:
        raise ValueError(f"{name}: API output has no transparent background")
    # Keep antialiased edges, but don't let one-pixel transparent noise determine
    # the product bounds.
    threshold = alpha.point(lambda value: 255 if value >= 8 else 0)
    bbox = threshold.getbbox()
    if bbox is None:
        raise ValueError(f"{name}: API output has no visible product")
    return image.crop(bbox)


def fit_square(image: Image.Image) -> Image.Image:
    """Fit an object to a 12% outer margin without distorting or cropping it."""
    max_extent = round(THUMBNAIL_SIZE * (1 - PADDING * 2))
    scale = min(max_extent / image.width, max_extent / image.height)
    fitted = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (THUMBNAIL_SIZE, THUMBNAIL_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(
        fitted,
        (
            (THUMBNAIL_SIZE - fitted.width) // 2,
            (THUMBNAIL_SIZE - fitted.height) // 2,
        ),
    )
    return canvas


def recolor(image: Image.Image, color: str) -> Image.Image:
    """Apply a material-preserving color grade while keeping neutral trim details."""
    red, green, blue = parse_hex(color)
    opaque = image.convert("RGB")
    luminance = opaque.convert("L")
    dark = tuple(round(channel * 0.28) for channel in (red, green, blue))
    light = tuple(min(255, round(channel * 1.22 + 16)) for channel in (red, green, blue))
    tinted = ImageOps.colorize(luminance, black=dark, white=light).convert("RGBA")

    # Buttons, buckles, pearls and bright trim in the source often have neutral
    # highlights. Preserve those details instead of flattening everything to cloth.
    saturation = opaque.convert("HSV").getchannel("S")
    neutral = saturation.point(lambda value: 255 if value < 34 else 0)
    neutral = ImageChops.multiply(neutral, image.getchannel("A"))
    tinted = Image.composite(image, tinted, neutral)
    tinted.putalpha(image.getchannel("A"))
    return tinted


def source_record(category: str, image: Image.Image, source: str) -> dict[str, object]:
    encoded = io.BytesIO()
    image.save(encoded, format="PNG")
    return {
        "category": category,
        "source": source,
        "sha256": hashlib.sha256(encoded.getvalue()).hexdigest(),
        "sourceSize": list(image.size),
    }


def build_manifest(records: list[dict[str, object]]) -> dict[str, object]:
    items = []
    for category, entries in COLORS.items():
        source = (
            f"assets/garments/clean-{category}.webp"
            if category in REUSED
            else f"openai-template:{category}"
        )
        for item_id, color in entries:
            items.append(
                {
                    "id": item_id,
                    "category": category,
                    "color": color,
                    "file": f"assets/shop-items/{item_id}.webp",
                    "model": "reused-garment" if category in REUSED else MODEL,
                    "source": source,
                    "canvas": [THUMBNAIL_SIZE, THUMBNAIL_SIZE],
                }
            )
    return {
        "model": MODEL,
        "quality": "medium",
        "background": "transparent",
        "sourceSize": SOURCE_SIZE,
        "thumbnailSize": [THUMBNAIL_SIZE, THUMBNAIL_SIZE],
        "padding": PADDING,
        "apiCalls": 5,
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "templates": records,
        "items": items,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source-dir",
        type=Path,
        help="Optional directory containing category PNGs, for offline reruns.",
    )
    args = parser.parse_args()
    if not args.source_dir and not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is not configured")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    templates: dict[str, Image.Image] = {}
    records: list[dict[str, object]] = []
    temporary_dir = Path(tempfile.mkdtemp(prefix="shop-product-sources-"))
    for category in COLORS:
        if category in REUSED:
            raw = Image.open(REUSED[category]).convert("RGBA")
            source_name = str(REUSED[category].relative_to(ROOT))
        else:
            source_path = args.source_dir / f"{category}.png" if args.source_dir else None
            raw_bytes = source_path.read_bytes() if source_path else request_template(category)
            (temporary_dir / f"{category}.png").write_bytes(raw_bytes)
            raw = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
            source_name = f"openai-template:{category}"
        cropped = object_crop(raw, category) if raw.size == (1024, 1024) else raw
        templates[category] = cropped
        records.append(source_record(category, cropped, source_name))
        print(f"{category}: source crop {cropped.width}x{cropped.height}", flush=True)

    for category, entries in COLORS.items():
        for item_id, color in entries:
            output = fit_square(recolor(templates[category], color))
            output_path = OUTPUT / f"{item_id}.webp"
            temporary = output_path.with_suffix(".part.webp")
            output.save(temporary, format="WEBP", quality=95, method=6)
            temporary.replace(output_path)
            print(f"{item_id}: {output_path.relative_to(ROOT)}", flush=True)

    manifest_path = OUTPUT / "manifest.json"
    manifest_path.write_text(
        json.dumps(build_manifest(records), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(COLORS) * 4} thumbnails and {manifest_path.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    main()
