"""Generate OpenAI hatted-head replacements, then register facial coordinates.

Hats include their own restyled hair. They replace the free head; they are never
stacked over an unhatted hairstyle. Raw art stays outside the published assets.
"""
import argparse
import hashlib
import importlib.util
import json
import shutil
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
DOLL=ROOT/'assets/doll'
REFERENCE=ROOT/'scripts/art-sources/doll-reference'
DEFAULT_CATALOG=ROOT/'assets/wardrobe-catalog.json'
DEFAULT_DESIGNS=ROOT/'scripts/art-sources/field-wardrobe/designs'
DEFAULT_OUT=DOLL/'headwear'
DEFAULT_RAW=ROOT/'scripts/art-sources/headwear'
CATALOG_PATH=DEFAULT_CATALOG
CATALOG=DEFAULT_CATALOG
DESIGNS=DEFAULT_DESIGNS
OUT=DEFAULT_OUT
RAW=DEFAULT_RAW
QA_DIR=Path('/tmp/paper-doll-qa/headwear')
CHARS=('dad','mom','jeongan','suan','yewon','hunho')
MOODS=('neutral','happy','sad')
QUALITY='high'

def module(name,filename):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/filename)
 mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
api=module('head_api','image-api.py')
reg=module('head_register','register-doll-heads.py')

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def _actual_input_cache_matches(record, source_hashes, text):
 required=('product','identity','headReference')
 previous_hashes=record.get('sourceHashes')
 if not isinstance(previous_hashes,dict):
  return False
 if any(previous_hashes.get(name)!=source_hashes[name] for name in required):
  return False
 if record.get('prompt')!=text:
  return False
 if 'model' in record and record['model']!=api.MODEL:
  return False
 if 'quality' in record and record['quality']!=QUALITY:
  return False
 return True

def prompt(char,item):
 glasses='Preserve the same glasses.' if char in ('dad','mom','jeongan','yewon') else 'No glasses; this person does not wear glasses.'
 hair='Preserve the length and colour of the hair, but naturally tuck or flatten it under the hat; side and back hair falls from UNDER the brim.'
 if char=='yewon':
  hair+=' Keep the complete low ponytail on the viewer-right side, including its tapered curled tip below the jaw beside the neck. It must remain visible outside the hat and any chin strap. Do not shorten it to a bun or cut hair off along a circular portrait edge.'
 antlers=('This character always has TWO small brown deer antlers. Both antlers MUST remain clearly visible, '
 'one on each side above the ears, protruding through discreet openings beside the hat. '
 'Do not hide, cover, remove or replace the antlers. They are part of this character identity, not optional decoration.') if char=='hunho' else ''
 return ('Image 1 is this known Korean family character\'s transparent head-only sprite. Image 2 is the requested hat design. '
 'Image 3 is the original family-game style and identity reference for this person\'s face only, not a body, outfit or product design to reproduce. '
 'Render ONLY one complete head wearing the hat, including face, fitted hat, and hair restyled under the hat. '
 'The hat opening must fit the FULL skull width and sit naturally just above the eyebrows. All crown hair is tucked inside; '
 'never place a miniature cone atop exposed crown hair. Preserve the recognizable design, material, colour, ornaments and trim of image 2. '
 'Image 2 is the exact new product reference: copy only its hat construction, materials, colours and stated trim. '
 'Do not import jewels, feathers, gold trim, stars, flowers or any other ornament from image 3 or from the character identity. '
 'If the hat is tall or pointed, its wide base encloses the skull and the point rises above it; keep the whole tip and brim visible. '
 'Keep this person\'s face, expression, facial proportions, fixed head framing and recognizable identity. All characters use the same front-facing head pose and scale; do not substitute a generic face. '
 f'{glasses} {hair} {antlers} '
 'Polished stylized 3D family illustration, same lighting and detailed materials as the references. '
 'No body, torso, shirt, cape, shoulders, limbs, hands, background, text or watermark. The head silhouette and all surrounding space are transparent. '
 f'Product: {item["name"]}. {item.get("designPrompt","")}')

