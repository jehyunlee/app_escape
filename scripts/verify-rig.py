"""Verify actual paper-doll pixels; persist hashes for dependency-free CI checks."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'assets/doll';R=D/'rigged'

def load(path):return np.asarray(Image.open(path).convert('RGBA'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
 global D,R
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--doll-dir',type=Path,default=D)
 args=parser.parse_args()
 D=args.doll_dir.resolve();R=D/'rigged'
 index=json.loads((R/'runtime.json').read_text())
 files={};failures=[]
 for file,meta in index['files'].items():
  path=D/file;im=load(path);height,width=im.shape[:2]
  if [width,height]!=[meta['width'],meta['height']]:failures.append(file+': dimensions')
  if sha(path)!=meta['sha256']:failures.append(file+': runtime hash')
  if not np.any(im[:,:,3]>128):failures.append(file+': empty')
  files[file]={'sha256':sha(path),'width':width,'height':height,'opaquePixels':int((im[:,:,3]>128).sum())}
 hands=load(ROOT/'scripts/art-sources/doll-reference/prototypes/grips/grip-base-mask.png')[:,:,3]
 pants=np.asarray(Image.open(R/'native-pants-ownership.png').convert('L'))
 body=load(R/'body-upper.webp')[:,:,3]
 checks={
  'nativeHandsInBody':int(((hands>=250)&(body>10)).sum()),
  'nativeTrousersInBody':int(((pants>=250)&(body>10)).sum()),
  'bootsPixelsAbove1320':int((load(R/'boots.webp')[:1320,:,3]>0).sum()),
  'starterPantsHandFragments':int((load(R/'starter-pants.webp')[940:1020,220:340,3]>20).sum()+(load(R/'starter-pants.webp')[940:1020,705:815,3]>20).sum()),
 }
 anatomy=json.loads((R/'neck-assembly.json').read_text())
 body_record=anatomy['body']
 removal_path=D/body_record['removalMask']
 removal=np.asarray(Image.open(removal_path).convert('L'))>128
 before_path=ROOT/body_record['source']['path']
 before=load(before_path);current=load(R/'body-upper.webp')
 visible=(before[:,:,3]>0)|(current[:,:,3]>0)
 outside=int((np.any(before!=current,axis=2)&visible&~removal).sum())
 retained=int(((body>0)&removal).sum())
 if outside or retained:failures.append('body: anatomical neck partition mismatch')
 if sha(before_path)!=body_record['source']['sha256'] or sha(removal_path)!=body_record['maskSha256'] or sha(R/'body-upper.webp')!=body_record['sha256']:failures.append('body: stale anatomical source')
 neck_checks={}
 for file,record in anatomy['heads'].items():
  neck_path=D/record['neck'];head_path=D/file
  neck=load(neck_path)[:,:,3]
  head=load(head_path)[768:2304,:,3]
  character=anatomy['characters'][record['character']]
  contact_path=D/character['contactMask']
  contact=np.asarray(Image.open(contact_path).convert('L'))>128
  contact_holes=int(((neck<200)&contact).sum())
  ys=slice(390,496);xs=slice(500,524)
  combined=255*(1-(1-head[ys,xs]/255)*(1-neck[ys,xs]/255)*(1-body[ys,xs]/255))
  required=removal[ys,xs]&(before[ys,xs,3]>=200)
  joint_holes=int(((combined<180)&required).sum())
  if contact_holes or joint_holes:failures.append(file+': disconnected anatomical neck')
  if sha(head_path)!=record['sha256'] or sha(neck_path)!=record['neckSha256'] or sha(contact_path)!=character['contactSha256']:failures.append(file+': stale anatomical assembly')
  neck_checks[file]={'headSha256':sha(head_path),'neckFile':record['neck'],'neckSha256':sha(neck_path),'uncoveredCollarPixels':contact_holes,'centralJointHoles':joint_holes}
 checks['neckAssembly']={'changedBodyPixelsOutsideJoint':outside,'nativeNeckPixelsInBody':retained,'states':neck_checks}
 for name,value in checks.items():
  if isinstance(value,int) and value:failures.append(name+': '+str(value))
 allowed=np.zeros((1536,1024),bool)
 allowed[735:995,200:398]=True;allowed[735:995,658:831]=True
 gloveChecks={}
 for i in range(1,13):
  file=f'rigged/gloves/gloves-{i:02d}.webp';a=load(D/file)[:,:,3]
  out=int(((a>10)&~allowed).sum())
  left=int((a[735:995,200:398]>128).sum());right=int((a[735:995,658:831]>128).sum())
  gloveChecks[file]={'outsideHandRegions':out,'leftPixels':left,'rightPixels':right}
  if out or min(left,right)<100:failures.append(file+': hand ownership')
 checks['gloves']=gloveChecks
 clothing=json.loads((R/'clothing/manifest.json').read_text())
 fitted_ids=['cloak-02','cloak-07','cloak-09']+[f'vest-{i:02d}' for i in range(1,13)]
 clothing_checks={}
 for key in fitted_ids:
  record=clothing['items'][key]
  path=R/'clothing'/f'{key}.webp'
  a=load(path)[:,:,3]
  probes=record['registration']['fitProbes']
  fabric=probes['fabric'];underlayer=probes['underlayer']
  if not fabric or not underlayer:raise ValueError(f'{key}: missing anatomical fit probes')
  fabric_results=[{'point':[x,y],'alpha':int(a[y,x])} for x,y in fabric]
  opening_results=[{'point':[x,y],'garmentAlpha':int(a[y,x]),'bodyAlpha':int(body[y,x])} for x,y in underlayer]
  shoulders=[int(a[520,390]),int(a[520,638])] if key.startswith('vest-') else []
  fit_errors=sum(p['alpha']<180 for p in fabric_results)
  fit_errors+=sum(p['garmentAlpha']>20 or p['bodyAlpha']<180 for p in opening_results)
  fit_errors+=sum(value<180 for value in shoulders)
  if fit_errors:failures.append(key+': garment attachment/opening mismatch')
  if sha(path)!=record['output']['sha256']:failures.append(key+': stale garment fit record')
  clothing_checks[key]={'sha256':sha(path),'fabric':fabric_results,'underlayer':opening_results,'shoulderAlpha':shoulders,'fitErrors':fit_errors}
 checks['clothingFit']=clothing_checks
 accessories=json.loads((R/'accessories.json').read_text())
 accessory_checks={}
 for file,record in accessories.items():
  a=load(R/file)[:,:,3];transform=record['transform']
  if file.startswith('wand-'):
   front_meta=transform['frontLayer']
   front_path=R/record['gripLayer']['file']
   original_path=R/front_meta['unpartitionedProof']['file']
   original=load(original_path);front=load(front_path);back=load(R/file)
   full_alpha=original[:,:,3]
   partition_errors=int((back[:,:,3].astype(np.uint16)+front[:,:,3].astype(np.uint16)!=full_alpha).sum())
   colour_errors=int((((front[:,:,:3]!=original[:,:,:3]).any(axis=2))&(front[:,:,3]>0)).sum()+(((back[:,:,:3]!=original[:,:,:3]).any(axis=2))&(back[:,:,3]>0)).sum())
   mask_path=R/front_meta['mask']['file']
   mask=np.asarray(Image.open(mask_path).convert('L'))>128
   x,y=transform['targetGripStart']
   overlap=int(((full_alpha[500:840,220:400]>160)&(body[500:840,220:400]>40)).sum())
   rows=np.where(front[:,:,3]>128)[0]
   result={'gripAlpha':int(full_alpha[y,x]),'frontGripAlpha':int(front[y,x,3]),'forearmOverlapPixels':overlap,
    'partitionAlphaErrorPixels':partition_errors,'partitionColourErrorPixels':colour_errors,
    'frontMaskLeakPixels':int(((front[:,:,3]>0)&~mask).sum()),
    'frontReachesUpperShaft':bool(len(rows) and int(rows.min())<y-100),
    'frontSha256':sha(front_path),'unpartitionedSha256':sha(original_path),'maskSha256':sha(mask_path)}
   if result['gripAlpha']<180 or result['frontGripAlpha']<180 or overlap:failures.append(file+': grip alignment')
   if partition_errors or colour_errors or result['frontMaskLeakPixels'] or not result['frontReachesUpperShaft']:failures.append(file+': disconnected or altered shaft split')
   if sha(front_path)!=front_meta['sha256'] or sha(original_path)!=front_meta['unpartitionedProof']['sha256'] or sha(mask_path)!=front_meta['mask']['sha256']:failures.append(file+': stale split proof hashes')
  elif file.startswith('necklace-'):
   mask_path=R/transform['occlusion']['mask'];mask=np.asarray(Image.open(mask_path).convert('L'))>128
   result={'rearArcVisiblePixels':int(((a>0)&mask).sum()),'maskSha256':sha(mask_path),'frontPixels':int((a>128).sum())}
   if result['rearArcVisiblePixels'] or result['frontPixels']<100:failures.append(file+': rear-neck occlusion')
  else:
   edge=int((a[0]>20).sum()+(a[-1]>20).sum()+(a[:,0]>20).sum()+(a[:,-1]>20).sum())
   result={'opaqueEdgePixels':edge}
   if edge:failures.append(file+': broom clipped')
  accessory_checks[file]=result
 checks['accessories']=accessory_checks
 headChecks={}
 for file,meta in index['files'].items():
  if not file.startswith('headwear/')or file.endswith('-portrait.webp'):continue
  a=load(D/file)[:,:,3]
  edge=int((a[0]>20).sum()+(a[-1]>20).sum()+(a[:,0]>20).sum()+(a[:,-1]>20).sum())
  headChecks[file]={'opaqueEdgePixels':edge}
  if edge:failures.append(file+': clipped canvas edge')
 report={'schema':'paper-doll-pixel-checks-v2','checkedAt':datetime.now(timezone.utc).isoformat(),'files':files,'checks':checks,'heads':headChecks,'failures':failures,'scope':'Pixel ownership, bounds and hashes. Visual anatomy and fit reviewed separately; these metrics do not prove semantic image correctness.'}
 (R/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'files':len(files),'checks':{k:v for k,v in checks.items()if k!='gloves'},'failures':failures},ensure_ascii=False))
 if failures:raise SystemExit(1)

if __name__=='__main__':main()
