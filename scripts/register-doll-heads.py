"""Align OpenAI-generated complete hatted heads to the doll's face coordinates.

This is registration/compositing, not image synthesis. Source PNGs are preserved.
The expanded canvas retains tall hat tips instead of truncating them at y=0.
"""

from pathlib import Path
from functools import lru_cache
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.signal import fftconvolve
from scipy.ndimage import map_coordinates
from scipy.ndimage import (
    label,
    find_objects,
    binary_fill_holes,
    binary_closing,
    binary_erosion,
)
from scipy.optimize import minimize

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / "scripts/art-sources/doll-reference"
PAD = 768
CANVAS = (1024, 2304)
ROI = (380, 215, 648, 382)


def luma(image):
    a = np.asarray(image.convert("RGBA"), dtype=np.float64)
    rgb = a[:, :, :3] * a[:, :, 3:] / 255
    return (rgb @ np.array([0.299, 0.587, 0.114])) / 255


def correlation(haystack, needle):
    centered = needle - needle.mean()
    ones = np.ones(needle.shape)
    sums = fftconvolve(haystack, ones, mode="valid")
    sums_sq = fftconvolve(haystack * haystack, ones, mode="valid")
    variance = np.maximum(sums_sq - sums * sums / needle.size, 1e-8)
    scores = fftconvolve(haystack, centered[::-1, ::-1], mode="valid")
    return scores / np.sqrt(variance * np.maximum((centered * centered).sum(), 1e-8))


def register(reference, generated):
    half = generated.resize((512, 768), Image.Resampling.LANCZOS)
    raw = luma(half)
    patch = reference.crop(ROI)
    best = None
    for scale in np.arange(0.75, 3.01, 0.05):
        template = luma(
            patch.resize(
                (round(patch.width * scale / 2), round(patch.height * scale / 2)),
                Image.Resampling.LANCZOS,
            )
        )
        scores = correlation(raw, template)
        y, x = np.unravel_index(np.argmax(scores), scores.shape)
        score = float(scores[y, x])
        if best is None or score > best[0]:
            best = (
                score,
                float(scale),
                float(x * 2 - ROI[0] * scale),
                float(y * 2 - ROI[1] * scale),
            )
    _, scale, tx, ty = best
    # Refine a rigid similarity transformation, without warping facial anatomy.
    gray = luma(generated)
    ref = luma(reference.crop(ROI))[::2, ::2]
    yy, xx = np.mgrid[ROI[1] : ROI[3] : 2, ROI[0] : ROI[2] : 2]
    ref = (ref - ref.mean()) / max(ref.std(), 0.001)

    def loss(p):
        s, angle, dx, dy = p
        if not 0.5 < s < 4 or abs(angle) > 0.25:
            return 100
        c, sn = np.cos(angle), np.sin(angle)
        sample = map_coordinates(
            gray,
            [s * (sn * xx + c * yy) + dy, s * (c * xx - sn * yy) + dx],
            order=1,
            mode="constant",
        )
        sample = (sample - sample.mean()) / max(sample.std(), 0.001)
        return float(np.mean((sample - ref) ** 2))

    optimum = minimize(
        loss,
        [scale, 0, tx, ty],
        method="Nelder-Mead",
        options={"maxiter": 350, "xatol": 0.01},
    )
    s, angle, tx, ty = optimum.x
    c, sn = np.cos(angle), np.sin(angle)
    transform = (s * c, -s * sn, tx + s * sn * PAD, s * sn, s * c, ty - s * c * PAD)
    data = np.asarray(generated.convert("RGBA")).copy()
    data[data[:, :, 3] < 10] = 0
    cleaned = Image.fromarray(data)
    aligned = cleaned.transform(
        CANVAS, Image.Transform.AFFINE, transform, Image.Resampling.BICUBIC
    )
    return aligned, {
        "sourceToGeneratedScale": float(s),
        "rotationRadians": float(angle),
        "translation": [float(tx), float(ty)],
        "initialCorrelation": best[0],
        "refinedCorrelation": 1 - float(optimum.fun) / 2,
        "offsetY": -PAD,
        "canvas": list(CANVAS),
    }


