const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function load(){class Image{}const s=vm.createContext({Image,URLSearchParams,location:{search:''}});for(const f of ['maps.js','player.js','door-labels.js'])vm.runInContext(fs.readFileSync(f,'utf8'),s);return s;}
test('預設速度由180加倍為360，單向與斜向一秒皆移動360像素',()=>{
 const s=load(),room={innerVertices:[{x:0,y:0},{x:2000,y:0},{x:2000,y:2000},{x:0,y:2000}],obstacles:[]};
 for(const [x,y]of[[1,0],[0,-1],[Math.SQRT1_2,Math.SQRT1_2]]){const p=new s.PlayerSystem.Player(1000,1000);assert.equal(p.speed,360);p.update(1,{direction:()=>({x,y})},room);assert.ok(Math.abs(Math.hypot(p.x-1000,p.y-1000)-360)<1e-8);}
});
test('四門箭頭位於外側且垂直門邊，文字在尖端延伸處，標示保持在畫面內',()=>{
 const s=load();for(const room of s.RoomMaps.maps)for(const door of room.portals){
  const layout=s.DoorLabels.layout(door),t=door.tangent,n=door.normal;
  const a={x:layout.tip.x-layout.start.x,y:layout.tip.y-layout.start.y};
  assert.ok(Math.abs(a.x*t.x+a.y*t.y)<1e-8);
  assert.ok(a.x*n.x+a.y*n.y<0);
  for(const p of [layout.start,layout.tip,layout.label]){assert.ok((p.x-door.center.x)*n.x+(p.y-door.center.y)*n.y<0);assert.ok(p.x>60&&p.x<1220&&p.y>30&&p.y<690);}
  const forward={x:layout.label.x-layout.tip.x,y:layout.label.y-layout.tip.y};assert.ok(forward.x*n.x+forward.y*n.y<0);assert.ok(Math.abs(forward.x*t.x+forward.y*t.y)<1e-8);
  assert.match(layout.label.text,/^(客廳|臥室|藏書房)$/);
 }
});
test('標示層不改變畫布與房間裁切；舊房內固定向右文字不再繪製',()=>{
 const html=fs.readFileSync('index.html','utf8');assert.match(html,/<svg[^>]*id="door-labels"[^>]*viewBox="0 0 1280 720"/);
 assert.ok(html.indexOf('src="door-labels.js"')<html.indexOf('src="main.js"'));
 assert.match(fs.readFileSync('main.js','utf8'),/DoorLabels\.render/);
 assert.doesNotMatch(fs.readFileSync('maps.js','utf8'),/fillText\(`→/);
});
