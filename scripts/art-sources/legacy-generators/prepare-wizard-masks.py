"""Prepare local selective-color masks and portrait crops for generated wizards."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1] / 'assets' / 'wizards'
MOODS = ('neutral', 'happy', 'sad')
FACE = {
    'dad': (145, 210, 385, 416),
    'mom': (190, 298, 382, 450),
    'jeongan': (158, 272, 405, 465),
    'suan': (178, 242, 376, 408),
}
PORTRAIT = {
    'dad': (133, 168, 397, 432),
    'mom': (182, 260, 398, 476),
    'jeongan': (151, 232, 409, 490),
    'suan': (166, 205, 386, 425),
}
HANDS = {
    'dad': {'neutral': [(62,447,138,558),(285,566,402,637)], 'happy': [(34,174,130,296),(374,351,474,474)], 'sad': [(86,620,192,720),(289,543,419,637)]},
    'mom': {'neutral': [(117,476,207,567),(299,467,378,568)], 'happy': [(94,474,194,564),(331,362,414,477)], 'sad': [(97,478,193,561),(294,501,397,584)]},
    'jeongan': {'neutral': [(91,485,167,575),(379,619,490,701)], 'happy': [(85,349,163,459),(345,377,414,467)], 'sad': [(222,629,322,715)]},
    'suan': {'neutral': [(119,432,204,535),(364,563,481,676)], 'happy': [(105,451,192,535),(329,318,407,439)], 'sad': [(170,508,290,651)]},
}
EYES = {
    'dad': {'neutral': [(224,293,14),(295,292,14)], 'sad': [(212,320,14),(275,326,14)]},
    'mom': {'neutral': [(256,350,10),(306,345,10)], 'sad': [(223,369,10),(266,362,10)]},
    'jeongan': {'neutral': [(239,353,14),(309,342,14)], 'sad': [(240,389,13),(306,378,13)]},
    'suan': {'neutral': [(245,312,11),(298,315,11)], 'sad': [(232,339,10),(288,343,10)]},
}


def regions(rectangles, shape):
    result = np.zeros(shape, dtype=bool)
    for left, top, right, bottom in rectangles:
        result[top:bottom, left:right] = True
    return result


def save_mask(path, selected, alpha):
    expanded = Image.fromarray((selected * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.55))
    opacity = (np.asarray(expanded, dtype=np.float32) * alpha / 255).astype('uint8')
    mask = Image.new('RGBA', (512, 1024), (255, 255, 255, 0))
    mask.putalpha(Image.fromarray(opacity))
    mask.save(path, lossless=True)
    return int(np.count_nonzero(opacity > 30))


def main():
    report = {}
    for character in FACE:
        for mood in MOODS:
            image = Image.open(ROOT / f'{character}-{mood}.webp').convert('RGBA')
            rgba = np.asarray(image)
            alpha = rgba[:, :, 3].astype('float32')
            hsv = np.asarray(image.convert('HSV'), dtype='float32')
            hue, saturation, value = hsv[:,:,0] * (360 / 255), hsv[:,:,1] / 255, hsv[:,:,2] / 255
            opaque = alpha > 100
            face = regions([FACE[character]], alpha.shape)
            skin_region = face | regions(HANDS[character][mood], alpha.shape)
            skin = skin_region & opaque & (hue >= 10) & (hue <= 48) & (saturation >= .20) & (saturation <= .66) & (value >= .55)
            if character == 'dad':
                robe = (hue >= 190) & (hue <= 260) & (saturation > .15)
            elif character == 'mom':
                robe = (hue >= 75) & (hue <= 175) & (saturation > .12)
                yy, xx = np.indices(alpha.shape)
                robe &= ((yy < 340) & (xx > 150)) | ((yy >= 340) & (xx > 170))
            elif character == 'jeongan':
                robe = (hue >= 235) & (hue <= 300) & (saturation > .15)
            else:
                robe = ((hue <= 22) | (hue >= 345)) & (saturation > .30)
            robe &= opaque & ~face & ~skin & (value > .07)
            yy, xx = np.indices(alpha.shape)
            eye_region = np.zeros(alpha.shape, dtype=bool)
            for cx, cy, radius in EYES[character].get(mood, []):
                eye_region |= ((xx-cx)/radius)**2 + ((yy-cy)/(radius*.9))**2 <= 1
            eyes = eye_region & opaque & (hue >= 10) & (hue <= 55) & (saturation > .28) & (value > .16) & (value < .70)
            skin &= ~eye_region
            counts = {}
            for category, selection in [('robe', robe), ('skin', skin), ('eyes', eyes)]:
                counts[category] = save_mask(ROOT / f'{character}-{mood}-{category}.webp', selection, alpha)
            if counts['robe'] < 3000 or counts['skin'] < 1000:
                raise ValueError(f'Insufficient color mask coverage: {character} {mood} {counts}')
            if mood == 'neutral' and counts['eyes'] < 20:
                raise ValueError(f'No visible iris mask for {character}')
            report[f'{character}-{mood}'] = counts
            print(character, mood, counts)
        portrait = Image.open(ROOT / f'{character}-neutral.webp').crop(PORTRAIT[character]).resize((256, 256), Image.Resampling.LANCZOS)
        portrait.save(ROOT / f'{character}-portrait.webp', quality=95, method=6)
    (ROOT / 'masks.json').write_text(json.dumps(report, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
