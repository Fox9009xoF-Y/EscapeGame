const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('VERIFY.md 保持使用者原始內容', () => {
  // 只剝除使用者明確授權新增的段落；其他內容仍須逐位元符合原驗收檔。
  const authorized = '角色風格：使用專案內 Old hero.png；正面行走保留原圖影格，僅背面行走以角色膚色覆蓋正面影格的臉部；左右使用原圖側面影格與鏡像。\r\n\r\n';
  const content = read('VERIFY.md');
  assert.ok(content.split(authorized).length <= 2);
  let preserved = content.replace(authorized, '');
  for (const paragraph of [
    '移動速度：角色基礎移動速度為 360 像素／秒（原 180 像素／秒的兩倍），斜向移動仍須正規化速度。',
    '門外指引：目的房間名稱須標示於門外；箭頭沿門的外法線指向房間外側，與門邊垂直；名稱顯示於箭頭尖端外側，並保持完整可見。',
  ]) {
    const addition = paragraph + '\r\n\r\n';
    assert.ok(preserved.split(addition).length <= 2);
    preserved = preserved.replace(addition, '');
  }
  const hash = crypto.createHash('sha256').update(preserved).digest('hex');
  assert.equal(hash, 'd2b70a2891088799a9000645d33d5fe74e5e4d8e44ab0bed26e52d3642d448dc');
});

test('每條驗收要求都有獨立規劃、階段與驗證方式', () => {
  const requirements = read('VERIFY.md').split(/\r?\n/).filter(line => /^(?:[12]\. |\- )/.test(line));
  assert.equal(requirements.length, 21);
  const plans = read('PLANS.md');
  requirements.forEach((line, index) => {
    const id = `V${String(index + 1).padStart(2, '0')}`;
    assert.ok(plans.includes(`### ${id}\n${line}`), `${id} 缺少原文要求`);
    const section = plans.split(`### ${id}\n`)[1]?.split('\n### ')[0] || '';
    assert.match(section, /對應：Phase [1-6]/, `${id} 缺少階段`);
    assert.match(section, /驗證：.+/, `${id} 缺少驗證方法`);
  });
});

test('包含六個開發階段（允許完成後勾選）與必要執行流程', () => {
  const plans = read('PLANS.md');
  for (let phase = 1; phase <= 6; phase++) assert.match(plans, new RegExp(`^- \\[[ x]\\] Phase ${phase}：`, 'm'));
  for (const required of ['先紅燈', 'commit', '實機', 'TEST.md', '一次只做一步', 'node --test tests/*.test.cjs', 'python -m http.server 8000', '角色 Sprite']) {
    assert.ok(plans.includes(required), `缺少 ${required}`);
  }
});
