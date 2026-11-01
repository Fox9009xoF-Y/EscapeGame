"""保留原圖；去除背景並依指定方式產生僅覆蓋臉部的背面行走三影格。"""
from PIL import Image

original = Image.open('Old hero.png').convert('RGBA')
front = original.copy()
background = (157,142,135,255)
skin = (255,212,168,255)
for y in range(original.height):
    for x in range(original.width):
        if original.getpixel((x,y)) == background:
            front.putpixel((x,y), (157,142,135,0))
front.save('hero-sprites.png')
back = Image.new('RGBA',(48,16))
for index in range(3):
    frame = front.crop((16+index*16,16,32+index*16,32))
    for y in range(1,9):
        # 頭部每列輪廓以內才填膚色，保留外框、頭髮、身體與動作。
        edges = [x for x in range(4,13) if frame.getpixel((x,y)) == (25,14,14,255)]
        if len(edges)>=2 and any(frame.getpixel((x,y))==skin for x in range(min(edges)+1,max(edges))):
            for x in range(min(edges)+1,max(edges)):
                frame.putpixel((x,y),skin)
    back.paste(frame,(index*16,0))
back.save('hero-back-walk.png')
