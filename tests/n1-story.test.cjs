'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = f => fs.readFileSync(f, 'utf8');
function api() { const s = vm.createContext({}); vm.runInContext(read('story.js'), s); return s.StorySystem; }
const plain = v => JSON.parse(JSON.stringify(v));
const opening = () => read('story1.txt');
const ending = () => read('story2.txt');
const fetcher = async path => ({ ok: true, text: async () => path === 'story1.txt' ? opening() : ending() });
async function ready(options) { const a = api(), c = new a.Controller(options); await c.load(fetcher); return { a, c }; }

test('外部劇本逐行解析，五章開場及第六章結尾的原文不丟句', () => {
  const a = api();
  for (const [text,count] of [[opening(),5],[ending(),1]]) {
    const chapters = a.parse(text);
    assert.equal(chapters.length,count);
    const originals = text.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!/^第.+章/.test(x));
    assert.deepEqual(plain(chapters.flatMap(x=>x.lines.map(l=>l.raw))), originals);
  }
  assert.equal(a.parse(ending())[0].id,6);
  assert.throws(()=>a.parse('沒有章節的劇本'), /章節/);
  assert.throws(()=>a.parse('第一章 空白章節'), /對話/);
});

test('角色別名、手機錄音、多人說話與旁白正確辨識', () => {
  const a=api(), chapters=a.parse(opening());
  assert.deepEqual(plain(chapters[0].characters), ['阿偉','彬彬','杰哥']);
  assert.deepEqual(plain(chapters[2].characters), ['阿偉','杰哥']);
  assert.deepEqual(plain(chapters[4].characters), ['阿偉','彬彬']);
  assert.deepEqual(plain(chapters[0].lines.find(l=>l.speaker==='阿偉彬彬').actors), ['阿偉','彬彬']);
  assert.deepEqual(plain(chapters[0].lines.find(l=>l.speaker==='光頭男子').actors), ['杰哥']);
  assert.deepEqual(plain(chapters[4].lines.find(l=>l.speaker==='手機錄音').actors), ['彬彬']);
  assert.equal(chapters[0].lines[0].speaker,'');
  const last=a.parse(ending())[0];
  assert.deepEqual(plain(last.characters),['阿偉','阿偉阿嬤','淑惠阿姨']);
});

test('六章背景與立繪來源為現有外部檔案，不讀網路素材', () => {
  const a=api(), chapters=[...a.parse(opening()),...a.parse(ending())];
  assert.deepEqual(plain(chapters.map(c=>c.background)),['網咖.png','超商.png','杰哥客廳.png','杰哥房間.png','杰哥客廳.png','公園.png']);
  for(const chapter of chapters) for(const actor of chapter.characters) assert.ok(fs.existsSync(a.portraits[actor]), actor);
});

test('每次載入重讀兩份外部文本、不快取舊台詞；失敗可重新載入', async () => {
  const a=api(), c=new a.Controller(), calls=[];
  await c.load(async (path,options)=>{calls.push({path,options});return {ok:true,text:async()=>path==='story1.txt'?'第一章 修改\n阿偉：新台詞':ending()};});
  assert.equal(c.snapshot().text,'新台詞');
  assert.deepEqual(calls.map(x=>x.path).sort(),['story1.txt','story2.txt']);
  assert.ok(calls.every(x=>x.options.cache==='no-store'));
  await c.load(async()=>({ok:false,status:404})); assert.equal(c.mode,'error'); assert.ok(c.snapshot().text.includes('載入'));
  await c.load(fetcher); assert.equal(c.mode,'opening');
});

test('較舊的非同步載入結果不得覆寫較新的載入', async () => {
  const a=api(), c=new a.Controller(); let resolve;
  const slow=new Promise(r=>resolve=r);
  const first=c.load(async()=>{await slow;return {ok:true,text:async()=> '第一章 舊\n阿偉：過期'};});
  await c.load(fetcher); resolve(); await first;
  assert.equal(c.snapshot().chapter,'第一章 杰難之地');
});

test('點擊/空白一次一句，重複按鍵與快速連點不跳過多句', async () => {
  const {c}=await ready();
  const first=c.snapshot().text;
  c.press('keyboard',0); assert.notEqual(c.snapshot().text,first);
  const next=c.snapshot().text;
  c.press('keyboard',40,true); c.press('pointer',60); assert.equal(c.snapshot().text,next);
  c.release('keyboard'); c.press('pointer',80); assert.equal(c.snapshot().text,next);
  c.release('pointer'); c.press('keyboard',200); assert.notEqual(c.snapshot().text,next);
});

