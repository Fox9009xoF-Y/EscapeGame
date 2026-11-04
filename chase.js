'use strict';
globalThis.ChaseSystem=(()=>{
 const step=12;
 function valid(room,p){return room.innerVertices.every((a,i)=>{const b=room.innerVertices[(i+1)%room.innerVertices.length],l=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/l,ny=(b.x-a.x)/l;return(p.x-a.x)*nx+(p.y-a.y)*ny>=Math.abs(nx)*8+Math.abs(ny)*6-1e-7;})&&!room.obstacles.some(b=>p.x+8>b.x+1e-7&&p.x-8<b.x+b.width-1e-7&&p.y+6>b.y+1e-7&&p.y-6<b.y+b.height-1e-7);}
 function line(room,a,b){const count=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/3);for(let i=0;i<=count;i++){const k=count?i/count:0;if(!valid(room,{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k}))return false;}return true;}
 function nearby(room,p){const candidates=[];for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){const q={x:(Math.round(p.x/step)+dx)*step,y:(Math.round(p.y/step)+dy)*step};if(valid(room,q))candidates.push(q);}return candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));}
 function findPath(room,from,to){
  let start,prefix=[];for(const p of nearby(room,from)){const xfirst={x:p.x,y:from.y},yfirst={x:from.x,y:p.y};if(line(room,from,xfirst)&&line(room,xfirst,p)){start=p;prefix=[xfirst,p];break;}if(line(room,from,yfirst)&&line(room,yfirst,p)){start=p;prefix=[yfirst,p];break;}}
  const goal=nearby(room,to)[0];if(!start||!goal)return[];
  const key=p=>p.x+','+p.y,queue=[start],parents=new Map([[key(start),null]]);let reached=false;
  for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(goal)){reached=true;break;}for(const[dx,dy]of[[step,0],[-step,0],[0,step],[0,-step]]){const q={x:p.x+dx,y:p.y+dy},k=key(q);if(!parents.has(k)&&valid(room,q)&&line(room,p,q)){parents.set(k,p);queue.push(q);}}}
  if(!reached)return[];const path=[];for(let p=goal;p;p=parents.get(key(p)))path.unshift(p);return [...prefix,...path.slice(1)];
 }
 function spawn(room,player){const candidates=[];room.innerVertices.forEach((a,i)=>{const b=room.innerVertices[(i+1)%room.innerVertices.length],l=Math.hypot(b.x-a.x,b.y-a.y),n={x:-(b.y-a.y)/l,y:(b.x-a.x)/l};for(const t of[.2,.5,.8]){const p={x:a.x+(b.x-a.x)*t+n.x*26,y:a.y+(b.y-a.y)*t+n.y*26};if(valid(room,p)&&Math.hypot(p.x-player.x,p.y-player.y)>=160&&findPath(room,p,player).length)candidates.push(p);}});return candidates.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y))[0]||null;}
 function visible(player,p){return Math.hypot(player.x-p.x,player.y-p.y)<=96;}
 class Pursuit{
  constructor({maps,start,playerSpeed=360}){this.maps=maps;this.room=start.room;this.actor=new PlayerSystem.Player(start.x,start.y);this.actor.speed=playerSpeed*.6;this.actor.draw=ctx=>{const p=this.actor;ctx.save();ctx.fillStyle='#17202b';ctx.fillRect(p.x-11,p.y-22,22,27);ctx.fillStyle='#be9d7a';ctx.fillRect(p.x-9,p.y-37,18,18);ctx.fillStyle='#161920';ctx.fillRect(p.x-8,p.y-32,6,4);ctx.fillRect(p.x+2,p.y-32,6,4);ctx.fillRect(p.x-2,p.y-31,4,2);ctx.fillStyle='#583238';ctx.fillRect(p.x-9,p.y-17,18,17);ctx.restore();};this.path=[];this.delay=1.5;this.timer=0;this.targetKey='';}
  nextRoom(target){const queue=[this.room],parent=new Map([[this.room,null]]);for(let i=0;i<queue.length;i++){const id=queue[i];if(id===target)break;for(const d of this.maps.maps.find(r=>r.id===id).portals)if(!parent.has(d.target)){parent.set(d.target,id);queue.push(d.target);}}if(!parent.has(target))return null;let id=target;while(parent.get(id)!==this.room&&parent.get(id))id=parent.get(id);return id;}
  update(dt,player,playerRoom){
   if(this.delay>0){this.delay=Math.max(0,this.delay-dt);return false;}const room=this.maps.maps.find(r=>r.id===this.room);let goal=player,door;
   if(this.room!==playerRoom){const next=this.nextRoom(playerRoom);door=room.portals.find(d=>d.target===next);if(!door)return false;const support=Math.abs(door.normal.x)*8+Math.abs(door.normal.y)*6;goal={x:door.innerCenter.x+door.normal.x*(support+2),y:door.innerCenter.y+door.normal.y*(support+2)};}
   this.timer-=dt;const key=this.room+':'+Math.round(goal.x/24)+','+Math.round(goal.y/24);
   if(!this.path.length||(this.timer<=0&&key!==this.targetKey)){this.path=findPath(room,this.actor,goal);this.timer=.25;this.targetKey=key;}
   let budget=this.actor.speed*dt,axisUsed=null;
   for(let i=0;i<32&&budget>1e-8&&this.path.length;i++){
    const p=this.path[0],dx=p.x-this.actor.x,dy=p.y-this.actor.y;if(Math.hypot(dx,dy)<.01){this.path.shift();continue;}const axis=Math.abs(dx)>.01?'x':'y';if(axisUsed&&axisUsed!==axis)break;axisUsed=axis;
    const value=axis==='x'?dx:dy,amount=Math.sign(value)*Math.min(Math.abs(value),budget),before=this.actor[axis];this.actor.move(axis==='x'?amount:0,axis==='y'?amount:0,room);const moved=Math.abs(this.actor[axis]-before);budget-=moved;if(moved<1e-6){this.path=[];break;}this.actor.direction=axis==='x'?(amount>0?'right':'left'):(amount>0?'down':'up');
   }
   if(door&&Math.hypot(this.actor.x-goal.x,this.actor.y-goal.y)<18){const target=this.maps.maps.find(r=>r.id===door.target),reverse=target.portals.find(d=>d.id===door.destination),n=reverse.normal,k=Math.abs(n.x)*8+Math.abs(n.y)*6+24;this.room=target.id;this.actor.x=reverse.innerCenter.x+n.x*k;this.actor.y=reverse.innerCenter.y+n.y*k;this.path=[];this.targetKey='';return false;}
   return this.room===playerRoom&&Math.abs(this.actor.x-player.x)<this.actor.halfWidth+player.halfWidth&&Math.abs(this.actor.y-player.y)<this.actor.halfHeight+player.halfHeight;
  }
 }
 return {valid,findPath,spawn,visible,Pursuit};
})();
