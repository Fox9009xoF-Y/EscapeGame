const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const room of ['living','bedroom','library']){
  await page.goto(`http://127.0.0.1:8000/?room=${room}`);await page.waitForFunction(()=>document.querySelectorAll('#door-labels g').length===RoomMaps.currentMap.portals.length);
  const result=await page.evaluate(()=>{
   const svg=document.getElementById('door-labels'),canvasRect=canvas.getBoundingClientRect(),svgRect=svg.getBoundingClientRect();
   const labels=RoomMaps.currentMap.portals.map(door=>{
    const group=svg.querySelector(`[data-portal="${door.id}"]`),text=group.querySelector('text'),path=group.querySelector('path'),box=text.getBBox();
    const nums=path.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
    const perpendicular=(nums[2]-nums[0])*door.tangent.x+(nums[3]-nums[1])*door.tangent.y;
    const outside=[{x:box.x,y:box.y},{x:box.x+box.width,y:box.y},{x:box.x,y:box.y+box.height},{x:box.x+box.width,y:box.y+box.height}].every(p=>(p.x-door.center.x)*door.normal.x+(p.y-door.center.y)*door.normal.y<0);
    return {id:door.id,text:text.textContent,perpendicular,outside,visible:box.x>=0&&box.x+box.width<=1280&&box.y>=0&&box.y+box.height<=720};
   });
   return {room:RoomMaps.currentMap.id,labels,aligned:canvasRect.x===svgRect.x&&canvasRect.y===svgRect.y&&canvasRect.width===svgRect.width&&canvasRect.height===svgRect.height};
  });
  assert.ok(result.aligned);for(const label of result.labels){assert.ok(Math.abs(label.perpendicular)<1e-8);assert.ok(label.outside&&label.visible);}
  await page.screenshot({path:`evidence/refinement-${room}.png`});console.log(JSON.stringify(result));
 }
 await page.setViewportSize({width:800,height:600});
 assert.deepEqual(await page.locator('canvas').boundingBox(),await page.locator('#door-labels').boundingBox());
 await page.screenshot({path:'evidence/refinement-small.png'});
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>typeof playerSession!=='undefined'&&playerSession!==null);
 await page.evaluate(()=>{window.motion=[];const p=playerSession.player,original=p.update;p.update=function(dt,input,room){const y=this.y,up=input.direction().y<0;original.call(this,dt,input,room);if(up)motion.push({dt,distance:y-this.y});};});
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(250);await page.keyboard.up('ArrowUp');
 const motion=await page.evaluate(()=>({count:motion.length,time:motion.reduce((s,m)=>s+m.dt,0),distance:motion.reduce((s,m)=>s+m.distance,0),speed:playerSession.player.speed}));
 assert.ok(motion.count>=5);assert.equal(motion.speed,360);assert.ok(Math.abs(motion.distance/motion.time-360)<1e-6);
 assert.deepEqual(errors,[]);console.log(JSON.stringify(motion));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
