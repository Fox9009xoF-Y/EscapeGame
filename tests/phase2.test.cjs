const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(search = '') {
  const images = [];
  class Image {
    constructor() { images.push(this); this.naturalWidth = 112; this.naturalHeight = 192; }
  }
  const sandbox = vm.createContext({ Image, URLSearchParams, location: { search } });
  vm.runInContext(fs.readFileSync(path.join(root, 'maps.js'), 'utf8'), sandbox);
  return { api: sandbox.RoomMaps, images, sandbox };
}
function context() {
  const calls = [];
  const ctx = {};
  for (const name of ['save','restore','beginPath','moveTo','lineTo','closePath','clip','drawImage','fillRect','fillText']) {
    ctx[name] = (...args) => calls.push([name, ...args]);
  }
  return { ctx, calls };
}

test('三房為等邊等角凸多邊形，幾何中心固定且完整容於 1280×720', () => {
  const { api } = load();
  assert.equal(api.maps.length, 3);
  for (const [index, room] of api.maps.entries()) {
    assert.ok(room instanceof api.Map);
    assert.equal(room.vertices.length, index + 4);
    assert.equal(room.edges.length, room.vertices.length);
    const vertices = room.vertices;
    const lengths = vertices.map((p, i) => Math.hypot(p.x - vertices[(i+1)%vertices.length].x, p.y - vertices[(i+1)%vertices.length].y));
    lengths.forEach(length => assert.ok(Math.abs(length - lengths[0]) < 1e-8));
    assert.ok(Math.abs(vertices.reduce((s,p)=>s+p.x,0)/vertices.length - 640) < 1e-8);
    assert.ok(Math.abs(vertices.reduce((s,p)=>s+p.y,0)/vertices.length - 360) < 1e-8);
    vertices.forEach((p,i) => {
      assert.ok(p.x >= 32 && p.x <= 1248 && p.y >= 32 && p.y <= 688);
      const q = vertices[(i+1)%vertices.length], r = vertices[(i+2)%vertices.length];
      const ux=q.x-p.x, uy=q.y-p.y, vx=r.x-q.x, vy=r.y-q.y;
      const turn=Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy);
      assert.ok(Math.abs(turn - 2*Math.PI/vertices.length) < 1e-8);
      assert.equal(room.edges[i].start, p);
      assert.equal(room.edges[i].end, q);
    });
  }
});

test('房間命名與方位符合後續門位置需求', () => {
  const { api } = load();
  assert.deepEqual(Array.from(api.maps, r=>r.name), ['客廳','臥室','藏書房']);
  const square = api.maps[0];
  assert.ok(square.edges.some(e=>Math.abs(e.start.x-e.end.x)<1e-8 && e.start.x>640));
  for (const room of api.maps.slice(1)) {
    assert.ok(room.edges.some(e=>Math.abs(e.start.y-e.end.y)<1e-8 && e.start.y>360), '底邊水平');
    assert.ok(room.edges.some(e=>(e.start.x+e.end.x)/2<640 && (e.start.y+e.end.y)/2>360 && Math.abs(e.start.y-e.end.y)>1), '左下斜邊');
    assert.ok(room.edges.some(e=>(e.start.x+e.end.x)/2>640 && (e.start.y+e.end.y)/2>360 && Math.abs(e.start.y-e.end.y)>1), '右下斜邊');
  }
});

test('只載入指定 tileset，完成前不繪製圖片，失敗時給出提示', () => {
  const { api, images } = load();
  assert.equal(images.length, 1);
  assert.equal(images[0].src, 'tilesetformattedupdate1.png');
  const { ctx, calls } = context();
  api.draw(ctx);
  assert.equal(calls.filter(c=>c[0]==='drawImage').length, 0);
  images[0].onerror(); api.draw(ctx);
  assert.ok(calls.some(c=>c[0]==='fillText' && /素材.*失敗/.test(c[1])));
});

test('每張地圖先裁切再鋪地板，牆面以內外多邊形裁切成平整邊帶，還原繪圖狀態', () => {
  for (const id of ['living','bedroom','library']) {
    const { api, images } = load(`?room=${id}`); images[0].onload();
    const { ctx, calls } = context(); api.draw(ctx);
    assert.equal(api.currentMap.id, id);
    const firstImage = calls.findIndex(c=>c[0]==='drawImage');
    assert.ok(firstImage > calls.findIndex(c=>c[0]==='clip'));
    assert.ok(calls.some(c=>c[0]==='clip' && c[1]==='evenodd'));
    assert.equal(calls.filter(c=>c[0]==='save').length, calls.filter(c=>c[0]==='restore').length);
    for (const call of calls.filter(c=>c[0]==='drawImage')) {
      const [, image, sx, sy, sw, sh, x, y, w, h] = call;
      assert.equal(image, images[0]);
      assert.ok(sx>=0 && sy>=0 && sx+sw<=112 && sy+sh<=192);
      assert.ok(Number.isFinite(x+y+w+h) && w>0 && h>0);
    }
    const tiles = calls.filter(c=>c[0]==='drawImage');
    assert.ok(new Set(tiles.map(c=>`${c[2]},${c[3]}`)).size >= 2, '地板與牆面使用不同素材');
    assert.ok(calls.some(c=>c[0]==='moveTo' && Math.abs(c[1]-api.currentMap.vertices[0].x)<1e-8));
  }
});

test('預設或未知房間僅顯示客廳，不同房間有不同輪廓且不依玩家位置捲動', () => {
  const { api, images } = load('?room=unknown'); images[0].onload();
  assert.equal(api.currentMap.id, 'living');
  const a=context(), b=context(); api.draw(a.ctx);
  api.player={x:9999,y:-9999}; api.draw(b.ctx);
  assert.deepEqual(a.calls,b.calls);
  const names=a.calls.filter(c=>c[0]==='fillText').map(c=>c[1]);
  assert.ok(names.includes('客廳'));
  assert.ok(!names.includes('臥室') && !names.includes('藏書房'));
});

test('HTML 先載入地圖模組，實際 main.draw 會繪製當前房間且保留 Phase 1 迴圈', () => {
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.indexOf('src="maps.js"')>=0 && html.indexOf('src="maps.js"')<html.indexOf('src="main.js"'));
  const app=load('?room=bedroom'); app.images[0].onload();
  const {ctx,calls}=context(); let callback;
  Object.assign(app.sandbox, {document:{hidden:false,getElementById:()=>({width:1280,height:720,getContext:()=>ctx}),addEventListener(){}},requestAnimationFrame:cb=>{callback=cb;return 1;},cancelAnimationFrame(){}});
  vm.runInContext(fs.readFileSync(path.join(root,'main.js'),'utf8'),app.sandbox);
  callback(0);
  assert.ok(calls.some(c=>c[0]==='fillRect' && c.slice(1).join(',')==='0,0,1280,720'));
  assert.ok(calls.some(c=>c[0]==='drawImage'));
  assert.ok(calls.some(c=>c[0]==='fillText' && c[1]==='臥室'));
});
