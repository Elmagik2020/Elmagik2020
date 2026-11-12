from pathlib import Path
from PIL import Image, ImageDraw
import math

ROOT = Path("android/app/src/main/res")
SIZES = {"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}
NAVY = (7, 20, 48, 255)
CYAN = (0, 217, 255, 255)
WHITE = (248, 252, 255, 255)
ORANGE = (255, 181, 46, 255)

def make_icon(size, round_icon=False):
    im = Image.new("RGBA", (size,size), NAVY)
    d = ImageDraw.Draw(im)
    s=size/192
    def box(coords, radius, fill):
        d.rounded_rectangle(tuple(int(v*s) for v in coords), radius=int(radius*s), fill=fill)
    # subtle digital border
    box((10,10,182,182),30,(14,43,86,255))
    box((17,17,175,175),25,NAVY)
    # snowflake upper right
    cx,cy=139*s,49*s
    for a in range(0,180,60):
        dx=math.cos(math.radians(a))*17*s
        dy=math.sin(math.radians(a))*17*s
        d.line((cx-dx,cy-dy,cx+dx,cy+dy),fill=CYAN,width=max(2,int(4*s)))
    # AC indoor unit
    box((35,62,157,113),12,WHITE)
    box((47,74,145,82),3,(13,53,105,255))
    d.arc((49*s,82*s,143*s,105*s),5,175,fill=CYAN,width=max(2,int(4*s)))
    # airflow streaks
    for x in (65,96,127):
        d.arc(( (x-12)*s,112*s,(x+12)*s,146*s),0,150,fill=CYAN,width=max(2,int(4*s)))
    # orange digital accent
    box((45,151,72,158),3,ORANGE)
    box((80,151,147,158),3,(34,89,146,255))
    if round_icon:
        mask=Image.new("L",(size,size),0)
        ImageDraw.Draw(mask).ellipse((0,0,size-1,size-1),fill=255)
        im.putalpha(mask)
    return im

for density, size in SIZES.items():
    folder=ROOT/f"mipmap-{density}"
    folder.mkdir(parents=True,exist_ok=True)
    make_icon(size).save(folder/"ic_launcher.png")
    make_icon(size,True).save(folder/"ic_launcher_round.png")
print("Generated legacy and round launcher PNGs.")
