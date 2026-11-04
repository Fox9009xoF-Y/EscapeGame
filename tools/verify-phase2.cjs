// 開發驗證工具，使用環境提供的 Playwright；遊戲本身不依賴此套件。
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    fs.mkdirSync('evidence', { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const room of ['living', 'bedroom', 'library']) {
      await page.goto(`http://127.0.0.1:8000/?room=${room}`);
      await page.waitForFunction(() => Array.from(document.images).every(i => i.complete) && typeof RoomMaps !== 'undefined');
      // 等待圖片載入且遊戲迴圈真正完成繪圖。
      await page.waitForFunction(() => {
        const data = document.getElementById('game').getContext('2d').getImageData(640,360,1,1).data;
        return data[0] !== 23 || data[1] !== 27 || data[2] !== 32;
      });
      const result = await page.evaluate(() => {
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const vertices = RoomMaps.currentMap.vertices;
        let leaks = 0, magenta = 0, sampled = 0;
        const data = ctx.getImageData(0,0,1280,720).data;
        for (let y=64;y<704;y+=8) for (let x=8;x<1272;x+=8) {
          const inside = vertices.every((p,i) => {
            const q=vertices[(i+1)%vertices.length];
            return (q.x-p.x)*(y-p.y)-(q.y-p.y)*(x-p.x)>=0;
          });
          // 避開反鋸齒邊緣一像素的採樣誤差。
          const nearEdge=vertices.some((p,i)=>{
            const q=vertices[(i+1)%vertices.length];
            return Math.abs((q.x-p.x)*(y-p.y)-(q.y-p.y)*(x-p.x))/Math.hypot(q.x-p.x,q.y-p.y)<2;
          });
          if(nearEdge) continue;
          const k=(y*1280+x)*4;
          if(!inside && (data[k]!==23 || data[k+1]!==27 || data[k+2]!==32)) leaks++;
          if(inside) { sampled++; if(data[k]>160 && data[k+1]<60 && data[k+2]>160) magenta++; }
        }
        return { id:RoomMaps.currentMap.id, width:canvas.width,height:canvas.height,
          centerX:rect.x+rect.width/2,centerY:rect.y+rect.height/2,
          leaks,magenta,sampled, smoothing:ctx.imageSmoothingEnabled };
      });
      assert.equal(result.id,room);
      assert.equal(result.width,1280); assert.equal(result.height,720);
      assert.equal(result.centerX,640); assert.equal(result.centerY,450);
      assert.equal(result.leaks,0,'圖塊不可溢出多邊形');
      assert.equal(result.magenta,0,'取樣不得含洋紅素材底色');
      assert.ok(result.sampled>1000);
      assert.equal(result.smoothing,false);
      await page.screenshot({path:path.join('evidence',`phase2-${room}.png`)});
      console.log(JSON.stringify(result));
    }
    await page.setViewportSize({width:800,height:600});
    const small = await page.locator('canvas').boundingBox();
    assert.equal(small.width,800); assert.equal(small.height,450);
    assert.equal(small.x,0); assert.equal(small.y,75);
    await page.screenshot({path:'evidence/phase2-small.png'});
    assert.deepEqual(errors,[]);
    console.log('Chrome 實際渲染：三房裁切/素材/置中/1280×720/小視窗全部通過，無 JavaScript 錯誤。');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
