/* 回饋視窗共用族譜原生 ui-dialog 外框，僅表單內容載入子頁。
   不修改畫布、人物資料、家族排列或其他視窗。 */
document.addEventListener('DOMContentLoaded',()=>{
  const backdrop=document.getElementById('genealogyFeedbackDialog');
  const panel=backdrop?.querySelector('.genealogy-feedback-panel');
  const openButton=document.getElementById('feedbackBtn');
  const closeButton=document.getElementById('genealogyFeedbackCloseBtn');
  const threadButton=document.getElementById('genealogyFeedbackThreadBtn');
  const frame=document.getElementById('genealogyFeedbackFrame');
  if(!backdrop||!panel||!openButton||!closeButton||!threadButton||!frame)return;

  const themeVariables={
    '--bg':'--surface-canvas',
    '--surface':'--surface-card',
    '--subtle':'--surface-panel',
    '--subtle-2':'--surface-panel',
    '--ink':'--text-primary',
    '--muted':'--text-secondary',
    '--faint':'--text-secondary',
    '--stroke':'--border-default',
    '--line':'--border-default',
    '--primary':'--action-primary',
    '--primary-hover':'--action-primary-hover',
    '--primary-pale':'--brand-tint-start',
    '--primary-line':'--border-default'
  };

  let lastFocus=null;

  function syncTheme(){
    if(!frame.contentWindow)return;
    const computed=getComputedStyle(document.body);
    const variables={};
    for(const [childName,parentName] of Object.entries(themeVariables)){
      variables[childName]=computed.getPropertyValue(parentName).trim();
    }
    frame.contentWindow.postMessage({type:'l1ng-feedback-theme',variables},window.location.origin);
  }

  function openFeedback(showThread=false){
    if(!backdrop.classList.contains('show')){
      lastFocus=document.activeElement;
      const more=document.getElementById('topbarMoreBtn');
      if(more?.getAttribute('aria-expanded')==='true')more.click();
      backdrop.classList.add('show');
      backdrop.setAttribute('aria-hidden','false');
      panel.focus({preventScroll:true});
    }
    syncTheme();
    if(showThread){
      frame.contentWindow?.postMessage({type:'l1ng-feedback-open-thread'},window.location.origin);
    }
  }

  function closeFeedback(){
    if(!backdrop.classList.contains('show'))return;
    backdrop.classList.remove('show');
    backdrop.setAttribute('aria-hidden','true');
    if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
    lastFocus=null;
  }

  openButton.addEventListener('click',()=>openFeedback());
  threadButton.addEventListener('click',()=>openFeedback(true));
  closeButton.addEventListener('click',closeFeedback);
  backdrop.addEventListener('pointerdown',event=>{
    if(event.target===backdrop)closeFeedback();
  });
  backdrop.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeFeedback();}
    if(event.key==='Tab'){
      const focusable=Array.from(backdrop.querySelectorAll('button:not([disabled]),iframe,[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  frame.addEventListener('load',syncTheme);

  const themeObserver=new MutationObserver(()=>{
    if(backdrop.classList.contains('show'))syncTheme();
  });
  themeObserver.observe(document.body,{attributes:true,attributeFilter:['data-theme','class','style']});
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class','style']});

  window.addEventListener('message',event=>{
    if(event.origin!==window.location.origin||event.source!==frame.contentWindow)return;
    if(event.data?.type==='l1ng-feedback-close')closeFeedback();
    if(event.data?.type==='l1ng-feedback-child-ready')syncTheme();
  });
});