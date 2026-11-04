// 舊地圖驗證預期進入客廳；新版預設先播放劇情。
// 不修改舊測試或斷言：在原 goto 完成後，使用真正空白鍵逐句播放開場，再執行原測試。
const {chromium}=require('playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=async function(...args){
 const browser=await launch(...args),newPage=browser.newPage.bind(browser);
 browser.newPage=async function(...options){
  const page=await newPage(...options),goto=page.goto.bind(page);
  page.goto=async function(url,...settings){
   const response=await goto(url,...settings),parsed=new URL(url);
   if(parsed.pathname==='/'&&!parsed.search){
    await page.waitForFunction(()=>typeof storyController!=='undefined'&&storyController.mode==='opening');
    while(await page.evaluate(()=>storyController.mode==='opening')){
     await page.keyboard.press('Space');await page.waitForTimeout(175);
    }
    await page.waitForFunction(()=>storyController.mode==='puzzle');
   }
   return response;
  };
  return page;
 };
 return browser;
};
