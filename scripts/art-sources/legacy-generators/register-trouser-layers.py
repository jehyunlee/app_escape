"""Fit OpenAI trouser-only artwork to fixed hip and ankle positions.

Uses a smooth horizontal registration between waist and cuffs, preserving raw
fabric pixels. No native trousers or body pixels are pasted into the garment.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
from scipy.ndimage import map_coordinates
ROOT=Path(__file__).resolve().parents[3]
RAW=ROOT/'scripts/art-sources/rigged-clothing'
OUT=ROOT/'assets/doll/rigged/clothing'
TOP,BOTTOM=806,1354

def band_centres(alpha):
 h,w=alpha.shape
 top=alpha[round(h*.025):max(round(h*.11),1)].sum(axis=0)
 occupied=np.where(top>top.max()*.04)[0]
 if not len(occupied):raise ValueError('No waistband')
 waist=((occupied[0]+occupied[-1])/2,occupied[-1]-occupied[0]+1)
 bottom=alpha[round(h*.83):round(h*.98)].sum(axis=0)
 mid=w//2
 left=np.average(np.arange(mid),weights=bottom[:mid])
 right=np.average(np.arange(mid,w),weights=bottom[mid:])
 if right-left<10:raise ValueError('No distinct trouser legs')
 return waist,(float(left),float(right))

def register(image):
 image=image.convert('RGBA');a=np.asarray(image).copy();a[a[:,:,3]<10]=0
 box=Image.fromarray(a[:,:,3]).point(lambda p:255 if p>128 else 0).getbbox()
 if not box:raise ValueError('Empty trousers')
 source=a[box[1]:box[3],box[0]:box[2]].astype(float)
 alpha=source[:,:,3]/255
 (waist_mid,waist_width),(left,right)=band_centres(alpha)
 waist_scale=285/waist_width
 cuff_scale=(662-365)/(right-left)
 h,w=alpha.shape
 yy,xx=np.mgrid[0:BOTTOM-TOP,0:1024]
 t=yy/(BOTTOM-TOP-1)
 blend=t**.85
 scale=waist_scale*(1-blend)+cuff_scale*blend
 source_mid=waist_mid*(1-blend)+(left+right)/2*blend
 target_mid=510*(1-blend)+513.5*blend
 sx=(xx-target_mid)/scale+source_mid
 sy=t*(h-1)
 sampled_alpha=map_coordinates(alpha,[sy,sx],order=1,mode='constant')
 output=np.zeros((1536,1024,4),dtype=np.uint8)
 for channel in range(3):
  premultiplied=source[:,:,channel]*alpha
  values=map_coordinates(premultiplied,[sy,sx],order=1,mode='constant')
  output[TOP:BOTTOM,:,channel]=np.clip(values/np.maximum(sampled_alpha,.0001),0,255).astype(np.uint8)
 output[TOP:BOTTOM,:,3]=np.clip(sampled_alpha*255,0,255).astype(np.uint8)
 output[output[:,:,3]<10]=0
 return Image.fromarray(output),{'waistY':TOP,'hemY':BOTTOM,'waistWidth':285,'ankleCentres':[365,662],'rawWaist': [float(waist_mid),int(waist_width)],'rawCuffCentres':[left,right],'horizontalScale':[float(waist_scale),float(cuff_scale)]}

def main():
 report={}
 sheet=Image.new('RGB',(1440,1000),'#29353d');draw=ImageDraw.Draw(sheet)
 D=ROOT/'assets/doll/rigged'
 for i in range(1,13):
  key=f'pants-{i:02d}';src=RAW/f'{key}-raw.png'
  image,metrics=register(Image.open(src));path=OUT/f'{key}.webp';image.save(path,format='WEBP',lossless=True,method=6)
  report[key]={'source':str(src.relative_to(ROOT)),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'registration':metrics,'method':'raw garment-only hip/ankle registration','review':'pending'}
  body=Image.new('RGBA',(1024,1536));body.alpha_composite(Image.open(D/'boots.webp').convert('RGBA'));body.alpha_composite(image);body.alpha_composite(Image.open(D/'body-upper.webp').convert('RGBA'));body.alpha_composite(Image.open(D/'hands-base.webp').convert('RGBA'))
  body=body.crop((180,720,845,1536));body.thumbnail((230,440))
  x=((i-1)%6)*240;y=((i-1)//6)*500
  sheet.paste(body,(x+5,y+30),body);draw.text((x+6,y+6),key,fill='white')
 (OUT/'pants-registration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 sheet.save('/tmp/paper-doll-qa/registered-trousers.png')
 print('Registered all 12 trousers to the hips and the two ankle anchors')

if __name__=='__main__':main()
