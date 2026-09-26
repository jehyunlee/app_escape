"""Generate Yewon and Hunho's transparent three-expression wizard sprites.

The two reference drawings are private, user-authorised inputs.  They are read
only by this script and are never copied into the web app; the generated
sprites are written to assets/wizards/.
"""
import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import io
import json
import os
from pathlib import Path
import urllib.error
import urllib.request
import uuid

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "wizards"
MODEL = "gpt-image-2.5-sunburst"
SOURCE_ROOT = Path("/Users/jehyunlee/Documents/내노트북/00_Personal/개인문서/개인정보/우리가족/그림")
PROFILES = {
    "yewon": {
        "name": "예원언니",
        "source": SOURCE_ROOT / "260925_송예원.png",
        "design": (
            "A scholarly young adult witch with the supplied person's dark hair in a neat low ponytail and the same large round black glasses. "
            "She wears a deep sapphire-blue fitted scholar's cloak with silver piping, a structured waistcoat, a small sapphire pointed hat, "
            "a silver moon necklace, tailored trousers and polished ankle boots. She carries a slim blue spellbook and a silver wand. "
            "Elegant, observant, warm and clever; sapphire, ink-blue and silver are her signature colors."
        ),
    },
    "hunho": {
        "name": "훈호오빠",
        "source": SOURCE_ROOT / "260925_송훈호.png",
        "design": (
            "A cheerful young adult stag explorer based closely on the supplied person's face and dark tousled hair, with no glasses. "
            "Keep his distinctive natural antlers as a refined small antler circlet, not animal ears. He wears a rich burgundy and silver "
            "frontier explorer coat with a fitted silver vest, leather belt, tailored charcoal trousers and sturdy boots. "
            "He carries a silver compass, a field journal and a long travelling broom. Adventurous, kind and confident; burgundy, silver and charcoal are his signature colors."
        ),
    },
}
STYLE = """Use the supplied family drawing as the identity reference. Create a professional CHARACTER SPRITE SHEET for a beautiful family fantasy game: high-end stylized 3D animated-feature character art, appealing sculpted face, softly rounded proportions, intricate layered costume, rich fabric textures, polished leather, delicate metallic details, soft cinematic rim lighting, highly finished and charming. Preserve the person's hairstyle, glasses/no glasses, antlers where present, and recognizable face identity from the reference while beautifying it.

MANDATORY LAYOUT: one image 1536x1024, exactly THREE equal vertical cells (512x1024 each), with the SAME ONE character repeated once in each cell. Left cell: neutral friendly expression, relaxed pose. Middle cell: joyful success expression, clearly smiling with delighted eyes and a small celebratory arm gesture. Right cell: gently sad/disappointed expression, clearly downturned mouth and lowered shoulders, NOT smiling and NOT crying dramatically. All three have IDENTICAL face identity, outfit, colors, hair, accessories and props, only expression and subtle pose differ. Same camera, same body scale and same baseline in every cell. Full body, from hat/hair to boot soles, no cropping. Stand front-facing or very slight three-quarter view facing the viewer. Keep every body part and prop within its 512-wide cell. Leave generous empty margins between figures. Character height around 850 pixels, boots near y=955. Hands have natural correct fingers. No text, labels, watermarks, panels, frames, other people or scenery. TRUE TRANSPARENT background, no floor or cast ground shadow, no checkerboard painted in. No huge magical effects covering the body. Natural warm-brown irises remain visible. Costume colors must be clear enough for selective recoloring later.
"""


def multipart(fields, image_bytes):
    boundary = "wizard-" + uuid.uuid4().hex
    chunks = []
    for name, value in fields.items():
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )
    chunks.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="face-reference.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
    )
    chunks.append(image_bytes)
    chunks.append(f"\r\n--{boundary}--\r\n".encode())
    return b"".join(chunks), boundary


