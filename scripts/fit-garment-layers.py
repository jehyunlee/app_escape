"""Fit generated fabric to the existing pose, keeping faces and hands registered.

Raw image edits are retained as design sources. Body garments use their fabric
luminance inside the original pose's material masks; clean independent props
are anchored on the chest/belt/back. This avoids regenerated faces or bodies.
"""
from pathlib import Path
import importlib.util
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'garments'
spec=importlib.util.spec_from_file_location('designs',ROOT/'scripts'/'generate-garment-layers.py')
designs=importlib.util.module_from_spec(spec);spec.loader.exec_module(designs)
# Landmarks are measured separately for the supplied 512x1024 pose sprites.
# face-bottom, neck-x, waist-y, trouser-bottom, head protected box, glove regions
POSES={
'dad':[
 (375,260,570,805,(145,192,384,384),[(62,447,139,558),(285,566,402,637)]),
 (372,256,556,799,(145,183,385,380),[(34,174,130,296),(374,351,474,474)]),
 (402,245,570,806,(126,210,382,410),[(86,620,192,720),(289,543,419,637)])],
'mom':[
 (426,280,560,841,(180,276,391,434),[(117,476,207,567),(299,467,378,568)]),
 (420,272,552,817,(180,276,390,430),[(94,474,194,564),(331,362,414,477)]),
 (438,272,571,850,(178,288,398,447),[(97,478,193,561),(294,501,397,584)])],
'jeongan':[
 (442,270,550,856,(148,245,405,451),[(91,485,167,575),(379,619,490,701)]),
 (437,265,554,863,(150,240,405,449),[(85,349,163,459),(345,377,414,467)]),
 (463,278,591,866,(162,269,426,470),[(222,629,322,715)])],
'suan':[
 (387,269,525,769,(164,218,391,398),[(119,432,204,535),(364,563,481,676)]),
 (379,265,520,797,(153,217,394,390),[(105,451,192,535),(329,318,407,439)]),
 (409,267,553,780,(161,237,398,419),[(170,508,290,651)])],
'yewon':[
 (304,245,504,810,(142,125,372,315),[(91,314,158,432),(220,420,329,499)]),
 (300,237,504,826,(131,118,374,312),[(78,307,146,400),(327,266,405,384)]),
 (336,263,524,841,(152,156,392,347),[(141,591,224,676),(254,435,349,497)])],
'hunho':[
 (271,265,493,790,(174,117,371,286),[(101,351,160,437),(310,492,411,570)]),
 (288,253,507,811,(157,117,379,302),[(111,355,172,442),(356,243,420,338)]),
 (300,262,517,823,(168,144,386,313),[(132,347,192,425),(317,501,419,579)])],
}

def region(shape, boxes):
 a=np.zeros(shape,bool)
 for x0,y0,x1,y1 in boxes:a[y0:y1,x0:x1]=True
 return a

def rgba_tint(image,color):
 a=np.asarray(image.convert('RGBA')).astype(np.float32)
 gray=np.asarray(image.convert('L')).astype(np.float32)/255
 rgb=np.array(tuple(bytes.fromhex(color[1:])),np.float32)
 # Full tonal detail, including brighter highlights; no flat-color rectangles.
 light=(.33+1.1*gray)[...,None]
 a[:,:,:3]=np.clip(rgb*light+np.maximum(0,gray-.72)[...,None]*110,0,255)
 return Image.fromarray(a.astype('uint8'))

def paste_prop(clean, color, size, position, rotate=0):
 image=rgba_tint(clean,color);image.thumbnail(size,Image.Resampling.LANCZOS)
 if rotate:image=image.rotate(rotate,resample=Image.Resampling.BICUBIC,expand=True)
 result=Image.new('RGBA',(512,1024));result.alpha_composite(image,position);return result

