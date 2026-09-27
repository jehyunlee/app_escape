"""Create four distinctive wizards and their three expressions with OpenAI Images."""
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
OUT = ROOT / 'assets' / 'wizards'
MODEL = 'gpt-image-2.5-sunburst'
PROFILES = {
    'dad': {
        'crop': (32, 36, 552, 556),
        'design': 'An approachable adult father wizard, short neatly side-parted brown hair and distinctive RECTANGULAR black glasses like the supplied face. A navy-blue pointed astronomy hat, elegant midnight-blue layered coat with gold constellation embroidery, waistcoat, brass buckles and sturdy leather boots. A compact leather backpack with rolled star charts is worn on his back. Holds a beautiful brass astrolabe in one hand and a slender celestial wand in the other. Distinguished star scholar and explorer, warm intelligent expression, no beard. Navy and antique gold are his signature colors.',
    },
    'mom': {
        'crop': (600, 50, 1170, 570),
        'design': 'A warm confident adult mother witch with brown softly curved bob-length hair and ROUND black glasses matching the supplied face. A sculptural emerald-green wide-brim pointed hat with tiny botanical embroidery, a sophisticated forest-green layered robe, flowing short cape, gold leaf clasps and brown boots. A small worn backpack containing botanical notebooks is worn on her back. Holds a graceful living-wood staff topped with a luminous leaf-shaped emerald, with a tiny potion bottle hanging at her belt. Elegant forest alchemist and botanical guardian. Emerald green, warm gold and leaf motifs, clearly different silhouette from an astronomy wizard.',
    },
    'jeongan': {
        'crop': (620, 555, 1165, 1000),
        'design': 'A youthful cheerful lunar wizard apprentice with short rounded brown bob hair and distinctive small OVAL/ROUND black glasses matching the supplied face. A tilted violet pointed hat with a silver crescent, a layered deep-violet coat with cyan lining, a short asymmetric star-pattern cape, silver fasteners and soft violet boots. A little backpack with a moon-shaped clasp is worn on the back. Holds a silver wand casting a small delicate crescent-and-star glow, not huge effects. Creative moon magician, charming and clever. Violet, pale silver, cyan accents. Keep her face recognizable, no animal ears or invented pigtails.',
    },
    'suan': {
        'crop': (45, 550, 625, 1005),
        'design': 'A youthful lively flying-witch explorer with medium-long brown hair and NO glasses, matching the supplied smiling face. A jaunty coral-red pointed hat with a gold feather, a tailored coral and amber flight coat, cream scarf, warm gold toggles and practical dark riding boots. A small leather travel backpack is worn on her back. Holds a beautifully detailed full-length wooden flying BROOM with a clearly recognizable large golden straw head, completely inside her panel. Adventurous wind rider, spirited and friendly, not seated on broom. Coral red, amber and cream give her a very different silhouette and palette.',
    },
}
STYLE = '''Use the supplied cropped family drawing as the identity reference. Create a professional CHARACTER SPRITE SHEET for a beautiful family fantasy game: high-end stylized 3D animated-feature character art, sculpted appealing face, softly rounded proportions, intricate layered costume, rich fabric textures, polished leather, delicate metallic details, soft cinematic rim lighting, highly finished and charming. Preserve the person's hairstyle, glasses/no glasses and recognizable face identity from the reference while beautifying it. Never use the old simple flat-vector robe style.

MANDATORY LAYOUT: one image 1536x1024, exactly THREE equal vertical cells (512x1024 each), with the SAME ONE character repeated once in each cell. Left cell: neutral friendly expression, relaxed pose. Middle cell: joyful success expression, clearly smiling with delighted eyes and a small celebratory arm gesture. Right cell: gently sad/disappointed expression, clearly downturned mouth and lowered shoulders, NOT smiling and NOT crying dramatically. All three must have IDENTICAL face identity, outfit, colors, hat, backpack and props, only expression and subtle pose differ. Same camera, same body scale and same baseline in every cell. Full body, from pointed hat to boot soles, no cropping. Stand front-facing or very slight three-quarter view facing the viewer. Keep ALL body parts, broom, staff, wand and light effects WITHIN each 512-wide cell. Leave generous empty margins between the figures. Character height around 850 pixels, boots near y=955, hat around y=100. Hands have natural correct fingers. No text, letters, labels, watermarks, panels, frames, other people or scenery. TRUE TRANSPARENT background, no floor or cast ground shadow, no checkerboard painted in. No huge magical effects covering the body. Irises should be natural warm brown and visible. Costume colors should be clear enough for selective recoloring later. '''