def mouth_box(image, jaw_y):
    """Locate the actual lip/cavity feature, never include a second jaw."""
    x0, x1 = 430, 615
    y0, y1 = max(280, int(jaw_y) - 110), min(395, int(jaw_y) - 10)
    pixels = np.asarray(image.convert("RGBA"))[y0:y1, x0:x1]
    rgb = pixels[:, :, :3].astype(float)
    dark = (
        (pixels[:, :, 3] > 180)
        & (rgb[:, :, 0] < 215)
        & (rgb[:, :, 1] < 145)
        & (rgb[:, :, 2] < 140)
    )
    components, _ = label(dark)
    candidates = []
    for box in find_objects(components):
        if box is None:
            continue
        ys, xs = box
        width, height = xs.stop - xs.start, ys.stop - ys.start
        centre_x = x0 + (xs.start + xs.stop) / 2
        centre_y = y0 + (ys.start + ys.stop) / 2
        if width < 24 or height > 70 or abs(centre_x - 512) > 35:
            continue
        score = width / (1 + abs(centre_y - (jaw_y - 52)) / 14)
        candidates.append(
            (
                score,
                (
                    x0 + xs.start - 7,
                    y0 + ys.start - 7,
                    x0 + xs.stop + 7,
                    y0 + ys.stop + 7,
                ),
            )
        )
    if not candidates:
        raise ValueError("No reliable mouth landmark in expression source")
    return max(candidates)[1]


@lru_cache(maxsize=6)
def face_interior(character):
    pixels = np.asarray(
        Image.open(REFERENCE / f"{character}-neutral-full.png").convert("RGBA")
    ).astype(np.int16)
    skin = (
        (pixels[:, :, 3] > 180)
        & (pixels[:, :, 0] > 150)
        & (pixels[:, :, 0] - pixels[:, :, 1] > 25)
    )
    region = np.zeros(skin.shape, dtype=bool)
    region[180:440, 330:700] = True
    skin &= region
    return binary_erosion(
        binary_fill_holes(binary_closing(skin, iterations=2)), iterations=2
    )


def expression_patch(character, mood, jaw_y):
    image = Image.open(REFERENCE / f"{character}-{mood}-full.png").convert("RGBA")
    neutral = Image.open(REFERENCE / f"{character}-neutral-full.png").convert("RGBA")
    reference_box = mouth_box(neutral, jaw_y)
    # Preserve the intact eyes, glasses, nose and jaw. A source-authored smile
    # or frown is sufficient to express the state without splicing whole faces.
    # This source's small frown is lighter than its nose. The authored lip ROI
    # excludes the nose and includes both corners (measured on the intact PNG).
    source_box = (
        (478, 324, 538, 348)
        if (character, mood) == ("hunho", "sad")
        else mouth_box(image, jaw_y)
    )
    centre_x = (reference_box[0] + reference_box[2]) / 2
    top = reference_box[1]
    width = max(source_box[2] - source_box[0], reference_box[2] - reference_box[0]) + 20
    source_height = (
        max(source_box[3] - source_box[1], reference_box[3] - reference_box[1]) + 8
    )
    source_region = (
        source_box[0],
        source_box[1] + 3,
        source_box[2],
        source_box[3],
    )
    height = min(source_height, max(12, int(jaw_y) - 10 - top))
    mouth = image.crop(source_region).resize((width, height), Image.Resampling.LANCZOS)
    mouth_mask = Image.new("L", mouth.size)
    ImageDraw.Draw(mouth_mask).ellipse(
        (-8, -8, mouth.width + 7, mouth.height + 7), fill=255
    )
    mouth_mask = mouth_mask.filter(ImageFilter.GaussianBlur(3))
    yy, xx = np.mgrid[:height, :width]
    edge = np.minimum.reduce((xx, yy, width - 1 - xx, height - 1 - yy))
    feather = np.clip(edge.astype(float) / 4, 0, 1)
    feather = feather * feather * (3 - 2 * feather)
    opacity = np.minimum(np.asarray(mouth.getchannel("A")), np.asarray(mouth_mask))
    mouth.putalpha(Image.fromarray(np.rint(opacity * feather).astype(np.uint8)))
    patch = Image.new("RGBA", image.size)
    patch.alpha_composite(mouth, (round(centre_x - width / 2), top))
    alpha = np.asarray(patch.getchannel("A")).copy()
    alpha[~face_interior(character)] = 0
    patch.putalpha(Image.fromarray(alpha))
    result = Image.new("RGBA", CANVAS)
    result.alpha_composite(patch, (0, PAD))
    return result
