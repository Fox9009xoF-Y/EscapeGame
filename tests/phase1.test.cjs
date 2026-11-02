const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function boot() {
  const pending = new Map();
  const listeners = {};
  let serial = 0;
  const paints = [];
  const context = { fillRect: (...args) => paints.push(args), fillText() {} };
  const canvas = { width: 1280, height: 720, getContext: type => {
    assert.equal(type, '2d'); return context;
  } };
  const document = { hidden: false, getElementById: id => {
    assert.equal(id, 'game'); return canvas;
  }, addEventListener: (type, callback) => { listeners[type] = callback; } };
  const sandbox = vm.createContext({ document,
    requestAnimationFrame: callback => { pending.set(++serial, callback); return serial; },
    cancelAnimationFrame: id => pending.delete(id),
  });
  vm.runInContext(read('main.js'), sandbox);
  return { pending, paints, document, listeners, factory: vm.runInContext('createGameLoop', sandbox),
    tick(time) { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(cb => cb(time)); } };
}

test('頁面載入本機 CSS/JS，宣告 1280×720 畫布且不用外部引擎', () => {
  const html = read('index.html');
  assert.match(html, /<html[^>]*lang="zh-Hant"/);
  assert.match(html, /<canvas[^>]*id="game"[^>]*width="1280"[^>]*height="720"/);
  assert.match(html, /<link[^>]*href="style.css"/);
  assert.match(html, /<script[^>]*src="main.js"[^>]*defer/);
  assert.doesNotMatch(html, /(?:src|href)="(?:https?:)?\/\//);
  const css = read('style.css');
  assert.match(css, /place-items:\s*center/);
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
});

test('瀏覽器初始化會排程 RAF 並實際繪製整張畫布', () => {
  const app = boot();
  assert.equal(app.pending.size, 1);
  app.tick(0);
  assert.ok(app.paints.some(args => args.join(',') === '0,0,1280,720'));
  assert.equal(app.pending.size, 1);
});

function simulate(hz) {
  const app = boot();
  app.pending.clear();
  let elapsed = 0;
  let updates = 0;
  let draws = 0;
  const loop = app.factory({ update: dt => { assert.ok(Math.abs(dt - 1 / 60) < 1e-10); elapsed += dt; updates++; }, draw: () => draws++ });
  loop.start();
  app.tick(0);
  for (let i = 1; i <= hz; i++) app.tick(i * 1000 / hz);
  return { elapsed, updates, draws };
}

test('60/120/144 Hz 在一秒內皆更新 60 次，繪圖上限 60 FPS 加初始畫面', () => {
  for (const hz of [60, 120, 144]) {
    const result = simulate(hz);
    assert.equal(result.updates, 60, `${hz}Hz`);
    assert.ok(Math.abs(result.elapsed - 1) < 1e-10);
    assert.ok(result.draws >= 50 && result.draws <= 61);
  }
});

test('長時間停頓限制補算步數；重複 start 不產生多條迴圈，stop 取消排程', () => {
  const app = boot(); app.pending.clear();
  let updates = 0;
  const loop = app.factory({ update: () => updates++, draw() {} });
  loop.start(); loop.start();
  assert.equal(app.pending.size, 1);
  app.tick(0); app.tick(10000);
  assert.ok(updates > 0 && updates <= 6);
  loop.stop();
  assert.equal(app.pending.size, 0);
  const old = updates;
  loop.start(); app.tick(20000);
  assert.equal(updates, old, '恢復第一幀不能補算背景時間');
});

test('頁籤隱藏停止 RAF，恢復後只保留一條迴圈且不補算背景時間', () => {
  const app = boot(); app.tick(0);
  app.document.hidden = true; app.listeners.visibilitychange();
  assert.equal(app.pending.size, 0);
  app.document.hidden = false; app.listeners.visibilitychange(); app.listeners.visibilitychange();
  assert.equal(app.pending.size, 1);
  app.tick(30000);
  assert.equal(app.pending.size, 1);
});
