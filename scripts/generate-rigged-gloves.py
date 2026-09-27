#!/usr/bin/env python3
"""Generate fixed-pose paper-doll glove layers.

All twelve paid designs, including ``gloves-12``, are image edits whose only
editable pixels are the owned two-hand/cuff matte.  Every API response is retained under
``scripts/art-sources/rigged-gloves`` together with the pre-clamp drift and the
post-clamp/render invariants.  Generation is resumable: a hash-matched output
and its raw receipt are not requested again unless ``--force`` is supplied.
"""
from __future__ import annotations

import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import threading
import time
import urllib.error
import urllib.request

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DOLL = ROOT / "assets" / "doll"
DOLL_REFERENCE = ROOT / "scripts" / "art-sources" / "doll-reference"
PROTOTYPES = DOLL_REFERENCE / "prototypes" / "grips"
DEFAULT_CATALOG = ROOT / "assets" / "wardrobe-catalog.json"
DEFAULT_DESIGNS = ROOT / "scripts" / "art-sources" / "field-wardrobe" / "designs"
DEFAULT_OUT = DOLL / "rigged" / "gloves"
DEFAULT_SOURCES = ROOT / "scripts" / "art-sources" / "rigged-gloves"
DESIGNS = DEFAULT_DESIGNS
RIGGED = DOLL / "rigged"
OUT = DEFAULT_OUT
SOURCES = DEFAULT_SOURCES
MANIFEST_PATH = OUT / "manifest.json"
QA_DIR = Path("/tmp/paper-doll-qa")
QA_PATH = QA_DIR / "rigged-gloves.png"
LOG_PATH = Path("/tmp/rigged-gloves.log")
CATALOG_PATH = DEFAULT_CATALOG
CANDIDATE_MODE = False

MODEL = "gpt-image-2.5-sunburst"
QUALITY = "high"
CANVAS = (1024, 1536)
W, H = CANVAS
MAX_ATTEMPTS = 2
MAX_WORKERS = 4

ITEMS = tuple(f"gloves-{index:02d}" for index in range(1, 13))
PAID_ITEMS = ITEMS
LEFT_ANCHOR = (285.0, 865.0)
RIGHT_ANCHOR = (748.0, 865.0)

GRIP_BASE_PATH = PROTOTYPES / "grip-base.png"
GRIP_BASE_MASK_PATH = PROTOTYPES / "grip-base-mask.png"
APPROVED_LAYER_PATH = PROTOTYPES / "gloves-12-layer.png"
APPROVED_MASK_PATH = PROTOTYPES / "gloves-12-mask.png"
POSE_REFERENCE_PATH = ROOT / "scripts/art-sources/field-wardrobe/closed-fist-reference.webp"


