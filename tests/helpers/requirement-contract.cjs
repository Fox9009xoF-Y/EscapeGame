const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const read = name => fs.readFileSync(path.resolve(__dirname, '../..', name), 'utf8').replace(/\r\n/g, '\n');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const baselines = {
  'BRIEF.md': '1e6ff30c495dc258f2d684abe065e6634653d4829f1ce64eca0204b0233c97e7',
  'VERIFY.md': 'c56e2d38488b14707d6370af8dc9badb8232288245b22b86d221c17b51ab3d45',
};
function stripAuthorized(text) {
  for (const name of ['MAP-20261105', 'PUZZLES-20261105']) {
    const start = `<!-- BEGIN ${name} -->\n`, end = `<!-- END ${name} -->\n`;
    const count = text.split(start).length - 1;
    assert.ok(count <= 1, `不可重複授權區塊 ${name}`);
    assert.equal(text.split(end).length - 1, count, '起訖標記必須成對');
    if (count) {
      const begin = text.indexOf(start), finish = text.indexOf(end, begin);
      assert.ok(finish > begin, '起訖順序錯誤');
      const prefix = text.slice(0, begin);
      assert.ok(name.startsWith('MAP') ? prefix.endsWith('### 1. 地圖建構\n') : prefix.endsWith('## 謎題設計\n'), '新增區塊只可位於授權章節');
      text = prefix + text.slice(finish + end.length);
    }
  }
  return text;
}
function requirements(text) {
  return text.split('\n').filter(line => /^(?:\d+\. |\- |門外指引：|移動速度：|角色風格：)/.test(line));
}
module.exports = { read, digest, stripAuthorized, baselines, requirements };