def multipart(fields, image_bytes):
    boundary = 'wizard-' + uuid.uuid4().hex
    chunks = []
    for name, value in fields.items():
        chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="face-reference.png"\r\nContent-Type: image/png\r\n\r\n'.encode())
    chunks.append(image_bytes)
    chunks.append(f'\r\n--{boundary}--\r\n'.encode())
    return b''.join(chunks), boundary


def split_sheet(character):
    sheet = Image.open(OUT / f'{character}-sheet.png').convert('RGBA')
    if sheet.size != (1536, 1024):
        raise ValueError(f'{character}: unexpected sheet size {sheet.size}')
    if sheet.getchannel('A').getextrema()[0] == 255:
        raise ValueError(f'{character}: image does not have a transparent background')
    tiles = [sheet.crop((index * 512, 0, (index + 1) * 512, 1024)) for index in range(3)]
    boxes = [tile.getchannel('A').point(lambda value: 255 if value > 20 else 0).getbbox() for tile in tiles]
    if not all(boxes):
        raise ValueError(f'{character}: one expression cell is empty')
    union = (min(box[0] for box in boxes), min(box[1] for box in boxes), max(box[2] for box in boxes), max(box[3] for box in boxes))
    crop_width, crop_height = union[2] - union[0], union[3] - union[1]
    scale = min(464 / crop_width, 940 / crop_height)
    size = (round(crop_width * scale), round(crop_height * scale))
    for mood, tile in zip(('neutral', 'happy', 'sad'), tiles):
        figure = tile.crop(union).resize(size, Image.Resampling.LANCZOS)
        image = Image.new('RGBA', (512, 1024))
        image.alpha_composite(figure, ((512 - size[0]) // 2, 984 - size[1]))
        image.save(OUT / f'{character}-{mood}.webp', quality=94, method=6)
    print(f'{character}: three expression sprites saved', flush=True)


def generate(character):
    path = OUT / f'{character}-sheet.png'
    if path.exists():
        split_sheet(character)
        return
    with Image.open(ROOT / 'assets' / 'family-characters.webp') as reference:
        face = reference.crop(PROFILES[character]['crop']).convert('RGBA')
        memory = io.BytesIO()
        face.save(memory, format='PNG')
    prompt = STYLE + '\nCHARACTER DESIGN: ' + PROFILES[character]['design']
    payload, boundary = multipart({'model': MODEL, 'prompt': prompt, 'size': '1536x1024', 'quality': 'high', 'background': 'transparent', 'output_format': 'png', 'n': '1'}, memory.getvalue())
    request = urllib.request.Request('https://api.openai.com/v1/images/edits', data=payload, headers={'Authorization': 'Bearer ' + os.environ['OPENAI_API_KEY'], 'Content-Type': f'multipart/form-data; boundary={boundary}'})
    print(f'{character}: generating three-expression wizard with {MODEL}', flush=True)
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read()).get('error', {}).get('message', 'Image API error')
        except ValueError:
            detail = 'Unable to decode image API error'
        raise RuntimeError(f'{character}: HTTP {error.code}: {detail}') from None
    image = base64.b64decode(result['data'][0]['b64_json'], validate=True)
    temporary = path.with_suffix('.part')
    temporary.write_bytes(image)
    temporary.replace(path)
    metadata = {'model': MODEL, 'generated_at': datetime.now(timezone.utc).isoformat(), 'source': 'User-provided cropped family illustration', 'prompt': prompt, 'moods': ['neutral', 'happy', 'sad']}
    (OUT / f'{character}.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    split_sheet(character)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--characters', nargs='+', choices=tuple(PROFILES), default=list(PROFILES))
    parser.add_argument('--split-only', action='store_true')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    if args.split_only:
        for character in args.characters:
            split_sheet(character)
        return
    if not os.environ.get('OPENAI_API_KEY'):
        raise SystemExit('OPENAI_API_KEY is not configured')
    failures = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(generate, character): character for character in args.characters}
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as error:
                failures.append(futures[future])
                print(f'FAILED: {error}', flush=True)
    print(f'Finished {len(args.characters) - len(failures)}/{len(args.characters)} wizard sheets; failures={failures}', flush=True)
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
