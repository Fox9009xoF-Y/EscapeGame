const navigate=require('./navigate.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function axis(name,target){const value=await page.evaluate(n=>playerSession.player[n],name);if(Math.abs(value-target)<3)return;const positive=value<target,key=name==='x'?(positive?'ArrowRight':'ArrowLeft'):(positive?'ArrowDown':'ArrowUp');await page.keyboard.down(key);try{await page.waitForFunction(({name,target,positive})=>positive?playerSession.player[name]>=target:playerSession.player[name]<=target,{name,target,positive},{timeout:5000});}finally{await page.keyboard.up(key);}}
 for(const room of ['living','bedroom','library']){
  await page.goto(`http://127.0.0.1:8000/?room=${room}`);await page.waitForFunction(()=>typeof interactionController!=='undefined'&&interactionController!==null);
  const object=await page.evaluate(()=>{const o=RoomMaps.currentMap.objects[1];return {id:o.id,title:o.title,x:o.collision.x+o.collision.width/2,y:o.collision.y+o.collision.height+14};});
  await navigate(page,{id:object.id});
  await page.keyboard.down('Space');await page.waitForFunction(()=>interactionController.message!==null);
  const first=await page.evaluate(()=>JSON.stringify(interactionController.message));
  assert.equal(JSON.parse(first).title,object.title);
  await page.waitForTimeout(350);await page.keyboard.down('Space');await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>JSON.stringify(interactionController.message)),first,'長按不重複開關');
  await page.keyboard.up('Space');await page.screenshot({path:`evidence/phase6-${room}-dialogue.png`});
  await page.keyboard.press('Space');await page.waitForFunction(()=>interactionController.message===null);
  await page.screenshot({path:`evidence/phase6-${room}.png`});
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(35);await page.keyboard.up('ArrowDown');await page.keyboard.press('Space');await page.waitForTimeout(50);
  assert.equal(await page.evaluate(()=>interactionController.message),null,'背向不觸發');
  await navigate(page,{point:{x:640,y:300}});await page.keyboard.down('ArrowUp');await page.waitForTimeout(22);await page.keyboard.up('ArrowUp');await page.keyboard.press('Space');await page.waitForTimeout(50);
  assert.equal(await page.evaluate(()=>interactionController.message),null,'遠處不觸發');
  console.log(JSON.stringify({room,title:object.title,open:true,holdOnce:true,close:true,backRejected:true,farRejected:true}));
 }
 assert.deepEqual(errors,[]);console.log('三房Chrome真實keyboard靠近傢俱/空白鍵調查/長按/關閉/背向遠處拒絕全通過。');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
