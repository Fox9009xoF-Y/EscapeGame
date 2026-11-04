const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('按鈕保留焦點時方向鍵仍能移動，但空白只操作按鈕而不重複調查',()=>{
 const events={},target={addEventListener:(n,fn)=>events[n]=fn},doc={addEventListener(){}};
 const s=vm.createContext({Image:class{}});vm.runInContext(fs.readFileSync('player.js','utf8'),s);
 const input=new s.PlayerSystem.Input(target,doc);let prevented=false;
 events.keydown({code:'ArrowRight',target:{tagName:'BUTTON'},preventDefault(){prevented=true;}});
 assert.equal(input.direction().x,1);assert.equal(prevented,true);
 events.keyup({code:'ArrowRight'});assert.equal(input.direction().x,0);
 prevented=false;events.keydown({code:'Space',target:{tagName:'BUTTON'},preventDefault(){prevented=true;}});
 assert.equal(input.consumeInteract(),false);assert.equal(prevented,false);
 events.keydown({code:'KeyW',target:{tagName:'INPUT'},preventDefault(){}});assert.equal(input.direction().y,0);
});
