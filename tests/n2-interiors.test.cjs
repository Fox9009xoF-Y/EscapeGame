const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function load(){class Image{set src(v){if(this.onload)this.onload();}}const s=vm.createContext({Image,URLSearchParams,location:{search:''}});for(const f of ['maps.js','player.js','interactions.js'])vm.runInContext(fs.readFileSync(f,'utf8'),s);return s;}
const plain=x=>JSON.parse(JSON.stringify(x));
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/n2-map-baseline.json','utf8'));
function valid(p,room){return room.innerVertices.every((a,i)=>{const b=room.innerVertices[(i+1)%room.innerVertices.length],l=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/l,ny=(b.x-a.x)/l;return (p.x-a.x)*nx+(p.y-a.y)*ny>=Math.abs(nx)*8+Math.abs(ny)*6-1e-7;})&&!room.obstacles.some(b=>p.x+8>b.x&&p.x-8<b.x+b.width&&p.y+6>b.y&&p.y-6<b.y+b.height);}
test('三房幾何、四門資料及原柱子/傢俱完整保留',()=>{
 const s=load();for(const [i,r] of s.RoomMaps.maps.entries())assert.deepEqual(plain({id:r.id,vertices:r.vertices,innerVertices:r.innerVertices,portals:r.portals,originalObjects:r.objects.slice(0,2).map(o=>({id:o.id,role:o.role,collision:o.collision}))}),baseline[i]);
 assert.equal(new s.PlayerSystem.Player().speed,360);
});
test('客廳具天象牆、開關、地毯線索、書桌與左上書櫃後大門',()=>{
 const r=load().RoomMaps.maps[0];for(const role of ['celestial-wall','light-switch','carpet-clue','desk','exit-bookshelf','escape-door'])assert.ok(r.objects.some(o=>o.role===role),role);
 const cover=r.objects.find(o=>o.role==='exit-bookshelf'),door=r.objects.find(o=>o.role==='escape-door');
 assert.ok(cover.collision.x+cover.collision.width<640&&cover.collision.y+cover.collision.height<360);
 assert.equal(r.exit.coverId,cover.id);assert.equal(r.exit.id,door.id);assert.equal(r.exit.locked,true);
 assert.ok(door.visualBounds.y<cover.visualBounds.y);assert.equal(r.portals.length,1,'出口不混入原房門路線');
});
test('臥室五燈按入口方向順時針配置，抱枕位於床內而可從床邊調查',()=>{
 const s=load(),r=s.RoomMaps.maps[1],lamps=r.objects.filter(o=>o.role==='oil-lamp');assert.equal(lamps.length,5);
 assert.deepEqual(Array.from(lamps,o=>o.lampIndex),[0,1,2,3,4]);
 const angles=lamps.map(o=>Math.atan2(o.collision.y+o.collision.height/2-360,o.collision.x+o.collision.width/2-640));
 let total=0;for(let i=0;i<5;i++)total+=(angles[(i+1)%5]-angles[i]+Math.PI*2)%(Math.PI*2);assert.ok(Math.abs(total-Math.PI*2)<1e-8);
 const bed=r.objects[1],pillow=r.objects.find(o=>o.role==='pillow');assert.equal(pillow.title,'杰哥的抱枕');
 const b=bed.collision,v=pillow.visualBounds;assert.ok(v.x>=b.x&&v.y>=b.y&&v.x+v.width<=b.x+b.width&&v.y+v.height<=b.y+b.height);
 const hit=pillow.interactionBounds,p=new s.PlayerSystem.Player(hit.x+hit.width/2,b.y+b.height+14);p.direction='up';assert.ok(valid(p,r));assert.equal(s.InteractionSystem.findTarget(p,r).id,pillow.id);
});
test('藏書房有書櫃文字線索與可通行的中央生成標示，不先生成獎勵',()=>{
 const s=load(),r=s.RoomMaps.maps[2],marker=r.objects.find(o=>o.role==='reward-marker');assert.ok(marker);
 assert.equal(marker.solid,false);assert.equal(marker.visualBounds.x+marker.visualBounds.width/2,640);assert.equal(marker.visualBounds.y+marker.visualBounds.height/2,360);
 assert.ok(valid({x:640,y:360},r));assert.ok(r.objects.some(o=>o.role==='word-clue'));assert.ok(!r.objects.some(o=>o.role==='reward-item'));
});
test('所有新增物件有穩定ID、合法邊界、碰撞一致與可達互動點',()=>{
 const s=load();for(const r of s.RoomMaps.maps){
  assert.equal(new Set(r.objects.map(o=>o.id)).size,r.objects.length);
  const start={x:640,y:300},queue=[start],seen=new Set(['640,300']);
  for(let n=0;n<queue.length;n++)for(const [dx,dy]of[[8,0],[-8,0],[0,8],[0,-8]]){const p={x:queue[n].x+dx,y:queue[n].y+dy},key=`${p.x},${p.y}`;if(!seen.has(key)&&valid(p,r)){seen.add(key);queue.push(p);}}
  for(const o of r.objects.slice(2)){
   assert.ok(o.id&&o.title&&o.text&&Number.isFinite(o.depth));
   if(o.solid)assert.ok(r.obstacles.includes(o.collision));else assert.ok(!r.obstacles.includes(o.collision));
   const b=o.visualBounds;for(const p of[{x:b.x,y:b.y},{x:b.x+b.width,y:b.y},{x:b.x+b.width,y:b.y+b.height},{x:b.x,y:b.y+b.height}])assert.ok(r.vertices.every((a,i)=>{const c=r.vertices[(i+1)%r.vertices.length];return (c.x-a.x)*(p.y-a.y)-(c.y-a.y)*(p.x-a.x)>=-1e-7;}),o.id+' 繪圖越界');
   if(o.role==='escape-door')continue; // 由書櫃遮住，N6移櫃後才可直接操作門。
   assert.ok(queue.some(pos=>['up','down','left','right'].some(direction=>{const p=new s.PlayerSystem.Player(pos.x,pos.y);p.direction=direction;return s.InteractionSystem.findTarget(p,r)?.id===o.id;})),o.id+' 無法靠近調查');
  }
 }
});
test('新增內裝只有調查回饋，不在N2解題或提前觸發警報/結尾',()=>{
 const s=load();for(const r of s.RoomMaps.maps)for(const o of r.objects.slice(2))assert.equal(typeof o.onInteract,'undefined');
 assert.equal(s.RoomMaps.maps[0].exit.locked,true);
});

test('床上抱枕與書櫃便條必須繪於父傢俱之後，出口門體仍位於書櫃後',()=>{
 const s=load();for(const room of s.RoomMaps.maps)for(const o of room.objects.filter(o=>o.parentId)){
  const parent=room.objects.find(p=>p.id===o.parentId);assert.ok(parent);
  if(o.role==='escape-door')assert.ok(o.depth<parent.depth,'門在書櫃後');
  else assert.ok(o.depth>parent.depth,o.id+' 不能被父傢俱蓋住');
 }
});
