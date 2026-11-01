const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function target(){const events={};return {hidden:false,addEventListener:(n,cb)=>(events[n]||=[]).push(cb),emit(n,e={}){for(const cb of events[n]||[])cb(e);}};}
function key(code='Space',repeat=false){return {code,repeat,target:{tagName:'BODY'},preventDefault(){this.prevented=true;}};}
function load(){class Image{set src(value){if(this.onload)this.onload();}}const s=vm.createContext({Image,URLSearchParams,location:{search:''}});for(const f of ['maps.js','player.js','interactions.js'])vm.runInContext(fs.readFileSync(f,'utf8'),s);return {s,maps:s.RoomMaps,players:s.PlayerSystem,api:s.InteractionSystem};}
function fixture(){const a=load(),win=target(),doc=target(),input=new a.players.Input(win,doc),player=new a.players.Player();return {...a,win,doc,input,player,session:{player,input},controller:new a.api.Controller(a.maps)};}
function face(p,box,direction,offset=8){p.direction=direction;const cx=box.x+box.width/2,cy=box.y+box.height/2;
  if(direction==='up'){p.x=cx;p.y=box.y+box.height+p.halfHeight+offset;}
  if(direction==='down'){p.x=cx;p.y=box.y-p.halfHeight-offset;}
  if(direction==='left'){p.x=box.x+box.width+p.halfWidth+offset;p.y=cy;}
  if(direction==='right'){p.x=box.x-p.halfWidth-offset;p.y=cy;}
}
test('空白鍵短按不丟失、長按只消費一次、放開才能再觸發，不干擾輸入框',()=>{
 const a=fixture(),press=key();a.win.emit('keydown',press);a.win.emit('keyup',key());assert.equal(press.prevented,true);assert.equal(a.input.consumeInteract(),true);assert.equal(a.input.consumeInteract(),false);
 a.win.emit('keydown',key());assert.equal(a.input.consumeInteract(),true);for(let i=0;i<10;i++)a.win.emit('keydown',key('Space',true));assert.equal(a.input.consumeInteract(),false);
 a.win.emit('keyup',key());a.win.emit('keydown',key());assert.equal(a.input.consumeInteract(),true);
 a.win.emit('keyup',key());const typing=key();typing.target.tagName='INPUT';a.win.emit('keydown',typing);assert.equal(a.input.consumeInteract(),false);assert.equal(typing.prevented,undefined);
});
test('失焦或隱藏清空未處理的互動，避免回到頁面自動觸發',()=>{
 const a=fixture();a.win.emit('keydown',key());a.win.emit('blur');assert.equal(a.input.consumeInteract(),false);
 a.win.emit('keydown',key());a.doc.hidden=true;a.doc.emit('visibilitychange');assert.equal(a.input.consumeInteract(),false);
});
test('四方向前方近距離可調查；背向、遠處與側邊不觸發',()=>{
 const a=fixture(),room=a.maps.currentMap,object=room.objects.find(o=>o.collision===room.obstacles[0]);
 for(const direction of ['up','down','left','right']){face(a.player,object.collision,direction);assert.equal(a.api.findTarget(a.player,room),object);face(a.player,object.collision,direction,48);assert.equal(a.api.findTarget(a.player,room),null);}
 face(a.player,object.collision,'right');a.player.direction='left';assert.equal(a.api.findTarget(a.player,room),null);
 face(a.player,object.collision,'up');a.player.x=object.collision.x-30;assert.equal(a.api.findTarget(a.player,room),null);
});
test('選擇前方最近物件，不穿過非互動障礙調查遠處',()=>{
 const a=fixture(),p=new a.players.Player(100,100);p.direction='right';
 const near={id:'near',title:'近',text:'近',collision:{x:116,y:90,width:4,height:20}},far={id:'far',title:'遠',text:'遠',collision:{x:128,y:90,width:10,height:20}};
 assert.equal(a.api.findTarget(p,{objects:[far,near],obstacles:[near.collision,far.collision]}),near);
 assert.equal(a.api.findTarget(p,{objects:[far],obstacles:[{x:116,y:90,width:4,height:20},far.collision]}),null);
});
test('每次按下只開啟/關閉一次對話；再次調查可重新開啟，無目標不顯示',()=>{
 const a=fixture(),object=a.maps.currentMap.objects[0];face(a.player,object.collision,'up');
 a.win.emit('keydown',key());assert.equal(a.controller.update(a.session),true);assert.equal(a.controller.message.title,object.title);
 for(let i=0;i<10;i++){a.win.emit('keydown',key('Space',true));a.controller.update(a.session);}assert.equal(a.controller.message.title,object.title);
 a.win.emit('keyup',key());a.win.emit('keydown',key());a.controller.update(a.session);assert.equal(a.controller.message,null);
 a.win.emit('keyup',key());a.win.emit('keydown',key());a.controller.update(a.session);assert.equal(a.controller.message.title,object.title);
});
test('切換房間清除舊對話與未消費空白鍵，不調查其他地圖物件',()=>{
 const a=fixture();face(a.player,a.maps.currentMap.objects[0].collision,'up');a.win.emit('keydown',key());a.controller.update(a.session);assert.ok(a.controller.message);
 a.win.emit('keyup',key());a.win.emit('keydown',key());a.maps.setCurrentMap('bedroom');a.controller.update(a.session);assert.equal(a.controller.message,null);assert.equal(a.input.consumeInteract(),false);
});
test('對話框含物件標題、說明與關閉提示，關閉後不繪製',()=>{
 const a=fixture(),object=a.maps.currentMap.objects[0],calls=[],ctx={save(){},restore(){},fillRect(){},fillText:(...args)=>calls.push(args)};
 a.controller.draw(ctx);assert.equal(calls.length,0);face(a.player,object.collision,'up');a.win.emit('keydown',key());a.controller.update(a.session);a.controller.draw(ctx);
 assert.ok(calls.some(c=>c[0]===object.title));assert.ok(calls.some(c=>c[0].includes('空白鍵')));assert.ok(calls.length>=3);
});
test('三房有不同居家傢俱與調查文字，傢俱碰撞和繪圖共用位置且完整位於內牆',()=>{
 const {maps}=load();for(const [i,role]of ['sofa','bed','bookshelf'].entries()){
 const room=maps.maps[i],object=room.objects.find(o=>o.role===role);assert.ok(object);assert.ok(object.title&&object.text);assert.ok(room.obstacles.includes(object.collision));
 const b=object.collision;for(const p of [{x:b.x,y:b.y},{x:b.x+b.width,y:b.y},{x:b.x,y:b.y+b.height},{x:b.x+b.width,y:b.y+b.height}])room.innerVertices.forEach((a,j)=>{const q=room.innerVertices[(j+1)%room.innerVertices.length];assert.ok((q.x-a.x)*(p.y-a.y)-(q.y-a.y)*(p.x-a.x)>=0);});
 }});
test('入口載入互動模組並在繪圖與更新串接',()=>{
 const html=fs.readFileSync('index.html','utf8'),main=fs.readFileSync('main.js','utf8');assert.ok(html.indexOf('src="interactions.js"')>=0&&html.indexOf('src="interactions.js"')<html.indexOf('src="main.js"'));
 assert.match(main,/interactionController\.update\(playerSession\)/);assert.match(main,/interactionController\.draw\(ctx\)/);
});
