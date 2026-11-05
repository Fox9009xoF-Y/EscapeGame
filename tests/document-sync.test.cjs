const test = require('node:test');
const assert = require('node:assert/strict');
const { read, digest, stripAuthorized, baselines } = require('./helpers/requirement-contract.cjs');
// 使用者 2026-11-05 明確允許維護文件保護測試。僅接受兩處有界新增，原文仍逐字保護。
for (const file of ['BRIEF.md', 'VERIFY.md']) test(`${file} 保留本輪使用者原文，僅接受授權新增區塊`, () => {
  assert.equal(digest(file === 'VERIFY.md' ? stripAuthorized(read(file)) : read(file)), baselines[file]);
  for (const paragraph of [
    '移動速度：角色基礎移動速度為 360 像素／秒（原 180 像素／秒的兩倍），斜向移動仍須正規化速度。',
    '門外指引：目的房間名稱須標示於門外；箭頭沿門的外法線指向房間外側，與門邊垂直；名稱顯示於箭頭尖端外側，並保持完整可見。',
  ]) assert.equal(read(file).split(paragraph).length, 2);
});
