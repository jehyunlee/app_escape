"""Generate the game's cinematic room artwork with the OpenAI Image API."""
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
MODEL = 'gpt-image-2.5-flare'
ROOMS = {
    1: 'A sophisticated Hogwarts-inspired wizarding classroom at blue hour. Tall pointed leaded glass windows, carved medieval oak desks to the sides, chalkboard with faint illegible chalk traces, shelves with translucent jewel-toned potion bottles, a brass astronomical instrument and an old leather spellbook. Cool teal moonlight crosses the room, warm candles illuminate richly textured stone. Quiet cinematic mystery, inviting rather than frightening.',
    2: 'An enchanting Victorian gothic greenhouse inside a wizard castle. Lofty arched glass and aged bronze structural ribs, lush realistic tropical leaves and climbing vines, rows of aged terracotta pots, glowing subtle botanical specimens and a small brass watering can. Moonlit teal mist outdoors, warm amber lanterns inside. Rich and natural greenery, a clear central aisle leading into depth.',
    3: 'An enormous medieval wizard castle Great Hall. Towering gothic vaulted stone ceiling, very long dark oak dining tables receding in one-point perspective on both sides of a clear central aisle, warm floating candles at different heights, soft teal moonlight through pointed windows, restrained dark gold banners, pewter goblets. Vast majestic cinematic architecture, realistic materials and atmospheric haze.',
    4: 'The edge of an ancient enchanted forest immediately outside a Scottish wizard castle at moonrise. Massive twisting oak trunks, realistic ferns, mossy rocks, delicate low blue mist, tiny warm fireflies, a winding quiet path. A little antique lantern on an old tree stump at one side, no monsters. Natural moonlit teal and earthy amber color palette with soft shafts of moonlight.',
    5: 'Inside a spectacular medieval wizard castle CLOCK TOWER. A HUGE antique translucent clock dial, raised bronze Roman numerals and elegant dark clock hands dominate the upper background, about 55 percent of the image width. Intricate brass gears, timber crossbeams, stone arches, softly glowing warm dust in moonlight. Camera at standing eye height, view into deep architectural space. Foreground is an open timber platform. Rear clockface is gently out of focus, recognizable and magnificent, foreground texture sharper. Cinematic depth of field, no text other than Roman clock numerals.',
    6: 'The interior of an atmospheric castle owl tower, a high circular stone room with large open pointed arches showing a distant misty Scottish landscape under the moon. Rows of wooden owl roosts and empty wicker nests, parchment envelopes and soft feathers on a ledge, warm hanging brass lantern, natural aged stone and weathered wood. A few believable small owls far in the background only, central foreground clear.',
    7: 'A magnificent gothic wizard castle library at night, towering oak bookcases packed with real old leather-bound books, spiral upper galleries, a wooden rolling ladder, brass reading lamps, distant glowing pointed window, detailed carved arches. Warm honey lamplight and cool teal moonlight, natural rich leather and wood grain, intimate mysterious scholarly mood. Central foreground open, a broad reading desk pushed to the side.',
    8: 'A magical astronomy observatory at the top of a medieval stone tower, open tall pointed arches reveal a stunning realistic starry night and distant mountain silhouettes. A large aged brass telescope angled upward on one side, a bronze armillary sphere, worn celestial maps with no legible lettering, circular stone floor, faint amber lanternlight. Cinematic blue moonlight, natural lens depth, awe inspiring and sophisticated.',
    9: 'An extraordinary grand staircase chamber in a medieval wizard castle, multiple sweeping dark stone staircases crossing and connecting at different heights, realistic carved railings, walls of antique gilded framed portraits too distant to discern faces, torchlight and cool teal mist from high gothic windows. Clear central landing in the foreground, dramatic spatial depth, believable architectural detail, wonder and mystery without horror.',
    10: 'Inside the monumental entrance gateway of an ancient Scottish wizard castle. Enormous arched dark oak double gates reinforced with aged iron bands, two warm torch sconces, carved stone heraldic shields, weathered flagstone floor. A thin opening between doors reveals inviting moonlit garden greenery and soft warm lights outside. Strong atmospheric blue-green moonlight mixed with amber firelight. Cinematic final destination, no people.',
}
STYLE = '''Create a high-end cinematic environment artwork for an educational fantasy escape-room game. Landscape 3:2 composition, AAA realistic 3D game environment / film production rendering, physically plausible global illumination, richly detailed stone, wood and brass materials, atmospheric perspective, natural shadows. Inspired by a moonlit Scottish gothic castle with cool dark teal-blue sky and warm golden window lights. NOT an illustration, NOT vector art, NOT cartoon, NOT low-poly, NOT flat game UI. Beautiful, inviting for children without childish styling. No people, no player character, no interface, no icons, no watermarks, no readable labels. Keep the lower central foreground relatively clear because interactive real 3D props will be placed in front later. Architectural subject and depth must remain visible rather than underexposed. Camera has a natural 40mm perspective, horizontal eye-level horizon near the upper middle. Subtle cinematic depth of field; not everything blurry. This image is the distant environmental matte behind real-time 3D objects. '''


