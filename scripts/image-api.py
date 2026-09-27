"""OpenAI Images edit client for the current reproducible art generators."""
import base64,io,json,os,urllib.request,uuid
from PIL import Image
MODEL='gpt-image-2.5-sunburst'

def png(image):
 out=io.BytesIO();image.convert('RGBA').save(out,format='PNG');return out.getvalue()

def api_edit(prompt,references,mask):
 key=os.environ.get('OPENAI_API_KEY')
 if not key:raise RuntimeError('OPENAI_API_KEY is not configured')
 boundary='doll-'+uuid.uuid4().hex;parts=[]
 for name,value in {'model':MODEL,'prompt':prompt,'size':'1024x1536','quality':'high','background':'transparent','output_format':'png','n':'1'}.items():
  parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
 for index,image in enumerate(references):
  parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="reference-{index}.png"\r\nContent-Type: image/png\r\n\r\n'.encode());parts.append(png(image));parts.append(b'\r\n')
 parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="mask"; filename="mask.png"\r\nContent-Type: image/png\r\n\r\n'.encode());parts.append(png(mask));parts.append(f'\r\n--{boundary}--\r\n'.encode())
 request=urllib.request.Request('https://api.openai.com/v1/images/edits',data=b''.join(parts),headers={'Authorization':'Bearer '+key,'Content-Type':'multipart/form-data; boundary='+boundary})
 with urllib.request.urlopen(request,timeout=300)as response:result=json.load(response)
 raw=base64.b64decode(result['data'][0]['b64_json'],validate=True)
 return Image.open(io.BytesIO(raw)).convert('RGBA'),raw
