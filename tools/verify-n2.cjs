const navigate=require('./navigate.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
 for(const room of ['living','bedroom','library']){
  await page.goto(`http://127.0.0.1:8000/?room=${room}`);await page.waitForFunction(()=>RoomMaps.currentMap.objects.length>2&&[...document.images].every(i=>i.complete));
  await page.screenshot({path:`evidence/n2-${room}.png`});
  const ids=await page.evaluate(()=>RoomMaps.currentMap.objects.filter(o=>o.role!=='escape-door').map(o=>o.id));
  for(const id of ids){
   await navigate(page,{id});
   const target=await page.evaluate(()=>InteractionSystem.findTarget(playerSession.player,RoomMaps.currentMap)?.id);assert.equal(target,id,'實際鍵盤走到互動點');
   await page.keyboard.press('Space');await page.waitForFunction(id=>interactionController.message?.id===id,id);
   assert.equal(await page.evaluate(()=>storyController.mode),'puzzle');
   if(id==='bedroom-pillow'||id==='living-exit-bookshelf')await page.screenshot({path:`evidence/n2-${id}-dialogue.png`});
   await page.keyboard.press('Space');await page.waitForFunction(()=>!interactionController.message);results.push({room,id,keyboardReachable:true});
  }
 }
 assert.equal(await page.evaluate(()=>RoomMaps.maps[0].exit.locked),true);assert.deepEqual(errors,[]);
 fs.writeFileSync('evidence/n2-results.json',JSON.stringify({results,errors,exitLocked:true,puzzleLogicNotImplemented:true,headless:true},null,2)+'\n');console.log(JSON.stringify({objects:results.length,results,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