def main():
 report={}
 for character,poses in POSES.items():
  for mood,pose in zip(('neutral','happy','sad'),poses):
   neck,cx,waist,ankle,facebox,hands=pose
   base=Image.open(ROOT/'assets'/'wizards'/f'{character}-{mood}.webp').convert('RGBA')
   rgb=np.asarray(base)[:,:,:3].astype(float);alpha=np.asarray(base.getchannel('A')).astype(float)
   hsv=np.asarray(base.convert('HSV')).astype(float);h=hsv[:,:,0]*360/255;s=hsv[:,:,1]/255;v=hsv[:,:,2]/255
   yy,xx=np.indices(alpha.shape);opaque=alpha>70;protected=region(alpha.shape,[facebox]);handregion=region(alpha.shape,hands)
   warm=(h>8)&(h<48)&(s>.18)&(s<.7)&(v>.44)
   if character in ('dad','yewon'):cloth=(h>185)&(h<270)&(s>.12)
   elif character=='mom':cloth=(h>60)&(h<190)&(s>.10)
   elif character=='jeongan':cloth=(h>218)&(h<312)&(s>.12)
   elif character=='suan':cloth=((h<25)|(h>345))&(s>.27)
   else:cloth=((h<28)|(h>325))&(s>.22)
   cloth &= opaque & ~protected & ~handregion
   masks={}
   masks['hat']=cloth&(yy<facebox[1]-8)&(xx>65)&(xx<465)
   masks['cloak']=cloth&(yy>neck+12)&(yy<ankle+12)
   # Do not replace outer cloak folds with waistcoat or trousers.
   masks['vest']=(yy>neck+55)&(yy<waist-15)&(abs(xx-cx)<62)&opaque&~handregion&~cloth
   masks['pants']=(yy>waist+38)&(yy<ankle-8)&(abs(xx-cx)<105)&opaque&~cloth&~handregion&(s<.58)&(v<.75)
   masks['gloves']=handregion&opaque&(warm if character!='hunho' else ((s<.52)&(v<.6)))
   for category,mask in masks.items():
    mask &= ~protected
    generated=Image.open(OUT/f'{character}-{mood}-{category}.master.png').convert('RGBA')
    generated_alpha=np.asarray(generated.getchannel('A'))/255
    texture=np.asarray(generated.convert('L')).astype(float)/255
    texture_detail=(texture-np.asarray(generated.convert('L').filter(ImageFilter.GaussianBlur(6)))/255)*generated_alpha
    # Authored anatomy is authoritative, generated fabric adds stitch/grain detail.
    luminance=np.asarray(base.convert('L')).astype(float)/255
    detail=np.clip(luminance+texture_detail*.30,0,1)
    mask_image=Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.5))
    opacity=np.minimum(np.asarray(mask_image).astype(float),alpha)
    def fade_low(axis,start,span=24):return np.clip((axis-start)/span,0,1)
    def fade_high(axis,end,span=24):return np.clip((end-axis)/span,0,1)
    if category=='cloak':opacity*=fade_low(yy,neck+12,36)*fade_high(yy,ankle+12,24)
    elif category=='vest':opacity*=fade_low(yy,neck+55,22)*fade_high(yy,waist-15,22)*fade_high(abs(xx-cx),62,18)
    elif category=='pants':opacity*=fade_low(yy,waist+38,28)*fade_high(yy,ankle-8,22)*fade_high(abs(xx-cx),105,20)
    elif category=='hat':opacity*=fade_high(yy,facebox[1]-8,18)
    opacity=opacity.astype('uint8')
    for name,color in designs.PALETTES[category]:
     color_rgb=np.array(tuple(bytes.fromhex(color[1:])),float)
     value=np.clip(color_rgb[None,None,:]*(.35+detail[:,:,None]*1.25)+np.maximum(0,detail-.78)[:,:,None]*70,0,255)
     out=np.dstack([value,opacity]).astype('uint8');Image.fromarray(out).save(OUT/f'{character}-{mood}-{category}-{name}.webp',lossless=True,method=6)
    report[f'{character}-{mood}-{category}']=int(np.count_nonzero(opacity>50))
   for category in ('necklace','wand','broom'):
    source=OUT/f'clean-{category}.webp'
    if not source.exists():continue
    clean=Image.open(source).convert('RGBA')
    for name,color in designs.PALETTES[category]:
     if category=='necklace':out=paste_prop(clean,color,(100,110),(cx-50,neck+5))
     elif category=='wand':out=paste_prop(clean,color,(35,235),(cx+68,waist-28),-18)
     else:out=paste_prop(clean,color,(170,630),(315,330),-14)
     out.save(OUT/f'{character}-{mood}-{category}-{name}.webp',lossless=True,method=6)
   # Hu nho's antler headband is not fabric. Put a fitted generated pointed hat
   # behind his fringe when a paid hat is selected, keeping his face untouched.
   if character=='hunho':
    for name,color in designs.PALETTES['hat']:
     reference=Image.open(ROOT/'assets'/'wizards'/f'dad-{mood}.webp').convert('RGBA')
     ref_hsv=np.asarray(reference.convert('HSV')).astype(float)
     ref_mask=((ref_hsv[:,:,0]*360/255>185)&(ref_hsv[:,:,0]*360/255<275)&(yy<225))
     ref_alpha=np.asarray(reference.getchannel('A')).copy();ref_alpha[~ref_mask]=0;reference.putalpha(Image.fromarray(ref_alpha))
     reference=reference.crop((65,30,455,230));reference.thumbnail((290,165),Image.Resampling.LANCZOS)
     out=Image.new('RGBA',(512,1024));out.alpha_composite(rgba_tint(reference,color),(cx-145,15))
     out_alpha=np.asarray(out.getchannel('A')).copy();out_alpha[protected]=0;out.putalpha(Image.fromarray(out_alpha));out.save(OUT/f'{character}-{mood}-hat-{name}.webp',lossless=True,method=6)
   for category in designs.CATEGORIES:
    for name,_ in designs.PALETTES[category]:
     path=OUT/f'{character}-{mood}-{category}-{name}.webp'
     image=Image.open(path).convert('RGBA');safe_alpha=np.asarray(image.getchannel('A')).copy();safe_alpha[protected]=0;image.putalpha(Image.fromarray(safe_alpha));image.save(path,lossless=True,method=6)
     pixels=int(np.count_nonzero(safe_alpha>50))
     if pixels<40:raise ValueError(f'Invisible garment: {path.name}')
     report[path.name]={'pixels':pixels,'faceOverlap':int(np.count_nonzero(safe_alpha[protected])),'size':[512,1024]}
 (OUT/'fit-report.json').write_text(json.dumps({'method':'Pose anatomy masks with generated fabric texture and fitted accessory sources','coverage':report},indent=2),encoding='utf-8')
 print('Fitted all character/pose layers without face regeneration')

if __name__=='__main__':main()
