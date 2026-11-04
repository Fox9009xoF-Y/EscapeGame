const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
 for(const room of ['living','bedroom','library']){
  await page.goto(`http://127.0.0.1:8000/?room=${room}`);await page.waitForFunction(()=>RoomMaps.currentMap.objects.length>2&&[...document.images].every(i=>i.complete));
  await page.screenshot({path:`evidence/n2-${room}.png`});
  const ids=await page.evaluate(()=>RoomMaps.currentMap.objects.slice(2).filter(o=>o.role!=='escape-door').map(o=>o.id));
  for(const id of ids){
   const route=await page.evaluate(id=>{
    const room=RoomMaps.currentMap,p=playerSession.player,step=12,queue=[{x:p.x,y:p.y,parent:-1}],seen=new Set(['0,0']);
    const valid=q=>room.innerVertices.every((a,i)=>{const b=room.innerVertices[(i+1)%room.innerVertices.length],l=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/l,ny=(b.x-a.x)/l;return (q.x-a.x)*nx+(q.y-a.y)*ny>=Math.abs(nx)*16+Math.abs(ny)*14;})&&!room.obstacles.some(b=>q.x+16>b.x&&q.x-16<b.x+b.width&&q.y+14>b.y&&q.y-14<b.y+b.height);
    for(let n=0;n<queue.length;n++){
     const q=queue[n];
     for(const direction of ['up','down','left','right'])if(InteractionSystem.findTarget({...q,halfWidth:8,halfHeight:6,direction},room)?.id===id){
      const path=[];for(let i=n;i>0;i=queue[i].parent)path.unshift({x:queue[i].x,y:queue[i].y});
      const runs=[];let prev=queue[0];for(const point of path){const axis=point.x!==prev.x?'x':'y',sign=Math.sign(point[axis]-prev[axis]);if(runs.length&&runs.at(-1).axis===axis&&runs.at(-1).sign===sign)runs.at(-1).target=point[axis];else runs.push({axis,sign,target:point[axis]});prev=point;}
      return {runs,direction};
     }
     for(const [dx,dy]of[[step,0],[-step,0],[0,step],[0,-step]]){const next={x:q.x+dx,y:q.y+dy,parent:n},key=`${Math.round((next.x-p.x)/step)},${Math.round((next.y-p.y)/step)}`;if(!seen.has(key)&&valid(next)){seen.add(key);queue.push(next);}}
    }
    return null;
   },id);
   assert.ok(route,id+' 無可走路徑');
   for(const r of route.runs){
    const key=r.axis==='x'?(r.sign>0?'ArrowRight':'ArrowLeft'):(r.sign>0?'ArrowDown':'ArrowUp');
    await page.keyboard.down(key);try{await page.waitForFunction(r=>r.sign*(playerSession.player[r.axis]-r.target)>=-5,r,{timeout:4000});}finally{await page.keyboard.up(key);}
   }
   const key={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[route.direction];await page.keyboard.down(key);await page.waitForTimeout(22);await page.keyboard.up(key);
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
