const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('杰哥從臥室經原房門追到客廳並抓到停留玩家，途中每步無穿模',()=>{
 const s=vm.createContext({Image:class{},URLSearchParams,location:{search:''}});for(const f of['maps.js','player.js','chase.js'])vm.runInContext(fs.readFileSync(f,'utf8'),s);
 const room=s.RoomMaps.maps[1],start=s.ChaseSystem.spawn(room,{x:796,y:332}),npc=new s.ChaseSystem.Pursuit({maps:s.RoomMaps,start:{room:'bedroom',...start}});npc.delay=0;let caught=false;
 for(let i=0;i<2400&&!caught;i++){caught=npc.update(1/60,{x:640,y:300,halfWidth:8,halfHeight:6},'living');const map=s.RoomMaps.maps.find(r=>r.id===npc.room);assert.equal(s.ChaseSystem.valid(map,npc.actor),true);}
 assert.equal(npc.room,'living');assert.equal(caught,true);
});
