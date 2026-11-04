// 根據目前內裝尋路，以真正方向鍵走位；不直接寫入玩家座標。
module.exports=async function navigate(page,goal){
 const route=await page.evaluate(goal=>{
  const room=RoomMaps.currentMap,p=playerSession.player,step=12,queue=[{x:p.x,y:p.y,parent:-1}],seen=new Set(['0,0']);
  const valid=q=>room.innerVertices.every((a,i)=>{const b=room.innerVertices[(i+1)%room.innerVertices.length],l=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/l,ny=(b.x-a.x)/l;return(q.x-a.x)*nx+(q.y-a.y)*ny>=Math.abs(nx)*16+Math.abs(ny)*14;})&&!room.obstacles.some(b=>q.x+16>b.x&&q.x-16<b.x+b.width&&q.y+14>b.y&&q.y-14<b.y+b.height);
  for(let n=0;n<queue.length;n++){
   const q=queue[n];let direction=null,found=goal.point&&Math.hypot(q.x-goal.point.x,q.y-goal.point.y)<=9;
   if(goal.id)for(const d of['up','down','left','right'])if(InteractionSystem.findTarget({...q,halfWidth:8,halfHeight:6,direction:d},room)?.id===goal.id){direction=d;found=true;break;}
   if(found){const path=[];for(let i=n;i>0;i=queue[i].parent)path.unshift({x:queue[i].x,y:queue[i].y});const runs=[];let prev=queue[0];for(const point of path){const axis=point.x!==prev.x?'x':'y',sign=Math.sign(point[axis]-prev[axis]);if(runs.length&&runs.at(-1).axis===axis&&runs.at(-1).sign===sign)runs.at(-1).target=point[axis];else runs.push({axis,sign,target:point[axis]});prev=point;}return{runs,direction};}
   for(const[dx,dy]of[[step,0],[-step,0],[0,step],[0,-step]]){const next={x:q.x+dx,y:q.y+dy,parent:n},key=`${Math.round((next.x-p.x)/step)},${Math.round((next.y-p.y)/step)}`;if(!seen.has(key)&&valid(next)){seen.add(key);queue.push(next);}}
  }
  return null;
 },goal);
 if(!route)throw Error('無可達路徑：'+JSON.stringify(goal));
 for(const r of route.runs){const key=r.axis==='x'?(r.sign>0?'ArrowRight':'ArrowLeft'):(r.sign>0?'ArrowDown':'ArrowUp');await page.keyboard.down(key);try{await page.waitForFunction(r=>r.sign*(playerSession.player[r.axis]-r.target)>=-5,r,{timeout:4000});}finally{await page.keyboard.up(key);}}
 if(route.direction){const key={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[route.direction];await page.keyboard.down(key);await page.waitForTimeout(22);await page.keyboard.up(key);}
};
