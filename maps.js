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

  function makeInteriors(room) {
    const id = room.id;
    const box = (x, y, width, height) => ({ x, y, width, height });
    const defs = id === 'living' ? [
      { id:'living-celestial', role:'celestial-wall', title:'天象牆', text:'牆上嵌著太陽、月亮與一圈星星。', bounds:box(624,140,148,52), solid:true },

      { id:'living-carpet-clue', role:'carpet-clue', title:'地毯的一角', text:'地毯的一角微微翹起，底下露出一張紙。', bounds:box(624,340,24,16), floor:true },
      { id:'living-desk', role:'desk', title:'書桌抽屜', text:'書桌抽屜裡露出一張摺好的紙。', bounds:box(800,188,56,48), solid:true },
      { id:'living-exit-bookshelf', role:'exit-bookshelf', title:'擋住門的書櫃', text:'書櫃後似乎有一道門。櫃側的鎖孔呈太陽形狀。', bounds:box(420,134,168,48), solid:true, modules:3 },
      { id:'living-exit', role:'escape-door', title:'書櫃後的大門', text:'大門被書櫃擋住，現在無法通過。', bounds:box(420,106,56,24), interaction:box(420,134,168,48), priority:-1, parentId:'living-exit-bookshelf' },
      { id:'living-lower-bookshelf', role:'bookshelf', title:'客廳下方書櫃', text:'書櫃裡放著幾本舊書。', bounds:box(432,506,104,44), solid:true },
      { id:'living-low-table', role:'low-table', title:'客廳矮桌', text:'矮桌上留著幾道杯底印。', bounds:box(564,462,80,40), solid:true },
    ] : id === 'bedroom' ? [
      ...[3,4,0,1,2].map((cornerIndex,i) => {
        const v=room.innerVertices[cornerIndex],length=Math.hypot(640-v.x,360-v.y);
        const x=v.x+(640-v.x)*40/length,y=v.y+(360-v.y)*40/length;
        return {id: 'bedroom-lamp-'+i,role:'oil-lamp',title:'油燈',text:'角落安放著一盞油燈。',bounds:box(x-8,y-14,16,28),collision:box(x-8,y-2,16,16),lampIndex:i,cornerIndex,solid:true};
      }),
      { id:'bedroom-pillow', role:'pillow', title:'杰哥的抱枕', text:'床上放著一個印有杰哥模樣的長抱枕。', bounds:box(786,280,18,30), interaction:box(786,312,20,6), priority:2, parentId:'bedroom-1', depth:319 },
      { id:'bedroom-low-table', role:'low-table', title:'床邊矮桌', text:'矮桌緊挨著床邊。', bounds:box(708,300,24,28),solid:true },
      { id:'bedroom-lower-bookshelf', role:'bookshelf', title:'臥室下方書櫃', text:'靠牆的書櫃裡塞著一些雜物。', bounds:box(620,538,124,28),solid:true,wallMounted:true,wallIndex:2 },
    ] : [
      { id:'library-word-clue', role:'word-clue', title:'書櫃裡的便條', text:'書頁間夾著一張寫有字句的紙。', bounds:box(692,168,14,22), interaction:box(688,194,24,6), priority:2, parentId:'library-1', depth:201 },
      { id:'library-reward-marker', role:'reward-marker', title:'中央刻痕', text:'地板中央有一圈刻痕，中間空著。', bounds:box(626,346,28,28), interaction:box(626,374,28,8), floor:true },
      { id:'library-lamp-1', role:'oil-lamp', title:'藏書房油燈', text:'書櫃旁放著一盞油燈。', bounds:box(466,312,16,28),collision:box(466,324,16,16),solid:true },
      ...[0,1,2,3,5].map(wallIndex => {
        const e=room.edges[wallIndex],length=Math.hypot(e.end.x-e.start.x,e.end.y-e.start.y);
        const t={x:(e.end.x-e.start.x)/length,y:(e.end.y-e.start.y)/length},n={x:-t.y,y:t.x};
        const offset=wallIndex===2?-88:wallIndex===0?70:0;
        const c={x:(e.start.x+e.end.x)/2+t.x*offset+n.x*44,y:(e.start.y+e.end.y)/2+t.y*offset+n.y*44};
        const points=[[-32,-13],[32,-13],[32,13],[-32,13]].map(([u,v])=>({x:c.x+t.x*u+n.x*v,y:c.y+t.y*u+n.y*v}));
        const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y));
        return {id:'library-wall-bookshelf-'+wallIndex,role:'bookshelf',title:'沿牆書櫃',text:'沿著牆面排列的書櫃，放滿了舊書。',bounds:box(left,top,Math.max(...points.map(p=>p.x))-left,Math.max(...points.map(p=>p.y))-top),collision:box(c.x+n.x*10-18,c.y+n.y*10-8,36,16),solid:true,wallMounted:true,wallIndex,orientation:{center:c,tangent:t,normal:n}};
      }),
    ];
    const door=room.portals[0],c={x:door.center.x+door.tangent.x*52+door.normal.x*12,y:door.center.y+door.tangent.y*52+door.normal.y*12};
    defs.push({id:id+'-switch',role:'light-switch',title:'牆上開關',text:'牆上有一個老舊的電燈開關。',bounds:box(c.x-5,c.y-6,10,12),interaction:box(c.x+door.normal.x*18-9,c.y+door.normal.y*18-9,18,18),wallMounted:true,wallIndex:door.edgeIndex});
    return defs.map(makeSceneObject);
  }

  function makeSceneObject(def) {
      const visualBounds = Object.freeze(def.bounds);
      const collision = def.collision ? Object.freeze(def.collision) : visualBounds;
      const interactionBounds = def.interaction ? Object.freeze(def.interaction) : collision;
      return Object.freeze({ id:def.id, role:def.role, title:def.title, text:def.text,
        visualBounds, collision, interactionBounds, solid:!!def.solid,
        priority:def.priority || 0, parentId:def.parentId, lampIndex:def.lampIndex, cornerIndex:def.cornerIndex,
        modules:def.modules,wallMounted:!!def.wallMounted,wallIndex:def.wallIndex,
        depth:def.depth ?? (def.floor ? -10000 : visualBounds.y + visualBounds.height),
        draw(ctx) {
          const {x,y,width:w,height:h}=visualBounds;
          const rect=(color,dx,dy,rw,rh)=>{ctx.fillStyle=color;ctx.fillRect(x+dx,y+dy,rw,rh);};
          const polygon=(color,points)=>{ctx.save();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+points[0][0],y+points[0][1]);for(const [px,py]of points.slice(1))ctx.lineTo(x+px,y+py);ctx.closePath();ctx.clip();ctx.fillRect(x,y,w,h);ctx.restore();};
          if(def.role==='pillar') {
            ctx.save();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.clip();
            for(let dy=0;dy<h;dy+=32)for(let dx=0;dx<w;dx+=32)ctx.drawImage(tileset,16,68,16,12,x+dx,y+dy,32,32);
            rect('rgba(12,14,22,.25)',0,0,w,h);ctx.restore();
          } else if(def.role==='sofa') {
            rect('#4d3426',0,0,w,h);rect('#653b3e',6,4,w-12,16);rect('#875758',12,23,(w-30)/2,h-29);rect('#875758',w/2+3,23,(w-30)/2,h-29);rect('#ac9665',4,4,4,h-8);rect('#ac9665',w-8,4,4,h-8);
          } else if(def.role==='bed') {
            rect('#4d3426',0,0,w,h);rect('#c7bca6',5,6,w-10,h-12);rect('#e6dfca',10,9,w-20,17);rect('#713d40',5,30,w-10,h-36);rect('#a77464',5,31,w-10,4);
          } else if(def.role==='celestial-wall') {
            rect('#876746',0,0,w,h);rect('#171f32',4,4,w-8,h-8);
            // 初始天象外觀；週期/旋轉/摘取由 N3 接入，不在內裝階段運作。
            polygon('#d9b764',[[50,16],[56,12],[62,16],[66,22],[62,28],[56,32],[50,28],[46,22]]);
            for(const [dx,dy]of [[54,7],[54,33],[39,20],[67,20]])rect('#d9b764',dx,dy,4,4);
            polygon('#d9d5bf',[[104,12],[110,12],[116,18],[116,24],[110,30],[104,30],[98,24],[98,18]]);
            polygon('#171f32',[[105,15],[109,15],[113,19],[113,23],[109,27],[105,27],[101,23],[101,19]]);
            for(const [dx,dy]of [[17,11],[28,32],[82,8],[126,26],[92,38]]){rect('#c1c7d5',dx,dy,3,3);}
          } else if(def.role==='light-switch') {
            rect('#b0a68e',0,0,w,h);rect('#ddd1b2',3,3,6,8);rect('#544b40',3,12,6,3);
          } else if(def.role==='carpet-clue'||def.role==='word-clue') {
            rect('#d6c69f',0,0,w,h);for(let row=4;row<h-2;row+=5)rect('#817559',3,row,w-6,1);
            if(def.role==='carpet-clue')polygon('#8b6a52',[[0,0],[8,0],[0,9]]);
          } else if(def.role==='desk') {
            rect('#3f2c24',0,0,w,h);rect('#9c784e',2,2,w-4,12);rect('#765536',4,18,w-8,h-22);rect('#d2b36d',w/2-3,24,6,3);
          } else if(def.role==='bookshelf'||def.role==='exit-bookshelf') {
            if(def.orientation) {
              const {center:c,tangent:t,normal:n}=def.orientation;
              const oriented=(color,u,v,ow,oh)=>polygon(color,[[u,v],[u+ow,v],[u+ow,v+oh],[u,v+oh]].map(([pu,pv])=>[c.x+t.x*pu+n.x*pv-x,c.y+t.y*pu+n.y*pv-y]));
              oriented('#3d2b24',-32,-13,64,26);for(let col=0;col<6;col++)oriented(['#765348','#55656a','#9b8b55'][col%3],-27+col*9,-9,6,14);oriented('#b18c55',-30,6,60,3);
            } else {
              const modules=def.modules||1,mw=w/modules;
              for(let m=0;m<modules;m++){
                rect('#3d2b24',m*mw,0,mw,h);
                for(let row=0;row<2;row++)for(let col=0;col<Math.floor((mw-8)/9);col++)rect(['#765348','#55656a','#9b8b55'][(col+row)%3],m*mw+5+col*9,4+row*Math.floor(h/2),6,Math.max(5,Math.floor(h/2)-8));
                rect('#b18c55',m*mw+2,Math.floor(h/2)-2,mw-4,3);rect('#b18c55',m*mw+2,h-5,mw-4,3);
              }
              if(def.role==='exit-bookshelf')rect('#dfb35b',w-7,h/2+3,4,5);
            }
          } else if(def.role==='low-table') {
            rect('#3d2b24',0,0,w,h);rect('#9c784e',2,2,w-4,h-8);rect('#be9d69',4,4,w-8,2);rect('#35251f',3,h-6,5,6);rect('#35251f',w-8,h-6,5,6);
          } else if(def.role==='escape-door') {
            rect('#392b24',0,0,w,h);rect('#866543',4,1,w-8,h-1);rect('#2b2422',w/2-2,3,4,h-3);
          } else if(def.role==='oil-lamp') {
            rect('#5d5045',0,12,16,16);rect('#a38c5d',3,9,10,10);rect('#d4c7a1',6,3,4,10);rect('#2e292b',7,0,2,5);
          } else if(def.role==='pillow') {
            rect('#a48b75',0,0,w,h);rect('#ddd0ae',2,2,w-4,h-4);rect('#bd9471',5,8,8,8);
            rect('#24272b',5,8,3,3);rect('#24272b',10,8,3,3);rect('#24272b',8,9,2,1);rect('#363a41',4,17,10,9);
          } else if(def.role==='reward-marker') {
            rect('#aa905c',0,0,w,2);rect('#aa905c',0,h-2,w,2);rect('#aa905c',0,0,2,h);rect('#aa905c',w-2,0,2,h);
            rect('#aa905c',w/2-2,h/2-2,4,4);
          }
        },
      });
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
      const box=(x,y,width,height)=>({x,y,width,height});
      const bottom=Math.max(...this.innerVertices.map(p=>p.y));
      this.carpet=Object.freeze(id==='bedroom'?{x:704,y:246,width:124,height:170,anchor:Object.freeze({x:704,y:304})}:{x:540,y:322,width:124,height:80});
      const bases=id==='living'?[
        {id:'living-0',role:'pillar',title:'客廳隔牆',text:'石牆一路延伸到房間下方，得從上方繞過去。',bounds:box(704,304,48,bottom-304),collision:box(704,352,48,bottom-352),solid:true},
        {id:'living-1',role:'sofa',title:'舊沙發',text:'沙發坐墊凹下了一角，布面還留著一點溫度。',bounds:box(480,188,104,56),solid:true},
      ]:id==='bedroom'?[
        {id:'bedroom-0',role:'pillar',title:'臥室隔牆',text:'加長的石牆把房間分隔開，兩端仍可繞行。',bounds:box(540,322,48,192),collision:box(540,370,48,144),solid:true},
        {id:'bedroom-1',role:'bed',title:'整理好的床',text:'被子折得很整齊。枕頭旁有幾道細長的抓痕。',bounds:box(744,246,64,72),solid:true},
      ]:[
        {id:'library-0',role:'oil-lamp',title:'藏書房油燈',text:'書櫃旁放著一盞油燈。',bounds:box(780,430,16,28),collision:box(780,442,16,16),solid:true},
        {id:'library-1',role:'bookshelf',title:'藏書架',text:'書背都蒙著灰，只有一本書像是剛被放回去。',bounds:box(565,136,150,64),solid:true,wallMounted:true,wallIndex:4},
      ];
      this.objects=Object.freeze(bases.map(makeSceneObject));
      this.obstacles=Object.freeze(this.objects.filter(o=>o.solid).map(o=>o.collision));
      this.portals = makePortals(this);
      const interiors = makeInteriors(this);
      this.obstacles = Object.freeze([...this.obstacles, ...interiors.filter(object => object.solid).map(object => object.collision)]);
      this.objects = Object.freeze([...this.objects, ...interiors]);
      if (id === 'living') this.exit = Object.freeze({ id:'living-exit', coverId:'living-exit-bookshelf', locked:true });
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
  let exitRevealed = false;
  const originalLiving=maps[0], cover=originalLiving.objects.find(o=>o.id===originalLiving.exit.coverId);
  const revealedLiving=Object.freeze(Object.assign(Object.create(Object.getPrototypeOf(originalLiving)),originalLiving,{
    objects:Object.freeze(originalLiving.objects.filter(o=>o!==cover).map(o=>o.role==='escape-door'?Object.freeze({...o,parentId:null,interactionBounds:Object.freeze({x:420,y:130,width:56,height:10})}):o)),
    obstacles:Object.freeze(originalLiving.obstacles.filter(o=>o!==cover.collision)),
    exit:Object.freeze({...originalLiving.exit,locked:false})
  }));
  const revealedMaps=Object.freeze([revealedLiving,...maps.slice(1)]);
  const effective=room=>exitRevealed&&room.id==='living'?revealedLiving:room;
  function setExitRevealed(value){exitRevealed=!!value;}
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
    const room = effective(currentMap);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    path(ctx, room.vertices);
    ctx.clip();
    // 圖片右上角為不含洋紅透明底的木色紋理。
    tile(ctx, room, [96, 0, 16, 16]);
    // 低矮地毯屬地板層，可步行通過；三房皆保留完整外輪廓。
    const rug=room.carpet;
    ctx.fillStyle='#593b3c';ctx.fillRect(rug.x,rug.y,rug.width,rug.height);
    ctx.fillStyle='#9a8050';ctx.fillRect(rug.x+4,rug.y+4,rug.width-8,rug.height-8);
    ctx.fillStyle='#593b3c';ctx.fillRect(rug.x+8,rug.y+8,rug.width-16,rug.height-16);
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
    }
    ctx.restore();

    [...room.objects, ...entities].sort((a, b) => a.depth - b.depth).forEach(entity => entity.draw(ctx));

    ctx.fillStyle = '#c6c1b1';
    ctx.fillText(room.name, center.x, 30);
  }

  return { Map: RoomMap, get maps(){return exitRevealed?revealedMaps:maps;}, get currentMap() { return effective(currentMap); }, setCurrentMap, setExitRevealed, draw };
})();
