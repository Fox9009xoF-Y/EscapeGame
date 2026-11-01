'use strict';

globalThis.PlayerSystem = (() => {
  const epsilon = 1e-8;
  const spriteImages = {};
  for (const source of ['hero-sprites.png', 'hero-back-walk.png']) {
    const image = new Image();
    const asset = { image, ready: false };
    spriteImages[source] = asset;
    image.onload = () => { asset.ready = true; };
    image.src = source;
  }
  function drawSorted(ctx, entities) {
    [...entities].sort((a, b) => a.depth - b.depth).forEach(entity => entity.draw(ctx));
  }
  const bindings = {
    KeyW: [0, -1], ArrowUp: [0, -1], KeyA: [-1, 0], ArrowLeft: [-1, 0],
    KeyS: [0, 1], ArrowDown: [0, 1], KeyD: [1, 0], ArrowRight: [1, 0],
  };

  class Input {
    constructor(target, document) {
      this.keys = new Set();
      target.addEventListener('keydown', event => {
        if (!Object.hasOwn(bindings, event.code)) return;
        if (event.target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
        event.preventDefault();
        this.keys.add(event.code);
      });
      target.addEventListener('keyup', event => {
        if (!Object.hasOwn(bindings, event.code)) return;
        this.keys.delete(event.code);
      });
      target.addEventListener('blur', () => this.keys.clear());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.keys.clear();
      });
    }

    direction() {
      // 同方向 WASD 和方向鍵同按仍只算一次。
      let left = false, right = false, up = false, down = false;
      for (const code of this.keys) {
        const [x, y] = bindings[code];
        left ||= x < 0; right ||= x > 0; up ||= y < 0; down ||= y > 0;
      }
      const x = Number(right) - Number(left), y = Number(down) - Number(up);
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length };
    }
  }

  // 對矩形作 Minkowski 擴張，將腳部 AABB 的掃掠轉換為點對矩形的射線。
  function sweepBox(player, dx, dy, box) {
    const min = [box.x - player.halfWidth, box.y - player.halfHeight];
    const max = [box.x + box.width + player.halfWidth, box.y + box.height + player.halfHeight];
    const position = [player.x, player.y], velocity = [dx, dy];
    let enter = -Infinity, exit = Infinity;
    let normals = [];
    for (let axis = 0; axis < 2; axis++) {
      const p = position[axis], v = velocity[axis];
      if (Math.abs(v) < epsilon) {
        // 沿邊界平行行走不進入障礙內部，不應卡住。
        if (p <= min[axis] + epsilon || p >= max[axis] - epsilon) return null;
        continue;
      }
      const a = (min[axis] - p) / v, b = (max[axis] - p) / v;
      const near = Math.min(a, b), far = Math.max(a, b);
      const normal = axis === 0 ? { x: -Math.sign(v), y: 0 } : { x: 0, y: -Math.sign(v) };
      if (near > enter + epsilon) { enter = near; normals = [normal]; }
      else if (Math.abs(near - enter) <= epsilon) normals.push(normal);
      exit = Math.min(exit, far);
    }
    if (enter < -epsilon || enter > 1 + epsilon || exit <= Math.max(0, enter) + epsilon) return null;
    return { time: Math.max(0, enter), normals };
  }

  // 求最接近原始意圖、又不進入任何接觸面的可行向量。
  function projectMotion(dx, dy, normals) {
    const allowed = (x, y) => normals.every(n => x * n.x + y * n.y >= -epsilon);
    if (allowed(dx, dy)) return { x: dx, y: dy };
    let best = { x: 0, y: 0 }, cost = dx * dx + dy * dy;
    for (const n of normals) {
      const dot = dx * n.x + dy * n.y;
      const x = dx - dot * n.x, y = dy - dot * n.y;
      const distance = (dx - x) ** 2 + (dy - y) ** 2;
      if (allowed(x, y) && distance < cost) { best = { x, y }; cost = distance; }
    }
    return best;
  }

  class Player {
    constructor(x = 640, y = 360) {
      this.x = x; this.y = y;
      this.halfWidth = 8; this.halfHeight = 6;
      this.speed = 180;
      this.direction = 'down';
      this.moving = false;
      this.animationTime = 0;
    }

    update(deltaSeconds, input, room) {
      const direction = input.direction();
      this.moving = direction.x !== 0 || direction.y !== 0;
      if (this.moving) {
        this.direction = direction.y < 0 ? 'up' : direction.y > 0 ? 'down' : direction.x < 0 ? 'left' : 'right';
      }
      if (Number.isFinite(deltaSeconds) && deltaSeconds > 0) {
        this.move(direction.x * this.speed * deltaSeconds, direction.y * this.speed * deltaSeconds, room);
      }
      this.animationTime = this.moving && Number.isFinite(deltaSeconds) && deltaSeconds > 0
        ? (this.animationTime + deltaSeconds) % 0.48 : 0;
    }

    get depth() { return this.y + this.halfHeight; }

    spriteFrame() {
      const index = this.moving ? [0, 1, 2, 1][Math.floor(this.animationTime / 0.12) % 4] : 0;
      const back = this.direction === 'up';
      return { asset: back ? 'hero-back-walk.png' : 'hero-sprites.png',
        sx: (back ? 0 : 16) + index * 16,
        sy: back ? 0 : this.direction === 'down' ? 16 : 32,
        flip: this.direction === 'left' };
    }

    move(dx, dy, room) {
      if (!Number.isFinite(dx + dy)) return;
      const vertices = room.innerVertices;
      const original = { x: dx, y: dy };
      let remaining = 1;
      // 每次處理最早接觸；餘下位移投影到切線。安全上限耗盡則放棄餘量，不能穿透。
      for (let iteration = 0; iteration < 8 && Math.hypot(dx, dy) > epsilon; iteration++) {
        const touching = [];
        for (let i = 0; i < vertices.length; i++) {
          const a = vertices[i], b = vertices[(i + 1) % vertices.length];
          const length = Math.hypot(b.x - a.x, b.y - a.y);
          const nx = -(b.y - a.y) / length, ny = (b.x - a.x) / length;
          const support = Math.abs(nx) * this.halfWidth + Math.abs(ny) * this.halfHeight;
          if ((this.x - a.x) * nx + (this.y - a.y) * ny - support < 1e-6) touching.push({ x: nx, y: ny });
        }
        for (const box of room.obstacles || []) {
          const left = box.x - this.halfWidth, right = box.x + box.width + this.halfWidth;
          const top = box.y - this.halfHeight, bottom = box.y + box.height + this.halfHeight;
          if (this.y > top + epsilon && this.y < bottom - epsilon) {
            if (Math.abs(this.x - left) < 1e-6) touching.push({ x: -1, y: 0 });
            if (Math.abs(this.x - right) < 1e-6) touching.push({ x: 1, y: 0 });
          }
          if (this.x > left + epsilon && this.x < right - epsilon) {
            if (Math.abs(this.y - top) < 1e-6) touching.push({ x: 0, y: -1 });
            if (Math.abs(this.y - bottom) < 1e-6) touching.push({ x: 0, y: 1 });
          }
        }
        const motion = projectMotion(original.x * remaining, original.y * remaining, touching);
        dx = motion.x; dy = motion.y;
        if (Math.hypot(dx, dy) < epsilon) break;
        let time = 1, normals = [];
        const contact = hit => {
          if (!hit || hit.time > time + epsilon) return;
          if (hit.time < time - epsilon) { time = hit.time; normals = []; }
          normals.push(...hit.normals);
        };
        for (let i = 0; i < vertices.length; i++) {
          const a = vertices[i], b = vertices[(i + 1) % vertices.length];
          const length = Math.hypot(b.x - a.x, b.y - a.y);
          const nx = -(b.y - a.y) / length, ny = (b.x - a.x) / length;
          const support = Math.abs(nx) * this.halfWidth + Math.abs(ny) * this.halfHeight;
          const distance = (this.x - a.x) * nx + (this.y - a.y) * ny - support;
          const velocity = dx * nx + dy * ny;
          if (velocity < -epsilon) {
            const hitTime = Math.max(0, distance) / -velocity;
            if (hitTime <= 1 + epsilon) contact({ time: Math.min(1, hitTime), normals: [{ x: nx, y: ny }] });
          }
        }
        for (const box of room.obstacles || []) contact(sweepBox(this, dx, dy, box));
        this.x += dx * time; this.y += dy * time;
        remaining *= 1 - time;
        if (remaining < epsilon) break;
        if (normals.length === 0) break;
      }
    }

    draw(ctx) {
      // 暫時角色標記，正式 Sprite 與四向動畫於 Phase 4 接上。
      ctx.fillStyle = '#22232c';
      ctx.fillRect(this.x - 8, this.y + 1, 16, 6);
      const frame = this.spriteFrame(), asset = spriteImages[frame.asset];
      if (asset.ready && ctx.drawImage) {
        const size = 32;
        if (frame.flip) {
          ctx.save(); ctx.translate(this.x, this.y + this.halfHeight); ctx.scale(-1, 1);
          ctx.drawImage(asset.image, frame.sx, frame.sy, 16, 16, -size / 2, -size, size, size);
          ctx.restore();
        } else ctx.drawImage(asset.image, frame.sx, frame.sy, 16, 16, this.x - size / 2, this.y + this.halfHeight - size, size, size);
        return;
      }
      ctx.fillStyle = '#bdc5bc';
      ctx.fillRect(this.x - 7, this.y - 12, 14, 16);
      ctx.fillStyle = '#e5ccb0';
      ctx.fillRect(this.x - 6, this.y - 23, 12, 11);
      ctx.fillStyle = '#37333a';
      ctx.fillRect(this.x - 6, this.y - 24, 12, 4);
    }
  }

  function createSession(target, document, room) {
    const input = new Input(target, document), player = new Player();
    let activeRoom = room;
    return { player, input, setRoom: next => { activeRoom = next; },
      update: dt => player.update(dt, input, activeRoom), draw: ctx => player.draw(ctx) };
  }
  return { Input, Player, createSession, drawSorted };
})();
