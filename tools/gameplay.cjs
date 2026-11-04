const navigate=require('./navigate.cjs'),assert=require('node:assert/strict');
exports.start=async page=>{await page.goto('http://127.0.0.1:8000/');await page.waitForFunction(()=>storyController.mode==='opening');while(await page.evaluate(()=>storyController.mode==='opening')){await page.keyboard.press('Space');await page.waitForTimeout(175);}await page.waitForFunction(()=>gameController.visible);};
exports.room=async(page,target)=>{for(let i=0;i<3&&await page.evaluate(()=>RoomMaps.currentMap.id)!==target;i++){
 const source=await page.evaluate(()=>RoomMaps.currentMap.id),next=source==='living'?'bedroom':source==='library'?'bedroom':target;
 const d=await page.evaluate(next=>{const d=RoomMaps.currentMap.portals.find(d=>d.target===next),p=playerSession.player,k=Math.abs(d.normal.x)*p.halfWidth+Math.abs(d.normal.y)*p.halfHeight+18;return{x:d.innerCenter.x+d.normal.x*k,y:d.innerCenter.y+d.normal.y*k,n:d.normal};},next);
 await navigate(page,{point:{x:d.x,y:d.y}});const keys=[];if(Math.abs(d.n.x)>.1)keys.push(d.n.x>0?'ArrowLeft':'ArrowRight');if(Math.abs(d.n.y)>.1)keys.push(d.n.y>0?'ArrowUp':'ArrowDown');for(const key of keys)await page.keyboard.down(key);try{await page.waitForFunction(next=>RoomMaps.currentMap.id===next,next,{timeout:4000});await page.waitForTimeout(100);}finally{for(const key of keys)await page.keyboard.up(key);}assert.equal(await page.evaluate(()=>RoomMaps.currentMap.id),next);
 }assert.equal(await page.evaluate(()=>RoomMaps.currentMap.id),target);};
exports.use=async(page,id)=>{await navigate(page,{id});await page.keyboard.press('Space');await page.waitForTimeout(50);};
exports.close=async page=>{if(await page.locator('#puzzle-modal').isVisible())await page.locator('#puzzle-close').click();};
exports.solveAll=async page=>{
 await exports.use(page,'living-switch');await exports.use(page,'living-switch');
 for(let i=1;i<11;i++){await page.keyboard.press('Space');await page.waitForTimeout(35);await page.keyboard.press('Space');await page.waitForTimeout(35);}
 await exports.use(page,'living-celestial');await page.getByRole('button',{name:'觸碰太陽',exact:true}).click();await exports.close(page);
 await exports.room(page,'bedroom');for(const i of[0,2,4])await exports.use(page,'bedroom-lamp-'+i);
 await exports.room(page,'library');await exports.use(page,'library-reward-marker');
 await page.getByLabel('文字謎題答案').fill('纏綿');await page.getByRole('button',{name:'確認答案',exact:true}).click();await exports.close(page);
 await exports.room(page,'bedroom');await exports.use(page,'bedroom-pillow');if(await page.evaluate(()=>gameController.modal?.kind==='pillow-description'))await page.getByRole('button',{name:'繼續調查',exact:true}).click();
};
