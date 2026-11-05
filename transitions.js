'use strict';
globalThis.TransitionSystem=(()=>{
 class Controller{
  constructor({element,clearInput=()=>{}}){this.element=element;this.clearInput=clearInput;this.active=false;this.history=[];}
  begin(action){if(this.active)return false;this.active=true;this.elapsed=0;this.switched=false;this.action=action;this.element.hidden=false;this.element.style.opacity='0';this.clearInput();return true;}
  update(dt){if(!this.active)return;this.elapsed=Math.min(1,this.elapsed+dt);if(!this.switched&&this.elapsed>=.5-1e-9){this.switched=true;this.action();}this.element.style.opacity=String(Math.max(0,1-Math.abs(2*this.elapsed-1)));if(this.elapsed>=1-1e-9){this.active=false;this.element.hidden=true;this.element.style.opacity='0';this.action=null;this.history.push({duration:1});this.clearInput();}}
 }
 return {Controller};
})();
