'use strict';

globalThis.InteractionSystem = (() => {
  function findTarget(player,room,{escape=false}={}){
    const p=player,boxFor=(mult=1)=>{const reach=32*mult,w=p.halfWidth*mult,h=p.halfHeight*mult;return p.direction==='up'?{x:p.x-w,y:p.y-p.halfHeight-reach,width:w*2,height:reach}:p.direction==='down'?{x:p.x-w,y:p.y+p.halfHeight,width:w*2,height:reach}:p.direction==='left'?{x:p.x-p.halfWidth-reach,y:p.y-h,width:reach,height:h*2}:{x:p.x+p.halfWidth,y:p.y-h,width:reach,height:h*2};};
    const overlap=(b,box)=>b.x<box.x+box.width&&b.x+b.width>box.x&&b.y<box.y+box.height&&b.y+b.height>box.y;
    const distance=b=>p.direction==='up'?p.y-b.y-b.height:p.direction==='down'?b.y-p.y:p.direction==='left'?p.x-b.x-b.width:b.x-p.x;
    const bounds=o=>o.interactionBounds||o.collision,mult=o=>escape&&['exit-bookshelf','escape-door'].includes(o.role)?2:1;
    const target=room.objects.filter(o=>o.title&&o.text&&overlap(bounds(o),boxFor(mult(o)))).sort((a,b)=>distance(bounds(a))-distance(bounds(b))||(b.priority||0)-(a.priority||0))[0];
    if(!target)return null;const box=boxFor(mult(target));if(room.obstacles.some(b=>b!==target.collision&&overlap(b,box)&&distance(b)<distance(bounds(target))))return null;return target;
  }

  class Controller {
    constructor(maps) { this.maps = maps; this.room = maps.currentMap.id; this.message = null; }
    update(session) {
      const pressed = session.input.consumeInteract();
      if (this.room !== this.maps.currentMap.id) {
        this.room = this.maps.currentMap.id; this.message = null;
        return false;
      }
      if (!pressed) return false;
      if (this.message) { this.message = null; return true; }
      const object = findTarget(session.player, this.maps.currentMap,{escape:!!this.escapeMode?.()});
      if (!object) return false;
      if (this.onInteract && this.onInteract(object)) return true;
      this.message = { id:object.id, title:object.title, text:object.text };
      return true;
    }
    draw(ctx) {
      if (!this.message) return;
      ctx.save();
      ctx.fillStyle = '#b9ac84'; ctx.fillRect(250, 560, 780, 136);
      ctx.fillStyle = '#15191e'; ctx.fillRect(254, 564, 772, 128);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#eee5cf';
      ctx.fillText(this.message.title, 278, 580);
      ctx.font = '18px sans-serif';
      const chars = Array.from(this.message.text);
      for (let i=0;i<chars.length;i+=38) ctx.fillText(chars.slice(i,i+38).join(''),278,610+Math.floor(i/38)*24);
      ctx.font = '14px sans-serif'; ctx.fillStyle = '#b9ac84';
      ctx.fillText('空白鍵關閉', 908, 670);
      ctx.restore();
    }
  }
  return { findTarget, Controller };
})();
