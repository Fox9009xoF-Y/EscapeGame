const test = require('node:test');
const assert = require('node:assert/strict');
const { read, digest, requirements } = require('./helpers/requirement-contract.cjs');

test('地圖驗收限定內裝與指定大門，保留幾何及既有操作', () => {
  const text = read('VERIFY.md');
  assert.match(text, /<!-- BEGIN MAP-20261105 -->/);
  for (const phrase of ['只更改內裝和新增逃脫大門', '客廳左上角', '書櫃後方', '三格', '32 像素', '96 像素', '幾何', '既有房間連接', '相機', '先詢問使用者']) assert.ok(text.includes(phrase), phrase);
});

test('正式採用天象與五燈原型參數，保留主動拾取及唯一獎勵', () => {
  const text = read('VERIFY.md').split('<!-- BEGIN PUZZLES-20261105 -->')[1];
  assert.ok(text, '尚未補足正式謎題驗收');
  for (const phrase of ['亮 → 暗', '暗 → 亮', '短 → 中 → 長', '新月 → 右半亮 → 滿月 → 左半亮', '45°', '135°', 'n ≡ 11 (mod 24)', '[true, false, true, false, true]', '32 種', '主動', '中央', '不直接加入背包', '一次']) assert.ok(text.includes(phrase), phrase);
});

test('台詞、抱枕、警報、追捕與回溯驗收包含指定行為和反例', () => {
  const text = read('VERIFY.md');
  for (const phrase of ['纏綿...?該不會是要我和杰哥纏綿吧?', '好暗，得趕快逃出去', '杰哥的抱枕', '臥室床上', '原來傑哥也會觀星啊。', '明明星空很亮，但環境怎麼好像有點陰暗。', '0.6', '216 像素／秒', '不會斜向移動', '牆壁', '警報', '回溯', '鑰匙', '書櫃', 'story2.txt', '不能只輸入', '不重做', '第一次', '不得']) assert.ok(text.includes(phrase), phrase);
});

test('規劃清楚分步，不將文件完成誤報成遊戲完成', () => {
  const plans = read('PLANS.md');
  for (let i = 0; i <= 6; i++) assert.match(plans, new RegExp(`^- \\[[ x]\\] N${i}：`, 'm'));
  for (const phrase of ['N0：', '尚待確認事項', '第二題道具', '彬彬', '阿偉']) assert.ok(plans.includes(phrase), phrase);
});

test('原劇本、版本規格與 AGENTS.md 不因本步規劃修改', () => {
  const preserved = {
    'AGENTS.md':'ca93456ee53f7bd4e69f92b0b848f9d90bfeaac0a61d2ac15e190b03fa7ee2b0',
    'story1.txt':'4c6e8f8849699b3ffcda51c096770ca8c791d546cb47ff1d85cf3eec2bac18f1',
    'story2.txt':'91168d9deb9fcda4c8934951acf84e2331856cd0a6b2be68d06609bb5b622cf1',
    '密室逃脫三道謎題實作規格.md':'c22fbbcdea1c292d2ebcb9ff28ecb771b290da6b640581e7529e8c0f687eaa81',
    '密室逃脫三道謎題實作規格v2.md':'2daf9bb36a278f3104a4353f162f61cd6dd51a4c82e4cee6f76af7f3739b549e',
    '密室逃脫三道謎題實作規格v3.md':'bd4f9e55155e9e78b576316f831336d8a1ee58d30cf55ac257e098b2b9189ae7',
  };
  for (const [file, hash] of Object.entries(preserved)) assert.equal(digest(read(file)), hash, file);
});

test('保護機制拒絕舊條文更動、越界及重複區塊，不只測正例', () => {
  const { stripAuthorized, baselines } = require('./helpers/requirement-contract.cjs');
  const text = read('VERIFY.md');
  assert.notEqual(digest(stripAuthorized(text.replace('解析度：1280x720', '解析度：640x360'))), baselines['VERIFY.md']);
  assert.throws(() => stripAuthorized(text + '\n<!-- BEGIN MAP-20261105 -->\n<!-- END MAP-20261105 -->\n'));
  assert.throws(() => stripAuthorized('<!-- BEGIN MAP-20261105 -->\n未授權位置\n<!-- END MAP-20261105 -->\n' + stripAuthorized(text)));
  assert.ok(requirements(text).includes('- 解析度：1280x720'));
});
