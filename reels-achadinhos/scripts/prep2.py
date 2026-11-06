import json
from PIL import Image, ImageFilter
U="/root/.claude/uploads/b8d230f5-5707-5750-90ec-9c9e52a4e390/"
S=1184/919
P=lambda v:int(round(v*S))
# id, file, sender_y, img(y0,y1,x0,x1), print(y0,y1), price box (x0,y0,x1,y1) — display coords
O=[
 ("tv","f8d55925",356,(391,1071,101,782),(318,1780),(125,1625,700,1765)),
 ("ducha","485a1c9c",432,(467,1147,101,782),(393,1735),(125,1625,530,1715)),
 ("lustre","26d72c10",573,(609,1124,490,782),(535,1615),(125,1552,595,1598)),
 ("tacas","8894364e",368,(403,1083,101,782),(330,1790),(125,1688,740,1778)),
 ("jantar","9266aba3",376,(410,1090,101,782),(337,1725),(122,1618,545,1712)),
 ("aspirador","1b3ffaef",518,(553,1168,101,782),(480,1655),(125,1598,680,1642)),
]
meta={}
for oid,f,sy,img,pr,box in O:
    im=Image.open(U+f+"-image.jpg").convert("RGB")
    assert im.size==(1184,2576),im.size
    b=(P(478),P(sy-20),P(765),P(sy+20)); im.paste(im.crop(b).filter(ImageFilter.GaussianBlur(14)),b)
    y0,y1,x0,x1=img; c=im.crop((P(x0),P(y0),P(x1),P(y1))); w,h=c.size; s=min(w,h)
    c=c.crop(((w-s)//2,(h-s)//2,(w-s)//2+s,(h-s)//2+s)).resize((800,800),Image.LANCZOS); c.save(f"public/img/o_{oid}.jpg",quality=92)
    py0,py1=pr; pc=im.crop((P(101),P(py0),P(782),P(py1))); pc.save(f"public/img/p_{oid}.jpg",quality=92)
    bx=[P(box[0]-101),P(box[1]-py0),P(box[2]-101),P(box[3]-py0)]
    meta[oid]={"pw":pc.size[0],"ph":pc.size[1],"box":bx}
json.dump(meta,open("src/prints.json","w"),indent=1); print(meta)
