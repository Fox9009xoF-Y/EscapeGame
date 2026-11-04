'use strict';
globalThis.PuzzleSystem=(()=>{
 function calendarClue(){return {month:8,day:23,sun:'長',azimuths:[0,.75,2.2,4.1,5.2].map(a=>(a*180/Math.PI+225)%360)};}
 const roomIds=['living','bedroom','library'];
 function stateAt(n){n=((n%24)+24)%24;return {sun:n%3,moon:n%4,angle:(n%8)*Math.PI/4,target:n===11};}
 class Game{
  constructor(){this.state={phase:'explore',lights:{living:true,bedroom:true,library:true},cycle:0,sunTaken:false,wallSeen:false,inventory:[],lampOn:[false,false,false,false,false],lampsSolved:false,rewardSpawned:false,rewardCollected:false,ambientLamps:{},wordSolved:false,exitRevealed:false,doorOpen:false,alarm:false};this.attempts=0;}
  collectNote(){if(this.state.inventory.includes('body_note'))return false;this.state.inventory.push('body_note');return true;}
  toggleLight(room){if(!roomIds.includes(room)||this.state.phase!=='explore')return false;const s=this.state;s.lights[room]=!s.lights[room];if(room==='living'&&s.lights[room])s.cycle=(s.cycle+1)%24;return true;}
  visitWall(){const first=!this.state.wallSeen;this.state.wallSeen=true;return first?'原來傑哥也會觀星啊。':'';}
  touchSun(){const s=this.state;if(s.sunTaken||!stateAt(s.cycle).target)return false;s.sunTaken=true;s.inventory.push('sun_key');return true;}
  toggleLamp(index){const s=this.state;if(s.phase!=='explore'||!Number.isInteger(index)||index<0||index>=5)return false;s.lampOn[index]=!s.lampOn[index];if(s.lampOn.every((on,i)=>on===[true,false,true,false,true][i])){s.lampsSolved=true;s.rewardSpawned=true;}return true;}
  collectBookmark(){const s=this.state;if(!s.rewardSpawned||s.rewardCollected)return false;s.rewardCollected=true;s.inventory.push('knot_bookmark');return true;}
  solveWord(text){const answer=String(text).replace(/[\s，。！？?!,.]/g,'');if(!['纏綿','缠绵','纏繞','交纏'].includes(answer))return false;this.state.wordSolved=true;return true;}
  beginChase(player){const s=this.state;if(s.phase!=='explore'||!s.wordSolved||!s.sunTaken||!s.lampsSolved||!s.rewardCollected||!s.inventory.includes('sun_key'))return false;s.phase='chase-intro';s.alarm=true;for(const room of roomIds)s.lights[room]=false;this.checkpoint=JSON.parse(JSON.stringify({state:s,player}));return true;}
  startChase(){if(!['chase-intro','retry'].includes(this.state.phase))return false;this.state.phase='chase';return true;}
  rewind(){if(!this.checkpoint)return null;this.attempts++;this.state=JSON.parse(JSON.stringify(this.checkpoint.state));this.state.phase='retry';return JSON.parse(JSON.stringify(this.checkpoint.player));}
  revealExit(){const s=this.state;if(s.phase!=='chase'||!s.inventory.includes('sun_key')||s.exitRevealed)return false;s.exitRevealed=true;return true;}
  openDoor(){const s=this.state;if(s.phase!=='chase'||!s.inventory.includes('sun_key')||!s.exitRevealed||s.doorOpen)return false;s.doorOpen=true;return true;}
  finishExit(){const s=this.state;if(s.phase!=='chase'||!s.inventory.includes('sun_key')||!s.exitRevealed||!s.doorOpen)return false;s.phase='escaped';s.alarm=false;return true;}
 }
 function exitReady(room,p,d){if(room.id!=='living'||d.y>=0)return false;const top=Math.min(...room.innerVertices.map(v=>v.y)),door=room.objects.find(o=>o.role==='escape-door').visualBounds;return p.x-p.halfWidth>=door.x&&p.x+p.halfWidth<=door.x+door.width&&p.y-top>=p.halfHeight-.01&&p.y-top<=p.halfHeight+4;}
 function drawCelestial(ctx,n,x,y,w,h,taken=false){
  const s=stateAt(n),cx=x+w*.5,cy=y+h*.5,r=Math.min(w,h)*.10;
  ctx.save();ctx.fillStyle='#8a6c44';ctx.fillRect(x,y,w,h);ctx.fillStyle='#101b30';ctx.fillRect(x+3,y+3,w-6,h-6);
  for(const [a,f]of[[0,1],[.75,.8],[2.2,.95],[4.1,.88],[5.2,.7]]){
   const t=a+s.angle,radius=Math.min(w*.42,h*.37),sx=cx+Math.cos(t)*radius*f,sy=cy+Math.sin(t)*radius*f;
   ctx.fillStyle='#e0ddbd';ctx.beginPath();for(let i=0;i<8;i++){const rad=i%2?2:4,angle=i*Math.PI/4-Math.PI/2;const px=sx+Math.cos(angle)*rad,py=sy+Math.sin(angle)*rad;if(!i)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();
  }
  if(!taken){ctx.strokeStyle='#e4bc61';ctx.lineWidth=Math.max(1,r*.18);for(let i=0;i<8;i++){const a=i*Math.PI/4,length=r*(.5+s.sun*.5);ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(r+2),cy+Math.sin(a)*(r+2));ctx.lineTo(cx+Math.cos(a)*(r+2+length),cy+Math.sin(a)*(r+2+length));ctx.stroke();}ctx.fillStyle='#e4bc61';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();}
  else{ctx.strokeStyle='#5b6574';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
  const mx=x+w*.77,my=cy,mr=r*.95;ctx.save();ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.clip();ctx.fillStyle='#222d45';ctx.fillRect(mx-mr,my-mr,2*mr,2*mr);ctx.fillStyle='#e4dfbf';if(s.moon===1)ctx.fillRect(mx,my-mr,mr,2*mr);if(s.moon===2)ctx.fillRect(mx-mr,my-mr,2*mr,2*mr);if(s.moon===3)ctx.fillRect(mx-mr,my-mr,mr,2*mr);ctx.restore();ctx.strokeStyle='#a6acc0';ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 class Controller{
  constructor(options){Object.assign(this,options);this.game=new Game();this.modal=null;this.visible=false;this.hints=0;this.toastUntil=0;const d=this.document;this.layer=d.getElementById('puzzle-layer');this.panel=d.getElementById('puzzle-modal');this.title=d.getElementById('puzzle-title');this.body=d.getElementById('puzzle-content');this.inventory=d.getElementById('puzzle-inventory');this.notice=d.getElementById('puzzle-notice');d.getElementById('puzzle-close').onclick=()=>this.close();d.getElementById('puzzle-hint').onclick=()=>this.hint();d.getElementById('puzzle-mute').onclick=()=>{this.muted=!this.muted;this.stopAlarm();d.getElementById('puzzle-mute').textContent=this.muted?'開啟音效':'靜音';};this.target.addEventListener('keydown',e=>{if(e.code==='Escape'&&this.visible&&this.modal){e.preventDefault();this.close();}});}
  get blocking(){return !!this.modal;}
  element(tag,text){const el=this.document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
  button(label,action){const b=this.element('button',label);b.type='button';b.onclick=action;this.body.append(b);return b;}
  show(title,text,kind='text'){this.modal={kind,title,text};this.panel.hidden=false;this.title.textContent=title;this.body.replaceChildren();if(text)this.body.append(this.element('p',text));this.clearInput();}
  close(){if(this.modal?.kind==='chase-intro')return;this.modal=null;this.panel.hidden=true;this.clearInput();}
  toast(text){this.notice.textContent=text;this.toastUntil=this.target.performance.now()+3000;this.refresh();}
  refresh(){const names={sun_key:'太陽鑰匙',knot_bookmark:'繩結書籤',body_note:'掉落的紙條'};this.inventory.textContent='道具：'+(this.game.state.inventory.map(id=>names[id]||id).join('、')||'無');if(this.game.state.rewardCollected){const b=this.element('button','看書籤');b.type='button';b.onclick=()=>this.bookmark();this.inventory.append(b);}if(this.game.state.inventory.includes('body_note')){const b=this.element('button','看紙條');b.type='button';b.onclick=()=>{if(this.game.state.phase==='explore')this.notePanel();else this.toast('現在只能先逃出去！');};this.inventory.append(b);}}
  setVisible(visible){if(this.visible===visible)return;this.visible=visible;this.layer.hidden=!visible;if(!visible)this.close();else this.refresh();}
  celestialPanel(target=false,quote=''){
   if(target){this.calendarPanel();return;}
   this.show('天象牆｜杰哥原來也有這個興趣?',quote?'彬彬：「'+quote+'」\n彬彬的心裡話：「明明星空很亮，但環境怎麼好像有點陰暗。」':'牆上有太陽、月亮與星群。','celestial');
   const canvas=this.element('canvas');canvas.width=480;canvas.height=200;canvas.setAttribute('aria-label','目前牆上天象');this.body.append(canvas);drawCelestial(canvas.getContext('2d'),this.game.state.cycle,0,0,480,200,this.game.state.sunTaken);
   if(!target)this.button('觸碰太陽',()=>{const taken=this.game.touchSun();this.celestialPanel(false);this.body.append(this.element('p',taken?'太陽鬆開了，取下的是一把光芒形狀的鑰匙。':this.game.state.sunTaken?'太陽鑰匙已經收好了。':'太陽還卡在牆上，天象似乎尚未相合。'));this.refresh();});
  }
  interact(object){
   if(object.role==='exit-bookshelf'){if(this.game.revealExit()){this.maps.setExitRevealed(true);this.session.setRoom(this.maps.currentMap);this.toast('太陽鑰匙轉動了鎖孔，三連書櫃移開，露出大門。再調查大門開門！');}else this.toast('櫃側有太陽形狀的鎖孔。現在還不是離開的時候。');return true;}
   if(object.role==='escape-door'){if(this.game.openDoor())this.toast('大門開了！朝門外走，快逃！');else this.toast(this.game.state.doorOpen?'朝門外走！':'先用太陽鑰匙移開擋門書櫃。');return true;}
   if(this.game.state.phase==='chase'){this.toast('警報響著，得趕快逃出去！');return true;}
   if(object.role==='light-switch'){this.game.toggleLight(this.maps.currentMap.id);this.toast(this.game.state.lights[this.maps.currentMap.id]?'電燈亮了。':'電燈熄滅了。');return true;}
   if(object.id==='living-celestial'){this.celestialPanel(false,this.game.visitWall());return true;}
   if(object.id==='living-carpet-clue'){this.celestialPanel(true);return true;}
   if(object.id==='living-desk'){this.roomPaper();return true;}
   if(object.role==='oil-lamp'){
    if(this.maps.currentMap.id==='bedroom'){const was=this.game.state.lampsSolved;this.game.toggleLamp(object.lampIndex);this.toast(!was&&this.game.state.lampsSolved?'遠處傳來機關移動的聲音。藏書房中央似乎有了變化。':this.game.state.lampOn[object.lampIndex]?'油燈點亮了。':'油燈熄滅了。');}
    else{const s=this.game.state;s.ambientLamps[object.id]=!(s.ambientLamps[object.id]??true);this.toast(s.ambientLamps[object.id]?'油燈點亮了。':'油燈熄滅了。');}return true;
   }
   if(object.role==='reward-marker'){if(this.game.collectBookmark()){this.toast('拿到了繩結書籤。');this.bookmark();}else if(this.game.state.rewardCollected)this.bookmark();else this.toast('中央刻痕裡還空著。');return true;}
   if(object.role==='word-clue'){this.wordPanel();return true;}
   if(object.id==='bedroom-low-table'){this.show('矮桌上的紙條','祝你今晚好眠，同床共夢');return true;}
   if(object.id==='bedroom-lower-bookshelf'){if(!this.game.state.inventory.includes('body_note')){this.show('臥室下方書櫃','靠牆的書櫃塞著一些雜物','note-discovery');this.button('下一句',()=>{this.show('彬彬','好像有有什麼掉出來了','note-found');this.game.collectNote();this.refresh();this.button('查看紙條',()=>this.notePanel());});}else this.show('臥室下方書櫃','靠牆的書櫃塞著一些雜物');return true;}
   if(object.role==='pillow'){if(!this.game.state.pillowSeen){this.game.state.pillowSeen=true;this.show('杰哥的抱枕','一個印著杰哥的抱枕，這什麼興趣','pillow-description');this.button('繼續調查',()=>{this.close();this.touchPillow();});}else this.touchPillow();return true;}

   return false;
  }
  touchPillow(){const p=this.session.player;if(this.game.beginChase({room:this.maps.currentMap.id,x:p.x,y:p.y,direction:p.direction}))this.chaseIntro();else this.toast(!this.game.state.wordSolved?'先看看紙條，想清楚那個詞。':'還有機關或道具沒處理完。先調查其他地方，再回來看抱枕。');}
  notePanel(){this.show('掉落的紙條','以軀體為題，以藤蔓為解，其心為何?','body-note');}
  calendarPanel(){
   const c=calendarClue();this.show('地毯下的月曆','','target');
   const canvas=this.element('canvas');canvas.width=480;canvas.height=200;canvas.setAttribute('aria-label','八月月曆，廿三日被圈起');this.body.append(canvas);const ctx=canvas.getContext('2d');ctx.fillStyle='#dfd0aa';ctx.fillRect(0,0,480,200);ctx.fillStyle='#493c2c';ctx.font='22px sans-serif';ctx.fillText('農曆 八月',22,30);ctx.font='16px sans-serif';for(let d=1;d<=30;d++){const x=28+((d-1)%7)*65,y=62+Math.floor((d-1)/7)*29;ctx.fillText(String(d),x,y);if(d===23){ctx.strokeStyle='#9b3836';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+9,y-5,14,0,Math.PI*2);ctx.stroke();}}
   this.body.append(this.element('p','農曆八月廿三'));
   this.body.append(this.element('p','今日幸運方位（北為0°，順時針）：'+c.azimuths.map(v=>v.toFixed(2)+'°').join('、')));
   this.body.append(this.element('p','今日幸運光芒：'+c.sun));
  }
  vinePicture(){const c=this.element('canvas');c.width=480;c.height=130;c.setAttribute('aria-label','藤蔓交纏心形石頭的意象');this.body.append(c);const x=c.getContext('2d');x.fillStyle='#101b25';x.fillRect(0,0,480,130);x.fillStyle='#9d6970';x.beginPath();x.moveTo(240,110);x.bezierCurveTo(120,45,195,-10,240,36);x.bezierCurveTo(285,-10,360,45,240,110);x.fill();for(let j=0;j<2;j++){x.strokeStyle=j?'#b4bd7c':'#659477';x.lineWidth=5;x.beginPath();for(let i=0;i<=160;i++){const px=100+i*1.8,py=65+Math.sin(i*.11+j*Math.PI)*28;if(!i)x.moveTo(px,py);else x.lineTo(px,py);}x.stroke();}}
  bookmark(){if(this.game.state.phase!=='explore'){this.toast('現在只能先逃出去！');return;}this.wordPanel('繩結書籤');}
  wordPanel(title='書櫃裡的文字謎題'){
   this.show(title,'請給我你的心臟，重量兩個字','word');this.vinePicture();const label=this.element('label','其心為何（兩個字）'),input=this.element('input');input.type='text';input.maxLength=24;input.setAttribute('aria-label','文字謎題答案');label.append(input);this.body.append(label);const feedback=this.element('p');this.body.append(feedback);
   const solve=()=>{if(this.game.solveWord(input.value)){this.show('彬彬的心裡話','纏綿...?該不會是要我和杰哥纏綿吧?','word-solved');this.body.append(this.element('p','想出了「纏綿」，還需要到房間裡實際調查。'));}else feedback.textContent='再想想軀體與藤蔓相互纏繞、連綿的樣子。';};this.button('確認答案',solve);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();solve();}});input.focus();
  }
  chaseIntro(){this.pursuit=null;this.stopAlarm();this.show('彬彬','好暗，得趕快逃出去','chase-intro');this.body.append(this.element('p','警報響起了。帶著鑰匙，往客廳的書櫃後大門逃！'));this.button(this.game.state.phase==='retry'?'重新挑戰':'趕快逃！',()=>{if(!this.game.startChase())return;this.modal=null;this.panel.hidden=true;this.clearInput();const room=this.maps.currentMap,point=ChaseSystem.spawn(room,this.session.player);if(point)this.pursuit=new ChaseSystem.Pursuit({maps:this.maps,start:{room:room.id,...point},playerSpeed:this.session.player.speed});this.alarmClock=0;this.toast('警報響起！杰哥可能從牆邊出現。');}).focus();this.refresh();}
  stopAlarm(){if(this.alarmOscillator){try{this.alarmOscillator.stop();}catch{}this.alarmOscillator=null;}}
  beep(){if(this.muted)return;try{const Audio=this.target.AudioContext||this.target.webkitAudioContext;if(!Audio)return;this.audio||=new Audio();this.audio.resume().catch(()=>{});const osc=this.audio.createOscillator(),gain=this.audio.createGain();osc.frequency.value=620;gain.gain.value=.035;osc.connect(gain);gain.connect(this.audio.destination);osc.start();osc.stop(this.audio.currentTime+.09);this.alarmOscillator=osc;osc.onended=()=>{osc.disconnect();gain.disconnect();if(this.alarmOscillator===osc)this.alarmOscillator=null;};}catch{/* 可見警報仍持續顯示。 */}}
  roomPaper(){
   this.show('','','room-paper');
   const canvas=this.element('canvas');canvas.width=600;canvas.height=280;canvas.setAttribute('aria-label','同一張紙上的三房形狀、入口方向及五盞燈目標');this.body.append(canvas);const ctx=canvas.getContext('2d');ctx.fillStyle='#d8c7a0';ctx.fillRect(0,0,600,280);ctx.textAlign='center';ctx.font='17px sans-serif';
   for(const [index,room]of this.maps.maps.entries()){
    const cx=105+195*index,cy=125,scale=.25,to=p=>({x:cx+(p.x-640)*scale,y:cy+(p.y-360)*scale});ctx.strokeStyle='#483e32';ctx.lineWidth=3;ctx.beginPath();room.vertices.forEach((p,i)=>{const q=to(p);if(!i)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});ctx.closePath();ctx.stroke();ctx.fillStyle='#483e32';
    if(room.id==='bedroom'){
     for(const lamp of room.objects.filter(o=>o.role==='oil-lamp')){const b=lamp.visualBounds,q=to({x:b.x+b.width/2,y:b.y+b.height/2});ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.stroke();if([0,2,4].includes(lamp.lampIndex)){ctx.fillStyle='#8a4f25';ctx.fill();}}
     const door=room.portals.find(d=>d.target==='living'),p=to(door.center);ctx.fillStyle='#a04436';ctx.beginPath();ctx.moveTo(p.x-5,p.y+7);ctx.lineTo(p.x+8,p.y+3);ctx.lineTo(p.x+2,p.y-7);ctx.closePath();ctx.fill();ctx.fillText('入口',p.x-14,p.y+26);
    }
    if(room.id==='library'){ctx.fillStyle='#8a4f25';ctx.fillRect(cx-5,cy-5,10,10);}
   }
  }
  hint(){if(this.game.state.phase!=='explore'){this.toast('快往客廳左上角大門逃！');return;}this.hints++;let hints=['留意房裡可以調查的物件，地毯下也可能有線索。','日、月、星群各有自己的規律，對照紙上的天象。','日、月、星群週期為3、4、8，完整明暗循環11次後，再主動碰觸太陽。'];if(this.game.state.sunTaken&&!this.game.state.lampsSolved)hints=['書桌抽屜裡的圖形與三個房間相同。','先對準客廳入口，再看五個角落的燈位；多亮也不行。','由客廳入口附近起順時針，亮、暗、亮、暗、亮。'];else if(this.game.state.lampsSolved&&!this.game.state.rewardCollected)hints=['到六角形藏書房中央調查刻痕。'];if(this.game.state.rewardCollected)hints=['臥室掉落的紙條與藏書房的藤蔓圖像，指向相連的意象。','其心是纏綿。解出後還需要實際調查床上的杰哥抱枕。'];this.show('提示 '+Math.min(this.hints,3),hints[Math.min(this.hints-1,hints.length-1)]);}
  update(dt){
   if(this.game.state.phase==='chase'){
    if(exitReady(this.maps.currentMap,this.session.player,this.session.input.direction())&&this.game.finishExit()){this.stopAlarm();this.pursuit=null;this.clearInput();this.onExit();return;}
    this.alarmClock=(this.alarmClock||0)-dt;if(this.alarmClock<=0){this.beep();this.alarmClock=.7;}
    if(this.pursuit?.update(dt,this.session.player,this.maps.currentMap.id)){const saved=this.game.rewind();this.maps.setExitRevealed(false);this.maps.setCurrentMap(saved.room);this.session.setRoom(this.maps.currentMap);Object.assign(this.session.player,{x:saved.x,y:saved.y,direction:saved.direction,moving:false,animationTime:0});this.portals.blocked=null;this.clearInput();this.chaseIntro();}
   }
   const status=this.document.getElementById('puzzle-alarm');if(status){status.hidden=!this.game.state.alarm;status.textContent='警報響起！'+(this.game.attempts?' 第'+(this.game.attempts+1)+'次逃離':'');}
   if(this.toastUntil&&this.target.performance.now()>this.toastUntil){this.notice.textContent='';this.toastUntil=0;}}
  draw(ctx){const room=this.maps.currentMap,s=this.game.state;if(room.id==='living'){const b=room.objects.find(o=>o.id==='living-celestial').visualBounds;drawCelestial(ctx,s.cycle,b.x,b.y,b.width,b.height,s.sunTaken);}for(const o of room.objects.filter(o=>o.role==='oil-lamp')){const on=room.id==='bedroom'?s.lampOn[o.lampIndex]:(s.ambientLamps[o.id]??true);if(on){const b=o.visualBounds;ctx.fillStyle='#ffd273';ctx.beginPath();ctx.moveTo(b.x+8,b.y-3);ctx.lineTo(b.x+12,b.y+6);ctx.lineTo(b.x+4,b.y+6);ctx.closePath();ctx.fill();}}if(room.id==='library'&&s.rewardSpawned&&!s.rewardCollected){ctx.fillStyle='#d9bd70';ctx.fillRect(633,349,14,23);ctx.fillStyle='#804d43';ctx.fillRect(637,347,6,28);}const dark=['chase','chase-intro','retry'].includes(s.phase);
   if(room.id==='living'&&s.doorOpen){ctx.fillStyle='#090d14';ctx.fillRect(423,108,50,22);ctx.fillStyle='#c4ac76';ctx.fillRect(423,128,50,2);}
   if(dark){const p=this.session.player;ctx.save();ctx.fillStyle='#000';ctx.beginPath();ctx.rect(0,0,1280,720);ctx.moveTo(p.x+96,p.y);ctx.arc(p.x,p.y,96,0,Math.PI*2,true);ctx.fill('evenodd');ctx.restore();}
   else if(!s.lights[room.id]){ctx.save();ctx.fillStyle='rgba(0,0,8,.78)';ctx.fillRect(0,0,1280,720);ctx.restore();}
   this.document.getElementById('door-labels').style.visibility=dark?'hidden':'visible';}
  get entities(){return this.pursuit&&this.game.state.phase==='chase'&&this.pursuit.delay<=0&&this.pursuit.room===this.maps.currentMap.id?[this.pursuit.actor]:[];}
 }
 function mount(options){return new Controller(options);}
 return {Game,Controller,stateAt,drawCelestial,calendarClue,exitReady,mount};
})();
