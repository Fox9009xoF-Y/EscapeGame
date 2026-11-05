const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('全畫面指標輸入及新的1.5秒/4句要求被明確記錄',()=>{
 const js=fs.readFileSync('story.js','utf8'),verify=fs.readFileSync('GAMEREPORT.md','utf8');
 assert.match(js,/target\.addEventListener\('pointerdown'/);assert.match(js,/now\+1500/);assert.match(js,/now\+250/);
 assert.match(verify,/全畫面左鍵推進/);assert.match(verify,/長按1\.5秒開始/);assert.match(verify,/每秒4句（250ms）/);
});
