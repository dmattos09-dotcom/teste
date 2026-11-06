import sys, json
from PIL import Image, ImageFilter, ImageDraw
U="/root/.claude/uploads/b8d230f5-5707-5750-90ec-9c9e52a4e390/"
files=["50e1a4b4","74bac357","7348852d","6a7a7eba","5119e74d","3bee131c","bd77a240","4bd0fa4d","21a2ed00"]
S=1184/919  # display->px
def P(v): return int(round(v*S))
# sender lines with phone numbers (display y centers) per screenshot
phones={0:[284,1733],1:[387,1727],4:[279],5:[518],6:[355],7:[445],8:[270]}
HEAD_END,CHAT_END=P(265),P(1815)
def blur(im,box,r=14):
    reg=im.crop(box).filter(ImageFilter.GaussianBlur(r)); im.paste(reg,box)
out={"chats":[],"products":[]}
for i,f in enumerate(files):
    im=Image.open(U+f+"-image.jpg").convert("RGB")
    for y in phones.get(i,[]):
        blur(im,(P(478),P(y-20),P(765),P(y+20)))
    if i==0:
        h=im.crop((0,0,1184,HEAD_END)); blur(h,(P(262),P(195),P(720),P(232)),10); h.save("public/img/header.png")
        im.crop((0,CHAT_END,1184,2576)).save("public/img/footer.png")
    im.crop((0,HEAD_END,1184,CHAT_END)).save(f"public/img/chat{i+1}.jpg",quality=93)
crops=[(318,935),(421,930),(268,948),(397,850),(312,993),(551,1168),(388,1070),(478,995),(302,985)]
for i,f in enumerate(files):
    im=Image.open(U+f+"-image.jpg").convert("RGB")
    y0,y1=crops[i]; c=im.crop((P(101),P(y0),P(782),P(y1)))
    w,h=c.size; s=min(w,h); c=c.crop(((w-s)//2,(h-s)//2,(w-s)//2+s,(h-s)//2+s)).resize((640,640),Image.LANCZOS)
    c.save(f"public/img/prod{i+1}.jpg",quality=92)
print("chat size",1184,CHAT_END-HEAD_END,"head",HEAD_END,"foot",2576-CHAT_END)
