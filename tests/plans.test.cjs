const test = require('node:test');
const assert = require('node:assert/strict');
const { read, digest, stripAuthorized, baselines, requirements } = require('./helpers/requirement-contract.cjs');
test('VERIFY.md 保持本輪使用者原始內容，授權範圍以外不可變動', () => {
  assert.equal(digest(stripAuthorized(read('VERIFY.md'))), baselines['VERIFY.md']);
});
test('每條現行驗收要求都有獨立規劃、階段、自動與實機驗證方式', () => {
  const items = requirements(read('VERIFY.md'));
  assert.ok(items.length >= 45, '不可刪減本輪已有的驗收要求');
  const plans = read('PLANS.md');
  const sections = [...plans.matchAll(/^### R(\d{3})\n([\s\S]*?)(?=^### R\d{3}\n|^## |$(?![\s\S]))/gm)];
  assert.equal(sections.length, items.length, '逐條對照不得缺漏或多列');
  items.forEach((line, index) => {
    const section = sections[index];
    assert.equal(section[1], String(index + 1).padStart(3, '0'));
    assert.ok(section[2].startsWith(`${line}\n`), `R${section[1]} 須保留原文`);
    for (const key of ['對應：', '自動驗證：', '實機驗證：', '狀態：']) assert.match(section[2], new RegExp(`^${key}.+`, 'm'));
    assert.doesNotMatch(section[2], /狀態：.*(?:全部通過|實機通過)/, '規劃不能冒充功能驗收');
  });
});
test('保留六個開發階段、一次一步與原有執行流程', () => {
  const plans = read('PLANS.md');
  for (let phase = 1; phase <= 6; phase++) assert.match(plans, new RegExp(`^- \\[[ x]\\] Phase ${phase}：`, 'm'));
  for (const required of ['先紅燈', 'commit', '實機', 'TEST.md', '一次只做一步', 'node --test tests/*.test.cjs', 'python -m http.server 8000', '角色 Sprite']) assert.ok(plans.includes(required));
});