def rel(path):
 try:return str(path.relative_to(ROOT))
 except ValueError:return str(path)

def load_catalog(path):
 data=json.loads(path.read_text(encoding='utf-8'))
 if isinstance(data,dict):data=data.get('items',data.get('catalog'))
 if not isinstance(data,list):raise ValueError(f'catalog must be a JSON list: {path}')
 return data

def _inside(path,root):
 path,root=path.resolve(),root.resolve()
 return path==root or root in path.parents

def configure_paths(args):
 global CATALOG_PATH,CATALOG,DESIGNS,OUT,RAW,QA_DIR
 alternate=args.catalog is not None or args.design_dir is not None
 CATALOG_PATH=Path(args.catalog).expanduser() if args.catalog else DEFAULT_CATALOG
 CATALOG=CATALOG_PATH
 DESIGNS=Path(args.design_dir).expanduser() if args.design_dir else DEFAULT_DESIGNS
 OUT=Path(args.output_dir).expanduser() if args.output_dir else DEFAULT_OUT
 RAW=Path(args.raw_dir).expanduser() if args.raw_dir else DEFAULT_RAW
 QA_DIR=Path(args.qa_dir).expanduser() if args.qa_dir else Path('/tmp/paper-doll-qa/headwear')
 if alternate:
  if args.output_dir is None or args.raw_dir is None:
   raise SystemExit('--output-dir and --raw-dir are required with --catalog or --design-dir')
  if OUT.resolve()==RAW.resolve() or _inside(OUT,DEFAULT_OUT) or _inside(DEFAULT_OUT,OUT) or _inside(RAW,DEFAULT_RAW) or _inside(DEFAULT_RAW,RAW) or _inside(QA_DIR,DEFAULT_OUT) or _inside(DEFAULT_OUT,QA_DIR):
   raise SystemExit('alternate catalog/design-dir requires fresh, distinct output and raw directories')
  if not CATALOG.is_file() or not DESIGNS.is_dir():
   raise SystemExit('alternate catalog/design-dir paths must exist')

def mask():
 img=Image.new('RGBA',(1024,1536),(0,0,0,0))
 ImageDraw.Draw(img).ellipse((344,224,682,404),fill=(0,0,0,255))
 return img

def save_webp(im,path):
 a=np.asarray(im.convert('RGBA')).copy();a[a[:,:,3]<10]=0
 Image.fromarray(a).save(path,format='WEBP',quality=94,method=6)