test('按住三秒開始每500毫秒一句，鬆開任何輸入立即停止且不補算', async () => {
  const {c}=await ready(); c.press('keyboard',0); const initial=c.snapshot().text;
  c.tick(2999); assert.equal(c.snapshot().text,initial);
  c.tick(3000); const fast=c.snapshot().text; assert.notEqual(fast,initial);
  c.tick(3499); assert.equal(c.snapshot().text,fast);
  c.tick(3500); assert.notEqual(c.snapshot().text,fast);
  c.release('pointer'); const stopped=c.snapshot().text; c.tick(9000); assert.equal(c.snapshot().text,stopped);
  c.press('pointer',10000); const mouse=c.snapshot().text; c.tick(12999); assert.equal(c.snapshot().text,mouse);
  c.tick(13000); assert.notEqual(c.snapshot().text,mouse);
  c.cancelHold(); const blurred=c.snapshot().text; c.tick(30000); assert.equal(c.snapshot().text,blurred);
});

test('暫停停止推進與長按，恢復後等待新輸入', async () => {
  const {c}=await ready(); c.press('pointer',0); c.setPaused(true); const text=c.snapshot().text;
  c.tick(4000); c.press('keyboard',4500); assert.equal(c.snapshot().text,text);
  c.setPaused(false); c.tick(8000); assert.equal(c.snapshot().text,text);
  c.release(); c.press('keyboard',8500); assert.notEqual(c.snapshot().text,text);
});

test('換句只讓說話者跳動，換章替換人物集合並保持章節名', async () => {
  const {c}=await ready(); let now=0;
  assert.deepEqual(plain(c.snapshot().speaking),[]);
  c.advance(now+=200); assert.deepEqual(plain(c.snapshot().speaking),['阿偉']);
  while(c.snapshot().chapterId!==3) c.advance(now+=200);
  assert.deepEqual(plain(c.snapshot().characters),['阿偉','杰哥']);
  assert.equal(c.snapshot().background,'杰哥客廳.png');
});

test('開場完只進客廳一次，清空劇情人物背景與按鍵，不提前播放結尾', async () => {
  let maps=0; const {c}=await ready({onPuzzle:()=>maps++}); let now=0;
  assert.equal(c.completeEscape(false),false); assert.equal(c.completeEscape(true),false);
  while(c.mode==='opening') c.advance(now+=200);
  assert.equal(c.mode,'puzzle'); assert.equal(maps,1);
  assert.deepEqual(plain(c.snapshot().characters),[]); assert.equal(c.snapshot().background,null);
  c.tick(100000); c.advance(100200); assert.equal(c.mode,'puzzle'); assert.equal(maps,1);
  assert.equal(c.completeEscape(false),false);
});

test('只有確認逃脫才切結尾，結尾完清場並顯示結束，不重複回呼', async () => {
  let finished=0; const {c}=await ready({onFinished:()=>finished++});let now=0;
  while(c.mode==='opening') c.advance(now+=200);
  assert.equal(c.completeEscape(true),true); assert.equal(c.mode,'ending');
  assert.equal(c.snapshot().chapterId,6); assert.equal(c.completeEscape(true),false);
  while(c.mode==='ending') c.advance(now+=200);
  assert.equal(c.mode,'finished'); assert.equal(finished,1);
  assert.equal(c.snapshot().background,null); assert.deepEqual(plain(c.snapshot().characters),[]);
  c.advance(now+=200); assert.equal(finished,1);
});

test('入口載入獨立劇情模組、下方對話及暫停控制，保留原地圖腳本', () => {
  const html=read('index.html');
  assert.ok(html.indexOf('src="story.js"')>=0&&html.indexOf('src="story.js"')<html.indexOf('src="main.js"'));
  for(const id of ['story-layer','story-background','story-cast','story-dialogue','story-chapter','story-speaker','story-text','story-pause','story-status']) assert.ok(html.includes(`id="${id}"`),id);
  assert.match(read('main.js'),/StorySystem\.mount/);
  assert.match(read('main.js'),/storyController\.mode/);
});
