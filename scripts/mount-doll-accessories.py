"""Register isolated accessory artwork on the fixed paper-doll rig.

This pass writes the complete accessory set (twelve necklaces plus thirteen
wand and thirteen broom products, including starter layers) plus its manifest.
The anatomical rig helpers remain in this module for the other registration
scripts, but ``main`` deliberately does not call them: body, hands and trouser
layers are owned by their respective generators.

An alternate source set is always isolated with ``--design-dir
--output-dir --qa-dir``.  All field-wardrobe products use the same canonical
fit table in either output mode; alternate output is only a write-safety and
QA boundary.
"""
import argparse
from pathlib import Path
import hashlib
import json
import math

from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DOLL = ROOT / "assets" / "doll"
PUBLISHED_OUT = DOLL / "rigged"
OUT = PUBLISHED_OUT
DEFAULT_DESIGNS = ROOT / "scripts" / "art-sources" / "field-wardrobe" / "designs"
DESIGN_DIR = DEFAULT_DESIGNS
QA_DIR = Path("/tmp/paper-doll-qa")
CANDIDATE_MODE = False
SIZE = (1024, 1536)

# The closed viewer-left fist is the wand hand.  The cuff/wrist seam is above
# the authored thumb/index webbing; this point is measured from the bare fist
# and checked against every existing glove layer.  The foreground split ends
# here; pixels on the lower-handle side remain in the back layer.
WAND_TARGET = (289, 884)
WAND_OPENING_BOUNDS = (270, 862, 312, 898)
# Brooms are back-layer props.  Their lengths are increased uniformly below;
# this is the requested high handle corridor before per-source viewport fitting.
BROOM_HANDLE_TIP = (840, 260)
BROOM_LENGTH_SCALE = 1.25
BROOM_VIEWPORT_MARGIN = 6
BROOM_RENDER_PADDING = 512
NECK_ELLIPSE = (460, 396, 570, 469)