def generate(char,item,force=False,rebuild=False):
 key=f'{char}-{item["id"]}'
 metadata=OUT/f'{key}.json'
 source_hashes={
  'catalog':digest(CATALOG),
  'product':digest(DESIGNS/f'{item["id"]}.webp'),
  'identity':digest(ROOT/f'scripts/art-sources/wizards/{char}-neutral.webp'),
  'headReference':digest(REFERENCE/f'{char}-neutral.webp'),
 }
 text=prompt(char,item)
 if metadata.exists() and not force and not rebuild:
  record=json.loads(metadata.read_text())
  if (
   _actual_input_cache_matches(record,source_hashes,text)
   and all((OUT/file).exists() for file in record.get('files',{}))
   and len(record.get('files',{}))==3
  ):
   return key,record.get('status')
 base=Image.open(REFERENCE/f'{char}-neutral.webp').convert('RGBA')
 design=Image.open(DESIGNS/f'{item["id"]}.webp').convert('RGBA')
 identity=Image.open(ROOT/f'scripts/art-sources/wizards/{char}-neutral.webp').convert('RGBA')
 raw_path=RAW/f'{key}.png'
 raw_receipt=RAW/f'{key}.json'
 cached=False
 if raw_path.exists() and raw_receipt.exists():
  previous=json.loads(raw_receipt.read_text())
  cached=_actual_input_cache_matches(previous,source_hashes,text) and previous.get('rawSha256')==digest(raw_path)
 if rebuild and not cached:
  raise ValueError(f'{key}: cached raw source does not match current inputs')
 if force or not cached:
  if raw_path.exists():
   archive=RAW/'superseded';archive.mkdir(parents=True,exist_ok=True)
   previous_key=f'{key}-{digest(raw_path)[:12]}'
   shutil.copy2(raw_path,archive/f'{previous_key}.png')
   if raw_receipt.exists():shutil.copy2(raw_receipt,archive/f'{previous_key}.json')
  last=None
  for attempt in range(3):
   try:
    image,raw=api.api_edit(text,[base,design,identity],mask())
    raw_path.write_bytes(raw)
    raw_receipt.write_text(json.dumps({
     'model':api.MODEL,
     'prompt':text,
     'createdAt':datetime.now(timezone.utc).isoformat(),
     'rawSha256':digest(raw_path),
     'sourceHashes':source_hashes,
     'sources':{
      'catalog':{'path':rel(CATALOG),'sha256':digest(CATALOG)},
      'product':{'path':rel(DESIGNS/f'{item["id"]}.webp'),'sha256':digest(DESIGNS/f'{item["id"]}.webp')},
     },
    },ensure_ascii=False,indent=2)+'\n')
    break
   except Exception as error:
    last=error
    if attempt==2:raise
    time.sleep(2*(attempt+1))
 raw=Image.open(raw_path).convert('RGBA')
 receipt=json.loads(raw_receipt.read_text())
 if receipt['rawSha256']!=digest(raw_path):raise ValueError(f'{key}: raw provenance hash mismatch')
 aligned,metrics=reg.register(base,raw)
 bbox=aligned.getchannel('A').getbbox()
 if not bbox:raise ValueError(f'{key}: empty image')
 status='needs-visual-review' if metrics['refinedCorrelation']>=.75 else 'registration-failed'
 _,neck_offset=reg.attach_neck(aligned)
 files={}
 for mood in MOODS:
  head=aligned.copy()
  if mood!='neutral':
   patch=reg.expression_patch(char,mood)
   patch.putalpha(Image.fromarray(np.minimum(np.asarray(patch.getchannel('A')),np.asarray(aligned.getchannel('A')))))
   head.alpha_composite(patch)
  head=head.transform(reg.CANVAS,Image.Transform.AFFINE,(1,0,0,0,1,-neck_offset),Image.Resampling.BICUBIC)
  file=f'{char}-{mood}-{item["id"]}.webp';save_webp(head,OUT/file)
  box=head.getchannel('A').getbbox()
  files[file]={'sha256':digest(OUT/file),'bbox':[box[0],box[1]-reg.PAD,box[2],box[3]-reg.PAD], 'offsetY':-reg.PAD,'width':1024,'height':2304,'neckOffset':neck_offset}
 record={'character':char,'item':item['id'],'model':receipt['model'],'quality':QUALITY,'createdAt':receipt['createdAt'],'prompt':receipt['prompt'],'raw':rel(raw_path),'rawSha256':digest(raw_path),'registration':metrics,'status':status,'files':files,'visualReview':None}
 record['sources']={
  'catalog':{'path':rel(CATALOG),'sha256':digest(CATALOG)},
  'product':{'path':rel(DESIGNS/f'{item["id"]}.webp'),'sha256':digest(DESIGNS/f'{item["id"]}.webp')},
  'identity':{'path':rel(ROOT/f'scripts/art-sources/wizards/{char}-neutral.webp'),'sha256':digest(ROOT/f'scripts/art-sources/wizards/{char}-neutral.webp')},
  'headReference':{'path':rel(REFERENCE/f'{char}-neutral.webp'),'sha256':digest(REFERENCE/f'{char}-neutral.webp')},
 }
 record['sourceHashes']={name:value['sha256'] for name,value in record['sources'].items()}
 metadata.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
 return key,status

