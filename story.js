'use strict';
globalThis.StorySystem = (() => {
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
    constructor({onChange=()=>{},onPuzzle=()=>{},onFinished=()=>{}}={}) {
      Object.assign(this,{onChange,onPuzzle,onFinished,mode:'loading',paused:false,chapterIndex:0,lineIndex:0,revision:0,generation:0,lastAdvance:-Infinity}); this.cancelHold();
    }
    notify() {this.revision++;this.onChange(this.snapshot());}
    snapshot() {
      const active=['opening','ending'].includes(this.mode),chapter=active?this.chapters[this.chapterIndex]:null,line=chapter?.lines[this.lineIndex];
      return {mode:this.mode,paused:this.paused,revision:this.revision,chapter:chapter?.title||'',chapterId:chapter?.id||null,
        chapterKey:chapter?`${this.mode}:${this.chapterIndex}`:'',background:chapter?.background||null,
        characters:chapter?[...chapter.characters]:[],speaking:line?[...line.actors]:[],speaker:line?.speaker||'',
        text:line?.text||(this.mode==='error'?this.error:''),lineIndex:this.lineIndex,lineCount:chapter?.lines.length||0};
    }
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
    advance(now) {
      if(this.paused||!['opening','ending'].includes(this.mode)||now-this.lastAdvance<160) return false;
      this.lastAdvance=now;this.lineIndex++;
      if(this.lineIndex>=this.chapters[this.chapterIndex].lines.length) {
        this.lineIndex=0;this.chapterIndex++;
        if(this.chapterIndex>=this.chapters.length) {
          const opening=this.mode==='opening';this.mode=opening?'puzzle':'finished';this.cancelHold();this.notify();
          if(opening)this.onPuzzle();else this.onFinished();return true;
        }
      }
      this.notify();return true;
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
    completeEscape(confirmed) {
      // N6 只在真正通過出口後呼叫，畫面沒有跳結尾按鈕。
      if(confirmed!==true||this.mode!=='puzzle'||!this.ending?.length) return false;
      this.chapters=this.ending;this.chapterIndex=0;this.lineIndex=0;this.mode='ending';this.paused=false;
      this.lastAdvance=-Infinity;this.cancelHold();this.notify();return true;
    }
  }
  function mount({document,target,onPuzzle,clearInput=()=>{},preview=false}) {
    const get=id=>document.getElementById(id),layer=get('story-layer'),background=get('story-background'),cast=get('story-cast');
    const dialogue=get('story-dialogue'),chapterLabel=get('story-chapter'),speaker=get('story-speaker'),text=get('story-text');
    const pause=get('story-pause'),status=get('story-status'),statusText=get('story-status-text'),retry=get('story-retry');
    const localMode = target.location.protocol === 'file:';
    const localPicker = get('story-local-picker'), localFiles = get('story-local-files');
    let chapterKey='',lastRevision=-1,lastLine='';
    const assetErrors=new Set(),assetWarning=get('story-asset-warning');
    const showErrors=()=>{assetWarning.textContent=assetErrors.size?`圖片載入失敗：${[...assetErrors].join('、')}，請確認圖檔後重新整理。`:'';assetWarning.hidden=assetErrors.size===0;};
    background.addEventListener('error',()=>{assetErrors.add(background.getAttribute('src'));showErrors();});
    const controller=new Controller({onPuzzle,onChange:render});
    function render(state) {
      if(lastRevision===state.revision)return;lastRevision=state.revision;
      const active=['opening','ending'].includes(state.mode);
      layer.hidden=state.mode==='puzzle';dialogue.hidden=!active;pause.hidden=!active;background.hidden=!active;cast.hidden=!active;
      status.hidden=active||state.mode==='puzzle';retry.hidden=localMode||state.mode!=='error';
      localPicker.hidden = !localMode || !['awaiting-files', 'error'].includes(state.mode);
      statusText.textContent=state.mode==='finished'?'全劇終\n感謝遊玩《密室逃脫之在杰難逃》':state.mode==='error'?state.text:state.mode==='awaiting-files'?'請選取劇本，開始遊戲':'正在載入劇情…';
      get('door-labels').hidden=state.mode!=='puzzle';
      pause.textContent=state.paused?'繼續':'暫停';pause.setAttribute('aria-pressed',String(state.paused));
      dialogue.setAttribute('aria-disabled',String(state.paused));
      get('story-guidance').textContent=state.paused?'已暫停 · 按右上角「繼續」恢復':'左鍵／空白鍵 下一句 · 按住 1.5 秒快轉（每秒 4 句），放開即停';
      if(!active) {
        background.removeAttribute('src');cast.replaceChildren();chapterKey='';lastLine='';
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
    retry.addEventListener('click',()=>controller.load(target.fetch.bind(target)));
    localFiles.addEventListener('change', () => {
      const files = Array.from(localFiles.files);
      localFiles.value = '';
      if (files.length) controller.loadFiles(files);
    });
    if(preview) {controller.mode='puzzle';controller.notify();}
    else if(localMode) {controller.mode='awaiting-files';controller.notify();}
    else controller.load(target.fetch.bind(target));
    return controller;
  }
  return {parse,portraits,Controller,mount};
})();
