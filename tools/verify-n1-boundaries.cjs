const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:800,height:600}});
  await page.goto('http://127.0.0.1:8000/');await page.waitForFunction(()=>storyController.mode==='opening');
  await page.waitForFunction(()=>[...document.querySelectorAll('#story-layer img')].every(i=>i.complete&&i.naturalWidth>0));
  await page.keyboard.press('Space');await page.waitForTimeout(90);
  const mid=await page.locator('#story-cast img.is-speaking').evaluate(e=>({matrix:getComputedStyle(e).transform,count:e.getAnimations().length}));
  assert.equal(mid.count,1);assert.ok(Number(mid.matrix.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^\)]+)/)[1])<0,'跳動途中向上');
  await page.waitForTimeout(250);assert.equal(await page.locator('#story-cast img.is-speaking').evaluate(e=>getComputedStyle(e).transform),'none');
  const shots=[];let count=0;
  for(const mode of ['opening','ending']) {
   if(mode==='ending')await page.evaluate(()=>storyController.completeEscape(true));
   while(await page.evaluate(m=>storyController.mode===m,mode)) {
    const layout=await page.evaluate(()=>{
     const box=document.getElementById('story-dialogue').getBoundingClientRect(),stage=document.querySelector('.game-stage').getBoundingClientRect(),text=document.getElementById('story-text').getBoundingClientRect();
     return {chapter:storyController.snapshot().chapterId,line:storyController.lineIndex,boxTop:box.top,textBottom:text.bottom,boxBottom:box.bottom,stageBottom:stage.bottom,actors:[...document.querySelectorAll('#story-cast img')].map(i=>i.getBoundingClientRect().bottom)};
    });
    assert.ok(layout.actors.every(y=>y<=layout.boxTop+1));assert.ok(layout.textBottom<=layout.boxBottom&&layout.boxBottom<=layout.stageBottom+1);count++;
    const longest=await page.evaluate(()=>{const c=storyController.chapters[storyController.chapterIndex];return c.lines[storyController.lineIndex].text.length===Math.max(...c.lines.map(l=>l.text.length));});
    if(longest&&!shots.includes(layout.chapter)){shots.push(layout.chapter);await page.screenshot({path:`evidence/n1-long-chapter${layout.chapter}.png`});}
    await page.keyboard.press('Space');await page.waitForTimeout(175);
   }
  }
  await page.goto('http://127.0.0.1:8000/');await page.waitForFunction(()=>storyController.mode==='opening');
  await page.keyboard.down('Space');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  const before=await page.evaluate(()=>storyController.lineIndex);await page.waitForTimeout(3200);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await page.keyboard.up('Space');await page.waitForTimeout(600);
  assert.equal(await page.evaluate(()=>storyController.lineIndex),before);
  await page.route(url=>decodeURIComponent(url.pathname).endsWith('/網咖.png'),r=>r.fulfill({status:404,body:'missing'}));await page.reload();await page.waitForFunction(()=>storyController.mode==='opening');
  await page.waitForFunction(()=>!document.getElementById('story-asset-warning').hidden);assert.match(await page.locator('#story-asset-warning').innerText(),/圖片載入失敗/);
  fs.writeFileSync('evidence/n1-boundaries-results.json',JSON.stringify({smallViewport:{width:800,height:600},lines:count,chapters:shots,bounceMidpoint:mid,visibilityEventSimulated:true,missingImageWarning:true},null,2)+'\n');
  console.log(JSON.stringify({lines:count,smallViewportAllLines:true,bounceUpAndReturn:true,visibilityEventSimulated:true,missingImageWarning:true}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
