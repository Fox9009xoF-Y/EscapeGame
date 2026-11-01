'use strict';

globalThis.RoomMaps = (() => {
  const center = Object.freeze({ x: 640, y: 360 });
  const wallThickness = 24;

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
      this.obstacles = Object.freeze([Object.freeze({ x: 704, y: 352, width: 48, height: 48 })]);
      Object.freeze(this);
    }
  }

  const maps = Object.freeze([
    new RoomMap('living', '客廳', 4, 360, Math.PI / 4),
    new RoomMap('bedroom', '臥室', 5, 286, -Math.PI / 2),
    new RoomMap('library', '藏書房', 6, 300, 0),
  ]);
  const selected = new URLSearchParams(location.search).get('room');
  const currentMap = maps.find(room => room.id === selected) || maps[0];
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

  function draw(ctx) {
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
    ctx.restore();

    for (const box of room.obstacles) {
      ctx.drawImage(tileset, 16, 68, 16, 12, box.x, box.y, box.width, box.height);
      ctx.fillStyle = 'rgba(12, 14, 22, 0.25)';
      ctx.fillRect(box.x, box.y, box.width, box.height);
    }

    ctx.fillStyle = '#c6c1b1';
    ctx.fillText(room.name, center.x, 30);
  }

  return { Map: RoomMap, maps, currentMap, draw };
})();
