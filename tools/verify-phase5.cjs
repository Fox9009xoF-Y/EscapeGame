const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8000/');
    await page.waitForFunction(()=>typeof portalController!=='undefined' && playerSession!==null);
    async function axis(name,target){
      const value=await page.evaluate(name=>playerSession.player[name],name);
      if(Math.abs(value-target)<4)return;
      const positive=value<target,key=name==='x'?(positive?'ArrowRight':'ArrowLeft'):(positive?'ArrowDown':'ArrowUp');
      await page.keyboard.down(key);
      try{await page.waitForFunction(({name,target,positive})=>positive?playerSession.player[name]>=target:playerSession.player[name]<=target,{name,target,positive},{timeout:5000});}
      finally{await page.keyboard.up(key);}
    }
    await page.screenshot({path:'evidence/phase5-start-living.png'});
    const route=['bedroom','library','bedroom','living'];
    for(let index=0;index<route.length;index++){
      const target=route[index],source=await page.evaluate(()=>RoomMaps.currentMap.id);
      // 使用真實鍵盤繞過既有柱子，不直接設定玩家座標。
      await axis('y',270);await axis('x',640);
      const approach=await page.evaluate(target=>{
        const door=RoomMaps.currentMap.portals.find(d=>d.target===target),p=playerSession.player;
        const inset=Math.abs(door.normal.x)*p.halfWidth+Math.abs(door.normal.y)*p.halfHeight+18;
        return {x:door.innerCenter.x+door.normal.x*inset,y:door.innerCenter.y+door.normal.y*inset,n:door.normal};
      },target);
      await axis('x',approach.x);await axis('y',approach.y);
      const keys=[];
      if(Math.abs(approach.n.x)>0.1)keys.push(approach.n.x>0?'ArrowLeft':'ArrowRight');
      if(Math.abs(approach.n.y)>0.1)keys.push(approach.n.y>0?'ArrowUp':'ArrowDown');
      for(const key of keys)await page.keyboard.down(key);
      try{
        await page.waitForFunction(target=>RoomMaps.currentMap.id===target,target,{timeout:3000});
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(()=>RoomMaps.currentMap.id),target,'按住原方向不彈回');
      }finally{for(const key of keys)await page.keyboard.up(key);}
      const state=await page.evaluate(()=>{
        const room=RoomMaps.currentMap,p=playerSession.player,v=room.innerVertices;
        let violations=0;
        for(let i=0;i<v.length;i++){
          const a=v[i],b=v[(i+1)%v.length],len=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
          if((p.x-a.x)*nx+(p.y-a.y)*ny<Math.abs(nx)*p.halfWidth+Math.abs(ny)*p.halfHeight-1e-6)violations++;
        }
        const ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,1280,720).data;
        let leaks=0;
        for(let y=64;y<704;y+=8)for(let x=8;x<1272;x+=8){
          let inside=true,near=false;
          room.vertices.forEach((a,i)=>{const b=room.vertices[(i+1)%room.vertices.length],cross=(b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x);inside&&=cross>=0;near||=Math.abs(cross)/Math.hypot(b.x-a.x,b.y-a.y)<2;});
          const i=(y*1280+x)*4;if(!inside&&!near&&(pixels[i]!==23||pixels[i+1]!==27||pixels[i+2]!==32))leaks++;
        }
        return {id:room.id,name:room.name,vertices:room.vertices.length,violations,leaks,x:p.x,y:p.y,width:canvas.width,height:canvas.height};
      });
      assert.equal(state.violations,0);assert.equal(state.leaks,0);assert.equal(state.width,1280);assert.equal(state.height,720);
      await page.screenshot({path:`evidence/phase5-${index+1}-${target}.png`});
      console.log(JSON.stringify({from:source,...state}));
    }
    assert.deepEqual(errors,[]);
    console.log('全程真實Chrome鍵盤走位，四條雙向連接/按住不彈回/門後合法位置/三房輪廓與單房渲染通過，無JavaScript錯誤。');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
