"""Index actual replacement layers and their body-relative bounds."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def build(doll):
    files = {}

    def add(path, x=0, y=0):
        with Image.open(path) as source:
            image = source.convert('RGBA')
        box = image.getchannel('A').getbbox()
        if not box:
            raise ValueError(f'Empty runtime layer: {path}')
        relative = str(path.relative_to(doll))
        files[relative] = {
            'width': image.width, 'height': image.height, 'x': x, 'y': y,
            'bbox': [box[0] + x, box[1] + y, box[2] + x, box[3] + y],
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        }

    accessories = json.loads((doll / 'rigged/accessories.json').read_text())
    for filename in ['body-upper.webp', 'hands-base.webp', 'starter-pants.webp', 'boots.webp']:
        add(doll / 'rigged' / filename)
    for category in ['necklace', 'wand', 'broom']:
        variants = [f'{i:02d}' for i in range(1, 13)]
        if category in ['wand', 'broom']:
            variants.append('base')
        for variant in variants:
            filename = f'{category}-{variant}.webp'
            record = accessories[filename]
            placement = record.get('placement', {'x': 0, 'y': 0})
            add(doll / 'rigged' / filename, placement['x'], placement['y'])
            grip = record.get('gripLayer')
            if grip:
                add(doll / 'rigged' / grip['file'], grip['x'], grip['y'])
                files[f'rigged/{filename}']['gripLayer'] = f"rigged/{grip['file']}"
    for category in ['cloak', 'vest', 'pants']:
        for i in range(1, 13):
            add(doll / 'rigged/clothing' / f'{category}-{i:02d}.webp')
    for i in range(1, 13):
        add(doll / 'rigged/gloves' / f'gloves-{i:02d}.webp')
    for character in ['dad', 'mom', 'jeongan', 'suan', 'yewon', 'hunho']:
        add(doll / 'rigged/necks' / f'{character}.webp')
        for i in range(1, 13):
            add(doll / 'rigged/necks' / f'{character}-hat-{i:02d}.webp')
        for mood in ['neutral', 'happy', 'sad']:
            add(doll / 'headwear' / f'{character}-{mood}-bare.webp', y=-768)
            for i in range(1, 13):
                add(doll / 'headwear' / f'{character}-{mood}-hat-{i:02d}.webp', y=-768)
        with Image.open(doll / 'headwear' / f'{character}-neutral-bare.webp') as source:
            head = source.convert('RGBA')
        head_box = head.getchannel('A').getbbox()
        portrait_source = Image.new('RGBA', head.size)
        with Image.open(doll / 'rigged/necks' / f'{character}.webp') as source:
            portrait_source.alpha_composite(source.convert('RGBA'), (0, 768))
        with Image.open(doll / 'rigged/body-upper.webp') as source:
            portrait_source.alpha_composite(source.convert('RGBA'), (0, 768))
        portrait_source.alpha_composite(head)
        head = portrait_source.crop((
            max(0, head_box[0] - 12), head_box[1],
            min(1024, head_box[2] + 12), max(head_box[3], 768 + 510),
        ))
        head.thumbnail((920, 920), Image.Resampling.LANCZOS)
        portrait = Image.new('RGBA', (1024, 1024))
        portrait.alpha_composite(head, ((1024 - head.width) // 2, (1024 - head.height) // 2))
        portrait_path = doll / 'headwear' / f'{character}-portrait.webp'
        portrait.save(portrait_path, format='WEBP', quality=94, method=6)
        add(portrait_path)
    manifest = {
        'schema': 'paper-doll-rig-v2', 'bodyCanvas': [1024, 1536],
        'anatomy': 'one fixed two-arm rig; one character neck behind shirt and jewellery; complete jaw and hair in front; exclusive hands and split wand grip',
        'files': files,
    }
    (doll / 'rigged/runtime.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'Indexed {len(files)} runtime layers and portraits in {doll}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--doll-dir', type=Path, default=ROOT / 'assets/doll')
    arguments = parser.parse_args()
    build(arguments.doll_dir.resolve())


if __name__ == '__main__':
    main()
