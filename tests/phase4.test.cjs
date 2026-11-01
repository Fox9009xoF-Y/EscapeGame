const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function load(){
  const images=[];class Image{set src(value){this.url=value;images.push(this);if(this.onload)this.onload();}}
  const sandbox=vm.createContext({Image,URLSearchParams,location:{search:''}});
  for(const file of ['maps.js','player.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox);
  return {s:sandbox,api:sandbox.PlayerSystem,maps:sandbox.RoomMaps,images};
}
test('四方向對應原正面/專用背面/側面鏡像，行走按固定時間循環，停止保留方向與待機',()=>{
  const {api,maps}=load();
  for(const [direction,x,y]of[['down',0,1],['up',0,-1],['left',-1,0],['right',1,0]]){
    const p=new api.Player(640,300),input={direction:()=>({x,y})};
    p.update(0.13,input,maps.currentMap);
    const frame=p.spriteFrame();
    assert.equal(p.direction,direction);assert.ok(frame.sx>=0&&frame.sy>=0);
    assert.equal(frame.asset,direction==='up'?'hero-back-walk.png':'hero-sprites.png');
    assert.equal(frame.flip,direction==='left');
    const changed=new Set();for(let i=0;i<8;i++){p.update(0.13,input,maps.currentMap);changed.add(p.spriteFrame().sx);}
    assert.ok(changed.size>=2);
    p.update(0,{direction:()=>({x:0,y:0})},maps.currentMap);
    assert.equal(p.direction,direction);assert.equal(p.spriteFrame().sx,direction==='up'?0:16);
    const idle=JSON.stringify(p.spriteFrame());p.update(0.5,{direction:()=>({x:0,y:0})},maps.currentMap);assert.equal(JSON.stringify(p.spriteFrame()),idle);
  }
});
test('Y-Sort 依底部排序，玩家在柱後先畫、在柱前後畫；排序不更動原陣列',()=>{
  const {api}=load(),order=[],items=[{depth:400,draw:()=>order.push('pillar')},{depth:350,draw:()=>order.push('player')}];
  api.drawSorted({},items);assert.deepEqual(order,['player','pillar']);assert.equal(items[0].depth,400);
  order.length=0;items[1].depth=420;api.drawSorted({},items);assert.deepEqual(order,['pillar','player']);
});
test('三房含可排序場景物件並與原碰撞障礙一致，主入口將玩家交給場景排序',()=>{
  const {maps}=load();for(const room of maps.maps){assert.ok(room.objects.length>0);assert.ok(room.objects.some(o=>o.collision===room.obstacles[0]));}
  assert.match(fs.readFileSync('main.js','utf8'),/RoomMaps\.draw\(ctx,\s*playerSession/);
});
test('角色風格已寫入授權位置且正面/背面區分明確',()=>{
  const verify=fs.readFileSync('VERIFY.md','utf8');assert.match(verify,/角色風格：使用專案內 Old hero.png；正面行走保留原圖影格，僅背面行走/);
  assert.match(fs.readFileSync('BRIEF.md','utf8'),/Old hero.png/);
});
