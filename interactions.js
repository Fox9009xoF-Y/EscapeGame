'use strict';

globalThis.InteractionSystem = (() => {
  function nearTarget(p,room,roles=['exit-bookshelf','escape-door'],reach=64){
    const pb={x:p.x-p.halfWidth,y:p.y-p.halfHeight,width:p.halfWidth*2,height:p.halfHeight*2},rects=o=>[o.interactionBounds,o.visualBounds,o.collision].filter(Boolean);
    const overlap=b=>pb.x<=b.x+b.width&&pb.x+pb.width>=b.x&&pb.y<=b.y+b.height&&pb.y+pb.height>=b.y;
    const gap=b=>Math.hypot(Math.max(b.x-pb.x-pb.width,pb.x-b.x-b.width,0),Math.max(b.y-pb.y-pb.height,pb.y-b.y-b.height,0));
    const choices=room.objects.filter(o=>roles.includes(o.role)&&o.title&&o.text&&!(o.role==='escape-door'&&o.parentId&&room.objects.some(c=>c.id===o.parentId))).map(o=>({o,b:rects(o).sort((a,b)=>gap(a)-gap(b))[0]})).filter(v=>v.b&&gap(v.b)<=reach).sort((a,b)=>gap(a.b)-gap(b.b));
    if(!choices.length)return null;const {o,b}=choices[0];if(rects(o).some(overlap))return o;
    const end={x:Math.max(b.x,Math.min(p.x,b.x+b.width)),y:Math.max(b.y,Math.min(p.y,b.y+b.height))};
    const blocked=r=>{if(r.vertices)return !!CollisionShape.sweep({x:p.x,y:p.y,halfWidth:0,halfHeight:0},end.x-p.x,end.y-p.y,r);let lo=0,hi=1;for(const[at,delta,min,max]of[[p.x,end.x-p.x,r.x,r.x+r.width],[p.y,end.y-p.y,r.y,r.y+r.height]]){if(Math.abs(delta)<1e-9){if(at<=min||at>=max)return false;continue;}const a=(min-at)/delta,z=(max-at)/delta;lo=Math.max(lo,Math.min(a,z));hi=Math.min(hi,Math.max(a,z));if(lo>hi)return false;}return hi>0&&lo<1;};
    return room.obstacles.some(r=>r!==o.collision&&blocked(r))?null:o;
  }
  function findTarget(player,room,{escape=false}={}){
    if(escape&&room.objects.some(o=>['exit-bookshelf','escape-door'].includes(o.role))){const exit=nearTarget(player,room);if(exit)return exit;}

    const marker=nearTarget(player,room,['reward-marker'],32);if(marker)return marker;
    const p=player,boxFor=(mult=1)=>{const reach=32*mult,w=p.halfWidth*mult,h=p.halfHeight*mult;return p.direction==='up'?{x:p.x-w,y:p.y-p.halfHeight-reach,width:w*2,height:reach}:p.direction==='down'?{x:p.x-w,y:p.y+p.halfHeight,width:w*2,height:reach}:p.direction==='left'?{x:p.x-p.halfWidth-reach,y:p.y-h,width:reach,height:h*2}:{x:p.x+p.halfWidth,y:p.y-h,width:reach,height:h*2};};
    const overlap=(b,box)=>CollisionShape.overlaps({x:box.x+box.width/2,y:box.y+box.height/2,halfWidth:box.width/2,halfHeight:box.height/2},b);
    const distance=b=>p.direction==='up'?p.y-b.y-b.height:p.direction==='down'?b.y-p.y:p.direction==='left'?p.x-b.x-b.width:b.x-p.x;
    const bounds=o=>o.interactionBounds||o.collision,mult=o=>escape&&['exit-bookshelf','escape-door'].includes(o.role)?2:1;
    const target=room.objects.filter(o=>!(escape&&['exit-bookshelf','escape-door'].includes(o.role))&&o.title&&o.text&&overlap(bounds(o),boxFor(mult(o)))).sort((a,b)=>distance(bounds(a))-distance(bounds(b))||(b.priority||0)-(a.priority||0))[0];
    if(!target)return null;const box=boxFor(mult(target));if(room.obstacles.some(b=>b!==target.collision&&overlap(b,box)&&distance(b)<distance(bounds(target))))return null;return target;
  }

  class Controller {
    constructor(maps) { this.maps = maps; this.room = maps.currentMap.id; this.message = null; }
    update(session) {
      const pressed = session.input.consumeInteract();
      if (this.room !== this.maps.currentMap.id) {
        this.room = this.maps.currentMap.id; this.message = null;
        if(pressed&&this.escapeMode?.()){
          const exit=findTarget(session.player,this.maps.currentMap,{escape:true});
          if(exit&&['exit-bookshelf','escape-door'].includes(exit.role)&&this.onInteract?.(exit))return true;
        }
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
