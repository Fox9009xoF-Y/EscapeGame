const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],textRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/story[12]\.txt/.test(r.url()))textRequests.push(r.url());});
  const url=pathToFileURL(path.resolve('index.html')).href;
  await page.goto(url);await page.waitForFunction(()=>storyController.mode==='awaiting-files');
  assert.equal(await page.locator('#story-local-files').isVisible(),true);assert.equal(await page.locator('#story-retry').isVisible(),false);
  await page.screenshot({path:'evidence/n1-local-picker.png'});
  await page.locator('#story-local-files').setInputFiles([]);assert.equal(await page.evaluate(()=>storyController.mode),'awaiting-files');
  await page.locator('#story-local-files').setInputFiles(path.resolve('story1.txt'));await page.waitForFunction(()=>storyController.mode==='error');
  assert.match(await page.locator('#story-status-text').innerText(),/story1.txt 與 story2.txt/);
  await page.locator('#story-local-files').setInputFiles([path.resolve('story2.txt'),path.resolve('story1.txt')]);
  await page.waitForFunction(()=>storyController.mode==='opening');
  await page.waitForFunction(()=>[...document.querySelectorAll('#story-layer img')].every(i=>i.complete&&i.naturalWidth>0));
  await page.screenshot({path:'evidence/n1-local-opening.png'});
  let opening=0,ending=0;
  while(await page.evaluate(()=>storyController.mode==='opening')){await page.keyboard.press('Space');await page.waitForTimeout(175);opening++;}
  assert.equal(await page.evaluate(()=>RoomMaps.currentMap.id),'living');
  await page.screenshot({path:'evidence/n1-local-map.png'});
  assert.equal(await page.evaluate(()=>storyController.completeEscape(true)),true);
  while(await page.evaluate(()=>storyController.mode==='ending')){await page.keyboard.press('Space');await page.waitForTimeout(175);ending++;}
  assert.equal(await page.evaluate(()=>storyController.mode),'finished');await page.screenshot({path:'evidence/n1-local-finished.png'});
  await page.reload();await page.waitForFunction(()=>storyController.mode==='awaiting-files');
  await page.locator('#story-local-files').setInputFiles([{name:'story1.txt',mimeType:'text/plain',buffer:Buffer.from('第一章 更新\n阿偉：選取後讀取最新文字')},{name:'story2.txt',mimeType:'text/plain',buffer:fs.readFileSync('story2.txt')}]);
  await page.waitForFunction(()=>storyController.mode==='opening');assert.equal(await page.locator('#story-text').innerText(),'選取後讀取最新文字');
  assert.deepEqual(errors,[]);assert.deepEqual(textRequests,[]);
  fs.writeFileSync('evidence/n1-local-results.json',JSON.stringify({protocol:'file:',initialPicker:true,emptySelection:true,missingFileRetry:true,openingLines:opening,endingLines:ending,reloadRequiresSelection:true,updatedText:true,textRequests,errors,headless:true},null,2)+'\n');
  console.log(JSON.stringify({protocol:'file:',openingLines:opening,endingLines:ending,updatedText:true,errors,textRequests}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
