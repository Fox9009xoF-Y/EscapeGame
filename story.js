'use strict';
globalThis.StorySystem = (() => {
  // BEGIN EMBEDDED STORY
  const builtInTexts = Object.freeze({"opening":"第一章 杰難之地 \r\n      某天阿偉和彬彬去網咖打電動，打完之後肚子很餓\r\n      阿偉：ㄟ彬彬，我又被我阿嬤趕出門了啦，晚上去你家住好不好?\r\n      彬彬：不行啦，我爸很兇餒\r\n      阿偉：阿不然你有錢嗎?現在肚子很餓耶\r\n      彬彬：沒有啊，沒錢我們就只能回家~\r\n      此時一位年約20，戴著黑框眼鏡體格壯碩的光頭男子走了過來\r\n      光頭男子：我看你們好像很餓，來，我這裡剛好有些麵包，看你們要不要吃\r\n      阿偉：這樣好嗎...\r\n      光頭男子：啊對了，附近的人都叫我杰哥，你們叫我阿杰就好\r\n      阿偉彬彬：杰哥好\r\n      杰哥：那這個麵包就給你們了，我一個人住，我家還蠻大的，歡迎你們來玩，玩累了就直接睡，沒問題的\r\n      阿偉：真的喔，那今晚我們就去你家住了喔\r\n\r\n第二章 搶杰超商\r\n      時間來到傍晚時分，杰哥帶著阿偉和彬彬去超商買晚餐和宵夜\r\n      杰哥：來，你們隨便拿，我請\r\n      阿偉：這樣不太好吧杰哥\r\n      杰哥：沒關係隨便拿\r\n      阿偉：杰哥，超商是你家開的喔，這麼慷慨\r\n      彬彬：阿偉你看，是泡芙耶\r\n      杰哥：拿~都拿\r\n      阿偉：杰哥，是酒欸\r\n      杰哥：隨便拿沒關係，盡量拿\r\n      採買完後杰哥就帶著阿偉和彬彬回家了\r\n\r\n第三章 一路杰難\r\n      三個人一路喝酒喝到午夜，彬彬已經先醉得不省人事了\r\n      阿偉：你看這個彬彬就是遜啦，才喝幾杯就不行了\r\n      杰哥：這麼貼你說，你很勇喔\r\n      阿偉：拜託~我超勇的好不好\r\n      杰哥：喲~身材不錯嘛\r\n      阿偉：傑哥你幹嘛啊\r\n      杰哥：來，要不要來我房間，有好康的，還能讓你登大人喔\r\n      阿偉：杰哥，甚麼好康的，是新遊戲喔?\r\n      杰哥：喲，我看你完全是不懂喔~\r\n      阿偉：懂什麼啊杰哥?\r\n      杰哥：來，來我房間就知道了\r\n      阿偉：杰哥，酒...\r\n      杰哥：拿拿拿...\r\n\r\n第四章 杰杰進攻\r\n      阿偉：杰哥，你收藏好多迷片喔\r\n      杰哥：啊那些沒甚麼，來看這個\r\n      阿偉：杰哥...這什麼啊?\r\n      杰哥：喲，你臉紅啦?來，讓我看看\r\n      阿偉：杰哥你幹嘛?\r\n      杰哥：讓我看看你發育正不正常啊\r\n      阿偉：不要啦杰哥\r\n      一陣拉扯中阿偉推開了杰哥，杰哥摘下他的黑框眼鏡\r\n      杰哥：聽話~讓我看看\r\n      阿偉：不要\r\n      杰哥揍了阿偉一拳後阿偉就不省人事了\r\n\r\n第五章 杰外生吱\r\n      當阿偉再次醒來，四周一片漆黑，四處摸索後稍微適應了黑暗的空間，發現杰哥家有三個房間，分別是客廳、臥室及書房，以及時不時傳來的老鼠吱叫聲\r\n      阿偉：這什麼鬼地方，這裡還是杰哥的房間嗎?怎麼不記得有這麼大?目測每個房間至少都有20坪啊!果然杰哥所言無誤...咦，床底下怎麼有聲音?\r\n      阿偉把手機翻出來，上面還有一則錄音，阿偉毫不猶豫的就點下去了\r\n      手機錄音：阿偉，我是彬彬，這些房間有著一堆機關，不管是地毯、書桌或是書櫃都翻看看，解開所有機關應該就能逃離這裡，只是當所有機關解開後就會觸發杰哥所設的警報器，到時候需要跑得夠快才不會被他追上\r\n      阿偉：啥鬼?怎麼還有追逐戰啊?\r\n      手機錄音：總之，帶著我的手機一起逃離這裡，逃出去之後我們學校門口見，如果到時候沒看到我的話，那就代表我沒逃離成功，祝你好運...\r\n      阿偉：彬彬應該沒事吧，都把手機留在這裡而且還先自己逃跑了，總之先看看這個房間有什麼好了\r\n","ending":"第六章：杰後餘生\r\n      阿偉依約來到校門口\r\n      阿偉：彬彬呢？該不會沒逃出來吧?是說我在裡面也不知道昏迷了多久，而且他也沒說什麼時候集合...\r\n      此時阿偉的阿嬤出現了\r\n      阿嬤：阿偉，昨天晚上是給我死去哪裡了?找你找一整個晚上！\r\n      阿偉：我再找彬彬啦，他不知道去哪了\r\n      阿嬤：先不要管他去哪裡了，先跟我回家，家裡的衣服碗筷都還沒洗，房間也還沒打掃，書也還沒讀，還想去找彬彬？\r\n      阿偉：煩欸，等一下他要是死了就都你害的啦\r\n      說完阿偉就從學校門口跑走了，但也不知道要去哪裡，最後來到了附近的公園，漫無目的的遊走，剛好遇到學校的老師(淑惠阿姨)\r\n      淑惠阿姨：欸？阿偉？你怎麼一個人在這裡？\r\n      於是阿偉坐下來向淑惠阿姨說明了一切原由\r\n      淑惠阿姨：原來如此，我明白了，我會打電話給妳阿嬤說一下情況，你就先跟我回學校...\r\n      此時阿嬤騎著機車出現，往旁邊一停下了車\r\n      阿嬤：阿偉，就知道你在這裡，立刻跟我回家，別再找那個什麼彬彬了，下次再這樣自己跑出門就別想打電動了！\r\n      淑惠阿姨：喔阿偉阿嬤，請容我說明一下情況...\r\n      淑惠阿姨話還沒說完阿偉就被阿嬤拽著耳朵拖走上了機車回家了，就是苦了彬彬在學校門口罰站兩小時給蚊子咬\r\n      全劇終"});
  // END EMBEDDED STORY
  const backgrounds = ['網咖.png','超商.png','杰哥客廳.png','杰哥房間.png','杰哥客廳.png','公園.png'];
  const portraits = Object.freeze({阿偉:'阿偉.webp',彬彬:'彬彬.webp',杰哥:'杰哥.webp',阿偉阿嬤:'阿偉阿嬤.webp',淑惠阿姨:'淑惠阿姨.webp'});
  const aliases = {傑哥:['杰哥'],光頭男子:['杰哥'],阿偉彬彬:['阿偉','彬彬'],手機錄音:['彬彬'],阿嬤:['阿偉阿嬤']};
  function parse(text) {
    const chapters=[];
    for(const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)) {
      const header=raw.match(/^第([一二三四五六\d]+)章[：:\s]*(.*)$/);
      if(header) {
        const id=Number(header[1])||'一二三四五六'.indexOf(header[1])+1;
        if(!backgrounds[id-1]) throw Error('劇本章節尚無對應背景：'+raw);
        chapters.push({id,title:raw,background:backgrounds[id-1],characters:[],lines:[]}); continue;
      }
      const chapter=chapters[chapters.length-1];
      if(!chapter) throw Error('劇本缺少章節標題。');
      const dialogue=raw.match(/^([^：:]{1,16})[：:](.*)$/), speaker=dialogue?dialogue[1]:'';
      const actors=aliases[speaker]||(portraits[speaker]?[speaker]:[]);
      for(const actor of actors) if(!chapter.characters.includes(actor)) chapter.characters.push(actor);
      chapter.lines.push({raw,speaker,text:dialogue?dialogue[2]:raw,actors});
    }
    if(!chapters.length||chapters.some(c=>!c.lines.length)) throw Error('劇本章節缺少對話內容。');
    return chapters;
  }
  class Controller {
    constructor({onChange=()=>{},onPuzzle=()=>{},onFinished=()=>{},transition=action=>{action();return true;}}={}) {
      Object.assign(this,{onChange,onPuzzle,onFinished,transition,mode:'loading',paused:false,chapterIndex:0,lineIndex:0,revision:0,generation:0,lastAdvance:-Infinity}); this.cancelHold();
    }
    notify() {this.revision++;this.onChange(this.snapshot());}
    snapshot() {
      const active=['opening','ending'].includes(this.mode),chapter=active?this.chapters[this.chapterIndex]:null,line=chapter?.lines[this.lineIndex];
      return {mode:this.mode,paused:this.paused,revision:this.revision,chapter:chapter?.title||'',chapterId:chapter?.id||null,
        chapterKey:chapter?`${this.mode}:${this.chapterIndex}`:'',background:chapter?.background||null,
        characters:chapter?[...chapter.characters]:[],speaking:line?[...line.actors]:[],speaker:line?.speaker||'',
        text:line?.text||(this.mode==='error'?this.error:''),lineIndex:this.lineIndex,lineCount:chapter?.lines.length||0};
    }
    loadEmbedded(texts=builtInTexts){this.generation++;this.paused=false;this.cancelHold();try{this.opening=parse(texts.opening);this.ending=parse(texts.ending);this.chapterIndex=0;this.lineIndex=0;this.mode='title';}catch(error){this.mode='error';this.error='劇情載入失敗：'+error.message;}this.notify();}
    startGame(){if(this.mode!=='title')return false;return this.performTransition(()=>{this.chapters=this.opening;this.chapterIndex=0;this.lineIndex=0;this.lastAdvance=-Infinity;this.paused=false;this.cancelHold();this.mode='opening';this.notify();});}
    async load(fetcher) {
      const generation=++this.generation;
      this.mode='loading';this.paused=false;this.cancelHold();this.notify();
      try {
        const scripts=await Promise.all(['story1.txt','story2.txt'].map(async path=>{
          const response=await fetcher(path,{cache:'no-store'});
          if(!response.ok) throw Error(`${path} (${response.status||'讀取失敗'})`);
          return parse(await response.text());
        }));
        if(generation!==this.generation) return;
        [this.opening,this.ending]=scripts;this.chapters=this.opening;this.chapterIndex=0;this.lineIndex=0;
        this.lastAdvance=-Infinity;this.mode='opening';this.notify();
      } catch(error) {
        if(generation!==this.generation) return;
        this.mode='error';this.error=`劇情載入失敗：${error.message}。請確認檔案後重試。`;this.notify();
      }
    }
    loadFiles(files) {
      const selected = Array.from(files);
      // 與 HTTP 共用解析、錯誤處理及競態保護，只替換讀取來源。
      return this.load(async path => {
        for (const name of ['story1.txt', 'story2.txt']) {
          if (selected.filter(file => file.name.toLowerCase() === name).length !== 1) {
            throw Error('請各選取一份 story1.txt 與 story2.txt');
          }
        }
        const file = selected.find(file => file.name.toLowerCase() === path);
        return { ok: true, text: () => file.text() };
      });
    }
    performTransition(action){if(this.transitionPending)return false;this.transitionPending=true;const accepted=this.transition(()=>{this.transitionPending=false;action();});if(accepted===false)this.transitionPending=false;return accepted!==false;}
    advance(now) {
      if(this.paused||this.transitionPending||!['opening','ending'].includes(this.mode)||now-this.lastAdvance<160)return false;
      this.lastAdvance=now;const chapter=this.chapters[this.chapterIndex];
      if(this.lineIndex===chapter.lines.length-1&&this.chapterIndex===this.chapters.length-1){const opening=this.mode==='opening';this.cancelHold();return this.performTransition(()=>{this.lineIndex=0;this.chapterIndex=this.chapters.length;this.mode=opening?'puzzle':'finished';this.notify();if(opening)this.onPuzzle();else this.onFinished();});}
      this.lineIndex++;if(this.lineIndex>=chapter.lines.length){this.lineIndex=0;this.chapterIndex++;}this.notify();return true;
    }
    press(source,now,repeat=false) {
      if(repeat||this.paused||this.holdSource||!['opening','ending'].includes(this.mode)) return;
      this.holdSource=source;this.nextAdvance=now+1500;this.advance(now);
    }
    release() {this.cancelHold();}
    cancelHold() {this.holdSource=null;this.nextAdvance=Infinity;}
    tick(now) {
      if(this.holdSource&&!this.paused&&now>=this.nextAdvance) {
        // 不補播背景停頓或低幀率期間的多句台詞。
        this.nextAdvance=now+250;this.advance(now);
      }
    }
    setPaused(paused) {this.paused=paused;this.cancelHold();this.notify();}
    showSuccess(){if(this.mode!=='puzzle')return false;return this.performTransition(()=>{this.mode='success';this.cancelHold();this.notify();});}
    completeEscape(confirmed) {
      if(confirmed!==true||!['puzzle','success'].includes(this.mode)||!this.ending?.length)return false;
      return this.performTransition(()=>{this.chapters=this.ending;this.chapterIndex=0;this.lineIndex=0;this.mode='ending';this.paused=false;this.lastAdvance=-Infinity;this.cancelHold();this.notify();});
    }

  }
  function mount({document,target,onPuzzle,clearInput=()=>{},preview=false,transition=action=>{action();return true;}}) {
    const get=id=>document.getElementById(id),layer=get('story-layer'),background=get('story-background'),cast=get('story-cast');
    const dialogue=get('story-dialogue'),chapterLabel=get('story-chapter'),speaker=get('story-speaker'),text=get('story-text');
    const pause=get('story-pause'),status=get('story-status'),statusText=get('story-status-text'),retry=get('story-retry');
    const titlePage=get('game-title-page'),start=get('game-start');
    let chapterKey='',lastRevision=-1,lastLine='';
    const assetErrors=new Set(),assetWarning=get('story-asset-warning');
    const showErrors=()=>{assetWarning.textContent=assetErrors.size?`圖片載入失敗：${[...assetErrors].join('、')}，請確認圖檔後重新整理。`:'';assetWarning.hidden=assetErrors.size===0;};
    background.addEventListener('error',()=>{assetErrors.add(background.getAttribute('src'));showErrors();});
    const controller=new Controller({onPuzzle,onChange:render,transition});
    function render(state) {
      if(lastRevision===state.revision)return;lastRevision=state.revision;
      const active=['opening','ending'].includes(state.mode);
      layer.hidden=state.mode==='puzzle';dialogue.hidden=!active;pause.hidden=!active;background.hidden=!active;cast.hidden=!active;
      status.hidden=active||state.mode==='puzzle'||state.mode==='title';retry.hidden=state.mode!=='error';titlePage.hidden=state.mode!=='title';get('escape-success').hidden=state.mode!=='success';if(state.mode==='success')status.hidden=true;
      statusText.textContent=state.mode==='finished'?'全劇終\n感謝遊玩《密室逃脫之在杰難逃》':state.mode==='error'?state.text:state.mode==='awaiting-files'?'請選取劇本，開始遊戲':'正在載入劇情…';
      get('door-labels').hidden=state.mode!=='puzzle';
      pause.textContent=state.paused?'繼續':'暫停';pause.setAttribute('aria-pressed',String(state.paused));
      dialogue.setAttribute('aria-disabled',String(state.paused));
      get('story-guidance').textContent=state.paused?'已暫停 · 按右上角「繼續」恢復':'左鍵／空白鍵 下一句 · 按住 1.5 秒快轉（每秒 4 句），放開即停';
      if(!active) {
        if(state.mode==='title'){background.src='杰哥客廳.png';background.hidden=false;}else background.removeAttribute('src');cast.replaceChildren();chapterKey='';lastLine='';
        chapterLabel.textContent='';speaker.textContent='';text.textContent='';assetErrors.clear();showErrors();clearInput();return;
      }
      if(chapterKey!==state.chapterKey) {
        cast.replaceChildren();chapterKey=state.chapterKey;assetErrors.clear();showErrors();background.src=state.background;
        for(const actor of state.characters) {
          const img=document.createElement('img');img.src=portraits[actor];img.alt=actor;img.dataset.actor=actor;
          img.addEventListener('error',()=>{assetErrors.add(portraits[actor]);showErrors();});cast.append(img);
        }
      }
      chapterLabel.textContent=state.chapter;speaker.textContent=state.speaker||'旁白';text.textContent=state.text;
      const lineKey=`${state.chapterKey}:${state.lineIndex}`;
      for(const img of cast.children) {
        const speaking=state.speaking.includes(img.dataset.actor);img.classList.toggle('is-speaking',speaking);
        if(state.paused) for(const a of img.getAnimations())a.pause();
        else if(lastLine===lineKey) for(const a of img.getAnimations())a.play();
        else {
          for(const a of img.getAnimations())a.cancel();
          if(speaking)img.animate([{transform:'translateY(0)'},{transform:'translateY(-14px)',offset:0.45},{transform:'translateY(0)'}],{duration:280,easing:'ease-in-out'});
        }
      }
      lastLine=lineKey;
    }
    const now=()=>target.performance.now(),editable=e=>e.target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target?.tagName);
    target.addEventListener('pointerdown',e=>{
      if(e.button===0&&controller.mode==='success'){e.preventDefault();controller.completeEscape(true);return;}
      if(e.button!==0||!['opening','ending'].includes(controller.mode)||editable(e))return;e.preventDefault();dialogue.focus({preventScroll:true});dialogue.setPointerCapture(e.pointerId);controller.press('pointer',now());
    });
    target.addEventListener('pointerup',()=>controller.release());target.addEventListener('pointercancel',()=>controller.cancelHold());
    target.addEventListener('keydown',e=>{
      if(!['opening','ending'].includes(controller.mode)||editable(e))return;
      if(e.code!=='Space'&&!(e.code==='Enter'&&e.target===dialogue))return;
      e.preventDefault();controller.press('keyboard',now(),e.repeat);
    });
    target.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter')controller.release();});
    const stop=()=>{controller.cancelHold();clearInput();};target.addEventListener('blur',stop);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    pause.addEventListener('click',()=>{controller.setPaused(!controller.paused);clearInput();});
    retry.addEventListener('click',()=>controller.loadEmbedded());
    start.addEventListener('click',()=>{clearInput();controller.startGame();});
    if(preview) {controller.mode='puzzle';controller.notify();}
    else controller.loadEmbedded();
    return controller;
  }
  return {parse,portraits,builtInTexts,Controller,mount};
})();
