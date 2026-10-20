// 共用選取指示器：編輯分頁水平底線；總覽桌面直向膠囊、手機水平底線。
(() => {
  const configs = [
    {selector:'.sim-editor-tabs:not(.pet-editor-tabs)', item:'.sim-editor-tab', kind:'line'},
    {selector:'.pet-editor-tabs', item:'.pet-editor-tab', kind:'line'},
    {selector:'.person-library-category-tabs', item:'button[role="tab"]', kind:'adaptive'}
  ];
  function mount(config) {
    const root = document.querySelector(config.selector);
    if (!root || root.querySelector(':scope > .l1ng-selection-indicator')) return;
    const indicator = document.createElement('span');
    indicator.className = 'l1ng-selection-indicator';
    indicator.setAttribute('aria-hidden','true');
    root.append(indicator);
    let previous = null;
    function refresh() {
      const active = root.querySelector(config.item+'.active') ||
        [...root.querySelectorAll(config.item)].find(el=>el.getAttribute('aria-selected')==='true');
      if (!active || active.hidden || !active.getClientRects().length || !root.getClientRects().length) {
        root.classList.remove('l1ng-indicator-ready');
        return;
      }
      const bounds = root.getBoundingClientRect(), rect=active.getBoundingClientRect();
      const isMobile = config.kind==='adaptive' && matchMedia('(max-width:720px)').matches;
      const x=rect.left-bounds.left+root.scrollLeft+(config.kind==='line'?14:isMobile?1:0);
      const y=rect.top-bounds.top+root.scrollTop;
      const w=rect.width-(config.kind==='line'?28:isMobile?2:0);
      const h=rect.height;
      const state=[x,y,w,h,isMobile].join(':');
      if(state===previous)return;
      previous=state;
      root.style.setProperty('--l1ng-indicator-x',x+'px');
      root.style.setProperty('--l1ng-indicator-y',y+'px');
      root.style.setProperty('--l1ng-indicator-width',Math.max(0,w)+'px');
      root.style.setProperty('--l1ng-indicator-height',h+'px');
      root.classList.add('l1ng-indicator-ready');
    }
    let queued=false;
    const request=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh();});};
    const observer=new MutationObserver(request);
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class','hidden','style','aria-selected']});
    if('ResizeObserver' in window){const resize=new ResizeObserver(request);resize.observe(root);root.querySelectorAll(config.item).forEach(el=>resize.observe(el));}
    else window.addEventListener('resize',request,{passive:true});
    root.addEventListener('scroll',request,{passive:true});
    root.addEventListener('click',request);
    document.fonts?.ready.then(request).catch(()=>{});
    request();
  }
  function init(){configs.forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
