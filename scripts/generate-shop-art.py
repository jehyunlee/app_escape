"""Generate the wardrobe interior using the configured OpenAI image API."""
import os,json,base64,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
prompt='Cinematic high quality realistic 3D environment inside a richly detailed wizard clothing shop in an ancient Scottish magical castle. Inspired by a warm old magical bookstore with towering oak shelves, stacked leather books, an upper mezzanine with carved wood railing, a spiral iron staircase, antique brass chandelier and lanterns. Transform it into an elegant wardrobe boutique: velvet pointed wizard hats on carved stands, jeweled necklaces in lit cabinets, richly embroidered cloaks hanging from bronze rails, wands and full size flying brooms along the walls, leather gloves, tailored trousers and brocade waistcoats displayed tastefully. A large ornate floor mirror and a generous empty central fitting area on polished wood. Warm golden interior lighting, deep emerald and burgundy textiles, subtle cool moonlight through a tall arched window. Physically realistic soft shadows, film production rendering, beautiful inviting child friendly atmosphere. Wide 3:2 landscape composition, no people no characters no legible signs no text no UI no watermarks.'
req=urllib.request.Request('https://api.openai.com/v1/images/generations',data=json.dumps({'model':'gpt-image-2.5-flare','prompt':prompt,'size':'1536x1024','quality':'high','output_format':'webp','n':1}).encode(),headers={'Authorization':'Bearer '+os.environ['OPENAI_API_KEY'],'Content-Type':'application/json'})
with urllib.request.urlopen(req,timeout=300) as response:data=json.load(response)
(root/'assets'/'wizard-shop.webp').write_bytes(base64.b64decode(data['data'][0]['b64_json']))
print('Created assets/wizard-shop.webp',flush=True)
