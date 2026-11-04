const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage();await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>typeof gameController!=='undefined');
 await p.evaluate(()=>{gameLoop.stop();gameController.setVisible(true);});const checks=[];
 for(const width of[1280,800]){await p.setViewportSize({width,height:900});for(const kind of['target','paper']){
  await p.evaluate(kind=>kind==='target'?gameController.celestialPanel(true):gameController.roomPaper(),kind);
  const ratio=await p.locator('#puzzle-content canvas').evaluate(c=>{const r=c.getBoundingClientRect();return {actual:r.width/r.height,intrinsic:c.width/c.height};});
  assert.ok(Math.abs(ratio.actual-ratio.intrinsic)<.005,'紙條畫面不可把圓形與45度星群拉伸');checks.push({width,kind,...ratio});
 }}
 await p.evaluate(()=>{gameController.close();gameController.game.state.inventory=['sun_key','knot_bookmark'];gameController.game.state.rewardCollected=true;gameController.refresh();});
 const overlap=await p.locator('#puzzle-inventory').evaluate(el=>{const range=document.createRange();range.selectNode(el.firstChild);return range.getBoundingClientRect().right>el.querySelector('button').getBoundingClientRect().left;});assert.equal(overlap,false);
 fs.writeFileSync('evidence/puzzle-layout-results.json',JSON.stringify({checks,inventoryOverlap:overlap},null,2));console.log('兩種視窗的天象/房形紙條比例及背包間距通過');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
