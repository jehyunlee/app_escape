"""Generate open starter outer garments, without baked-in shirt/vest/skirt."""
from pathlib import Path
from PIL import Image
from datetime import datetime,timezone
import importlib.util,json,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[3];D=ROOT/'assets/doll';RAW=ROOT/'scripts/art-sources/open-starters'
s=importlib.util.spec_from_file_location('api',ROOT/'scripts/image-api.py');api=importlib.util.module_from_spec(s);s.loader.exec_module(api)
DESIGNS={'mom':'emerald forest-green hooded long coat/cape with delicate golden leaf embroidery and a gold botanical throat clasp','jeongan':'violet and purple long wizard coat with a short shoulder capelet, silver stars and moon trim, turquoise INNER LINING visible only on the coat itself'}

def main():
 RAW.mkdir(parents=True,exist_ok=True)
 for char,design in DESIGNS.items():
  key=f'{char}-base-cloak';path=RAW/f'{key}.png'
  prompt=('Create ONLY the OUTER garment from the family wizard design in image 2: '+design+'. '
   'Image 1 gives the precise front-facing body pose and scale. Image 2 gives colors and decorative style only. '
   'The coat is worn on an invisible body in the exact relaxed DOWNWARD-arm pose of image 1: shoulders, long sleeves, cuffs and hem must follow that stance. Both sleeves extend down to wrist cuffs near hip level, never forward or raised. '
   'The hood is DOWN, folded flat behind the neck and shoulders; do not show an upright pointed hood above the collar. The highest part of the garment is its low neck collar. '
   'The front is OPEN from below the throat clasp all the way to the hem. This opening is EMPTY TRANSPARENT SPACE, not a white shirt, not a green vest, not a turquoise dress or skirt. '
   'No inner outfit, no waistcoat, no trouser pixels, no belts bridging an inner outfit, no body, no skin, no hands, no head, no boots. '
   'Preserve rich fabric texture, lining inside folded lapels, matching magical embroidery and the recognizable original palette. '
   'Full garment visible, isolated true transparent background. Same polished stylized 3D game art and studio lighting. No text or extra objects.')
  path=RAW/f'{key}-hood-down.png'
  if not path.exists():
   images=[Image.open(ROOT/'scripts/art-sources/doll-reference/prototypes/grips/grip-base.png').convert('RGBA'),Image.open(ROOT/f'scripts/art-sources/wizards/{char}-neutral.webp').convert('RGBA')]
   raw,data=api.api_edit(prompt,images,Image.new('RGBA',(1024,1536)))
   path.write_bytes(data)
   path.with_suffix('.json').write_text(json.dumps({'model':api.MODEL,'prompt':prompt,'createdAt':datetime.now(timezone.utc).isoformat(),'rawSha256':hashlib.sha256(data).hexdigest()},ensure_ascii=False,indent=2)+'\n')
  raw=Image.open(path).convert('RGBA');a=np.asarray(raw).copy();a[a[:,:,3]<20]=0;raw=Image.fromarray(a)
  box=raw.getchannel('A').point(lambda p:255 if p>80 else 0).getbbox()
  if not box:raise ValueError('Empty outer garment')
  # Register the collar at the neck and the cuffs at the unchanged wrists.
  # A generic ankle-length bounding box would put the sleeve openings below
  # the hands, recreating the floating-clothes defect.
  part=raw.crop(box).resize((714,692),Image.Resampling.LANCZOS)
  layer=Image.new('RGBA',(1024,1536));layer.alpha_composite(part,(162,445))
  layer.save(D/'rigged/clothing'/f'{key}.webp',format='WEBP',lossless=True,method=6)
  print(key,'generated and registered; needs visual review',flush=True)

if __name__=='__main__':main()
