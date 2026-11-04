const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('全畫面指標輸入及新的1.5秒/4句要求被明確記錄',()=>{
 const js=fs.readFileSync('story.js','utf8'),verify=fs.readFileSync('VERIFY.md','utf8');
 assert.match(js,/target\.addEventListener\('pointerdown'/);assert.match(js,/now\+1500/);assert.match(js,/now\+250/);
 assert.match(verify,/任意位置/);assert.match(verify,/達 1\.5 秒鐘後/);assert.match(verify,/1 秒 4 句台詞（即每 250 毫秒跳一句）/);
});
