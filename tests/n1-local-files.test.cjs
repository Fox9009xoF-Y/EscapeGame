const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot(){const c=vm.createContext({});vm.runInContext(fs.readFileSync('story.js','utf8'),c);return c.StorySystem;}
const file=(name,text)=>({name,text:async()=>text});
test('本機選檔讀取兩份最新劇本，順序無關且不呼叫網路',async()=>{
 const a=boot(),c=new a.Controller();
 await c.loadFiles([file('story2.txt','第六章 結尾\n阿偉：本機結尾'),file('story1.txt','第一章 開始\n阿偉：本機新版')]);
 assert.equal(c.mode,'opening');assert.equal(c.snapshot().text,'本機新版');
 c.advance(0);assert.equal(c.mode,'puzzle');assert.equal(c.completeEscape(true),true);assert.equal(c.snapshot().text,'本機結尾');
 await c.loadFiles([file('story1.txt','第一章 修改\n阿偉：已更新'),file('story2.txt','第六章 結尾\n全劇終')]);assert.equal(c.snapshot().text,'已更新');
});
test('缺檔、同名重複或檔案讀取失敗需回饋錯誤，可重新選取修復',async()=>{
 const a=boot(),c=new a.Controller();
 for(const files of [[],[file('story1.txt','第一章 開始\n阿偉：測試')],[file('story1.txt',''),file('story1.txt',''),file('story2.txt','')],[{name:'story1.txt',text:async()=>{throw Error('讀取失敗');}},file('story2.txt','第六章 結尾\n全劇終')]]){
  await c.loadFiles(files);assert.equal(c.mode,'error');assert.match(c.snapshot().text,/載入失敗/);
 }
 await c.loadFiles([file('story1.txt','第一章 開始\n阿偉：恢復'),file('story2.txt','第六章 結尾\n全劇終')]);assert.equal(c.mode,'opening');
});
test('正式入口以內建劇本開始，不提供選檔或呼叫文字fetch',()=>{const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('story.js','utf8');assert.doesNotMatch(html,/type="file"/);assert.match(html,/id="game-start"/);assert.match(js,/else controller.loadEmbedded\(\)/);assert.doesNotMatch(js,/target.fetch/);});
