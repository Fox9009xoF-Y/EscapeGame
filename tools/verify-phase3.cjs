const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel:'chrome', headless:true });
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(() => {
      window.renderedTiles=0;
      const original=CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage=function(...args){window.renderedTiles++;return original.apply(this,args);};
    });
    fs.mkdirSync('evidence',{recursive:true});
    for(const room of ['living','bedroom','library']) {
      await page.goto(`http://127.0.0.1:8000/?room=${room}`);
      await page.waitForFunction(()=>window.renderedTiles>0 && typeof playerSession!=='undefined' && playerSession!==null);
      const before=await page.evaluate(()=>JSON.stringify(RoomMaps.currentMap.vertices));
      for(const [key,dx,dy] of [['w',0,-1],['a',-1,0],['s',0,1],['d',1,0],['ArrowUp',0,-1],['ArrowLeft',-1,0],['ArrowDown',0,1],['ArrowRight',1,0]]) {
        await page.evaluate(()=>{playerSession.player.x=640;playerSession.player.y=300;});
        await page.keyboard.down(key);await page.waitForTimeout(120);await page.keyboard.up(key);
        const moved=await page.evaluate(()=>({x:playerSession.player.x,y:playerSession.player.y}));
        assert.ok(dx ? (moved.x-640)*dx>0 : Math.abs(moved.x-640)<1e-6);
        assert.ok(dy ? (moved.y-300)*dy>0 : Math.abs(moved.y-300)<1e-6);
        await page.waitForTimeout(80);
        assert.deepEqual(await page.evaluate(()=>({x:playerSession.player.x,y:playerSession.player.y})),moved,'放鍵停止');
      }
      const result=await page.evaluate(()=>{
        gameLoop.stop();
        const room=RoomMaps.currentMap,p=playerSession.player;
        // 在真正載入的瀏覽器中重驗高速、障礙與斜牆；實際按鍵由上面的 keyboard 驗證。
        let violations=0;
        const valid=()=>{
          const v=room.innerVertices;
          for(let i=0;i<v.length;i++) {
            const a=v[i],b=v[(i+1)%v.length],len=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
            if((p.x-a.x)*nx+(p.y-a.y)*ny<Math.abs(nx)*p.halfWidth+Math.abs(ny)*p.halfHeight-1e-6)violations++;
          }
          for(const b of room.obstacles) if(p.x+p.halfWidth>b.x+1e-6 && p.x-p.halfWidth<b.x+b.width-1e-6 && p.y+p.halfHeight>b.y+1e-6 && p.y-p.halfHeight<b.y+b.height-1e-6)violations++;
        };
        for(let i=0;i<48;i++) {p.x=640;p.y=300;const angle=i*Math.PI/24;p.move(Math.cos(angle)*20000,Math.sin(angle)*20000,room);valid();}
        const box=room.obstacles[0];p.x=box.x-8;p.y=box.y+10;const y=p.y;p.move(20,20,room);valid();
        const obstacleSlide=p.y-y;
        let wallSlide=null;
        if(room.vertices.length>4) {
          const v=room.innerVertices,i=v.findIndex((a,i)=>Math.abs(v[(i+1)%v.length].x-a.x)>1 && Math.abs(v[(i+1)%v.length].y-a.y)>1);
          const a=v[i],b=v[(i+1)%v.length],length=Math.hypot(b.x-a.x,b.y-a.y),tx=(b.x-a.x)/length,ty=(b.y-a.y)/length,nx=-ty,ny=tx;
          const support=Math.abs(nx)*p.halfWidth+Math.abs(ny)*p.halfHeight;
          const along=room.id==='library'?.15:.5; // 新背櫃碰撞占用中點，仍測同一實際斜牆的空段。
          p.x=a.x+(b.x-a.x)*along+nx*(support+0.001);p.y=a.y+(b.y-a.y)*along+ny*(support+0.001);
          const old={x:p.x,y:p.y};p.move(tx*30-nx*40,ty*30-ny*40,room);valid();wallSlide=(p.x-old.x)*tx+(p.y-old.y)*ty;
        }
        draw();
        return {id:room.id,violations,obstacleSlide,wallSlide,width:canvas.width,height:canvas.height};
      });
      assert.equal(result.violations,0);assert.ok(result.obstacleSlide>19.9);
      if(room!=='living')assert.ok(result.wallSlide>29.9);
      assert.equal(result.width,1280);assert.equal(result.height,720);
      assert.equal(await page.evaluate(()=>JSON.stringify(RoomMaps.currentMap.vertices)),before,'相機與房間不隨角色移動');
      await page.screenshot({path:`evidence/phase3-${room}.png`});
      console.log(JSON.stringify(result));
    }
    assert.deepEqual(errors,[]);
    console.log('Chrome 實際鍵盤：三房共24種方向按鍵/放鍵停止通過；48方向高速碰撞/障礙滑動/斜牆/固定相機通過。');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
