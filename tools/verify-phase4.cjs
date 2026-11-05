const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.heroCalls=[];
      const original=CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage=function(...args){
        if(args[0].src && /hero-(sprites|back-walk)\.png/.test(args[0].src))window.heroCalls.push({src:args[0].src,sx:args[1],sy:args[2]});
        return original.apply(this,args);
      };
    });
    await page.goto('http://127.0.0.1:8000');
    await page.waitForFunction(()=>heroCalls.length>0);
    for(const [key,direction] of [['s','down'],['w','up'],['a','left'],['d','right']]){
      await page.evaluate(()=>{playerSession.player.x=640;playerSession.player.y=300;heroCalls=[];});
      await page.keyboard.down(key);await page.waitForTimeout(50);await page.evaluate(()=>{heroCalls=[];});await page.waitForTimeout(350);await page.keyboard.up(key);
      await page.waitForTimeout(50);
      const result=await page.evaluate(()=>({direction:playerSession.player.direction,frame:playerSession.player.spriteFrame(),sources:[...new Set(heroCalls.map(c=>c.src.split('/').pop()))],frames:[...new Set(heroCalls.map(c=>c.sx))]}));
      assert.equal(result.direction,direction);assert.deepEqual(result.sources,[direction==='up'?'hero-back-walk.png':'hero-sprites.png']);assert.ok(result.frames.length>=2);
      assert.equal(result.frame.sx,direction==='up'?0:16);
      await page.screenshot({path:`evidence/phase4-${direction}.png`});
      console.log(JSON.stringify(result));
    }
    const occlusion=await page.evaluate(()=>{
      gameLoop.stop();const p=playerSession.player,ctx=canvas.getContext('2d');
      const box=RoomMaps.currentMap.objects.find(o=>o.role==='sofa').collision;
      p.moving=false;p.direction='down';p.x=box.x+box.width/2;
      ctx.fillStyle='#171b20';ctx.fillRect(0,0,1280,720);RoomMaps.draw(ctx,[],(ctx,o)=>gameController?gameController.drawSceneObject(ctx,o):o.draw(ctx));
      if(gameController)gameController.draw(ctx);
      const baseline=ctx.getImageData(0,0,1280,720).data;
      p.y=box.y+box.height-23;draw();const behind=ctx.getImageData(0,0,1280,720).data;
      p.y=box.y+box.height+7;draw();const front=ctx.getImageData(0,0,1280,720).data;
      let hiddenChanges=0,frontChanges=0;
      for(let i=0;i<baseline.length;i++){if(behind[i]!==baseline[i])hiddenChanges++;if(front[i]!==baseline[i])frontChanges++;}
      return {hiddenChanges,frontChanges};
    });
    assert.equal(occlusion.hiddenChanges,0,'傢俱後角色應完全被不透明傢俱遮住');assert.ok(occlusion.frontChanges>100);
    await page.screenshot({path:'evidence/phase4-front-pillar.png'});
    await page.evaluate(()=>{const b=RoomMaps.currentMap.objects.find(o=>o.role==='sofa').collision;playerSession.player.y=b.y+b.height-23;draw();});
    await page.screenshot({path:'evidence/phase4-behind-pillar.png'});
    assert.deepEqual(errors,[]);console.log(JSON.stringify(occlusion));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