def bare_heads():
 for char in CHARS:
  neutral=Image.new('RGBA',reg.CANVAS)
  neutral.alpha_composite(Image.open(REFERENCE/f'{char}-neutral.webp').convert('RGBA'),(0,reg.PAD))
  _,offset=reg.attach_neck(neutral)
  for mood in MOODS:
   im=Image.new('RGBA',reg.CANVAS)
   im.alpha_composite(Image.open(REFERENCE/f'{char}-{mood}.webp').convert('RGBA'),(0,reg.PAD))
   im=im.transform(reg.CANVAS,Image.Transform.AFFINE,(1,0,0,0,1,-offset),Image.Resampling.BICUBIC)
   save_webp(im,OUT/f'{char}-{mood}-bare.webp')

def main():
 p=argparse.ArgumentParser()
 p.add_argument('--only',nargs='*')
 p.add_argument('--workers',type=int,default=4)
 p.add_argument('--force',action='store_true')
 p.add_argument('--rebuild-existing',action='store_true')
 p.add_argument('--review',choices=('passed','failed'),help='record a completed visual review without generation')
 p.add_argument('--review-note',help='specific visual review evidence')
 p.add_argument('--catalog',type=Path,metavar='PATH',help='catalog JSON (alternate collections require isolated output/raw directories)')
 p.add_argument('--design-dir',type=Path,metavar='PATH',help='directory containing exact product design references')
 p.add_argument('--output-dir',type=Path,metavar='PATH',help='directory for registered heads and manifests')
 p.add_argument('--raw-dir',type=Path,metavar='PATH',help='directory for API responses and receipts')
 p.add_argument('--qa-dir',type=Path,metavar='PATH',help='directory reserved for QA artifacts')
 args=p.parse_args()
 configure_paths(args)
 OUT.mkdir(parents=True,exist_ok=True);RAW.mkdir(parents=True,exist_ok=True)
 hats=[item for item in load_catalog(CATALOG) if item.get('category')=='hat']
 jobs=[(char,item)for char in CHARS for item in hats]
 if args.only:
  unknown=set(args.only)-{f'{char}-{item["id"]}' for char,item in jobs}
  if unknown:raise ValueError(f'Unknown headwear keys: {sorted(unknown)}')
 if args.only:jobs=[(c,i) for c,i in jobs if f'{c}-{i["id"]}' in args.only]
 if args.review:
  if not args.review_note:p.error('--review-note is required with --review')
  for char,item in jobs:
   path=OUT/f'{char}-{item["id"]}.json';record=json.loads(path.read_text())
   if args.review=='passed':
    if record['registration']['refinedCorrelation']<.75:raise ValueError(f'{path.name}: registration is unresolved')
    for filename,details in record['files'].items():
     if digest(OUT/filename)!=details['sha256']:raise ValueError(f'{filename}: stale review input')
   record['visualReview']={'status':args.review,'reviewer':'parent assistant','note':args.review_note,'reviewedAt':datetime.now(timezone.utc).isoformat()}
   record['status']='visual-review-passed' if args.review=='passed' else 'visual-review-failed'
   path.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
  print(f'Recorded {args.review} visual review for {len(jobs)} headwear variants')
  return
 if args.rebuild_existing:jobs=[(c,i)for c,i in jobs if (RAW/f'{c}-{i["id"]}.png').exists()]
 failures=[]
 with ThreadPoolExecutor(max_workers=args.workers)as pool:
  futures={pool.submit(generate,c,i,args.force,args.rebuild_existing):f'{c}-{i["id"]}'for c,i in jobs}
  for index,future in enumerate(as_completed(futures),1):
   try:key,status=future.result();print(f'{index}/{len(jobs)} {key}: {status}',flush=True)
   except Exception as error:failures.append(futures[future]);print(f'FAILED {futures[future]}: {type(error).__name__}',flush=True)
 bare_heads()
 print('Failures:',failures,flush=True)
 if failures:raise SystemExit(1)

if __name__=='__main__':main()
