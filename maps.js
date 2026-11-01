'use strict';

globalThis.RoomMaps = (() => {
  const center = Object.freeze({ x: 640, y: 360 });
  const wallThickness = 24;

  function makePortals(room) {
    const routes = room.id === 'living' ? ['bedroom'] : room.id === 'bedroom' ? ['living', 'library'] : ['bedroom'];
    return Object.freeze(routes.map(target => {
      const right = room.id === 'living' || target === 'library';
      const edgeIndex = room.edges.findIndex(({ start: a, end: b }) => {
        const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
        return room.id === 'living' ? x > center.x && Math.abs(a.x - b.x) < 1e-6
          : y > center.y && (right ? x > center.x : x < center.x) && Math.abs(a.y - b.y) > 1;
      });
      const { start: a, end: b } = room.edges[edgeIndex];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const tangent = Object.freeze({ x: (b.x - a.x) / length, y: (b.y - a.y) / length });
      const normal = Object.freeze({ x: -tangent.y, y: tangent.x });
      const midpoint = Object.freeze({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      return Object.freeze({ id: `${room.id}-${target}`, target, destination: `${target}-${room.id}`, edgeIndex,
        width: 64, center: midpoint, tangent, normal,
        innerCenter: Object.freeze({ x: midpoint.x + normal.x * wallThickness, y: midpoint.y + normal.y * wallThickness }) });
    }));
  }

  class RoomMap {
    constructor(id, name, sides, radius, rotation) {
      this.id = id;
      this.name = name;
      this.radius = radius;
      this.apothem = radius * Math.cos(Math.PI / sides);
      this.vertices = Object.freeze(Array.from({ length: sides }, (_, i) => {
        const angle = rotation + i * Math.PI * 2 / sides;
        return Object.freeze({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
      }));
      // 邊界與渲染共用頂點，供 Phase 3 的向量碰撞直接沿用。
      this.edges = Object.freeze(this.vertices.map((start, i) => Object.freeze({ start, end: this.vertices[(i + 1) % sides] })));
      const scale = (this.apothem - wallThickness) / this.apothem;
      this.innerVertices = Object.freeze(this.vertices.map(p => Object.freeze({
        x: center.x + (p.x - center.x) * scale,
        y: center.y + (p.y - center.y) * scale,
      })));
      this.bounds = Object.freeze({
        left: Math.min(...this.vertices.map(p => p.x)), right: Math.max(...this.vertices.map(p => p.x)),
        top: Math.min(...this.vertices.map(p => p.y)), bottom: Math.max(...this.vertices.map(p => p.y)),
      });
      // Phase 3 的可見石造障礙；正式傢俱與深度排序在 Phase 4 加入。
      const furniture = id === 'living' ? { role:'sofa',title:'舊沙發',text:'沙發坐墊凹下了一角，布面還留著一點溫度。',x:480,y:188,width:104,height:56 }
        : id === 'bedroom' ? { role:'bed',title:'整理好的床',text:'被子折得很整齊。枕頭旁有幾道細長的抓痕。',x:548,y:180,width:64,height:72 }
        : { role:'bookshelf',title:'藏書架',text:'書背都蒙著灰，只有一本書像是剛被放回去。',x:565,y:176,width:150,height:64 };
      this.obstacles = Object.freeze([Object.freeze({ x: 704, y: 352, width: 48, height: 48 }),
        Object.freeze({x:furniture.x,y:furniture.y,width:furniture.width,height:furniture.height})]);
      this.objects = Object.freeze(this.obstacles.map((collision,index) => Object.freeze({
        id:`${id}-${index}`,role:index===0?'pillar':furniture.role,
        title:index===0?'冰冷的石柱':furniture.title,
        text:index===0?'石柱背後刻著幾道深痕，像是有人曾在這裡等了很久。':furniture.text,
        collision, depth: collision.y + collision.height,
        draw(ctx) {
          if (index === 1) {
            const {x,y,width:w,height:h}=collision;
            const rect=(color,rx,ry,rw,rh)=>{ctx.fillStyle=color;ctx.fillRect(rx,ry,rw,rh);};
            rect('#4d3426',x,y,w,h);
            if(furniture.role==='sofa'){
              rect('#653b3e',x+6,y+4,w-12,16);
              rect('#875758',x+12,y+23,(w-30)/2,h-29);
              rect('#875758',x+w/2+3,y+23,(w-30)/2,h-29);
              rect('#ac9665',x+4,y+4,4,h-8);rect('#ac9665',x+w-8,y+4,4,h-8);
            }else if(furniture.role==='bed'){
              rect('#c7bca6',x+5,y+6,w-10,h-12);rect('#e6dfca',x+10,y+9,w-20,17);
              rect('#713d40',x+5,y+30,w-10,h-36);rect('#a77464',x+5,y+31,w-10,4);
            }else{
              for(let row=0;row<2;row++)for(let col=0;col<15;col++){
                const colors=['#716c52','#75424a','#4f666c','#b09b67'];
                rect(colors[(row+col)%4],x+7+col*9,y+7+row*28,6,18+(col%3)*2);
              }
              rect('#a48a51',x+4,y+30,w-8,4);rect('#a48a51',x+4,y+h-7,w-8,3);
            }
            rect('#45272b',x+13,y+h+5,9,3);rect('#45272b',x+23,y+h+8,5,3);
            return;
          }
          // 柱子上半部可遮擋角色，底座碰撞盒沿用前一步。
          ctx.drawImage(tileset, 16, 68, 16, 12, collision.x, collision.y - 48, collision.width, collision.height + 48);
          ctx.fillStyle = 'rgba(12, 14, 22, 0.25)';
          ctx.fillRect(collision.x, collision.y - 48, collision.width, collision.height + 48);
        },
      })));
      this.portals = makePortals(this);
      Object.freeze(this);
    }
  }

  const maps = Object.freeze([
    new RoomMap('living', '客廳', 4, 360, Math.PI / 4),
    new RoomMap('bedroom', '臥室', 5, 286, -Math.PI / 2),
    new RoomMap('library', '藏書房', 6, 300, 0),
  ]);
  const selected = new URLSearchParams(location.search).get('room');
  let currentMap = maps.find(room => room.id === selected) || maps[0];
  function setCurrentMap(id) {
    const next = maps.find(room => room.id === id);
    if (!next) return false;
    currentMap = next;
    return true;
  }
  const tileset = new Image();
  let assetState = 'loading';
  tileset.onload = () => { assetState = 'ready'; };
  tileset.onerror = () => { assetState = 'error'; };
  tileset.src = 'tilesetformattedupdate1.png';

  function path(ctx, vertices) {
    ctx.moveTo(vertices[0].x, vertices[0].y);
    vertices.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
  }

  function tile(ctx, room, source) {
    const size = 32;
    const { left, right, top, bottom } = room.bounds;
    for (let y = Math.floor(top / size) * size; y < bottom; y += size) {
      for (let x = Math.floor(left / size) * size; x < right; x += size) {
        ctx.drawImage(tileset, ...source, x, y, size, size);
      }
    }
  }

  function draw(ctx, entities = []) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#ddd7c6';
    if (assetState !== 'ready') {
      ctx.fillText(assetState === 'error' ? '素材載入失敗，請確認圖片檔案後重新整理。' : '正在載入房間素材…', center.x, center.y);
      return;
    }
    const room = currentMap;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    path(ctx, room.vertices);
    ctx.clip();
    // 圖片右上角為不含洋紅透明底的木色紋理。
    tile(ctx, room, [96, 0, 16, 16]);
    // 低矮地毯屬地板層，可步行通過；三房皆保留完整外輪廓。
    ctx.fillStyle = '#593b3c'; ctx.fillRect(540, 322, 124, 80);
    ctx.fillStyle = '#9a8050'; ctx.fillRect(544, 326, 116, 72);
    ctx.fillStyle = '#593b3c'; ctx.fillRect(548, 330, 108, 64);
    ctx.fillStyle = 'rgba(20, 15, 23, 0.22)';
    ctx.fillRect(room.bounds.left, room.bounds.top, room.bounds.right - room.bounds.left, room.bounds.bottom - room.bounds.top);

    ctx.save();
    ctx.beginPath();
    path(ctx, room.vertices);
    path(ctx, room.innerVertices);
    ctx.clip('evenodd');
    // 石造區取樣；內外同心多邊形相差固定的法向距離。
    tile(ctx, room, [16, 68, 16, 12]);
    ctx.fillStyle = 'rgba(12, 14, 22, 0.25)';
    ctx.fillRect(room.bounds.left, room.bounds.top, room.bounds.right - room.bounds.left, room.bounds.bottom - room.bounds.top);
    ctx.restore();
    for (const door of room.portals) {
      const { center: c, normal: n, tangent: t, width } = door;
      const points = [-1, 1].map(sign => ({ x: c.x + t.x * width / 2 * sign, y: c.y + t.y * width / 2 * sign }));
      ctx.save();
      ctx.beginPath();
      path(ctx, [points[0], points[1],
        { x: points[1].x + n.x * wallThickness, y: points[1].y + n.y * wallThickness },
        { x: points[0].x + n.x * wallThickness, y: points[0].y + n.y * wallThickness }]);
      ctx.clip();
      ctx.fillStyle = '#a18046';
      ctx.fillRect(room.bounds.left, room.bounds.top, room.bounds.right - room.bounds.left, room.bounds.bottom - room.bounds.top);
      ctx.restore();
      ctx.fillStyle = '#d4c3a1';
      ctx.font = '14px sans-serif';
      const label = { living: '客廳', bedroom: '臥室', library: '藏書房' }[door.target];
      ctx.fillText(`→ ${label}`, door.innerCenter.x + n.x * 54, door.innerCenter.y + n.y * 54);
    }
    ctx.restore();

    [...room.objects, ...entities].sort((a, b) => a.depth - b.depth).forEach(entity => entity.draw(ctx));

    ctx.fillStyle = '#c6c1b1';
    ctx.fillText(room.name, center.x, 30);
  }

  return { Map: RoomMap, maps, get currentMap() { return currentMap; }, setCurrentMap, draw };
})();
