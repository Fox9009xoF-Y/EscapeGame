const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function load(){const s=vm.createContext({Image:class{},URLSearchParams,location:{search:''}});for(const f of['maps.js','puzzles.js'])vm.runInContext(fs.readFileSync(f,'utf8'),s);return s;}
test('纏繞只給接近答案的提示，不設定完成或觸發追捕',()=>{const g=new(load().PuzzleSystem.Game)();assert.equal(g.solveWord('纏繞'),false);assert.equal(g.state.wordSolved,false);assert.equal(g.state.phase,'explore');assert.equal(g.solveWord('纏綿'),true);});
test('房形紙包含四個連接門口與客廳逃脫大門，共五個紅標位置',()=>{const s=load();assert.deepEqual(Array.from(s.RoomMaps.maps,r=>s.PuzzleSystem.paperDoors(r).length),[2,2,1]);});
test('藏書房恰有兩座書櫃放杰哥的A書，且不改門與碰撞',()=>{const r=load().RoomMaps.maps.find(r=>r.id==='library');const shelves=r.objects.filter(o=>o.role==='bookshelf'&&o.text.includes('杰哥的A書'));assert.equal(shelves.length,2);assert.ok(shelves.every(o=>o.solid));assert.equal(r.portals.length,1);});
