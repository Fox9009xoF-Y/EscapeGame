const {overlaps}=require('./helpers/shape-check.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function load() {
  class Image { set src(value) { this.url = value; if(this.onload) this.onload(); } }
  const sandbox = vm.createContext({ Image, URLSearchParams, location:{search:''} });
  for (const file of ['maps.js','player.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
  return { ...sandbox.PlayerSystem, maps:sandbox.RoomMaps.maps, sandbox };
}
function target() {
  const events = {};
  return { events, hidden:false,
    addEventListener(name,cb) { (events[name] ||= []).push(cb); },
    emit(name,event={}) { for(const cb of events[name] || []) cb(event); },
  };
}
function key(code) { return {code, target:{tagName:'BODY'}, preventDefault(){this.prevented=true;}}; }
function inside(player,room) {
  const v=room.innerVertices;
  for(let i=0;i<v.length;i++) {
    const a=v[i],b=v[(i+1)%v.length],len=Math.hypot(b.x-a.x,b.y-a.y);
    const nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
    assert.ok((player.x-a.x)*nx+(player.y-a.y)*ny >= Math.abs(nx)*player.halfWidth+Math.abs(ny)*player.halfHeight-1e-6, `${room.id} 邊 ${i} 穿牆`);
  }
  for(const box of room.obstacles || []) {
    assert.ok(!overlaps(player,box,1e-7),'穿過障礙物');
  }
}
const directions=[['KeyW',0,-1],['KeyA',-1,0],['KeyS',0,1],['KeyD',1,0],['ArrowUp',0,-1],['ArrowLeft',-1,0],['ArrowDown',0,1],['ArrowRight',1,0]];

test('WASD 與方向鍵皆移向對應方向；只攔截遊戲按鍵，不干擾文字輸入',()=>{
  const {Input,Player,maps}=load();
  for(const [code,x,y] of directions) {
    const win=target(),doc=target(),input=new Input(win,doc),p=new Player(640,300);
    const event=key(code);win.emit('keydown',event); p.update(0.1,input,maps[0]);
    assert.ok(Math.abs(p.x-640-x*p.speed*0.1)<1e-8);
    assert.ok(Math.abs(p.y-300-y*p.speed*0.1)<1e-8);
    assert.equal(event.prevented,true);
  }
  const win=target(),doc=target(),input=new Input(win,doc);
  const other=key('KeyQ');win.emit('keydown',other);assert.equal(other.prevented,undefined);
  const typing=key('KeyW');typing.target.tagName='INPUT';win.emit('keydown',typing);
  const p=new Player(640,300);p.update(0.1,input,maps[0]);assert.equal(p.y,300);
});

test('四種斜向與單向速度一致，相反方向抵消，重複 keydown 不加速',()=>{
  const {Input,Player,maps}=load();
  for(const codes of [['KeyW','KeyA'],['KeyW','KeyD'],['KeyS','KeyA'],['KeyS','KeyD']]) {
    const win=target(),input=new Input(win,target()),p=new Player(640,300);
    for(const code of codes) {win.emit('keydown',key(code));win.emit('keydown',key(code));}
    p.update(0.1,input,maps[0]);assert.ok(Math.abs(Math.hypot(p.x-640,p.y-300)-p.speed*0.1)<1e-8);
  }
  const win=target(),input=new Input(win,target()),p=new Player(640,300);
  for(const code of ['KeyW','KeyS','KeyA','KeyD']) win.emit('keydown',key(code));
  p.update(1,input,maps[0]);assert.equal(p.x,640);assert.equal(p.y,300);
});

test('keyup 立即停止，放開其中一鍵保留另一方向；blur 與 hidden 清空按鍵',()=>{
  const {Input,Player,maps}=load(),win=target(),doc=target(),input=new Input(win,doc),p=new Player(640,300);
  win.emit('keydown',key('KeyW'));win.emit('keydown',key('KeyD'));win.emit('keyup',key('KeyW'));
  p.update(0.1,input,maps[0]);assert.equal(p.y,300);assert.ok(p.x>640);
  win.emit('keyup',key('KeyD'));const x=p.x;p.update(0.1,input,maps[0]);assert.equal(p.x,x);
  win.emit('keydown',key('KeyD'));win.emit('blur');p.update(0.1,input,maps[0]);assert.equal(p.x,x);
  win.emit('keydown',key('KeyD'));doc.hidden=true;doc.emit('visibilitychange');p.update(0.1,input,maps[0]);assert.equal(p.x,x);
});

test('三房全部邊與角，含單次100秒位移，不穿牆或角落；使用內牆而非外輪廓',()=>{
  const {Player,maps}=load();
  for(const room of maps) for(let i=0;i<48;i++) {
    const p=new Player(640,300),angle=i*Math.PI/24;
    p.move(Math.cos(angle)*20000,Math.sin(angle)*20000,room);
    inside(p,room);
    const old={x:p.x,y:p.y};
    for(let j=0;j<30;j++) {p.move(Math.cos(angle)*3,Math.sin(angle)*3,room);inside(p,room);}
    assert.ok(Number.isFinite(p.x+p.y));
    const pinned={x:p.x,y:p.y};p.move(Math.cos(angle)*20000,Math.sin(angle)*20000,room);inside(p,room);
    assert.ok(Math.hypot(p.x-pinned.x,p.y-pinned.y)<1e-4,'角落持續推牆不得抖動');
    assert.ok(Math.hypot(old.x-640,old.y-300)>50);
  }
});

test('斜牆碰撞保留切向位移，向內移動可離牆',()=>{
  const {Player,maps}=load();
  for(const map of maps.slice(1)) {
    // 牆邊現在有書櫃；隔離驗證幾何滑動，完整場景碰撞仍由48方向測試覆蓋。
    const room={...map,obstacles:[]};
    const v=room.innerVertices;
    const i=v.findIndex((a,i)=>Math.abs(v[(i+1)%v.length].x-a.x)>1 && Math.abs(v[(i+1)%v.length].y-a.y)>1);
    const a=v[i],b=v[(i+1)%v.length],len=Math.hypot(b.x-a.x,b.y-a.y),tx=(b.x-a.x)/len,ty=(b.y-a.y)/len,nx=-ty,ny=tx;
    const p=new Player(640,300),support=Math.abs(nx)*p.halfWidth+Math.abs(ny)*p.halfHeight;
    p.x=(a.x+b.x)/2+nx*(support+0.001);p.y=(a.y+b.y)/2+ny*(support+0.001);
    const old={x:p.x,y:p.y};p.move(tx*30-nx*40,ty*30-ny*40,room);inside(p,room);
    assert.ok((p.x-old.x)*tx+(p.y-old.y)*ty>29.9);
    const before={x:p.x,y:p.y};p.move(nx*20,ny*20,room);
    assert.ok((p.x-before.x)*nx+(p.y-before.y)*ny>19.9);
  }
});

test('三房可見障礙物以掃掠碰撞阻擋四方向高速穿透並可貼邊滑動',()=>{
  const {Player,maps}=load();
  for(const map of maps) {
    // 使用真實障礙尺寸，在獨立空間驗證四面掃掠；不從已封到外牆的牆後出生。
    const b=map.obstacles[0],margin=100;
    const room={obstacles:[b],innerVertices:[{x:b.x-margin,y:b.y-margin},{x:b.x+b.width+margin,y:b.y-margin},{x:b.x+b.width+margin,y:b.y+b.height+margin},{x:b.x-margin,y:b.y+b.height+margin}]};
    assert.ok(room.obstacles.length>0);
    const box=room.obstacles[0],cx=box.x+box.width/2,cy=box.y+box.height/2;
    for(const [x,y,dx,dy] of [[box.x-40,cy,2000,0],[box.x+box.width+40,cy,-2000,0],[cx,box.y-40,0,2000],[cx,box.y+box.height+40,0,-2000]]) {
      const p=new Player(x,y);p.move(dx,dy,room);inside(p,room);
      if(dx>0) assert.ok(p.x<=box.x-p.halfWidth+1e-6);
      if(dx<0) assert.ok(p.x>=box.x+box.width+p.halfWidth-1e-6);
      if(dy>0) assert.ok(p.y<=box.y-p.halfHeight+1e-6);
      if(dy<0) assert.ok(p.y>=box.y+box.height+p.halfHeight-1e-6);
    }
    const p=new Player(box.x-8,box.y+10),oldY=p.y;p.move(12,20,room);inside(p,room);
    assert.ok(p.y-oldY>19.9);assert.ok(p.x<=box.x-8+1e-6);
  }
});

test('玩家位置繪製與碰撞盒一致，無動畫素材時使用暫時圖形，不新增圖片來源',()=>{
  const {Player}=load(),p=new Player(640,360),calls=[];
  p.draw({fillRect:(...args)=>calls.push(args)});
  assert.ok(calls.length>0);assert.ok(calls.some(([x,y,w,h])=>x<=p.x && x+w>=p.x && y<=p.y && y+h>=p.y));
});

test('窄通道略偏向牆面仍持續前進，通道內不穿入上下障礙',()=>{
  const {Player,maps}=load();
  const room={id:'corridor',innerVertices:maps[0].innerVertices,obstacles:[
    {x:550,y:230,width:200,height:58},{x:550,y:312,width:200,height:58},
  ]};
  const p=new Player(560,300);
  for(let i=0;i<80;i++){p.move(2,-0.3,room);inside(p,room);}
  assert.ok(p.x>719.9,'輕微偏離通道不得卡住');
  assert.ok(p.y>=294-1e-6 && p.y<300);
});

test('實際入口串接 Input/Player，RAF 按鍵更新而地圖保持固定',()=>{
  const {sandbox}=load(),win=target(),doc=target();
  const ctx={};for(const method of ['save','restore','beginPath','moveTo','lineTo','closePath','clip','drawImage','fillRect','fillText'])ctx[method]=()=>{};
  doc.getElementById=()=>({width:1280,height:720,getContext:()=>ctx});
  let callback;
  sandbox.addEventListener=win.addEventListener.bind(win);sandbox.document=doc;
  sandbox.requestAnimationFrame=cb=>{callback=cb;return 1;};sandbox.cancelAnimationFrame=()=>{};
  vm.runInContext(fs.readFileSync(path.join(root,'main.js'),'utf8'),sandbox);
  const session=vm.runInContext('playerSession',sandbox);
  assert.ok(session.player instanceof sandbox.PlayerSystem.Player);
  assert.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('src="player.js"'));
  const originalY=session.player.y;
  win.emit('keydown',key('KeyW'));callback(0);callback(1000/60);
  assert.ok(session.player.y<originalY);
});