_PRINT_LOCK = threading.Lock()
_MANIFEST_LOCK = threading.Lock()
_API_LOCK = threading.Lock()
_API_CALLS = 0


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(message: str) -> None:
    line = f"{utc_now()} {message}"
    with _PRINT_LOCK:
        print(line, flush=True)
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def load_catalog(path: Path) -> list[dict[str, object]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("items", data.get("catalog"))
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise ValueError(f"catalog must be a JSON list of objects: {path}")
    return data


def _inside(path: Path, root: Path) -> bool:
    path, root = path.resolve(), root.resolve()
    return path == root or root in path.parents


def configure_paths(args: argparse.Namespace) -> None:
    global CATALOG_PATH, DESIGNS, OUT, SOURCES, MANIFEST_PATH, QA_DIR, QA_PATH, CANDIDATE_MODE
    CANDIDATE_MODE = args.catalog is not None or args.design_dir is not None
    CATALOG_PATH = Path(args.catalog).expanduser() if args.catalog else DEFAULT_CATALOG
    DESIGNS = Path(args.design_dir).expanduser() if args.design_dir else DEFAULT_DESIGNS
    OUT = Path(args.output_dir).expanduser() if args.output_dir else DEFAULT_OUT
    SOURCES = Path(args.raw_dir).expanduser() if args.raw_dir else DEFAULT_SOURCES
    QA_DIR = Path(args.qa_dir).expanduser() if args.qa_dir else Path("/tmp/paper-doll-qa")
    QA_PATH = QA_DIR / "rigged-gloves.png"
    MANIFEST_PATH = OUT / "manifest.json"
    if CANDIDATE_MODE:
        if args.output_dir is None or args.raw_dir is None:
            raise SystemExit("--output-dir and --raw-dir are required with --catalog or --design-dir")
        if not CATALOG_PATH.is_file() or not DESIGNS.is_dir():
            raise SystemExit("alternate catalog/design-dir paths must exist")
        if OUT.resolve() == SOURCES.resolve() or _inside(OUT, DEFAULT_OUT) or _inside(DEFAULT_OUT, OUT) or _inside(SOURCES, DEFAULT_SOURCES) or _inside(DEFAULT_SOURCES, SOURCES) or _inside(QA_DIR, DOLL) or _inside(DOLL, QA_DIR):
            raise SystemExit("alternate catalog/design-dir requires fresh, isolated output and raw directories")


def configure_catalog(items: list[dict[str, object]]) -> None:
    global ITEMS, PAID_ITEMS
    ITEMS = tuple(str(item["id"]) for item in items if item.get("category") == "gloves" and item.get("id"))
    if not ITEMS:
        raise ValueError(f"catalog has no glove entries: {CATALOG_PATH}")
    PAID_ITEMS = ITEMS


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGBA").save(buffer, format="PNG", optimize=False)
    return buffer.getvalue()


def webp_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGBA").save(buffer, format="WEBP", lossless=True, method=6)
    return buffer.getvalue()


def load_rgba(path: Path, *, canvas: bool = True) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(path)
    image = Image.open(path).convert("RGBA")
    if canvas and image.size != CANVAS:
        raise ValueError(f"{path}: expected {CANVAS}, got {image.size}")
    return image


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").point(lambda value: 255 if value > 10 else 0).getbbox()


def alpha_pixels(image: Image.Image) -> int:
    return int((np.asarray(image.getchannel("A")) > 10).sum())


def alpha_composite(*layers: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    for layer in layers:
        canvas = Image.alpha_composite(canvas, layer.convert("RGBA"))
    return canvas


def source_record(path: Path, image: Image.Image | None = None) -> dict[str, object]:
    if image is None:
        image = load_rgba(path, canvas=False)
    return {
        "path": rel(path),
        "sha256": sha256_file(path),
        "size": list(image.size),
        "alphaBbox": list(alpha_bbox(image) or ()),
    }


def multipart(fields: dict[str, str], images: list[tuple[str, bytes]], mask: bytes) -> tuple[bytes, str]:
    boundary = "rigged-gloves-" + hashlib.sha256(os.urandom(24)).hexdigest()[:24]
    chunks: list[bytes] = []

    def field(name: str, value: str) -> None:
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"'
            f"\r\n\r\n{value}\r\n".encode()
        )

    for name, value in fields.items():
        field(name, value)
    for filename, data in images:
        chunks.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="image[]"; '
            f'filename="{filename}"\r\nContent-Type: image/png\r\n\r\n'.encode()
        )
        chunks.extend((data, b"\r\n"))
    chunks.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="mask"; '
        'filename="mask.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
    )
    chunks.extend((mask, b"\r\n", f"--{boundary}--\r\n".encode()))
    return b"".join(chunks), boundary


def api_edit(item: str, prompt: str, references: list[Image.Image], mask: Image.Image) -> tuple[Image.Image, bytes]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    fields = {
        "model": MODEL,
        "prompt": prompt,
        "size": f"{W}x{H}",
        "quality": QUALITY,
        "background": "transparent",
        "output_format": "png",
        "n": "1",
    }
    payload, boundary = multipart(
        fields,
        [(f"reference-{index + 1}.png", png_bytes(image)) for index, image in enumerate(references)],
        png_bytes(mask),
    )
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/edits",
        data=payload,
        headers={
            "Authorization": "Bearer " + api_key,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    with _API_LOCK:
        global _API_CALLS
        _API_CALLS += 1
        call_number = _API_CALLS
    log(f"{item}: image edit {call_number}")
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read()).get("error", {}).get("message", "image API error")
        except (ValueError, UnicodeDecodeError):
            detail = "image API error"
        raise RuntimeError(f"HTTP {error.code}: {detail}") from None
    try:
        encoded = result["data"][0]["b64_json"]
        raw_png = base64.b64decode(encoded, validate=True)
        image = Image.open(io.BytesIO(raw_png)).convert("RGBA")
    except (KeyError, IndexError, TypeError, ValueError, OSError) as error:
        raise RuntimeError("image API returned no decodable image") from error
    if image.size != CANVAS:
        raise ValueError(f"{item}: API output must be {CANVAS}, got {image.size}")
    return image, raw_png


def mask_from_allowed(allowed: np.ndarray) -> Image.Image:
    """Create an OpenAI mask: transparent pixels are editable, opaque protected."""
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, 3] = np.where(allowed, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba, mode="RGBA")


