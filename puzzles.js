'use strict';
globalThis.PuzzleSystem=(()=>{
 const roomIds=['living','bedroom','library'];
 function stateAt(n){n=((n%24)+24)%24;return {sun:n%3,moon:n%4,angle:(n%8)*Math.PI/4,target:n===11};}
 class Game{
  constructor(){this.state={phase:'explore',lights:{living:true,bedroom:true,library:true},cycle:0,sunTaken:false,wallSeen:false,inventory:[],lampOn:[false,false,false,false,false],lampsSolved:false,rewardSpawned:false,rewardCollected:false,ambientLamps:{}};}
  toggleLight(room){if(!roomIds.includes(room)||this.state.phase!=='explore')return false;const s=this.state;s.lights[room]=!s.lights[room];if(room==='living'&&s.lights[room])s.cycle=(s.cycle+1)%24;return true;}
  visitWall(){const first=!this.state.wallSeen;this.state.wallSeen=true;return first?'原來傑哥也會觀星啊。':'';}
  touchSun(){const s=this.state;if(s.sunTaken||!stateAt(s.cycle).target)return false;s.sunTaken=true;s.inventory.push('sun_key');return true;}
  toggleLamp(index){const s=this.state;if(s.phase!=='explore'||!Number.isInteger(index)||index<0||index>=5)return false;s.lampOn[index]=!s.lampOn[index];if(s.lampOn.every((on,i)=>on===[true,false,true,false,true][i])){s.lampsSolved=true;s.rewardSpawned=true;}return true;}
  collectBookmark(){const s=this.state;if(!s.rewardSpawned||s.rewardCollected)return false;s.rewardCollected=true;s.inventory.push('knot_bookmark');return true;}
 }
 function drawCelestial(ctx,n,x,y,w,h,taken=false){
  const s=stateAt(n),cx=x+w*.5,cy=y+h*.5,r=Math.min(w,h)*.10;
  ctx.save();ctx.fillStyle='#8a6c44';ctx.fillRect(x,y,w,h);ctx.fillStyle='#101b30';ctx.fillRect(x+3,y+3,w-6,h-6);
  for(const [a,f]of[[0,1],[.75,.8],[2.2,.95],[4.1,.88],[5.2,.7]]){
   const t=a+s.angle,sx=cx+Math.cos(t)*w*.42*f,sy=cy+Math.sin(t)*h*.37*f;
   ctx.fillStyle='#e0ddbd';ctx.beginPath();for(let i=0;i<8;i++){const rad=i%2?2:4,angle=i*Math.PI/4-Math.PI/2;const px=sx+Math.cos(angle)*rad,py=sy+Math.sin(angle)*rad;if(!i)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();
  }
  if(!taken){ctx.strokeStyle='#e4bc61';ctx.lineWidth=Math.max(1,r*.18);for(let i=0;i<8;i++){const a=i*Math.PI/4,length=r*(.5+s.sun*.5);ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(r+2),cy+Math.sin(a)*(r+2));ctx.lineTo(cx+Math.cos(a)*(r+2+length),cy+Math.sin(a)*(r+2+length));ctx.stroke();}ctx.fillStyle='#e4bc61';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();}
  else{ctx.strokeStyle='#5b6574';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
  const mx=x+w*.77,my=cy,mr=r*.95;ctx.save();ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.clip();ctx.fillStyle='#222d45';ctx.fillRect(mx-mr,my-mr,2*mr,2*mr);ctx.fillStyle='#e4dfbf';if(s.moon===1)ctx.fillRect(mx,my-mr,mr,2*mr);if(s.moon===2)ctx.fillRect(mx-mr,my-mr,2*mr,2*mr);if(s.moon===3)ctx.fillRect(mx-mr,my-mr,mr,2*mr);ctx.restore();ctx.strokeStyle='#a6acc0';ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 class Controller{
  constructor(options){Object.assign(this,options);this.game=new Game();this.modal=null;this.visible=false;this.hints=0;this.toastUntil=0;const d=this.document;this.layer=d.getElementById('puzzle-layer');this.panel=d.getElementById('puzzle-modal');this.title=d.getElementById('puzzle-title');this.body=d.getElementById('puzzle-content');this.inventory=d.getElementById('puzzle-inventory');this.notice=d.getElementById('puzzle-notice');d.getElementById('puzzle-close').onclick=()=>this.close();d.getElementById('puzzle-hint').onclick=()=>this.hint();this.target.addEventListener('keydown',e=>{if(e.code==='Escape'&&this.visible&&this.modal){e.preventDefault();this.close();}});}
  get blocking(){return !!this.modal;}
  element(tag,text){const el=this.document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
  button(label,action){const b=this.element('button',label);b.type='button';b.onclick=action;this.body.append(b);return b;}
  show(title,text,kind='text'){this.modal={kind,title,text};this.panel.hidden=false;this.title.textContent=title;this.body.replaceChildren();if(text)this.body.append(this.element('p',text));this.clearInput();}
  close(){this.modal=null;this.panel.hidden=true;this.clearInput();}
  toast(text){this.notice.textContent=text;this.toastUntil=this.target.performance.now()+3000;this.refresh();}
  refresh(){const names={sun_key:'太陽鑰匙',knot_bookmark:'繩結書籤'};this.inventory.textContent='道具：'+(this.game.state.inventory.map(id=>names[id]||id).join('、')||'無');if(this.game.state.rewardCollected){const b=this.element('button','看書籤');b.type='button';b.onclick=()=>this.bookmark();this.inventory.append(b);}}
  setVisible(visible){if(this.visible===visible)return;this.visible=visible;this.layer.hidden=!visible;if(!visible)this.close();else this.refresh();}
  celestialPanel(target=false,quote=''){
   this.show(target?'地毯下的天象圖':'天象牆',target?'明明星空很亮，但環境怎麼好像有點陰暗。':quote?("彬彬：「"+quote+'」'):'牆上有太陽、月亮與星群。',target?'target':'celestial');
   const canvas=this.element('canvas');canvas.width=480;canvas.height=200;canvas.setAttribute('aria-label',target?'目標天象圖':'目前牆上天象');this.body.append(canvas);drawCelestial(canvas.getContext('2d'),target?11:this.game.state.cycle,0,0,480,200,!target&&this.game.state.sunTaken);
   if(!target)this.button('觸碰太陽',()=>{const taken=this.game.touchSun();this.celestialPanel(false);this.body.append(this.element('p',taken?'太陽鬆開了，取下的是一把光芒形狀的鑰匙。':this.game.state.sunTaken?'太陽鑰匙已經收好了。':'太陽還卡在牆上，天象似乎尚未相合。'));this.refresh();});
  }
  interact(object){
   if(object.role==='light-switch'){this.game.toggleLight(this.maps.currentMap.id);this.toast(this.game.state.lights[this.maps.currentMap.id]?'電燈亮了。':'電燈熄滅了。');return true;}
   if(object.id==='living-celestial'){this.celestialPanel(false,this.game.visitWall());return true;}
   if(object.id==='living-carpet-clue'){this.celestialPanel(true);return true;}
   if(object.id==='living-desk'){this.roomPaper();return true;}
   if(object.role==='oil-lamp'){
    if(this.maps.currentMap.id==='bedroom'){const was=this.game.state.lampsSolved;this.game.toggleLamp(object.lampIndex);this.toast(!was&&this.game.state.lampsSolved?'遠處傳來機關移動的聲音。藏書房中央似乎有了變化。':this.game.state.lampOn[object.lampIndex]?'油燈點亮了。':'油燈熄滅了。');}
    else{const s=this.game.state;s.ambientLamps[object.id]=!(s.ambientLamps[object.id]??true);this.toast(s.ambientLamps[object.id]?'油燈點亮了。':'油燈熄滅了。');}return true;
   }
   if(object.role==='reward-marker'){if(this.game.collectBookmark()){this.toast('拿到了繩結書籤。');this.bookmark();}else if(this.game.state.rewardCollected)this.bookmark();else this.toast('中央刻痕裡還空著。');return true;}
   return false;
  }
  bookmark(){this.show('繩結書籤','書籤上的兩條線纏繞在一起，旁邊寫著：「以軀體為題，以藤蔓作答，其心為何？」','bookmark');}
  roomPaper(){
   this.show('抽屜裡的房間圖','以從客廳進來的入口為基準，對照臥室的燈位。實心代表亮、空心代表暗；六角形中央有個記號。','room-paper');
   const canvas=this.element('canvas');canvas.width=600;canvas.height=280;canvas.setAttribute('aria-label','同一張紙上的三房形狀、入口方向及五盞燈目標');this.body.append(canvas);const ctx=canvas.getContext('2d');ctx.fillStyle='#d8c7a0';ctx.fillRect(0,0,600,280);ctx.textAlign='center';ctx.font='17px sans-serif';
   for(const [index,room]of this.maps.maps.entries()){
    const cx=105+195*index,cy=125,scale=.25,to=p=>({x:cx+(p.x-640)*scale,y:cy+(p.y-360)*scale});ctx.strokeStyle='#483e32';ctx.lineWidth=3;ctx.beginPath();room.vertices.forEach((p,i)=>{const q=to(p);if(!i)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});ctx.closePath();ctx.stroke();ctx.fillStyle='#483e32';ctx.fillText(room.name,cx,245);
    if(room.id==='bedroom'){
     for(const lamp of room.objects.filter(o=>o.role==='oil-lamp')){const b=lamp.visualBounds,q=to({x:b.x+b.width/2,y:b.y+b.height/2});ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.stroke();if([0,2,4].includes(lamp.lampIndex)){ctx.fillStyle='#8a4f25';ctx.fill();}}
     const door=room.portals.find(d=>d.target==='living'),p=to(door.center);ctx.fillStyle='#a04436';ctx.beginPath();ctx.moveTo(p.x-5,p.y+7);ctx.lineTo(p.x+8,p.y+3);ctx.lineTo(p.x+2,p.y-7);ctx.closePath();ctx.fill();ctx.fillText('入口',p.x-14,p.y+26);
    }
    if(room.id==='library'){ctx.fillStyle='#8a4f25';ctx.fillRect(cx-5,cy-5,10,10);}
   }
  }
  hint(){this.hints++;let hints=['留意房裡可以調查的物件，地毯下也可能有線索。','日、月、星群各有自己的規律，對照紙上的天象。','日、月、星群週期為3、4、8，完整明暗循環11次後，再主動碰觸太陽。'];if(this.game.state.sunTaken&&!this.game.state.lampsSolved)hints=['書桌抽屜裡的圖形與三個房間相同。','先對準客廳入口，再看五個角落的燈位；多亮也不行。','由客廳入口附近起順時針，亮、暗、亮、暗、亮。'];else if(this.game.state.lampsSolved&&!this.game.state.rewardCollected)hints=['到六角形藏書房中央調查刻痕。'];this.show('提示 '+Math.min(this.hints,3),hints[Math.min(this.hints-1,hints.length-1)]);}
  update(dt){if(this.toastUntil&&this.target.performance.now()>this.toastUntil){this.notice.textContent='';this.toastUntil=0;}}
  draw(ctx){const room=this.maps.currentMap,s=this.game.state;if(room.id==='living'){const b=room.objects.find(o=>o.id==='living-celestial').visualBounds;drawCelestial(ctx,s.cycle,b.x,b.y,b.width,b.height,s.sunTaken);}for(const o of room.objects.filter(o=>o.role==='oil-lamp')){const on=room.id==='bedroom'?s.lampOn[o.lampIndex]:(s.ambientLamps[o.id]??true);if(on){const b=o.visualBounds;ctx.fillStyle='#ffd273';ctx.beginPath();ctx.moveTo(b.x+8,b.y-3);ctx.lineTo(b.x+12,b.y+6);ctx.lineTo(b.x+4,b.y+6);ctx.closePath();ctx.fill();}}if(room.id==='library'&&s.rewardSpawned&&!s.rewardCollected){ctx.fillStyle='#d9bd70';ctx.fillRect(633,349,14,23);ctx.fillStyle='#804d43';ctx.fillRect(637,347,6,28);}if(!s.lights[room.id]){ctx.save();ctx.fillStyle='rgba(0,0,8,.78)';ctx.fillRect(0,0,1280,720);ctx.restore();}}
  get entities(){return [];}
 }
 function mount(options){return new Controller(options);}
 return {Game,Controller,stateAt,drawCelestial,mount};
})();
