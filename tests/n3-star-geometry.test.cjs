const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('正式牆面與放大圖上的星群每格實際旋轉45度且保持任兩星距離',()=>{
 const s=vm.createContext({});vm.runInContext(fs.readFileSync('puzzles.js','utf8'),s);
 function points(n,w,h){const moves=[],ctx=new Proxy({moveTo:(x,y)=>moves.push({x,y:y+4})},{get:(o,k)=>o[k]||(()=>{})});s.PuzzleSystem.drawCelestial(ctx,n,0,0,w,h);return moves.slice(0,5);}
 for(const[w,h]of[[148,52],[480,200]]){const base=points(0,w,h);for(let n=0;n<24;n++){const actual=points(n,w,h),angle=(n%8)*Math.PI/4;for(let i=0;i<5;i++){const dx=base[i].x-w/2,dy=base[i].y-h/2;assert.ok(Math.abs(actual[i].x-(w/2+dx*Math.cos(angle)-dy*Math.sin(angle)))<1e-7);assert.ok(Math.abs(actual[i].y-(h/2+dx*Math.sin(angle)+dy*Math.cos(angle)))<1e-7);for(let j=i+1;j<5;j++)assert.ok(Math.abs(Math.hypot(actual[i].x-actual[j].x,actual[i].y-actual[j].y)-Math.hypot(base[i].x-base[j].x,base[i].y-base[j].y))<1e-7);}}}
});
