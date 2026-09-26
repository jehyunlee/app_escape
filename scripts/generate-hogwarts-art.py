"""Generate one cinematic background per documented Hogwarts facility."""
import importlib.util
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('space_art',ROOT/'scripts'/'generate-space-art.py')
art=importlib.util.module_from_spec(spec);spec.loader.exec_module(art)
art.OUT=ROOT/'assets'/'hogwarts';art.OUT.mkdir(parents=True,exist_ok=True)
facilities=json.loads((ROOT/'assets'/'hogwarts-facilities.json').read_text(encoding='utf-8'))
failures=[]
with ThreadPoolExecutor(max_workers=4) as pool:
    futures={pool.submit(art.generate,facility,'high'):facility for facility in facilities}
    for index,future in enumerate(as_completed(futures),1):
        facility=futures[future]
        try:
            result=future.result()
            print(f'{index}/{len(facilities)} {facility["name"]}: {result}',flush=True)
        except Exception as error:
            failures.append(facility['id'])
            print(f'FAILED {facility["id"]}: {error}',flush=True)
print('Completed facility generation; failed:',failures,flush=True)
if failures:raise SystemExit(1)