# Fractions are measured on the actual field-wardrobe source artwork before
# any orientation correction. ``sourceGripAnchor`` is inside the graspable
# handle, not its upper boundary or the wrist.  The field products are all
# authored upright with the handle at the bottom, so this canonical table has
# no product-specific 180-degree turns.
WAND_FITS = {
    "wand-01": {"sourceGripAnchor": [0.50, 0.86], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-02": {"sourceGripAnchor": [0.50, 0.86], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-03": {"sourceGripAnchor": [0.50, 0.84], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-04": {"sourceGripAnchor": [0.50, 0.86], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-05": {"sourceGripAnchor": [0.50, 0.86], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-06": {"sourceGripAnchor": [0.50, 0.86], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-07": {"sourceGripAnchor": [0.50, 0.88], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-08": {"sourceGripAnchor": [0.50, 0.84], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-09": {"sourceGripAnchor": [0.50, 0.87], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-10": {"sourceGripAnchor": [0.50, 0.87], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-11": {"sourceGripAnchor": [0.50, 0.88], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-12": {"sourceGripAnchor": [0.50, 0.88], "rotateSource": 0, "rotationDegrees": 45, "height": 400},
    "wand-base": {"sourceGripAnchor": [0.50, 0.90], "rotateSource": 0, "rotationDegrees": 45, "height": 310},
}

# Broom junctions were read from each source's handle/bristle transition.  A
# broom has no hand-width constraint: its whole product is scaled uniformly and
# retained as a back-carry prop.  ``handleShape`` records the visible curve
# family for downstream QA/debugging, not a synthetic fallback geometry.
BROOM_FITS = {
    "broom-01": {"sourceJunctionAnchor": [0.50, 0.708], "handleShape": "straight-wood", "rotationDegrees": -30, "height": 1120},
    "broom-02": {"sourceJunctionAnchor": [0.50, 0.610], "handleShape": "bundled-reed", "rotationDegrees": -30, "height": 1120},
    "broom-03": {"sourceJunctionAnchor": [0.50, 0.584], "handleShape": "banded-wood", "rotationDegrees": -30, "height": 1120},
    "broom-04": {"sourceJunctionAnchor": [0.50, 0.713], "handleShape": "wide-band-reinforced", "rotationDegrees": -30, "height": 1120},
    "broom-05": {"sourceJunctionAnchor": [0.50, 0.592], "handleShape": "bent-wood", "rotationDegrees": -30, "height": 1120},
    "broom-06": {"sourceJunctionAnchor": [0.50, 0.593], "handleShape": "metal-collar", "rotationDegrees": -30, "height": 1120},
    "broom-07": {"sourceJunctionAnchor": [0.50, 0.690], "handleShape": "carved-wood", "rotationDegrees": -30, "height": 1120},
    "broom-08": {"sourceJunctionAnchor": [0.50, 0.504], "handleShape": "triangular-braced", "rotationDegrees": -30, "height": 1120},
    "broom-09": {"sourceJunctionAnchor": [0.50, 0.660], "handleShape": "metal-collared", "rotationDegrees": -30, "height": 1120},
    "broom-10": {"sourceJunctionAnchor": [0.50, 0.557], "handleShape": "wrapped-collar", "rotationDegrees": -30, "height": 1120},
    "broom-11": {"sourceJunctionAnchor": [0.50, 0.670], "handleShape": "sleeved-shaft", "rotationDegrees": -30, "height": 1120},
    "broom-12": {"sourceJunctionAnchor": [0.50, 0.638], "handleShape": "reinforced-head", "rotationDegrees": -30, "height": 1120},
    "broom-base": {"sourceJunctionAnchor": [0.50, 0.620], "handleShape": "curved-starter", "rotationDegrees": -43, "height": 1080},
}

# Necklace scale/placement is explicit so chokers and broad collars are not
# forced through the tall-pendant ratio.  rearArcClipY is the lower edge of
# the *rear* upper arc; pixels below it belong to the visible front chain or
# pendant and are never removed by this mask.
NECKLACE_FITS = {
    "necklace-01": {"width": 156, "top": 397, "rearArcClipY": 451},
    "necklace-02": {"width": 160, "top": 397, "rearArcClipY": 451},
    "necklace-03": {"width": 156, "top": 397, "rearArcClipY": 451},
    "necklace-04": {"width": 142, "top": 397, "rearArcClipY": 446},
    "necklace-05": {"width": 174, "top": 397, "rearArcClipY": 449},
    "necklace-06": {"width": 174, "top": 397, "rearArcClipY": 450},
    "necklace-07": {"width": 176, "top": 397, "rearArcClipY": 450},
    # Ribbon choker: hide only the top/back strip; preserve its front band.
    "necklace-08": {"width": 190, "top": 397, "rearArcClipY": 419},
    "necklace-09": {"width": 184, "top": 397, "rearArcClipY": 451},
    # A rigid collar has no loose rear chain, but its upper inner tips still
    # pass behind the neck ellipse.
    "necklace-10": {"width": 220, "top": 397, "rearArcClipY": 424},
    "necklace-11": {"width": 194, "top": 397, "rearArcClipY": 449},
    "necklace-12": {"width": 204, "top": 397, "rearArcClipY": 451},
}


def clean(image):
    """Remove insignificant alpha fringe without repainting source pixels."""
    a = np.asarray(image.convert("RGBA")).copy()
    a[:, :, 3][a[:, :, 3] < 10] = 0
    return Image.fromarray(a)


def trim(image):
    image = clean(image)
    box = image.getchannel("A").point(lambda p: 255 if p > 40 else 0).getbbox()
    if not box:
        raise ValueError("Empty source accessory")
    return image.crop(box)


def _alpha_edge_point(image, edge):
    """Return an alpha-weighted point on the first/last occupied source row."""
    alpha = np.asarray(image.getchannel("A"), dtype=np.uint8)
    rows = np.where((alpha > 40).any(axis=1))[0]
    if not len(rows):
        raise ValueError("Empty source accessory")
    row = int(rows[0] if edge == "top" else rows[-1])
    weights = alpha[row].astype(np.float64)
    xs = np.arange(image.width, dtype=np.float64)
    return (float(np.average(xs, weights=weights)), float(row))


def _rotate_vector(point, degrees):
    """Pillow image-coordinate rotation of a vector around the origin."""
    radians = math.radians(degrees)
    c, s = math.cos(radians), math.sin(radians)
    x, y = point
    return (c * x + s * y, -s * x + c * y)


def _place_and_rotate(source, source_anchor, target_anchor, angle):
    """Place a source point at a target point, then rotate around that target."""
    result = Image.new("RGBA", SIZE)
    offset = (round(target_anchor[0] - source_anchor[0]), round(target_anchor[1] - source_anchor[1]))
    result.alpha_composite(source, offset)
    if angle:
        result = result.rotate(angle, Image.Resampling.BICUBIC, center=target_anchor)
    return clean(result)


def _place_and_rotate_padded(source, source_anchor, target_anchor, angle):
    """Render a prop on a padded canvas so viewport fitting never drops pixels."""
    pad = BROOM_RENDER_PADDING
    canvas_size = (SIZE[0] + pad * 2, SIZE[1] + pad * 2)
    canvas_target = (target_anchor[0] + pad, target_anchor[1] + pad)
    result = Image.new("RGBA", canvas_size)
    offset = (
        round(canvas_target[0] - source_anchor[0]),
        round(canvas_target[1] - source_anchor[1]),
    )
    result.alpha_composite(source, offset)
    if angle:
        result = result.rotate(angle, Image.Resampling.BICUBIC, center=canvas_target)
    return clean(result), pad


def _padded_bbox(image, pad):
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("Empty mounted accessory")
    return (
        bbox[0] - pad,
        bbox[1] - pad,
        bbox[2] - pad,
        bbox[3] - pad,
    )


def _viewport_offset(bbox, margin):
    """Return the smallest translation that keeps a padded bbox inside SIZE."""
    x0, y0, x1, y1 = bbox
    width, height = x1 - x0, y1 - y0
    if width > SIZE[0] - margin * 2 or height > SIZE[1] - margin * 2:
        raise ValueError(f"Mounted accessory exceeds the fixed viewport: {bbox}")
    dx = margin - x0 if x0 < margin else 0
    if x1 + dx > SIZE[0] - margin:
        dx -= x1 + dx - (SIZE[0] - margin)
    dy = margin - y0 if y0 < margin else 0
    if y1 + dy > SIZE[1] - margin:
        dy -= y1 + dy - (SIZE[1] - margin)
    return round(dx), round(dy)


def _crop_padded(image, pad):
    return clean(image.crop((pad, pad, pad + SIZE[0], pad + SIZE[1])))


def _split_wand_layers(image, item_id, angle, output_dir=None):
    """Partition the original wand at the measured thumb/index opening.

    The front layer is the original, unmodified wand alpha on the tip-side
    half-plane.  The back layer receives the exact integer alpha complement,
    so antialiased source pixels cannot be drawn twice at the split.
    """
    radians = math.radians(angle)
    direction = np.array([math.sin(radians), math.cos(radians)], dtype=np.float64)
    opening = np.array(WAND_TARGET, dtype=np.float64)
    yy, xx = np.mgrid[0 : SIZE[1], 0 : SIZE[0]]
    projection = (xx - opening[0]) * direction[0] + (
        yy - opening[1]
    ) * direction[1]
    source_pixels = np.asarray(image.convert("RGBA"))
    source_alpha = source_pixels[:, :, 3].astype(np.uint16)
    front_selector = (projection <= 0) & (source_alpha > 0)
    front_alpha = np.where(front_selector, source_alpha, 0).astype(np.uint8)
    back_alpha = (source_alpha - front_alpha).astype(np.uint8)
    front_pixels = source_pixels.copy()
    back_pixels = source_pixels.copy()
    front_pixels[:, :, 3] = front_alpha
    back_pixels[:, :, 3] = back_alpha
    front = clean(Image.fromarray(front_pixels))
    back = clean(Image.fromarray(back_pixels))
    mask_name = f"{item_id}-front-mask.png"
    output_dir = Path(output_dir if output_dir is not None else OUT)
    output_dir.mkdir(parents=True, exist_ok=True)
    mask = Image.fromarray((front_selector.astype(np.uint8) * 255), mode="L")
    mask.save(output_dir / mask_name)
    front_bbox = list(front.getchannel("A").getbbox() or (0, 0, 0, 0))
    mask_bbox = list(mask.getbbox() or (0, 0, 0, 0))
    source_bbox = list(image.getchannel("A").getbbox() or (0, 0, 0, 0))
    front_projection = projection[front_selector]
    front_tip_projection = float(front_projection.min()) if len(front_projection) else 0
    front_opening_projection = float(front_projection.max()) if len(front_projection) else 0
    opening_line = [
        [round(float(opening[0] - direction[1] * 1024), 2), round(float(opening[1] + direction[0] * 1024), 2)],
        [round(float(opening[0] + direction[1] * 1024), 2), round(float(opening[1] - direction[0] * 1024), 2)],
    ]
    front_transform = {
        "file": f"{item_id}-front.webp",
        "layer": "front-prop-after-hand",
        "mask": {
            "file": mask_name,
            "sha256": hashlib.sha256((output_dir / mask_name).read_bytes()).hexdigest(),
            "type": "tip-to-thumb-index-half-plane",
            "openingCenter": list(WAND_TARGET),
            "openingEndpoint": list(WAND_TARGET),
            "openingBounds": list(WAND_OPENING_BOUNDS),
            "tipDirection": [round(float(value), 6) for value in -direction],
            "openingBoundary": opening_line,
            "sourceAlphaOnly": True,
            "description": (
                "Original wand pixels from the authored tip through the "
                "upper hand terminate at the measured thumb/index opening; "
                "the opposite handle side remains behind the fingers."
            ),
        },
        "bbox": front_bbox,
        "maskBbox": mask_bbox,
        "sourceBbox": source_bbox,
        "opaquePixels": int(np.count_nonzero(front_alpha > 40)),
        "partition": {
            "sourceAlphaPixels": int(np.count_nonzero(source_alpha > 40)),
            "frontAlphaPixels": int(np.count_nonzero(front_alpha > 40)),
            "backAlphaPixels": int(np.count_nonzero(back_alpha > 40)),
            "frontPlusBackAlphaEqualsSource": bool(
                np.array_equal(front_alpha.astype(np.uint16) + back_alpha, source_alpha)
            ),
            "tipProjection": round(front_tip_projection, 2),
            "openingProjection": round(front_opening_projection, 2),
        },
    }
    return back, front, front_transform


def _orient_and_resize(source, fit, anchor_key):
    """Orient/scale a source and return it with its measured anchor in pixels."""
    source_anchor_fraction = fit[anchor_key]
    source_anchor = (
        source_anchor_fraction[0] * max(source.width - 1, 1),
        source_anchor_fraction[1] * max(source.height - 1, 1),
    )
    rotate_source = int(fit.get("rotateSource", 0)) % 360
    if rotate_source == 180:
        source = source.transpose(Image.Transpose.ROTATE_180)
        source_anchor = (source.width - 1 - source_anchor[0], source.height - 1 - source_anchor[1])
    elif rotate_source:
        source = source.rotate(rotate_source, Image.Resampling.BICUBIC, expand=True)
        raise ValueError("Only explicit 180-degree product turns are supported")
    height = int(fit["height"])
    scale = height / max(source.height, 1)
    source = source.resize((max(1, round(source.width * scale)), height), Image.Resampling.LANCZOS)
    source_anchor = (source_anchor[0] * scale, source_anchor[1] * scale)
    return source, source_anchor, rotate_source


_WAND_BODY_MASK = None


def _wand_forearm_overlap(image):
    """Measure intersections; never erase shaft pixels to conceal a bad grip."""
    global _WAND_BODY_MASK
    if _WAND_BODY_MASK is None:
        body_path = PUBLISHED_OUT / "body-upper.webp"
        hands_path = PUBLISHED_OUT / "hands-base.webp"
        if not body_path.is_file() or not hands_path.is_file():
            raise FileNotFoundError(
                "canonical body-upper.webp and hands-base.webp are required for wand QA"
            )
        body = clean(Image.open(body_path))
        hands = clean(Image.open(hands_path))
        body_alpha = np.asarray(body.getchannel("A")) > 40
        hand_alpha = np.asarray(hands.getchannel("A")) > 40
        _WAND_BODY_MASK = body_alpha & ~hand_alpha
    a = np.asarray(image.convert("RGBA")).copy()
    region = np.zeros((SIZE[1], SIZE[0]), dtype=bool)
    region[500:840, 220:400] = True
    overlap = _WAND_BODY_MASK & (a[:, :, 3] > 160) & region
    return int(np.count_nonzero(overlap))


def mount_wand(source, item_id, output_dir=None):
    fit = dict(WAND_FITS[item_id])
    raw_size = source.size
    source = trim(source)
    trimmed_size = source.size
    # Register onto the solid handle, not its transparent contour or a hollow
    # ring. Keep the authored handle height and select the nearest solid run.
    row = round(fit["sourceGripAnchor"][1] * (source.height - 1))
    occupied = np.where(np.asarray(source.getchannel("A"))[row] > 180)[0]
    if not len(occupied):
        raise ValueError(f"{item_id}: no solid handle at the authored grip height")
    runs = np.split(occupied, np.where(np.diff(occupied) > 1)[0] + 1)
    desired_x = fit["sourceGripAnchor"][0] * (source.width - 1)
    run = min(runs, key=lambda values: abs((values[0] + values[-1]) / 2 - desired_x))
    handle_x = (float(run[0]) + float(run[-1])) / 2
    fit["sourceGripAnchor"] = [handle_x / max(1, source.width - 1), fit["sourceGripAnchor"][1]]
    source, source_anchor, turned = _orient_and_resize(source, fit, "sourceGripAnchor")
    image = _place_and_rotate(source, source_anchor, WAND_TARGET, fit["rotationDegrees"])
    forearm_overlap = _wand_forearm_overlap(image)
    if forearm_overlap:
        raise ValueError(f"{item_id}: shaft intersects the forearm ({forearm_overlap} pixels)")
    transform = {
        "layer": "front-prop-before-hand",
        "targetGripStart": list(WAND_TARGET),
        "targetGripMeaning": "solid handle centre at the viewer-left thumb/index webbing",
        "openingReference": {
            "center": list(WAND_TARGET),
            "bounds": list(WAND_OPENING_BOUNDS),
            "measuredFrom": "hands-base.webp and gloves/gloves-01..12.webp",
        },
        "sourceGripAnchor": list(fit["sourceGripAnchor"]),
        "sourceGripMeaning": "measured graspable handle centre before orientation",
        "sourceOrientationDegrees": turned,
        "fitTable": "candidate-bottom-handle-v1",
        "rotationDegrees": fit["rotationDegrees"],
        "height": fit["height"],
        "forearmOverlapPixels": forearm_overlap,
        "shaftPixelsErased": 0,
        "sourceSize": list(raw_size),
        "trimmedSourceSize": list(trimmed_size),
        "shaftDirection": "viewer-left/upward from thumb-side crease",
    }
    unpartitioned = image.copy()
    image, front, front_transform = _split_wand_layers(
        image, item_id, fit["rotationDegrees"], output_dir=output_dir
    )
    transform["frontLayer"] = front_transform
    transform["placement"] = {"x": 0, "y": 0}
    transform["gripLayer"] = {
        "file": front_transform["file"],
        "x": 0,
        "y": 0,
    }
    return image, transform, front, front_transform, unpartitioned


def mount_broom(source, item_id):
    base_fit = BROOM_FITS[item_id]
    fit = dict(base_fit)
    fit["height"] = round(base_fit["height"] * BROOM_LENGTH_SCALE)
    raw_size = source.size
    source = trim(source)
    trimmed_size = source.size
    source, junction, _ = _orient_and_resize(source, fit, "sourceJunctionAnchor")
    top_point = _alpha_edge_point(source, "top")
    bottom_point = _alpha_edge_point(source, "bottom")
    # Solve the target junction from the actual high handle tip.  This keeps
    # every source's handle curve and bristle length proportional while putting
    # the common tip in the viewer-right high corridor.
    top_vector = _rotate_vector((top_point[0] - junction[0], top_point[1] - junction[1]), fit["rotationDegrees"])
    requested_junction = (
        BROOM_HANDLE_TIP[0] - top_vector[0],
        BROOM_HANDLE_TIP[1] - top_vector[1],
    )
    padded, pad = _place_and_rotate_padded(
        source, junction, requested_junction, fit["rotationDegrees"]
    )
    initial_bbox = _padded_bbox(padded, pad)
    viewport_offset = _viewport_offset(initial_bbox, BROOM_VIEWPORT_MARGIN)
    target_junction = (
        requested_junction[0] + viewport_offset[0],
        requested_junction[1] + viewport_offset[1],
    )
    if viewport_offset != (0, 0):
        padded, pad = _place_and_rotate_padded(
            source, junction, target_junction, fit["rotationDegrees"]
        )
    image = _crop_padded(padded, pad)
    final_bbox = image.getchannel("A").getbbox() or (0, 0, 0, 0)
    bottom_vector = _rotate_vector((bottom_point[0] - junction[0], bottom_point[1] - junction[1]), fit["rotationDegrees"])
    predicted_bottom = (target_junction[0] + bottom_vector[0], target_junction[1] + bottom_vector[1])
    mounted_path_length = math.hypot(*bottom_vector)
    base_path_length = mounted_path_length / BROOM_LENGTH_SCALE
    actual_handle_tip = (
        target_junction[0] + top_vector[0],
        target_junction[1] + top_vector[1],
    )
    edge_alpha = np.asarray(image.getchannel("A"))
    edge_pixels = int(
        np.count_nonzero(
            np.concatenate(
                (
                    edge_alpha[0, :],
                    edge_alpha[-1, :],
                    edge_alpha[:, 0],
                    edge_alpha[:, -1],
                )
            )
            > 40
        )
    )
    if edge_pixels:
        raise ValueError(f"{item_id}: mounted broom touches viewport edge ({edge_pixels})")
    transform = {
        "layer": "back-prop-before-body",
        "sourceJunctionAnchor": list(fit["sourceJunctionAnchor"]),
        "junctionMeaning": "measured handle/bristle transition; product proportions preserved",
        "junctionTarget": [round(target_junction[0], 2), round(target_junction[1], 2)],
        "requestedHandleTipTarget": list(BROOM_HANDLE_TIP),
        "handleTipTarget": [round(actual_handle_tip[0], 2), round(actual_handle_tip[1], 2)],
        "predictedBristleBottom": [round(predicted_bottom[0], 2), round(predicted_bottom[1], 2)],
        "bristleDirection": "bottom-left/viewer-left",
        "handleDirection": "top-right/viewer-right above shoulder",
        "handleShape": fit["handleShape"],
        "rotationDegrees": fit["rotationDegrees"],
        "height": fit["height"],
        "baseHeight": base_fit["height"],
        "lengthScale": BROOM_LENGTH_SCALE,
        "basePathLengthPixels": round(base_path_length, 2),
        "mountedPathLengthPixels": round(mounted_path_length, 2),
        "mountedPathLengthRatio": round(mounted_path_length / base_path_length, 4),
        "aspectRatioPreserved": True,
        "viewportOffset": list(viewport_offset),
        "viewport": {
            "size": list(SIZE),
            "renderPadding": pad,
            "bbox": list(final_bbox),
            "opaqueEdgePixels": edge_pixels,
            "cropped": False,
        },
        "sourceSize": list(raw_size),
        "trimmedSourceSize": list(trimmed_size),
        "handWidthConstraint": "none; back-carry prop",
    }
    return image, transform


def _neck_occlude(image, clip_y):
    """Erase only the rear upper arc inside the measured neck ellipse."""
    a = np.asarray(image.convert("RGBA")).copy()
    x0, y0, x1, y1 = NECK_ELLIPSE
    yy, xx = np.mgrid[0:SIZE[1], 0:SIZE[0]]
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
    ellipse = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
    rear_arc = yy <= clip_y
    # The upper loop goes around the nape, not upward beside the jaw.
    # Keep only the sides descending from the neck and the front jewellery.
    hidden = (yy < 430) | (ellipse & rear_arc)
    removed = hidden & (a[:, :, 3] > 40)
    a[:, :, 3][hidden] = 0
    mask = Image.fromarray((hidden.astype(np.uint8) * 255))
    return Image.fromarray(a), int(np.count_nonzero(removed)), mask


def mount_necklace(source, item_id):
    fit = NECKLACE_FITS[item_id]
    raw_size = source.size
    source = trim(source)
    trimmed_size = source.size
    width = int(fit["width"])
    height = max(1, round(width * source.height / max(source.width, 1)))
    source = source.resize((width, height), Image.Resampling.LANCZOS)
    image = Image.new("RGBA", SIZE)
    image.alpha_composite(source, ((SIZE[0] - width) // 2, int(fit["top"])))
    image, occluded_pixels, mask = _neck_occlude(image, fit["rearArcClipY"])
    mask_name = f"{item_id}-occlusion.png"
    mask.save(OUT / mask_name)
    transform = {
        "layer": "front-jewellery-after-body",
        "top": fit["top"],
        "width": width,
        "height": height,
        "sourceSize": list(raw_size),
        "trimmedSourceSize": list(trimmed_size),
        "occlusion": {
            "type": "rear-neck-ellipse",
            "bounds": list(NECK_ELLIPSE),
            "clipYMax": fit["rearArcClipY"],
            "backAttachmentY": 430,
            "description": "rear upper chain only; front sides, ribbon band and pendant preserved",
            "occludedPixels": occluded_pixels,
            "mask": mask_name,
        },
    }
    return clean(image), transform


def mount(item):
    source_path = Path(item.get("source", DESIGN_DIR / f"{item['id']}.webp"))
    if not source_path.is_absolute():
        source_path = ROOT / source_path
    source = Image.open(source_path)
    category = item["category"]
    if category == "wand":
        return mount_wand(source, item["id"])
    if category == "broom":
        return mount_broom(source, item["id"])
    if category == "necklace":
        return mount_necklace(source, item["id"])
    raise ValueError(f"Unsupported accessory category: {category}")


def save(image, path):
    clean(image).save(path, format="WEBP", lossless=True, method=6)


def _preview_layers():
    """Use the same canonical anatomy as the renderer, never a legacy chin mask."""
    preview_root = OUT if CANDIDATE_MODE else PUBLISHED_OUT
    body = clean(Image.open(PUBLISHED_OUT / "starter-pants.webp"))
    body.alpha_composite(clean(Image.open(PUBLISHED_OUT / "necks/dad.webp")))
    body.alpha_composite(clean(Image.open(PUBLISHED_OUT / "body-upper.webp")))
    hands = clean(Image.open(PUBLISHED_OUT / "hands-base.webp"))
    glove_path = preview_root / "gloves" / "gloves-12.webp"
    if not glove_path.exists():
        glove_path = PUBLISHED_OUT / "gloves" / "gloves-12.webp"
    gloves = clean(Image.open(glove_path)) if glove_path.exists() else hands
    return body, hands, gloves


def _composite(body, accessory=None, foreground=None, back=False):
    if back:
        image = Image.new("RGBA", SIZE)
        if accessory is not None:
            image.alpha_composite(accessory)
        image.alpha_composite(body)
    else:
        image = body.copy()
        if accessory is not None:
            image.alpha_composite(accessory)
    if foreground is not None:
        image.alpha_composite(foreground)
    return image


def _compose_wand(body, wand, hand, front):
    image = body.copy()
    image.alpha_composite(wand)
    image.alpha_composite(hand)
    if front is not None:
        image.alpha_composite(front)
    return image


def _thumbnail(image, size):
    image = image.copy()
    image.thumbnail(size, Image.Resampling.LANCZOS)
    return image


def make_qa():
    """Write visual-review sheets under the configured isolated QA directory."""
    qa = QA_DIR
    qa.mkdir(parents=True, exist_ok=True)
    body, hands, _ = _preview_layers()
    wand_ids = sorted(
        path.stem
        for path in OUT.glob("wand-*.webp")
        if not path.stem.endswith("-front")
        and not path.stem.endswith("-unpartitioned")
    )
    broom_ids = sorted(
        path.stem
        for path in OUT.glob("broom-*.webp")
        if not path.stem.endswith("-front")
    )
    if not wand_ids or not broom_ids:
        raise FileNotFoundError(f"QA requires mounted wand and broom outputs in {OUT}")
    preferred = ("wand-01", "wand-05", "wand-07", "wand-08", "wand-12")
    if CANDIDATE_MODE:
        representative = tuple(wand_ids)
    else:
        representative = tuple(
            item_id for item_id in preferred if item_id in wand_ids
        ) or tuple(wand_ids[: min(5, len(wand_ids))])
    glove_root = OUT if CANDIDATE_MODE else PUBLISHED_OUT
    glove_layers = [("bare", hands)] + [
        (
            f"glove-{number:02d}",
            clean(
                Image.open(
                    glove_root / "gloves" / f"gloves-{number:02d}.webp"
                )
            ),
        )
        for number in range(1, 13)
        if (glove_root / "gloves" / f"gloves-{number:02d}.webp").exists()
    ]
    crop_box = (190, 760, 390, 1020)
    panel_w, panel_h = 320, 420
    grip = Image.new(
        "RGBA",
        (panel_w * len(glove_layers), panel_h * len(representative)),
        (27, 35, 43, 255),
    )
    grip_draw = ImageDraw.Draw(grip)
    for row, number in enumerate(representative):
        wand = clean(Image.open(OUT / f"{number}.webp"))
        front = clean(Image.open(OUT / f"{number}-front.webp"))
        for col, (label, hand) in enumerate(glove_layers):
            panel = _compose_wand(body, wand, hand, front).crop(crop_box)
            panel = _thumbnail(panel, (panel_w - 12, panel_h - 34))
            x = col * panel_w + (panel_w - panel.width) // 2
            y = row * panel_h + 26
            grip.alpha_composite(panel, (x, y))
            grip_draw.text((col * panel_w + 7, row * panel_h + 6), label, fill="white")
        grip_draw.text(
            (7, row * panel_h + 6),
            f"{number} · bare + gloves",
            fill=(255, 216, 112, 255),
        )
    grip.convert("RGB").save(qa / "grip-v5.png")

    broom_panel_w, broom_panel_h = 300, 430
    broom_columns = 4
    broom_rows = math.ceil(len(broom_ids) / broom_columns)
    broom_sheet = Image.new(
        "RGBA",
        (broom_panel_w * broom_columns, broom_panel_h * broom_rows),
        (27, 35, 43, 255),
    )
    broom_draw = ImageDraw.Draw(broom_sheet)
    for index, number in enumerate(broom_ids):
        broom = clean(Image.open(OUT / f"{number}.webp"))
        panel = _composite(body, broom, hands, back=True)
        panel = _thumbnail(panel, (broom_panel_w - 14, broom_panel_h - 34))
        col, row = index % broom_columns, index // broom_columns
        x = col * broom_panel_w + (broom_panel_w - panel.width) // 2
        y = row * broom_panel_h + 26
        broom_sheet.alpha_composite(panel, (x, y))
        broom_draw.text(
            (col * broom_panel_w + 7, row * broom_panel_h + 6),
            f"{number} · bare hands",
            fill="white",
        )
    broom_sheet.convert("RGB").save(qa / "long-brooms-v5.png")

    necklace_ids = sorted(
        path.stem for path in OUT.glob("necklace-*.webp")
        if not path.stem.endswith("-occlusion")
    )
    if necklace_ids:
        necklace_panel_w, necklace_panel_h = 300, 430
        necklace_sheet = Image.new(
            "RGBA",
            (
                necklace_panel_w * 4,
                necklace_panel_h * math.ceil(len(necklace_ids) / 4),
            ),
            (27, 35, 43, 255),
        )
        necklace_draw = ImageDraw.Draw(necklace_sheet)
        for index, number in enumerate(necklace_ids):
            necklace = clean(Image.open(OUT / f"{number}.webp"))
            panel = _composite(body, necklace)
            panel = _thumbnail(panel, (necklace_panel_w - 14, necklace_panel_h - 34))
            col, row = index % 4, index // 4
            x = col * necklace_panel_w + (necklace_panel_w - panel.width) // 2
            y = row * necklace_panel_h + 26
            necklace_sheet.alpha_composite(panel, (x, y))
            necklace_draw.text(
                (col * necklace_panel_w + 7, row * necklace_panel_h + 6),
                f"{number} · rear arc occluded",
                fill="white",
            )
        necklace_sheet.convert("RGB").save(qa / "necklaces-v5.png")


def _path_label(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def _inside(path, root):
    path, root = Path(path).resolve(), Path(root).resolve()
    return path == root or root in path.parents


def configure_paths(arguments):
    global DESIGN_DIR, OUT, QA_DIR, CANDIDATE_MODE
    alternate = any(
        value is not None
        for value in (arguments.design_dir, arguments.output_dir, arguments.qa_dir)
    )
    CANDIDATE_MODE = alternate
    if not alternate:
        DESIGN_DIR = DEFAULT_DESIGNS
        OUT = PUBLISHED_OUT
        QA_DIR = Path("/tmp/paper-doll-qa")
        return
    if arguments.design_dir is None or arguments.output_dir is None or arguments.qa_dir is None:
        raise SystemExit(
            "--design-dir, --output-dir, and --qa-dir are required together for an isolated candidate run"
        )
    DESIGN_DIR = Path(arguments.design_dir).expanduser().resolve()
    OUT = Path(arguments.output_dir).expanduser().resolve()
    QA_DIR = Path(arguments.qa_dir).expanduser().resolve()
    if not DESIGN_DIR.is_dir():
        raise SystemExit(f"--design-dir is not a directory: {DESIGN_DIR}")
    if _inside(OUT, PUBLISHED_OUT) or _inside(PUBLISHED_OUT, OUT):
        raise SystemExit("--output-dir must be separate from assets/doll/rigged")
    if _inside(QA_DIR, PUBLISHED_OUT) or _inside(PUBLISHED_OUT, QA_DIR):
        raise SystemExit("--qa-dir must be separate from assets/doll/rigged")
    if OUT == QA_DIR or _inside(OUT, QA_DIR) or _inside(QA_DIR, OUT):
        raise SystemExit("--output-dir and --qa-dir must be separate directories")


def _candidate_ids(category):
    prefix = f"{category}-"
    ids = sorted(
        path.stem
        for path in DESIGN_DIR.glob(f"{prefix}*.webp")
        if path.stem.startswith(prefix)
        and not path.stem.endswith("-front")
        and ".part" not in path.stem
    )
    if not ids:
        raise FileNotFoundError(f"{DESIGN_DIR}: no {category} source designs")
    if category in ("wand", "broom"):
        ids.append(f"{category}-base")
    fits = WAND_FITS if category == "wand" else BROOM_FITS if category == "broom" else None
    if fits is not None:
        unknown = [item_id for item_id in ids if item_id not in fits]
        if unknown:
            raise ValueError(
                f"Canonical {category} fit table missing: {', '.join(unknown)}"
            )
    return ids


def _source_for(item_id, category):
    if item_id == "wand-base":
        return ROOT / "scripts" / "art-sources" / "plain-starters" / "wand-base.png"
    if item_id.endswith("-base"):
        return ROOT / "scripts" / "art-sources" / "starter-props" / f"clean-{category}.webp"
    path = DESIGN_DIR / f"{item_id}.webp"
    if not path.is_file():
        png = DESIGN_DIR / f"{item_id}.png"
        if png.is_file():
            return png
        raise FileNotFoundError(path)
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--design-dir",
        type=Path,
        help="isolated directory containing alternate wand/broom source artwork",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="isolated directory for mounted wand/broom layers and manifest",
    )
    parser.add_argument(
        "--qa-dir",
        type=Path,
        help="isolated directory for grip/broom QA sheets and ratio evidence",
    )
    arguments = parser.parse_args()
    configure_paths(arguments)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "accessories.json"
    manifest = {}
    categories = ("necklace", "wand", "broom")
    for category in categories:
        ids = _candidate_ids(category)
        for item_id in ids:
            source_path = _source_for(item_id, category)
            item = {
                "id": item_id,
                "category": category,
                "source": _path_label(source_path),
            }
            mounted = mount(item)
            if category == "wand":
                image, transform, front, front_transform, unpartitioned = mounted
            else:
                image, transform = mounted
                front = front_transform = None
                unpartitioned = None
            output_name = f"{item_id}.webp"
            save(image, OUT / output_name)
            if front is not None:
                front_name = f"{item_id}-front.webp"
                save(front, OUT / front_name)
                front_transform["sha256"] = hashlib.sha256(
                    (OUT / front_name).read_bytes()
                ).hexdigest()
                proof_name = f"{item_id}-unpartitioned.webp"
                save(unpartitioned, OUT / proof_name)
                proof_hash = hashlib.sha256(
                    (OUT / proof_name).read_bytes()
                ).hexdigest()
                front_transform["unpartitionedProof"] = {
                    "file": proof_name,
                    "sha256": proof_hash,
                    "size": list(unpartitioned.size),
                    "bbox": list(
                        unpartitioned.getchannel("A").getbbox()
                        or (0, 0, 0, 0)
                    ),
                    "composition": "original mounted object before the front/back split",
                    "alphaPartitionProof": {
                        "sourceAlphaPixels": transform["frontLayer"][
                            "partition"
                        ]["sourceAlphaPixels"],
                        "frontAlphaPixels": transform["frontLayer"][
                            "partition"
                        ]["frontAlphaPixels"],
                        "backAlphaPixels": transform["frontLayer"][
                            "partition"
                        ]["backAlphaPixels"],
                        "frontPlusBackAlphaEqualsSource": transform[
                            "frontLayer"
                        ]["partition"]["frontPlusBackAlphaEqualsSource"],
                    },
                }
            manifest_entry = {
                "source": _path_label(source_path),
                "sourceSha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
                "method": "rigid registration of isolated OpenAI product artwork; no anatomy pixels",
                "transform": transform,
                "bbox": list(image.getchannel("A").getbbox() or (0, 0, 0, 0)),
            }
            if category == "wand":
                # build-rig-index.py consumes these at the record root.  Keep
                # the richer copy under transform for accessory QA/provenance.
                manifest_entry["placement"] = transform["placement"]
                manifest_entry["gripLayer"] = transform["gripLayer"]
            manifest[output_name] = manifest_entry
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    make_qa()
    qa = QA_DIR
    (qa / "broom-length-ratios-v5.json").write_text(
        json.dumps(
            {
                file_name: {
                    "basePathLengthPixels": entry["transform"]["basePathLengthPixels"],
                    "mountedPathLengthPixels": entry["transform"]["mountedPathLengthPixels"],
                    "mountedPathLengthRatio": entry["transform"]["mountedPathLengthRatio"],
                    "bbox": entry["bbox"],
                    "viewportOffset": entry["transform"]["viewportOffset"],
                }
                for file_name, entry in manifest.items()
                if file_name.startswith("broom-")
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    print(
        f"Mounted {len(manifest)} accessory layers"
        + (
            "; isolated candidate output; published body/hand outputs untouched"
            if CANDIDATE_MODE
            else "; body/hand/pants outputs untouched"
        )
    )


if __name__ == "__main__":
    main()
