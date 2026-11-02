import unittest
from pathlib import Path
from PIL import Image

class HeroAssets(unittest.TestCase):
    def test_front_pixels_unchanged_and_back_only_face_changed(self):
        original = Image.open('Old hero.png').convert('RGBA')
        front = Image.open('hero-sprites.png').convert('RGBA')
        back = Image.open('hero-back-walk.png').convert('RGBA')
        self.assertEqual(original.size, (128,112))
        self.assertEqual(front.size, original.size)
        self.assertEqual(back.size, (48,16))
        bg=(157,142,135,255); skin=(255,212,168,255)
        for y in range(112):
            for x in range(128):
                pixel=original.getpixel((x,y))
                self.assertEqual(front.getpixel((x,y)), (157,142,135,0) if pixel==bg else pixel)
        changes=0
        for i in range(3):
            for y in range(16):
                for x in range(16):
                    a=front.getpixel((16+i*16+x,16+y));b=back.getpixel((i*16+x,y))
                    if a!=b:
                        changes+=1;self.assertIn(y,range(1,9));self.assertIn(x,range(4,13));self.assertEqual(b,skin)
            for x in (7,10):
                # 三影格的眼睛因步幅上下差一像素，兩列都必須覆蓋。
                self.assertEqual(back.getpixel((i*16+x,4)),skin)
        self.assertGreater(changes,8)

if __name__=='__main__':unittest.main()
