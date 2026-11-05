const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const g=require('./gameplay.cjs'),navigate=require('./navigate.cjs'),prefix=process.env.ESCAPE_TEST_FILE?'evidence/n6-file':'evidence/n6';
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await g.start(p);await g.solveAll(p);
  await p.keyboard.press('Escape');
  assert.equal(await p.evaluate(()=>gameController.modal.kind),'chase-intro');
  await p.getByRole('button',{name:'趕快逃！',exact:true}).click();
  async function open(){
   await g.room(p,'living');await g.use(p,'living-exit-bookshelf');
   assert.equal(await p.evaluate(()=>gameController.game.state.exitRevealed),true);
   assert.equal(await p.evaluate(()=>RoomMaps.currentMap.objects.some(o=>o.role==='exit-bookshelf')),false);
   assert.equal(await p.evaluate(()=>storyController.mode),'puzzle');
   await g.use(p,'living-exit');
   assert.equal(await p.evaluate(()=>gameController.game.state.doorOpen),true);
   assert.equal(await p.evaluate(()=>storyController.mode),'puzzle');
  }
  await open();
  // 故意在已開門後被抓；回溯要恢復整組書櫃碰撞，而不只復原旗標。
  await p.waitForFunction(()=>gameController.game.state.phase==='retry',null,{timeout:20000});
  const restored=await p.evaluate(()=>{
   const room=RoomMaps.maps.find(r=>r.id==='living'),cover=room.objects.find(o=>o.role==='exit-bookshelf');
   return {room:RoomMaps.currentMap.id,covered:!!cover,collision:!!cover&&room.obstacles.includes(cover.collision),doorOpen:gameController.game.state.doorOpen,attempts:gameController.game.attempts};
  });
  assert.deepEqual(restored,{room:'bedroom',covered:true,collision:true,doorOpen:false,attempts:1});
  await p.getByRole('button',{name:'重新挑戰',exact:true}).click();
  await open();await p.screenshot({path:prefix+'-open-door.png'});
  await navigate(p,{point:{x:448,y:155}});await p.keyboard.down('ArrowUp');
  try{await p.waitForFunction(()=>storyController.mode==='success'&&!transitionController.active,null,{timeout:4000});}finally{await p.keyboard.up('ArrowUp');}
  assert.equal(await p.evaluate(()=>gameController.game.state.phase),'escaped');
  assert.equal(await p.evaluate(()=>gameController.game.state.alarm),false);
  assert.equal(await p.evaluate(()=>gameController.pursuit),null);
  assert.equal(await p.locator('#escape-success p').innerText(),'按左鍵繼續');await p.screenshot({path:prefix+'-success.png'});await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>storyController.mode),'success');await p.mouse.click(640,360,{button:'right'});assert.equal(await p.evaluate(()=>storyController.mode),'success');await p.locator('#escape-success').click();await g.idle(p);assert.equal(await p.evaluate(()=>storyController.mode),'ending');await p.screenshot({path:prefix+'-ending.png'});
  let lines=0;while(await p.evaluate(()=>storyController.mode==='ending')){await p.keyboard.press('Space');await p.waitForTimeout(175);await g.idle(p);lines++;}
  assert.equal(await p.evaluate(()=>storyController.mode),'finished');
  for(let i=0;i<4;i++)await p.keyboard.press('Space');await p.mouse.click(640,360);await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>storyController.mode),'finished');
  assert.equal(await p.evaluate(()=>gameController.game.attempts),1);
  assert.equal(await p.locator('#puzzle-layer').isVisible(),false);
  await p.screenshot({path:prefix+'-finished.png'});assert.deepEqual(errors,[]);
  fs.writeFileSync(prefix+'-results.json',JSON.stringify({protocol:await p.evaluate(()=>location.protocol),fullKeyboardEscape:true,coverRemoved:true,doorOpenedSeparately:true,walkOutsideRequired:true,alarmStopped:true,successRequiresLeftClick:true,openedExitRetry:restored,finishedInputStable:true,endingLines:lines,errors},null,2));
  console.log('N6真實鍵盤全流程、開門後被抓恢復書櫃碰撞、重試逃出與結尾後輸入檢查完成');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