def split_sheet(character):
    sheet = Image.open(OUT / f"{character}-sheet.png").convert("RGBA")
    if sheet.size != (1536, 1024):
        raise ValueError(f"{character}: unexpected sheet size {sheet.size}")
    if sheet.getchannel("A").getextrema()[0] == 255:
        raise ValueError(f"{character}: image does not have a transparent background")
    tiles = [sheet.crop((index * 512, 0, (index + 1) * 512, 1024)) for index in range(3)]
    boxes = [tile.getchannel("A").point(lambda value: 255 if value > 20 else 0).getbbox() for tile in tiles]
    if not all(boxes):
        raise ValueError(f"{character}: one expression cell is empty")
    union = (min(box[0] for box in boxes), min(box[1] for box in boxes), max(box[2] for box in boxes), max(box[3] for box in boxes))
    crop_width, crop_height = union[2] - union[0], union[3] - union[1]
    scale = min(464 / crop_width, 940 / crop_height)
    size = (round(crop_width * scale), round(crop_height * scale))
    for mood, tile in zip(("neutral", "happy", "sad"), tiles):
        figure = tile.crop(union).resize(size, Image.Resampling.LANCZOS)
        image = Image.new("RGBA", (512, 1024))
        image.alpha_composite(figure, ((512 - size[0]) // 2, 984 - size[1]))
        image.save(OUT / f"{character}-{mood}.webp", quality=94, method=6)
    # Character cards use a square head-and-shoulders crop from the neutral
    # sprite; this keeps portraitMarkup and avatarMarkup on the same art set.
    neutral = Image.open(OUT / f"{character}-neutral.webp").convert("RGBA")
    neutral.crop((0, 0, 512, 512)).save(
        OUT / f"{character}-portrait.webp", quality=94, method=6
    )
    print(f"{character}: three expression sprites saved", flush=True)


def generate(character):
    profile = PROFILES[character]
    source = profile["source"]
    if not source.is_file():
        raise FileNotFoundError(f"Authorised reference image is missing: {source}")
    path = OUT / f"{character}-sheet.png"
    if path.exists():
        split_sheet(character)
        return
    with Image.open(source) as reference:
        face = reference.convert("RGBA")
        memory = io.BytesIO()
        face.save(memory, format="PNG")
    prompt = STYLE + "\nCHARACTER DESIGN: " + profile["design"]
    payload, boundary = multipart(
        {
            "model": MODEL,
            "prompt": prompt,
            "size": "1536x1024",
            "quality": "high",
            "background": "transparent",
            "output_format": "png",
            "n": "1",
        },
        memory.getvalue(),
    )
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/edits",
        data=payload,
        headers={
            "Authorization": "Bearer " + os.environ["OPENAI_API_KEY"],
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    print(f"{character}: generating three-expression wizard with {MODEL}", flush=True)
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read()).get("error", {}).get("message", "Image API error")
        except ValueError:
            detail = "Unable to decode image API error"
        raise RuntimeError(f"{character}: HTTP {error.code}: {detail}") from None
    image = base64.b64decode(result["data"][0]["b64_json"], validate=True)
    temporary = path.with_suffix(".part")
    temporary.write_bytes(image)
    temporary.replace(path)
    metadata = {
        "model": MODEL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "User-provided authorised family illustration",
        "prompt": prompt,
        "moods": ["neutral", "happy", "sad"],
    }
    (OUT / f"{character}.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    split_sheet(character)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--characters", nargs="+", choices=tuple(PROFILES), default=list(PROFILES))
    parser.add_argument("--split-only", action="store_true")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    if args.split_only:
        for character in args.characters:
            split_sheet(character)
        return
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is not configured")
    failures = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(generate, character): character for character in args.characters}
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as error:
                failures.append(futures[future])
                print(f"FAILED: {error}", flush=True)
    print(f"Finished {len(args.characters) - len(failures)}/{len(args.characters)} wizard sheets; failures={failures}", flush=True)
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
