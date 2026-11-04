const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function load(){const s=vm.createContext({Image:class{},URLSearchParams,location:{search:''}});for(const f of ['maps.js','player.js','interactions.js'])vm.runInContext(fs.readFileSync(f,'utf8'),s);return s;}
function rect(o){return o.visualBounds||o.collision;}
test('臥室油燈各對應一個角落，保留入口起順時針L0至L4',()=>{
 const r=load().RoomMaps.maps[1],lamps=r.objects.filter(o=>o.role==='oil-lamp'),corners=new Set();assert.equal(lamps.length,5);
 for(const l of lamps){const b=rect(l),p={x:b.x+b.width/2,y:b.y+b.height/2};const distances=r.innerVertices.map(v=>Math.hypot(v.x-p.x,v.y-p.y)),i=distances.indexOf(Math.min(...distances));assert.ok(distances[i]<=52,'油燈需貼近角落');corners.add(i);assert.equal(l.cornerIndex,i);}
 assert.equal(corners.size,5);assert.deepEqual(Array.from(lamps,o=>o.cornerIndex),[3,4,0,1,2]);
});
test('每房有牆上獨立開關，客廳開關在往臥室門旁',()=>{
 const maps=load().RoomMaps.maps;
 for(const r of maps){const switches=r.objects.filter(o=>o.role==='light-switch');assert.equal(switches.length,1);const o=switches[0],b=rect(o),p={x:b.x+b.width/2,y:b.y+b.height/2};assert.equal(o.wallMounted,true);const e=r.edges[o.wallIndex],l=Math.hypot(e.end.x-e.start.x,e.end.y-e.start.y);const d=((e.end.x-e.start.x)*(p.y-e.start.y)-(e.end.y-e.start.y)*(p.x-e.start.x))/l;assert.ok(d>=0&&d<=24,'開關繪在牆帶內');if(r.id==='living'){const door=r.portals.find(d=>d.target==='bedroom');assert.equal(o.wallIndex,door.edgeIndex);assert.ok(Math.hypot(p.x-door.center.x,p.y-door.center.y)<85);}}
});
test('客廳出口書櫃為三連櫃，下半部有書櫃/矮桌，隔牆封至下牆',()=>{
 const r=load().RoomMaps.maps[0],cover=r.objects.find(o=>o.role==='exit-bookshelf');assert.equal(cover.modules,3);
 assert.ok(r.objects.some(o=>o.role==='bookshelf'&&rect(o).y>360));assert.ok(r.objects.some(o=>o.role==='low-table'&&rect(o).y>360));
 const wall=r.objects.find(o=>o.role==='pillar'),b=wall.collision;assert.equal(b.x,704);assert.equal(b.y,352);assert.ok(Math.abs(b.y+b.height-Math.max(...r.innerVertices.map(v=>v.y)))<1e-6);
});
test('藏書房六面牆各有書櫃，中央無隔牆且至少兩盞油燈',()=>{
 const r=load().RoomMaps.maps[2];assert.ok(r.objects.filter(o=>o.role==='oil-lamp').length>=2);
 for(let i=0;i<6;i++)assert.ok(r.objects.some(o=>o.role==='bookshelf'&&o.wallIndex===i&&o.wallMounted),`第${i}牆缺書櫃`);
 assert.ok(!r.objects.some(o=>o.role==='pillar'));
 assert.ok(!r.obstacles.some(b=>b.x<688&&b.x+b.width>592&&b.y<408&&b.y+b.height>312),'中央96×96保持可走');
});
test('臥室隔牆與地毯交換，牆視覺高度兩倍，右床及床邊桌/下方書櫃配置完整',()=>{
 const r=load().RoomMaps.maps[1],wall=r.objects.find(o=>o.role==='pillar'),b=rect(wall),bed=r.objects.find(o=>o.role==='bed'),rug=r.carpet;
 assert.equal(b.x,540);assert.equal(b.y,322);assert.equal(b.height,192);
 assert.equal(rug.anchor.x,704);assert.equal(rug.anchor.y,304);
 const bb=rect(bed);assert.ok(bb.x>640);assert.ok(rug.x<=bb.x&&rug.y<=bb.y&&rug.x+rug.width>=bb.x+bb.width&&rug.y+rug.height>=bb.y+bb.height,'地毯延伸到床底');
 assert.ok(r.objects.some(o=>o.role==='bookshelf'&&rect(o).y>480));
 assert.ok(r.objects.some(o=>o.role==='low-table'&&Math.hypot(rect(o).x-bb.x,rect(o).y-bb.y)<150));
});
