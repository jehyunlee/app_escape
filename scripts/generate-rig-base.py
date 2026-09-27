"""OpenAI edit for the concealed leg underlayer of the paper-doll rig."""
from pathlib import Path
import importlib.util,json,hashlib
from datetime import datetime,timezone
from PIL import Image,ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'assets/doll';RAW=ROOT/'scripts/art-sources/rig-base';OUT=D/'rigged'
REFERENCE=ROOT/'scripts/art-sources/doll-reference'
s=importlib.util.spec_from_file_location('api',ROOT/'scripts/image-api.py');api=importlib.util.module_from_spec(s);s.loader.exec_module(api)
PROMPT=('Edit ONLY the leg clothing inside the mask. Keep this entire nonsexual stylized family-game paper-doll figure in precisely the same standing pose, frame, scale, anatomy and 1024x1536 transparent canvas. '
'Remove the baggy grey trousers. Replace them with plain modest dark-grey fitted knee-length shorts, ending just above the knees. '
'Show the two natural bare lower legs below those shorts, with the SAME unchanged brown ankle boots. Exactly two legs, same hip/knee/ankle/foot positions, same warm skin tone as the hands. '
'Do not move or redraw the torso, cream long-sleeve shirt, closed fists, arms, head or face. Do not zoom, crop, change camera or create a product-only image. '
'This is the concealed anatomical underlayer for dressing the figure with different trousers later. Preserve the soft stylized 3D texture, shading, identity and lighting. Transparent background, no text, no other objects.')

def main():
 RAW.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
 base=Image.open(REFERENCE/'prototypes/grips/grip-base.png').convert('RGBA')
 owned=Image.new('L',base.size,0);draw=ImageDraw.Draw(owned)
 draw.rectangle((348,774,703,974),fill=255);draw.rectangle((200,975,824,1535),fill=255)
 edit=owned.copy();ImageDraw.Draw(edit).rectangle((0,1400,1023,1535),fill=0)
 mask=Image.new('RGBA',base.size,(0,0,0,255));mask.putalpha(Image.fromarray(255-np.asarray(edit)))
 path=RAW/'raw.png'
 if not path.exists():
  result,data=api.api_edit(PROMPT,[base],mask);path.write_bytes(data)
  (RAW/'provenance.json').write_text(json.dumps({'model':api.MODEL,'prompt':PROMPT,'source':'assets/doll/prototypes/grips/grip-base.png','createdAt':datetime.now(timezone.utc).isoformat(),'rawSha256':hashlib.sha256(data).hexdigest()},ensure_ascii=False,indent=2)+'\n')
 raw=Image.open(path).convert('RGBA')
 combined=Image.composite(raw,base,edit)
 rgba=np.asarray(combined).copy();a=np.asarray(owned)/255;rgba[:,:,3]=np.round(rgba[:,:,3]*a).astype(np.uint8);rgba[rgba[:,:,3]<10]=0
 Image.fromarray(rgba).save(OUT/'legs-under.webp',format='WEBP',lossless=True,method=6)
 owned.save(OUT/'pants-ownership.png')
 combined.save('/tmp/paper-doll-qa/leg-underlayer.png')
 print('Generated leg underlayer; visual review required')

if __name__=='__main__':main()