def side_mask(allowed: np.ndarray, side: str) -> np.ndarray:
    result = allowed.copy()
    if side == "left":
        result[:, W // 2 :] = False
    else:
        result[:, : W // 2] = False
    return result


def component_count(mask: np.ndarray) -> int:
    """Return 8-connected component count for a small hand matte."""
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return 0
    y0, y1 = max(0, int(ys.min()) - 1), min(H, int(ys.max()) + 2)
    x0, x1 = max(0, int(xs.min()) - 1), min(W, int(xs.max()) + 2)
    local = mask[y0:y1, x0:x1]
    seen = np.zeros(local.shape, dtype=bool)
    count = 0
    for yy, xx in zip(*np.where(local)):
        if seen[yy, xx]:
            continue
        count += 1
        stack = [(int(yy), int(xx))]
        seen[yy, xx] = True
        while stack:
            cy, cx = stack.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if not dy and not dx:
                        continue
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < local.shape[0] and 0 <= nx < local.shape[1] and local[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
    return count


def region_stats(mask: np.ndarray, side: str) -> dict[str, object]:
    region = side_mask(mask, side)
    ys, xs = np.where(region)
    if len(xs) == 0:
        return {"pixels": 0, "bbox": None, "centroid": None, "components": 0}
    return {
        "pixels": int(len(xs)),
        "bbox": [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)],
        "centroid": [float(xs.mean()), float(ys.mean())],
        "components": component_count(region),
    }


def changed_mask(raw: Image.Image, baseline: Image.Image) -> np.ndarray:
    a = np.asarray(raw.convert("RGBA"), dtype=np.int32)
    b = np.asarray(baseline.convert("RGBA"), dtype=np.int32)
    rgb_distance = np.sqrt(((a[:, :, :3] - b[:, :, :3]) ** 2).sum(axis=2))
    alpha_distance = np.abs(a[:, :, 3] - b[:, :, 3])
    return (rgb_distance > 24) | (alpha_distance > 24)


def raw_drift_before_clamp(raw: Image.Image, canonical: Image.Image, editable: np.ndarray) -> dict[str, object]:
    changed = changed_mask(raw, canonical)
    raw_alpha = np.asarray(raw.getchannel("A")) > 10
    outside = ~editable
    changed_outside = changed & outside
    changed_inside = changed & editable
    raw_visible_outside = raw_alpha & outside
    total = int(changed.sum())
    return {
        "measuredBeforeClamp": True,
        "changedPixels": total,
        "changedInsideEditablePixels": int(changed_inside.sum()),
        "changedOutsideEditablePixels": int(changed_outside.sum()),
        "changedOutsideFraction": float(changed_outside.sum() / total) if total else 0.0,
        "rawVisibleOutsideEditablePixels": int(raw_visible_outside.sum()),
        "rawChangedBbox": list(Image.fromarray(changed.astype(np.uint8) * 255, mode="L").getbbox() or ()),
    }


def extract_layer(raw: Image.Image, baseline: Image.Image, allowed: np.ndarray) -> tuple[Image.Image, dict[str, object]]:
    raw_arr = np.asarray(raw.convert("RGBA"), dtype=np.uint8)
    base_arr = np.asarray(baseline.convert("RGBA"), dtype=np.int32)
    rgb_distance = np.sqrt(((raw_arr[:, :, :3].astype(np.int32) - base_arr[:, :, :3]) ** 2).sum(axis=2))
    alpha_distance = np.abs(raw_arr[:, :, 3].astype(np.int32) - base_arr[:, :, 3])
    # A changed-pixel semantic matte prevents copied shirt/arm pixels from
    # becoming a glove layer.  The final allowed matte is the second clamp.
    semantic = ((rgb_distance > 24) | (alpha_distance > 24)) & (raw_arr[:, :, 3] > 10)
    semantic &= allowed
    output = np.zeros((H, W, 4), dtype=np.uint8)
    output[:, :, :3] = raw_arr[:, :, :3]
    output[:, :, 3] = np.where(semantic, raw_arr[:, :, 3], 0)
    output[output[:, :, 3] < 10] = 0
    layer = Image.fromarray(output, mode="RGBA")
    stats = {
        "rawVisiblePixels": int((raw_arr[:, :, 3] > 10).sum()),
        "semanticPixelsBeforeAllowedClamp": int(((raw_arr[:, :, 3] > 10) & ((rgb_distance > 24) | (alpha_distance > 24))).sum()),
        "finalAlphaPixels": int((output[:, :, 3] > 10).sum()),
        "removedByAllowedClampPixels": int((((raw_arr[:, :, 3] > 10) & ((rgb_distance > 24) | (alpha_distance > 24))) & ~allowed).sum()),
        "allowedMaskPixels": int(allowed.sum()),
    }
    return layer, stats


def pose_metrics(layer: Image.Image, approved_layer: Image.Image) -> dict[str, object]:
    alpha = np.asarray(layer.getchannel("A")) > 10
    approved = np.asarray(approved_layer.getchannel("A")) > 10
    sides: dict[str, object] = {}
    flagged = False
    for side, anchor in (("left", LEFT_ANCHOR), ("right", RIGHT_ANCHOR)):
        current = region_stats(alpha, side)
        reference = region_stats(approved, side)
        centroid = current.get("centroid")
        ref_pixels = int(reference.get("pixels") or 0)
        pixels = int(current.get("pixels") or 0)
        if centroid is None:
            dx = dy = 999.0
        else:
            dx, dy = float(centroid[0]) - anchor[0], float(centroid[1]) - anchor[1]
        ratio = pixels / ref_pixels if ref_pixels else 0.0
        components = int(current.get("components") or 0)
        current_region = side_mask(alpha, side)
        approved_region = side_mask(approved, side)
        intersection = int((current_region & approved_region).sum())
        union = int((current_region | approved_region).sum())
        silhouette_iou = intersection / union if union else 0.0
        # A moved/open product-like hand generally loses the compact approved
        # fist silhouette.  This low-overlap check triggers the one allowed
        # retry; final visual review remains mandatory even when it is clear.
        open_finger_suspected = silhouette_iou < 0.55
        pose_flag = (
            abs(dx) > 20
            or abs(dy) > 20
            or ratio < 0.32
            or ratio > 3.4
            or components > 4
            or open_finger_suspected
        )
        flagged |= pose_flag
        sides[side] = {
            "current": current,
            "approved": reference,
            "anchor": list(anchor),
            "centroidDelta": [dx, dy],
            "areaRatioToApproved": ratio,
            "silhouetteIoUToApproved": silhouette_iou,
            "openFingerSuspected": open_finger_suspected,
            "poseFlag": pose_flag,
            "openFingerVisualReviewRequired": True,
        }
    return {"flagged": flagged, "sides": sides}


def rendered_invariants(layer: Image.Image, allowed: np.ndarray) -> dict[str, object]:
    alpha = np.asarray(layer.getchannel("A")) > 10
    outside = alpha & ~allowed
    left = alpha & side_mask(allowed, "left")
    right = alpha & side_mask(allowed, "right")
    bbox = alpha_bbox(layer)
    result = {
        "canvas": list(layer.size),
        "fullCanvas": layer.size == CANVAS,
        "alphaPixels": int(alpha.sum()),
        "alphaBbox": list(bbox or ()),
        "outsideAllowedPixels": int(outside.sum()),
        "leftAlphaPixels": int(left.sum()),
        "rightAlphaPixels": int(right.sum()),
        "sourceFullyOpaqueExpectedCoverage": {
            "leftFractionOfAllowed": float(left.sum() / max(1, side_mask(allowed, "left").sum())),
            "rightFractionOfAllowed": float(right.sum() / max(1, side_mask(allowed, "right").sum())),
        },
    }
    result["ok"] = bool(
        result["fullCanvas"]
        and result["alphaPixels"] >= 4000
        and result["leftAlphaPixels"] >= 1200
        and result["rightAlphaPixels"] >= 1200
        and result["outsideAllowedPixels"] == 0
    )
    return result


def prompt_for(item: str) -> str:
    return (
        "Image 1 is the fixed two-fist grip-base mannequin and is a pose/scale reference only. Any old glove "
        "colours, jewels, embroidery, gold trim or other decoration visible in the template must be ignored. "
        "Image 2 is the exact new shop product reference for " + item + "; use it ONLY for its glove material, "
        "colour, seams and cuffs, never for its displayed unworn hand pose. Image 3 is a close-up of the APPROVED "
        "CLOSED FIST POSE: copy its folded finger anatomy and thumb/index opening exactly, not its brown material. "
        "The four fingers curl tightly INTO the palm; there are no long finger silhouettes hanging downward. "
        "A loose, open or dangling hand is a failure. Replace ONLY the two existing glove foregrounds "
        "inside the supplied hand-and-cuff edit mask. Keep the exact same front-facing mannequin, arms, wrists, "
        "fist centres (viewer-left about x=285,y=865 and viewer-right about x=748,y=865), scale and hanging pose. "
        "Render two complete tightly fitted gloves around the existing curled closed fists: every finger remains folded "
        "around a handle, with the thumb crossing the folded fingers. Keep the visible thumb/index opening of "
        "the viewer-left fist near x=289,y=884: a shaft would emerge there toward the upper-left while the "
        "thumb and curled fingers wrap over the lower handle. Do not draw the shaft itself. Both gloves must be compact "
        "closed fists matching Image 1. No straight or dangling fingers, "
        "no open palms, no floating product gloves, no changed hands, no new arms, no raised elbows and no extra "
        "limbs. Do not repaint or move the cream sleeves, cuffs, arms, torso, face, legs or background; do not add "
        "skin, shirt, handles or props. "
        "Return a transparent 1024x1536 image. The editable foreground is restricted to the two authored glove/cuff "
        "mattes; preserve every pixel outside that mask exactly."
    )


def input_hash_for(paths: list[Path], prompt: str, mask: Image.Image, extra: dict[str, object]) -> str:
    payload = {
        "sources": [(rel(path), sha256_file(path)) for path in paths],
        "promptSha256": sha256_bytes(prompt.encode()),
        "maskSha256": sha256_bytes(png_bytes(mask)),
        "extra": extra,
    }
    return sha256_bytes(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode())


def load_manifest() -> dict[str, object]:
    if not MANIFEST_PATH.is_file():
        return {
            "schema": "rigged-gloves-v1",
            "model": MODEL,
            "quality": QUALITY,
            "size": list(CANVAS),
            "maxAttempts": MAX_ATTEMPTS,
            "maxWorkers": MAX_WORKERS,
            "files": {},
            "failures": [],
            "qa": {},
            "qaStatus": "pending-visual-review",
        }
    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise RuntimeError(f"cannot read {MANIFEST_PATH}: {error}") from error
    if data.get("schema") != "rigged-gloves-v1":
        raise ValueError(f"unexpected manifest schema in {MANIFEST_PATH}")
    data.setdefault("files", {})
    data.setdefault("failures", [])
    data.setdefault("qa", {})
    return data


def write_manifest(manifest: dict[str, object]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    temporary = MANIFEST_PATH.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(MANIFEST_PATH)


def record_entry(manifest: dict[str, object], key: str, entry: dict[str, object]) -> None:
    with _MANIFEST_LOCK:
        files = manifest.setdefault("files", {})
        assert isinstance(files, dict)
        files[key] = entry
        write_manifest(manifest)


def skip_entry(manifest: dict[str, object], key: str, input_hash: str) -> dict[str, object] | None:
    files = manifest.get("files", {})
    if not isinstance(files, dict):
        return None
    entry = files.get(key)
    if not isinstance(entry, dict) or entry.get("inputHash") != input_hash:
        return None
    if entry.get("status") == "failed":
        return None
    output = OUT / str(entry.get("file", ""))
    raw_name = entry.get("rawFile")
    raw = SOURCES / str(raw_name) if raw_name else None
    if not output.is_file() or entry.get("sha256") != sha256_file(output):
        return None
    if raw is not None and not raw.is_file():
        return None
    return entry


def save_webp(image: Image.Image, path: Path) -> bytes:
    data = webp_bytes(image)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data


def write_receipt(key: str, receipt: dict[str, object]) -> Path:
    SOURCES.mkdir(parents=True, exist_ok=True)
    path = SOURCES / f"{key}.json"
    path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def process_api_item(
    item: str,
    manifest: dict[str, object],
    baseline: Image.Image,
    product: Image.Image,
    product_path: Path,
    allowed: np.ndarray,
    approved_layer: Image.Image,
    input_mask: Image.Image,
    force: bool,
) -> dict[str, object]:
    prompt = prompt_for(item)
    paths = [GRIP_BASE_PATH, APPROVED_MASK_PATH, GRIP_BASE_MASK_PATH, product_path, POSE_REFERENCE_PATH]
    input_hash = input_hash_for(paths, prompt, input_mask, {"item": item, "model": MODEL, "quality": QUALITY, "anchors": [LEFT_ANCHOR, RIGHT_ANCHOR], "editable": "approved-gloves-12-mask"})
    if not force:
        old = skip_entry(manifest, item, input_hash)
        if old:
            log(f"{item}: resume existing {old.get('status')}")
            return old
    output_path = OUT / f"{item}.webp"
    attempts: list[dict[str, object]] = []
    candidate: tuple[Image.Image, bytes, dict[str, object], dict[str, object], str] | None = None
    pose_reference = load_rgba(POSE_REFERENCE_PATH, canvas=False)
    references = [baseline, product, pose_reference]
    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.time()
        raw_name = f"{item}-attempt-{attempt}.png"
        raw_path = SOURCES / raw_name
        try:
            raw, raw_png = api_edit(item, prompt, references, input_mask)
            SOURCES.mkdir(parents=True, exist_ok=True)
            raw_path.write_bytes(raw_png)
            drift = raw_drift_before_clamp(raw, baseline, allowed)
            layer, extraction = extract_layer(raw, baseline, allowed)
            pose = pose_metrics(layer, approved_layer)
            invariant = rendered_invariants(layer, allowed)
            validation = {
                "invariantOk": invariant["ok"],
                "poseFlag": pose["flagged"],
                "ok": bool(invariant["ok"] and not pose["flagged"]),
            }
            note = {
                "attempt": attempt,
                "status": "accepted" if validation["ok"] else ("flagged-pose" if invariant["ok"] else "rejected"),
                "elapsedSeconds": round(time.time() - started, 3),
                "rawFile": raw_name,
                "rawSha256": sha256_bytes(raw_png),
                "rawSize": list(raw.size),
                "rawAlphaBbox": list(alpha_bbox(raw) or ()),
                "rawBeforeClampDrift": drift,
                "extraction": extraction,
                "pose": pose,
                "renderedInvariant": invariant,
                "validation": validation,
                "visualShapeStatus": "requires-human-inspection",
            }
            attempts.append(note)
            if invariant["ok"]:
                candidate = (layer, raw_png, pose, invariant, raw_name)
                if not pose["flagged"]:
                    break
            if attempt < MAX_ATTEMPTS:
                log(f"{item}: retrying after {'pose flag' if pose['flagged'] else 'render invariant failure'}")
                time.sleep(2)
        except (OSError, RuntimeError, ValueError, KeyError, urllib.error.URLError, TimeoutError) as error:
            attempts.append({
                "attempt": attempt,
                "status": "error",
                "elapsedSeconds": round(time.time() - started, 3),
                "error": str(error),
                "rawFile": raw_name,
            })
            if attempt < MAX_ATTEMPTS:
                time.sleep(2)
    receipt = {
        "schema": "rigged-gloves-receipt-v1",
        "key": item,
        "category": "gloves",
        "stage": "paid",
        "model": MODEL,
        "quality": QUALITY,
        "prompt": prompt,
        "promptSha256": sha256_bytes(prompt.encode()),
        "inputHash": input_hash,
        "sources": [(rel(path), sha256_file(path)) for path in paths],
        "editableMask": {"path": rel(APPROVED_MASK_PATH), "sha256": sha256_file(APPROVED_MASK_PATH), "pixels": int(allowed.sum())},
        "attempts": attempts,
        "createdAt": utc_now(),
    }
    write_receipt(item, receipt)
    if candidate is None:
        entry = {
            "key": item,
            "category": "gloves",
            "stage": "paid",
            "file": output_path.name,
            "inputHash": input_hash,
            "status": "failed",
            "visualStatus": "failed",
            "sources": receipt["sources"],
            "attempts": attempts,
        }
        record_entry(manifest, item, entry)
        raise RuntimeError(f"{item}: no non-empty render with two hand regions after {MAX_ATTEMPTS} attempts")
    layer, selected_raw, pose, invariant, selected_raw_name = candidate
    output_data = save_webp(layer, output_path)
    selected_raw_path = SOURCES / f"{item}-raw.png"
    selected_raw_path.write_bytes(selected_raw)
    selected_attempt = next((note for note in attempts if note.get("rawFile") == selected_raw_name), {})
    status = "accepted-pending-visual" if not pose["flagged"] else "flagged-pose"
    entry = {
        "key": item,
        "category": "gloves",
        "stage": "paid",
        "file": output_path.name,
        "inputHash": input_hash,
        "status": status,
        "visualStatus": "pending-inspection",
        "sources": {
            "catalog": {"path": rel(CATALOG_PATH), "sha256": sha256_file(CATALOG_PATH)},
            "fixedPoseReference": source_record(GRIP_BASE_PATH, baseline),
            "gripBase": source_record(GRIP_BASE_PATH, baseline),
            "approvedGloveMask": source_record(APPROVED_MASK_PATH),
            "gripBaseMask": source_record(GRIP_BASE_MASK_PATH),
            "product": source_record(product_path, product),
            "closedFistPose": source_record(POSE_REFERENCE_PATH, pose_reference),
        },
        "model": MODEL,
        "quality": QUALITY,
        "prompt": prompt,
        "promptSha256": sha256_bytes(prompt.encode()),
        "sha256": sha256_bytes(output_data),
        "rawFile": selected_raw_path.name,
        "rawSha256": sha256_bytes(selected_raw),
        "size": list(layer.size),
        "alphaBbox": list(alpha_bbox(layer) or ()),
        "alphaPixels": alpha_pixels(layer),
        "rawBeforeClamp": selected_attempt.get("rawBeforeClampDrift", {}),
        "rawPath": rel(selected_raw_path),
        "renderedInvariant": invariant,
        "pose": pose,
        "attempts": attempts,
        "ownership": {
            "allowedMask": {"path": rel(APPROVED_MASK_PATH), "sha256": sha256_file(APPROVED_MASK_PATH), "pixels": int(allowed.sum())},
            "gripBaseMask": {"path": rel(GRIP_BASE_MASK_PATH), "sha256": sha256_file(GRIP_BASE_MASK_PATH)},
            "forbidden": ["all pixels outside approved glove-12 hand+cuff mask", "cream sleeves", "arms", "torso", "head", "legs", "props", "body"],
        },
        "validation": {
            "invariant": invariant,
            "pose": pose,
            "actualClosedShape": "requires-human-inspection",
        },
    }
    entry["sourceHashes"] = {
        name: value["sha256"]
        for name, value in entry["sources"].items()
        if isinstance(value, dict) and value.get("sha256")
    }
    record_entry(manifest, item, entry)
    log(f"{item}: {status} alpha={entry['alphaPixels']} raw={entry['rawSha256']}")
    return entry


def thumbnail(image: Image.Image, width: int, height: int) -> Image.Image:
    scale = min(width / image.width, height / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    resized = image.resize(size, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (width, height), (35, 40, 52, 255))
    cell.alpha_composite(resized, ((width - size[0]) // 2, (height - size[1]) // 2))
    return cell


def closeup(image: Image.Image, width: int = 256, height: int = 240) -> Image.Image:
    crop = image.crop((180, 740, 844, 1015))
    return thumbnail(crop, width, height)


def make_qa(manifest: dict[str, object], wand: Image.Image, broom: Image.Image) -> Path:
    QA_PATH.parent.mkdir(parents=True, exist_ok=True)
    upper = load_rgba(RIGGED / "body-upper.webp")
    pants = load_rgba(RIGGED / "starter-pants.webp")
    bare_hands = load_rgba(RIGGED / "hands-base.webp")
    front = load_rgba(OUT.parent / "wand-12-front.webp")
    head = Image.new("RGBA", CANVAS)
    head.alpha_composite(
        load_rgba(DOLL / "headwear/dad-neutral-bare.webp", canvas=False), (0, -768)
    )
    foundation = alpha_composite(broom, pants, upper, wand)
    bare_props = alpha_composite(foundation, bare_hands, front, head)
    cell_w, full_h, close_h, label_h = 256, 384, 240, 28
    columns = 4
    row_h = full_h + label_h
    sheet = Image.new("RGB", (cell_w * columns, row_h * len(ITEMS)), "#181c27")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
    except OSError:
        font = ImageFont.load_default()
    files = manifest.get("files", {})
    assert isinstance(files, dict)
    qa_entries: dict[str, object] = {}
    for row, item in enumerate(ITEMS):
        output = OUT / f"{item}.webp"
        if output.is_file():
            glove = load_rgba(output)
            gloved_props = alpha_composite(foundation, glove, front, head)
            gloved_close = closeup(gloved_props, cell_w, close_h)
            gloved_full = thumbnail(gloved_props, cell_w, full_h)
            visual = files.get(item, {}).get("visualStatus") if isinstance(files.get(item), dict) else None
            label = f"{item} · {visual or 'missing-review'}"
        else:
            glove = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
            gloved_props = bare_props
            gloved_close = closeup(gloved_props, cell_w, close_h)
            gloved_full = thumbnail(gloved_props, cell_w, full_h)
            label = f"{item} · MISSING"
        cells = [thumbnail(bare_props, cell_w, full_h), gloved_full, closeup(bare_props, cell_w, close_h), gloved_close]
        labels = [f"{item} bare+props", "gloved+props", "bare close", label]
        y = row * row_h
        for col, (cell, text) in enumerate(zip(cells, labels)):
            x = col * cell_w
            draw.rectangle((x, y, x + cell_w - 1, y + label_h - 1), fill="#2e3442")
            draw.text((x + 5, y + 7), text, fill="white", font=font)
            sheet.paste(cell.convert("RGB"), (x, y + label_h))
        entry = files.get(item, {}) if isinstance(files.get(item), dict) else {}
        qa_entries[item] = {
            "visualStatus": entry.get("visualStatus", "missing") if isinstance(entry, dict) else "missing",
            "sourceOutput": entry.get("sha256") if isinstance(entry, dict) else None,
        }
    sheet.save(QA_PATH, format="PNG", optimize=False)
    visual_statuses = [
        entry.get("visualStatus")
        for entry in files.values()
        if isinstance(entry, dict)
    ]
    if len(visual_statuses) == len(ITEMS) and all(status == "passed" for status in visual_statuses):
        qa_status = "visual-review-passed"
    elif any(status in {"flagged", "failed"} for status in visual_statuses):
        qa_status = "visual-review-flagged"
    else:
        qa_status = "pending-visual-review"
    manifest["qa"] = {
        "path": str(QA_PATH),
        "sha256": sha256_file(QA_PATH),
        "items": qa_entries,
        "visualStatus": qa_status,
        "composition": "actual fixed body without native hands; broom behind body, lower handle behind glove, continuous upper shaft in front from the finger opening",
    }
    manifest["qaStatus"] = qa_status
    write_manifest(manifest)
    return QA_PATH


def apply_reviews(manifest: dict[str, object], reviews: list[str]) -> None:
    files = manifest.get("files", {})
    if not isinstance(files, dict):
        raise RuntimeError("manifest files are malformed")
    for review in reviews:
        if "=" not in review:
            raise ValueError(f"review must be ITEM=passed|flagged|failed, got {review!r}")
        key, status = review.split("=", 1)
        if key not in files:
            raise KeyError(f"unknown item {key}")
        if status not in {"passed", "flagged", "failed"}:
            raise ValueError(f"review status must be passed, flagged or failed: {status}")
        entry = files[key]
        if not isinstance(entry, dict):
            raise ValueError(f"manifest entry malformed for {key}")
        entry["visualStatus"] = "passed" if status == "passed" else status
        if status == "passed":
            if entry.get("status") == "accepted-pending-visual":
                entry["status"] = "accepted"
            entry.setdefault("validation", {})
            if isinstance(entry["validation"], dict):
                entry["validation"]["actualClosedShape"] = "visual-confirmed"
        elif status == "flagged":
            entry["status"] = "flagged-visual-shape"
            entry.setdefault("validation", {})
            if isinstance(entry["validation"], dict):
                entry["validation"]["actualClosedShape"] = "visual-flagged"
        else:
            entry["status"] = "failed-visual"
            entry.setdefault("validation", {})
            if isinstance(entry["validation"], dict):
                entry["validation"]["actualClosedShape"] = "visual-failed"
    statuses = [entry.get("visualStatus") for entry in files.values() if isinstance(entry, dict)]
    manifest["qaStatus"] = "visual-review-passed" if len(statuses) == len(ITEMS) and all(status == "passed" for status in statuses) else "visual-review-flagged"
    manifest["visualReview"] = {"updatedAt": utc_now(), "itemsReviewed": len([status for status in statuses if status != "pending-inspection"])}
    write_manifest(manifest)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workers", type=int, default=MAX_WORKERS)
    parser.add_argument("--force", action="store_true", help="regenerate API items despite matching manifest hashes")
    parser.add_argument("--only", nargs="*", help="generate only the listed glove keys")
    parser.add_argument("--catalog", type=Path, metavar="PATH", help="catalog JSON (alternate collections require isolated output/raw directories)")
    parser.add_argument("--design-dir", type=Path, metavar="PATH", help="directory containing exact product design references")
    parser.add_argument("--output-dir", type=Path, metavar="PATH", help="directory for cleaned glove layers and manifest")
    parser.add_argument("--raw-dir", type=Path, metavar="PATH", help="directory for API responses and receipts")
    parser.add_argument("--qa-dir", type=Path, metavar="PATH", help="directory for visual QA sheets")
    parser.add_argument("--qa-only", action="store_true", help="rebuild /tmp/paper-doll-qa/rigged-gloves.png without API calls")
    parser.add_argument("--review", action="append", default=[], metavar="ITEM=STATUS", help="record visual review: passed, flagged, or failed")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    configure_paths(args)
    configure_catalog(load_catalog(CATALOG_PATH))
    OUT.mkdir(parents=True, exist_ok=True)
    SOURCES.mkdir(parents=True, exist_ok=True)
    QA_DIR.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest()

    baseline = load_rgba(GRIP_BASE_PATH)
    approved_layer = load_rgba(APPROVED_LAYER_PATH)
    approved_mask = np.asarray(load_rgba(APPROVED_MASK_PATH).getchannel("A")) > 10
    input_mask = mask_from_allowed(approved_mask)
    wand = load_rgba(OUT.parent / "wand-12.webp")
    broom = load_rgba(OUT.parent / "broom-12.webp")

    if args.review:
        apply_reviews(manifest, args.review)
        make_qa(manifest, wand, broom)
        log(f"recorded visual reviews: {', '.join(args.review)}")
        return 0
    if args.qa_only:
        make_qa(manifest, wand, broom)
        log(f"wrote QA {QA_PATH}")
        return 0

    failures: list[dict[str, str]] = []
    results: dict[str, object] = {}
    tasks: list[tuple[str, Image.Image, Path]] = []
    for item in PAID_ITEMS:
        if args.only and item not in args.only:
            continue
        product_path = DESIGNS / f"{item}.webp"
        product = load_rgba(product_path, canvas=False)
        tasks.append((item, product, product_path))

    workers = max(1, min(int(args.workers), MAX_WORKERS))
    manifest["maxWorkers"] = workers
    with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="rigged-gloves") as pool:
        futures = {
            pool.submit(
                process_api_item,
                item,
                manifest,
                baseline,
                product,
                product_path,
                approved_mask,
                approved_layer,
                input_mask,
                args.force,
            ): item
            for item, product, product_path in tasks
        }
        for future in as_completed(futures):
            item = futures[future]
            try:
                results[item] = future.result()
            except Exception as error:
                failures.append({"key": item, "error": str(error)})
                log(f"{item}: FAILED: {error}")

    manifest["failures"] = failures
    manifest["apiCallsThisRun"] = _API_CALLS
    manifest["createdAt"] = manifest.get("createdAt", utc_now())
    manifest["updatedAt"] = utc_now()
    make_qa(manifest, wand, broom)
    write_manifest(manifest)
    if failures:
        log(json.dumps({"failures": failures}, ensure_ascii=False))
        return 1
    log(f"generated {len(manifest.get('files', {}))} glove files; API calls={_API_CALLS}; QA={QA_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
