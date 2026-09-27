"""Align OpenAI-generated complete hatted heads to the doll's face coordinates.

This is registration/compositing, not image synthesis. Source PNGs are preserved.
The expanded canvas retains tall hat tips instead of truncating them at y=0.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.signal import fftconvolve
from scipy.ndimage import map_coordinates
from scipy.optimize import minimize

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'scripts/art-sources/doll-reference'
OUT = REFERENCE / 'prototypes'
PAD = 768
CANVAS = (1024, 2304)
ROI = (380, 215, 648, 382)


def luma(image):
    a = np.asarray(image.convert('RGBA'), dtype=np.float64)
    rgb = a[:, :, :3] * a[:, :, 3:] / 255
    return (rgb @ np.array([.299, .587, .114])) / 255


def correlation(haystack, needle):
    centered = needle - needle.mean()
    ones = np.ones(needle.shape)
    sums = fftconvolve(haystack, ones, mode='valid')
    sums_sq = fftconvolve(haystack * haystack, ones, mode='valid')
    variance = np.maximum(sums_sq - sums * sums / needle.size, 1e-8)
    scores = fftconvolve(haystack, centered[::-1, ::-1], mode='valid')
    return scores / np.sqrt(variance * np.maximum((centered * centered).sum(), 1e-8))


def register(reference, generated):
    half = generated.resize((512, 768), Image.Resampling.LANCZOS)
    raw = luma(half)
    patch = reference.crop(ROI)
    best = None
    for scale in np.arange(.75, 3.01, .05):
        template = luma(patch.resize((round(patch.width * scale / 2), round(patch.height * scale / 2)), Image.Resampling.LANCZOS))
        scores = correlation(raw, template)
        y, x = np.unravel_index(np.argmax(scores), scores.shape)
        score = float(scores[y, x])
        if best is None or score > best[0]:
            best = (score, float(scale), float(x * 2 - ROI[0] * scale), float(y * 2 - ROI[1] * scale))
    _, scale, tx, ty = best
    # Refine a rigid similarity transformation, without warping facial anatomy.
    gray = luma(generated)
    ref = luma(reference.crop(ROI))[::2, ::2]
    yy, xx = np.mgrid[ROI[1]:ROI[3]:2, ROI[0]:ROI[2]:2]
    ref = (ref - ref.mean()) / max(ref.std(), .001)
    def loss(p):
        s, angle, dx, dy = p
        if not .5 < s < 4 or abs(angle) > .25:
            return 100
        c, sn = np.cos(angle), np.sin(angle)
        sample = map_coordinates(gray, [s * (sn * xx + c * yy) + dy, s * (c * xx - sn * yy) + dx], order=1, mode='constant')
        sample = (sample - sample.mean()) / max(sample.std(), .001)
        return float(np.mean((sample - ref) ** 2))
    optimum = minimize(loss, [scale, 0, tx, ty], method='Nelder-Mead', options={'maxiter': 350, 'xatol': .01})
    s, angle, tx, ty = optimum.x
    c, sn = np.cos(angle), np.sin(angle)
    transform = (s*c, -s*sn, tx+s*sn*PAD, s*sn, s*c, ty-s*c*PAD)
    data = np.asarray(generated.convert('RGBA')).copy()
    data[data[:, :, 3] < 10] = 0
    cleaned = Image.fromarray(data)
    aligned = cleaned.transform(CANVAS, Image.Transform.AFFINE, transform, Image.Resampling.BICUBIC)
    return aligned, {'sourceToGeneratedScale': float(s), 'rotationRadians': float(angle), 'translation': [float(tx),float(ty)], 'initialCorrelation': best[0], 'refinedCorrelation': 1-float(optimum.fun)/2, 'offsetY': -PAD, 'canvas': list(CANVAS)}


def expression_patch(character, mood):
    image = Image.open(REFERENCE / f'{character}-{mood}.webp').convert('RGBA')
    # Interior feature patch only: never reintroduce the free crown or side hair.
    mask = Image.new('L', image.size)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((370, 210, 654, 325), fill=255)
    draw.ellipse((420, 290, 610, 384), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(7))
    alpha = np.minimum(np.asarray(image.getchannel('A')), np.asarray(mask))
    image.putalpha(Image.fromarray(alpha))
    result = Image.new('RGBA', CANVAS)
    result.alpha_composite(image, (0, PAD))
    return result


def attach_neck(image):
    """Attach the complete generated head to the rig's neck, without cutting it."""
    alpha = np.asarray(image.getchannel('A'))
    rows = np.where((alpha[PAD + 320:PAD + 560, 490:535] > 160).mean(axis=1) > .65)[0]
    if not len(rows):
        raise ValueError('No central neck/jaw attachment in registered head')
    bottom = int(rows[-1]) + 320
    offset = 430 - bottom
    if abs(offset) > 95:
        raise ValueError(f'Head needs an implausible neck correction: {offset}px')
    return image.transform(CANVAS, Image.Transform.AFFINE, (1,0,0,0,1,-offset), Image.Resampling.BICUBIC), offset


def main():
    specs = [('dad','hat-05'),('suan','hat-11'),('yewon','hat-01')]
    sheet = Image.new('RGB', (1080, 1740), '#29353d')
    for row, (char, item) in enumerate(specs):
        key = f'{char}-{item}'
        reference = Image.open(REFERENCE / f'{char}-neutral.webp').convert('RGBA')
        generated = Image.open(OUT / f'{key}-raw.png').convert('RGBA')
        aligned, metrics = register(reference, generated)
        aligned.save(OUT / f'{key}-registered.png')
        (OUT / f'{key}-registration.json').write_text(json.dumps(metrics, indent=2)+'\n')
        print(key, metrics, flush=True)
        body = Image.open(ROOT / 'assets/doll/rigged/body.webp').convert('RGBA')
        for col, mood in enumerate(['neutral','happy','sad']):
            head = aligned.copy()
            if mood != 'neutral':
                head.alpha_composite(expression_patch(char,mood))
            # No legacy prop/outfit layers: those have independently confirmed limb defects.
            full = Image.new('RGBA', CANVAS)
            full.alpha_composite(body, (0,PAD))
            full.alpha_composite(head)
            box = full.getchannel('A').getbbox()
            crop = full.crop((max(0,box[0]-24),max(0,box[1]-24),min(1024,box[2]+24),min(2304,box[3]+24)))
            crop.thumbnail((340,535),Image.Resampling.LANCZOS)
            x,y = col*360+(360-crop.width)//2,row*580+35
            sheet.paste(crop,(x,y),crop)
            ImageDraw.Draw(sheet).text((col*360+8,row*580+8),f'{key} {mood}',fill='white')
    path=Path('/tmp/paper-doll-qa/registered-hat-heads.png');path.parent.mkdir(parents=True,exist_ok=True);sheet.save(path)

if __name__ == '__main__':
    main()
