const {overlaps}=require('./helpers/shape-check.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function load(room='living'){
  class Image{set src(value){if(this.onload)this.onload();}}
  const s=vm.createContext({Image,URLSearchParams,location:{search:`?room=${room}`}});
  for(const file of ['maps.js','player.js','portals.js'])vm.runInContext(fs.readFileSync(file,'utf8'),s);
  return {s,maps:s.RoomMaps,players:s.PlayerSystem,portals:s.PortalSystem};
}
function fixture(id){
  const app=load(id),player=new app.players.Player();
  let direction={x:0,y:0},activeRoom=app.maps.currentMap;
  const session={player,input:{direction:()=>direction},setRoom:room=>{activeRoom=room;},update:dt=>player.update(dt,session.input,activeRoom)};
  return {...app,player,session,control:new app.portals.Controller(app.maps),aim:(x,y)=>{direction={x,y};}};
}
function support(p,n){return Math.abs(n.x)*p.halfWidth+Math.abs(n.y)*p.halfHeight;}
function approach(app,door){
  const p=app.player,n=door.normal,d=support(p,n)+1;
  p.x=door.innerCenter.x+n.x*d;p.y=door.innerCenter.y+n.y*d;app.aim(-n.x,-n.y);
}
function inside(p,room){
  room.innerVertices.forEach((a,i)=>{
    const b=room.innerVertices[(i+1)%room.innerVertices.length],len=Math.hypot(b.x-a.x,b.y-a.y),n={x:-(b.y-a.y)/len,y:(b.x-a.x)/len};
    assert.ok((p.x-a.x)*n.x+(p.y-a.y)*n.y>=support(p,n)-1e-6,'出生/移動不可穿牆');
  });
  for(const b of room.obstacles)assert.ok(!overlaps(p,b),'出生不可重疊障礙');
}

test('四個雙向門位於指定邊，反向門存在且目標互相對應',()=>{
  const {maps}=load();assert.deepEqual(Array.from(maps.maps,r=>r.portals.length),[1,2,1]);
  for(const room of maps.maps)for(const door of room.portals){
    const target=maps.maps.find(r=>r.id===door.target),reverse=target.portals.find(p=>p.id===door.destination);
    assert.equal(reverse.target,room.id);assert.equal(reverse.destination,door.id);
    const a=room.vertices[door.edgeIndex],b=room.vertices[(door.edgeIndex+1)%room.vertices.length];
    assert.ok(Math.abs(door.center.x-(a.x+b.x)/2)<1e-8);assert.ok(Math.abs(door.center.y-(a.y+b.y)/2)<1e-8);
    if(room.id==='living'){assert.ok(door.center.x>640);assert.ok(Math.abs(door.center.y-360)<1e-8);}
    else {assert.ok(door.center.y>360);assert.ok(door.target==='library'?door.center.x>640:door.center.x<640);}
    assert.ok(Math.abs(Math.hypot(door.normal.x,door.normal.y)-1)<1e-8);
    assert.ok(door.width>=48);
  }
});

test('四方向門皆切換到正確地圖與對應門內安全出生點，且後續碰撞使用新地圖',()=>{
  for(const [source,target]of[['living','bedroom'],['bedroom','living'],['bedroom','library'],['library','bedroom']]){
    const a=fixture(source),door=a.maps.currentMap.portals.find(d=>d.target===target);approach(a,door);
    assert.equal(a.control.update(a.session),true);assert.equal(a.maps.currentMap.id,target);inside(a.player,a.maps.currentMap);
    const reverse=a.maps.currentMap.portals.find(d=>d.target===source),n=reverse.normal;
    const dist=(a.player.x-reverse.innerCenter.x)*n.x+(a.player.y-reverse.innerCenter.y)*n.y;
    assert.ok(dist>support(a.player,n)+8 && dist<support(a.player,n)+40);
    assert.equal(a.player.moving,false);assert.equal(a.player.animationTime,0);
    a.aim(n.x,n.y);a.session.update(10);inside(a.player,a.maps.currentMap);
  }
});