def generate(level, output):
    path = output / f'room-{level}.webp'
    if path.exists():
        print(f'Room {level}: existing artwork kept', flush=True)
        return level
    prompt = STYLE + ROOMS[level]
    payload = json.dumps({'model': MODEL, 'prompt': prompt, 'size': '1536x1024', 'quality': 'high', 'n': 1, 'output_format': 'webp', 'output_compression': 90}).encode()
    request = urllib.request.Request('https://api.openai.com/v1/images/generations', data=payload, headers={'Authorization': 'Bearer ' + os.environ['OPENAI_API_KEY'], 'Content-Type': 'application/json'})
    print(f'Room {level}: generating with {MODEL}', flush=True)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=240) as response:
                result = json.load(response)
            image = base64.b64decode(result['data'][0]['b64_json'], validate=True)
            if len(image) < 1000:
                raise ValueError('Image API returned an unexpectedly small image')
            temporary = path.with_suffix('.part')
            temporary.write_bytes(image)
            temporary.replace(path)
            metadata = {'model': MODEL, 'generated_at': datetime.now(timezone.utc).isoformat(), 'file': path.name, 'prompt': prompt}
            path.with_suffix('.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
            print(f'Room {level}: saved {path.name}, {len(image)} bytes', flush=True)
            return level
        except urllib.error.HTTPError as error:
            if error.code == 429 and attempt < 2:
                print(f'Room {level}: rate limited, retrying after pacing delay', flush=True)
                time.sleep(15 * (attempt + 1))
                continue
            try:
                detail = json.loads(error.read()).get('error', {}).get('message', 'Unknown API error')
            except (ValueError, AttributeError):
                detail = 'Unable to decode API error'
            raise RuntimeError(f'Room {level}: HTTP {error.code}: {detail}') from None
    raise RuntimeError(f'Room {level}: retry limit reached')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--levels', nargs='+', type=int, default=list(ROOMS))
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    if not os.environ.get('OPENAI_API_KEY'):
        raise SystemExit('OPENAI_API_KEY is not configured')
    if any(level not in ROOMS for level in args.levels):
        raise SystemExit('Levels must be between 1 and 10')
    output = ROOT / 'assets' / 'rooms'
    output.mkdir(parents=True, exist_ok=True)
    failures = []
    with ThreadPoolExecutor(max_workers=max(1, min(3, args.workers))) as executor:
        futures = {executor.submit(generate, level, output): level for level in args.levels}
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as error:
                failures.append(futures[future])
                print(f'FAILED: {error}', flush=True)
    print(f'Finished: {len(args.levels) - len(failures)}/{len(args.levels)}; failures={failures}', flush=True)
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
