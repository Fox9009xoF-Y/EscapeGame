'use strict';

globalThis.DoorLabels = (() => {
  const names = { living:'客廳', bedroom:'臥室', library:'藏書房' };
  function layout(door) {
    const outward = { x:-door.normal.x, y:-door.normal.y };
    const at = distance => ({ x:door.center.x+outward.x*distance, y:door.center.y+outward.y*distance });
    const start=at(8), tip=at(58), back=at(48), label=at(76);
    return { start, tip,
      head:[{x:back.x+door.tangent.x*5,y:back.y+door.tangent.y*5},tip,{x:back.x-door.tangent.x*5,y:back.y-door.tangent.y*5}],
      label:{...label,text:names[door.target],anchor:outward.x>0.2?'start':outward.x<-0.2?'end':'middle'} };
  }
  let previousRoom=null, previousLayer=null;
  function render(layer,room) {
    if(!layer || (room===previousRoom && layer===previousLayer))return;
    const document=layer.ownerDocument;
    const element=(tag,attributes)=>{
      const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
      for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
      return node;
    };
    const groups=room.portals.map(door=>{
      const {start,tip,head,label}=layout(door);
      const group=element('g',{'data-portal':door.id});
      const arrow=element('path',{d:`M ${start.x} ${start.y} L ${tip.x} ${tip.y} M ${head[0].x} ${head[0].y} L ${tip.x} ${tip.y} L ${head[2].x} ${head[2].y}`,fill:'none',stroke:'#d4c3a1','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'});
      const text=element('text',{x:label.x,y:label.y,'text-anchor':label.anchor,'dominant-baseline':'middle',fill:'#d4c3a1','font-size':16,'font-family':'sans-serif'});
      text.textContent=label.text;group.append(arrow,text);return group;
    });
    layer.replaceChildren(...groups);previousRoom=room;previousLayer=layer;
  }
  return {layout,render};
})();
