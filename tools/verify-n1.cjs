// Chrome 實際渲染與輸入檢查；只供開發驗證，不是遊戲依賴。
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[],errors=[];
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  const state=()=>page.evaluate(()=>storyController.snapshot());
  async function reset(){await page.goto('http://127.0.0.1:8000/');await page.waitForFunction(()=>storyController.mode==='opening');await page.waitForFunction(()=>[...document.querySelectorAll('#story-layer img')].every(i=>i.complete&&i.naturalWidth>0));}
  async function next(){await page.keyboard.press('Space');await page.waitForTimeout(175);}
  async function geometry(){return page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
   const stage=rect(document.querySelector('.game-stage')),box=rect(document.getElementById('story-dialogue')),pause=rect(document.getElementById('story-pause'));
   const actors=[...document.querySelectorAll('#story-cast img')].map(e=>({...rect(e),actor:e.alt}));
   const text=document.getElementById('story-text'),bg=rect(document.getElementById('story-background'));
   return {stage,box,pause,actors,bg,textOverflow:text.scrollHeight>text.clientHeight+1,castVisible:!document.getElementById('story-cast').hidden};
  });}
  function validate(g){
   assert.equal(g.bg.width,g.stage.width);assert.equal(g.bg.height,g.stage.height);
   assert.ok(g.box.y>=g.stage.y&&g.box.bottom<=g.stage.bottom+1);
   for(const a of g.actors){assert.ok(a.x>=g.stage.x&&a.right<=g.stage.right+1,a.actor+' 橫向界內');assert.ok(a.y>=g.stage.y&&a.bottom<=g.box.y+1,a.actor+' 不覆蓋對話框');assert.ok(a.y>=g.pause.bottom||a.right<=g.pause.x||a.x>=g.pause.right,a.actor+' 不遮暫停');}
   assert.equal(g.textOverflow,false);
  }
  await reset();
  assert.equal((await state()).lineIndex,0);
  const position=await page.evaluate(()=>({x:playerSession.player.x,y:playerSession.player.y}));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);await page.keyboard.up('ArrowRight');
  assert.deepEqual(await page.evaluate(()=>({x:playerSession.player.x,y:playerSession.player.y})),position,'劇情期間不移動地圖玩家');
  await page.locator('#story-dialogue').click();assert.equal((await state()).lineIndex,1);
  await page.waitForTimeout(60);await page.locator('#story-dialogue').click();assert.equal((await state()).lineIndex,1,'連點抑制');
  await page.waitForTimeout(180);await page.keyboard.press('Space');assert.equal((await state()).lineIndex,2);
  await page.waitForTimeout(350);
  const transform=await page.locator('#story-cast img.is-speaking').evaluate(e=>getComputedStyle(e).transform);
  assert.equal(transform,'none','跳動結束精準回到基準');
  results.push('左鍵/空白鍵單句、快速連點抑制、劇情期間玩家不移動、說話跳動回位');
  await reset();
  await page.keyboard.down('Space');const held=(await state()).lineIndex;
  await page.waitForTimeout(1250);assert.equal((await state()).lineIndex,held,'1.5秒前不快轉');
  await page.waitForTimeout(450);assert.equal((await state()).lineIndex,held+1);
  await page.waitForTimeout(250);assert.equal((await state()).lineIndex,held+2);
  await page.keyboard.up('Space');const stopped=(await state()).lineIndex;await page.waitForTimeout(650);assert.equal((await state()).lineIndex,stopped);
  await page.locator('#story-pause').click();await page.keyboard.press('Space');assert.equal((await state()).lineIndex,stopped);
  await page.locator('#story-pause').click();await page.locator('#story-dialogue').focus();await page.waitForTimeout(200);await next();assert.equal((await state()).lineIndex,stopped+1);
  results.push('鍵盤1.5秒/250ms快轉與鬆開停止、暫停/繼續按鍵可用');
  await reset();const target=await page.locator('#story-dialogue').boundingBox();
  await page.mouse.move(target.x+target.width/2,target.y+target.height/2);await page.mouse.down();const pointer=(await state()).lineIndex;
  await page.waitForTimeout(1700);assert.equal((await state()).lineIndex,pointer+1);
  await page.mouse.up();const afterPointer=(await state()).lineIndex;await page.waitForTimeout(650);assert.equal((await state()).lineIndex,afterPointer);
  await page.keyboard.down('Space');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const blur=(await state()).lineIndex;
  await page.waitForTimeout(3200);assert.equal((await state()).lineIndex,blur);await page.keyboard.up('Space');
  results.push('滑鼠長按快轉/放開、失焦取消快轉');
  await reset();let checked=0;const chapters=new Set();
  while((await state()).mode==='opening'){
   const s=await state();validate(await geometry());checked++;
   if(!chapters.has(s.chapterId)){
    chapters.add(s.chapterId);
    assert.deepEqual(await page.locator('#story-cast img').evaluateAll(es=>es.map(e=>e.alt)),s.characters);
    await page.screenshot({path:`evidence/n1-chapter${s.chapterId}.png`});
   }
   await next();
  }
  assert.equal(chapters.size,5);assert.equal(await page.evaluate(()=>RoomMaps.currentMap.id),'living');
  assert.equal(await page.locator('#story-layer').isVisible(),false);
  assert.equal(await page.locator('#story-cast img').count(),0);
  assert.equal(await page.locator('#story-background').getAttribute('src'),null);
  const x=await page.evaluate(()=>playerSession.player.x);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>playerSession.player.x)>x);
  assert.equal(await page.evaluate(()=>storyController.completeEscape(false)),false);
  results.push(`開場 ${checked} 則逐句鍵盤播放與版面檢查、五章人物背景、清場進客廳並可移動`);
  assert.equal(await page.evaluate(()=>storyController.completeEscape(true)),true);
  await page.waitForFunction(()=>[...document.querySelectorAll('#story-layer img')].every(i=>i.complete&&i.naturalWidth>0));
  validate(await geometry());await page.screenshot({path:'evidence/n1-chapter6.png'});
  await page.setViewportSize({width:800,height:600});validate(await geometry());await page.screenshot({path:'evidence/n1-small.png'});
  await page.setViewportSize({width:1280,height:900});
  while((await state()).mode==='ending'){validate(await geometry());await next();}
  assert.equal((await state()).mode,'finished');assert.equal(await page.locator('#story-cast img').count(),0);
  assert.equal(await page.locator('#story-background').getAttribute('src'),null);assert.match(await page.locator('#story-status-text').innerText(),/全劇終/);
  await page.screenshot({path:'evidence/n1-finished.png'});
  results.push('以確認逃脫介面測第六章/800小視窗、逐句結尾與結束清場；大門尚未實作，非全流程逃脫');
  await page.route('**/story1.txt',r=>r.fulfill({status:200,contentType:'text/plain; charset=utf-8',body:'第一章 測試\n阿偉：測試更新文字'}));
  await reset();assert.equal((await state()).text,'測試更新文字');await page.unroute('**/story1.txt');
  await page.route('**/story1.txt',r=>r.fulfill({status:404,body:'missing'}));
  await page.reload();await page.waitForFunction(()=>storyController.mode==='error');assert.equal(await page.locator('#story-retry').isVisible(),true);
  await page.unroute('**/story1.txt');await page.locator('#story-retry').click();await page.waitForFunction(()=>storyController.mode==='opening');
  results.push('文本載入替換更新、404可見錯誤及原位重試');
  assert.deepEqual(errors,[]);
  fs.writeFileSync('evidence/n1-browser-results.json',JSON.stringify({results,errors,headless:true,manualUserPlaytest:false},null,2)+'\n');
  console.log(JSON.stringify({results,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
