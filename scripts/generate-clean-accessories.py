"""Generate three isolated accessory sprites with the OpenAI Images API."""
from __future__ import annotations

import base64
import io
import json
import os
from pathlib import Path
import urllib.error
import urllib.request

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "garments"
MODEL = "gpt-image-2.5-flare"
SIZE = "1024x1536"

PROMPTS = {
    "wand": (
        "One single isolated fantasy wand accessory, centered vertically on a transparent "
        "background. Slender rich dark wood with subtle organic grain, a refined silver cap "
        "at the top, and one tiny tasteful gemstone set into the tip. Full wand visible from "
        "end to end, elegant realistic construction, no magic glow. High-end stylized 3D "
        "animated-fantasy game asset, polished materials, soft studio rim light."
    ),
    "broom": (
        "One single isolated flying broom accessory, centered on a transparent background. "
        "A realistic full-length wooden broom shown vertical with a slight diagonal from upper "
        "left toward lower right, richly textured warm wood handle and a substantial natural "
        "bristle bundle at the lower end. Complete object visible end to end, believable "
        "binding and fibers, no rider. High-end stylized 3D animated-fantasy game asset, "
        "polished materials, soft studio rim light."
    ),
    "necklace": (
        "One single isolated necklace accessory, centered on a transparent background. A thin "
        "delicate metallic chain in a clean U shape with a small crescent-moon pendant exactly "
        "at the center. The pendant has a clearly visible transparent hole, with no fill behind "
        "the hole; complete chain and pendant visible, no clasp emphasis. High-end stylized "
        "3D animated-fantasy game asset, delicate polished metal, soft studio rim light."
    ),
}

NEGATIVE = (
    "Absolutely no humans, person, face, head, hair, skin, hands, fingers, arms, body, "
    "clothing, garments, mannequin, character, extra objects, duplicate object, scene, "
    "floor, shadow, text, logo, border, frame, or background. The output must contain only "
    "the one requested accessory and transparent pixels around it."
)


def request_image(name: str) -> bytes:
    prompt = f"{PROMPTS[name]} {NEGATIVE}"
    payload = json.dumps(
        {
            "model": MODEL,
            "prompt": prompt,
            "size": SIZE,
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
        raise RuntimeError(f"{name}: HTTP {error.code}: {detail}") from None
    encoded = result.get("data", [{}])[0].get("b64_json")
    if not encoded:
        raise RuntimeError(f"{name}: image API returned no b64_json")
    return base64.b64decode(encoded, validate=True)


def save_cropped(name: str, image_bytes: bytes) -> None:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    if image.size != (1024, 1536):
        raise ValueError(f"{name}: expected {SIZE}, got {image.size}")
    alpha = image.getchannel("A")
    if alpha.getextrema()[0] > 0:
        raise ValueError(f"{name}: API returned no transparent background")
    # Ignore antialiasing noise while retaining the actual edge of the object.
    threshold = alpha.point(lambda value: 255 if value >= 8 else 0)
    bbox = threshold.getbbox()
    if bbox is None:
        raise ValueError(f"{name}: image has no visible object")
    cropped = image.crop(bbox)
    path = OUTPUT / f"clean-{name}.webp"
    temporary = path.with_suffix(".part.webp")
    cropped.save(temporary, format="WEBP", quality=95, method=6)
    temporary.replace(path)
    print(f"{name}: saved {path.relative_to(ROOT)} ({cropped.width}x{cropped.height})", flush=True)


def main() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is not configured")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name in ("wand", "broom", "necklace"):
        # One request per accessory; do not retry or synthesize a fallback.
        save_cropped(name, request_image(name))


if __name__ == "__main__":
    main()
