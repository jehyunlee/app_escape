"""Build 200 game exploration areas within 40 documented Hogwarts facilities."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://namu.wiki/w/%ED%98%B8%EA%B7%B8%EC%99%80%ED%8A%B8/%EC%8B%9C%EC%84%A4'
facilities=json.loads((ROOT/'assets'/'hogwarts-facilities.json').read_text(encoding='utf-8'))
assert len(facilities)==40
assert len({facility['id'] for facility in facilities})==40
assert len({facility['name'] for facility in facilities})==40
catalog=[]
for facility in facilities:
    assert facility['scope'] in ('castle','grounds')
    assert len(facility['areas'])==5
    assert len({area['name'] for area in facility['areas']})==5
    assert len(set(facility['clues']))==3
    for area in facility['areas']:
        clues=[*[clue for clue in facility['clues'] if clue!=area['clue']][:2],area['clue']]
        assert len(set(clues))==3,(facility['name'],area['name'],clues)
        catalog.append({'id':f'space-{len(catalog)+1:03d}','name':facility['name']+' · '+area['name'],
            'facilityId':facility['id'],'facilityName':facility['name'],'areaName':area['name'],
            'scope':facility['scope'],'gameArea':True,'source':SOURCE,
            'themeId':facility['themeId'],'accent':facility['accent'],
            'description':facility['description']+' '+area['detail'],'clues':clues,
            'artPrompt':facility['artPrompt']})
assert len(catalog)==200 and len({room['name'] for room in catalog})==200
(ROOT/'assets'/'rooms-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Built 200 exploration areas, all within 40 documented Hogwarts facilities')
