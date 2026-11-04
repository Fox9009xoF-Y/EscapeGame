'use strict';

// 更新固定為 60 次/秒；繪製亦限制為每秒最多 60 次。
function createGameLoop({ update, draw }) {
  const step = 1 / 60;
  const epsilon = 1e-10;
  let running = false;
  let frameId = null;
  let previous = null;
  let accumulator = 0;

  function frame(timestamp) {
    if (!running) return;
    if (previous === null) {
      previous = timestamp;
      draw();
    } else {
      // 長時間停頓最多補算 0.1 秒，避免恢復時大量更新。
      accumulator += Math.min(Math.max((timestamp - previous) / 1000, 0), 0.1);
      previous = timestamp;
      let updated = false;
      while (accumulator + epsilon >= step) {
        update(step);
        accumulator = Math.max(0, accumulator - step);
        updated = true;
      }
      if (updated) draw();
    }
    if (running) frameId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      previous = null;
      accumulator = 0;
      frameId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      previous = null;
      accumulator = 0;
    },
  };
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const playerSession = typeof PlayerSystem !== 'undefined' && typeof RoomMaps !== 'undefined'
  ? PlayerSystem.createSession(globalThis, document, RoomMaps.currentMap) : null;
const portalController = playerSession && typeof PortalSystem !== 'undefined' ? new PortalSystem.Controller(RoomMaps) : null;
const interactionController = playerSession && typeof InteractionSystem !== 'undefined' ? new InteractionSystem.Controller(RoomMaps) : null;

function clearGameInput() {
  if (!playerSession) return;
  playerSession.input.keys.clear();
  playerSession.input.spaceDown = false;
  playerSession.input.interactQueued = false;
}
const storyController = typeof StorySystem !== 'undefined' ? StorySystem.mount({
  document, target: globalThis, clearInput: clearGameInput,
  preview: ['living', 'bedroom', 'library'].includes(new URLSearchParams(location.search).get('room')),
  onPuzzle() {
    RoomMaps.setCurrentMap('living');
    playerSession.setRoom(RoomMaps.currentMap);
    playerSession.player.x = 640; playerSession.player.y = 360;
    playerSession.player.moving = false;
    if (interactionController) interactionController.message = null;
    clearGameInput();
  },
}) : null;

// ?room= 保留純場景預覽，完整遊戲從預設首頁開始。
const gameController = typeof PuzzleSystem !== 'undefined' && !['living','bedroom','library'].includes(new URLSearchParams(location.search).get('room'))
  ? PuzzleSystem.mount({document, target:globalThis, maps:RoomMaps, session:playerSession, portals:portalController, clearInput:clearGameInput,
      onExit:()=>storyController.completeEscape(true)}) : null;
if (gameController && interactionController) interactionController.onInteract = object => gameController.interact(object);

function update(deltaSeconds) {
  if (storyController && storyController.mode !== 'puzzle') {
    storyController.tick(performance.now());
    clearGameInput();
    return;
  }
  if (gameController) {
    gameController.setVisible(true);
    if (gameController.blocking) { clearGameInput(); gameController.update(deltaSeconds); return; }
  }
  if (playerSession) { playerSession.setRoom(RoomMaps.currentMap); playerSession.update(deltaSeconds); }
  if (portalController) portalController.update(playerSession);
  if (interactionController) interactionController.update(playerSession);
  if (gameController) gameController.update(deltaSeconds);
}

function draw() {
  ctx.fillStyle = '#171b20';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (storyController && storyController.mode !== 'puzzle') { if (gameController) gameController.setVisible(false); return; }
  if (typeof RoomMaps !== 'undefined') {
    RoomMaps.draw(ctx, playerSession ? [playerSession.player, ...(gameController ? gameController.entities : [])] : []);
    if (typeof DoorLabels !== 'undefined') DoorLabels.render(document.getElementById('door-labels'), RoomMaps.currentMap);
    if (gameController) gameController.draw(ctx);
    if (interactionController) interactionController.draw(ctx);
    return;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e0dfd7';
  ctx.font = '32px sans-serif';
  ctx.fillText('Escape Game', canvas.width / 2, canvas.height / 2 - 24);
  ctx.fillStyle = '#a1a69f';
  ctx.font = '18px sans-serif';
  ctx.fillText('遊戲初始化完成', canvas.width / 2, canvas.height / 2 + 24);
}

const gameLoop = createGameLoop({ update, draw });
// 首次 RAF 可能稍晚執行，先填滿畫布以免短暫顯示透明空白。
draw();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) gameLoop.stop();
  else gameLoop.start();
});
if (!document.hidden) gameLoop.start();