test('靠近但未碰到門、門側邊、朝內或平行移動、無輸入均不切換',()=>{
  for(const mode of ['far','side','inward','parallel','idle']){
    const a=fixture('living'),door=a.maps.currentMap.portals[0];approach(a,door);
    if(mode==='far'){a.player.x+=door.normal.x*40;a.player.y+=door.normal.y*40;}
    if(mode==='side'){a.player.x+=door.tangent.x*(door.width/2+20);a.player.y+=door.tangent.y*(door.width/2+20);}
    if(mode==='inward')a.aim(door.normal.x,door.normal.y);
    if(mode==='parallel')a.aim(door.tangent.x,door.tangent.y);
    if(mode==='idle')a.aim(0,0);
    assert.equal(a.control.update(a.session),false,mode);assert.equal(a.maps.currentMap.id,'living');
  }
});

test('抵達後持續推門不立即彈回，放鍵後可主動走回；離開門區亦可重新觸發',()=>{
  const a=fixture('living');approach(a,a.maps.currentMap.portals[0]);a.control.update(a.session);
  const reverse=a.maps.currentMap.portals.find(d=>d.target==='living');
  for(let i=0;i<60;i++){approach(a,reverse);assert.equal(a.control.update(a.session),false);}
  a.aim(0,0);assert.equal(a.control.update(a.session),false);
  approach(a,reverse);assert.equal(a.control.update(a.session),true);assert.equal(a.maps.currentMap.id,'living');
  a.player.x=640;a.player.y=300;a.control.update(a.session);
  approach(a,a.maps.currentMap.portals[0]);assert.equal(a.control.update(a.session),true);assert.equal(a.maps.currentMap.id,'bedroom');
});

test('未知地圖不變更狀態，繪圖只包含最新房間',()=>{
  const a=fixture('living');assert.equal(a.maps.setCurrentMap('missing'),false);assert.equal(a.maps.currentMap.id,'living');
  approach(a,a.maps.currentMap.portals[0]);a.control.update(a.session);
  const calls=[],ctx={};for(const m of ['save','restore','beginPath','moveTo','lineTo','closePath','clip','drawImage','fillRect','fillText'])ctx[m]=(...args)=>calls.push([m,...args]);
  a.maps.draw(ctx);assert.ok(calls.some(c=>c[0]==='fillText' && c[1]==='臥室'));
  assert.ok(!calls.some(c=>c[0]==='fillText' && ['客廳','藏書房'].includes(c[1])));
});

test('原入口串接門控制器；地圖切換不重建Input或重開RAF',()=>{
  const html=fs.readFileSync('index.html','utf8');assert.ok(html.indexOf('src="portals.js"')>=0 && html.indexOf('src="portals.js"')<html.indexOf('src="main.js"'));
  const {s,maps}=load();let callback,scheduled=0;const events={},ctx={};
  for(const m of ['save','restore','beginPath','moveTo','lineTo','closePath','clip','drawImage','fillRect','fillText'])ctx[m]=()=>{};
  s.document={hidden:false,getElementById:()=>({width:1280,height:720,getContext:()=>ctx}),addEventListener(){}};
  s.addEventListener=(name,cb)=>{events[name]=cb;};s.requestAnimationFrame=cb=>{callback=cb;scheduled++;return scheduled;};s.cancelAnimationFrame=()=>{};
  vm.runInContext(fs.readFileSync('main.js','utf8'),s);
  const session=vm.runInContext('playerSession',s),door=maps.currentMap.portals[0];
  session.player.x=door.innerCenter.x+door.normal.x*(support(session.player,door.normal)+1);session.player.y=door.innerCenter.y;
  events.keydown({code:'KeyD',target:{tagName:'BODY'},preventDefault(){}});callback(0);callback(1000/60);
  assert.equal(maps.currentMap.id,'bedroom');assert.equal(scheduled,3);
});
