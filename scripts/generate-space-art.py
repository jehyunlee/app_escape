"""Generate one OpenAI image per room in rooms-catalog.json into assets/spaces/."""
import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'spaces'
MODEL = 'gpt-image-2.5-flare'
STYLE = ('Create a high-end cinematic environment artwork for an educational fantasy escape-room game. '
         'Landscape 3:2, AAA realistic 3D game environment / film production rendering, physically plausible lighting, '
         'richly detailed materials, atmospheric perspective. Inspired by a moonlit Scottish gothic castle: cool dark '
         'teal-blue night light with warm golden lantern light. NOT an illustration, NOT vector, NOT cartoon, NOT low-poly. '
         'Beautiful and inviting for children without childish styling. No people, no creatures in the foreground, no text, '
         'no letters, no UI, no watermark. Keep the lower central foreground relatively open; interactive 3D props are placed '
         'in front later. Natural 40mm eye-level camera, horizon in the upper middle, subtle depth of field. ')


def load_rooms():
    return json.loads((ROOT / 'rooms-catalog.json').read_text(encoding='utf-8'))


def generate(room, quality):
    path = OUT / f'{room["id"]}.webp'
    if path.exists():
        return room['id'], 'kept'
    prompt = STYLE + 'SCENE: ' + room['artPrompt']
    payload = json.dumps({'model': MODEL, 'prompt': prompt, 'size': '1536x1024', 'quality': quality, 'n': 1,
                          'output_format': 'webp', 'output_compression': 88}).encode()
    for attempt in range(4):
        request = urllib.request.Request('https://api.openai.com/v1/images/generations', data=payload, headers={
            'Authorization': 'Bearer ' + os.environ['OPENAI_API_KEY'], 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=300) as response:
                result = json.load(response)
            image = base64.b64decode(result['data'][0]['b64_json'], validate=True)
            if len(image) < 1000:
                raise ValueError('unexpectedly small image')
            temporary = path.with_suffix('.part')
            temporary.write_bytes(image)
            temporary.replace(path)
            path.with_suffix('.json').write_text(json.dumps({
                'model': MODEL, 'quality': quality, 'generated_at': datetime.now(timezone.utc).isoformat(),
                'file': path.name, 'roomId': room['id'], 'name': room['name'], 'prompt': prompt,
            }, ensure_ascii=False, indent=2), encoding='utf-8')
            return room['id'], f'{len(image)} bytes'
        except urllib.error.HTTPError as error:
            body = error.read().decode('utf-8', 'replace')
            if error.code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(20 * (attempt + 1))
                continue
            try:
                detail = json.loads(body).get('error', {}).get('message', body[:200])
            except ValueError:
                detail = body[:200]
            raise RuntimeError(f'{room["id"]}: HTTP {error.code}: {detail}') from None
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt < 3:
                time.sleep(15 * (attempt + 1))
                continue
            raise RuntimeError(f'{room["id"]}: {error}') from None
    raise RuntimeError(f'{room["id"]}: retry limit reached')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--quality', choices=('low', 'medium', 'high'), default='medium')
    parser.add_argument('--ids', nargs='*')
    args = parser.parse_args()
    if not os.environ.get('OPENAI_API_KEY'):
        raise SystemExit('OPENAI_API_KEY is not configured')
    rooms = load_rooms()
    if args.ids:
        rooms = [room for room in rooms if room['id'] in set(args.ids)]
    OUT.mkdir(parents=True, exist_ok=True)
    failures, done = [], 0
    started = time.time()
    with ThreadPoolExecutor(max_workers=max(1, min(6, args.workers))) as executor:
        futures = {executor.submit(generate, room, args.quality): room for room in rooms}
        for future in as_completed(futures):
            room = futures[future]
            try:
                room_id, note = future.result()
                done += 1
                print(f'[{done}/{len(rooms)}] {room_id} {room["name"]}: {note} ({int(time.time() - started)}s)', flush=True)
            except Exception as error:
                failures.append(room['id'])
                print(f'FAILED {error}', flush=True)
    print(f'Finished {len(rooms) - len(failures)}/{len(rooms)}; failures={failures}', flush=True)
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
