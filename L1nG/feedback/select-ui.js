/* 網站共用自訂下拉選單：保留原生 select 作為資料與鍵盤語義來源。 */
(()=>{'use strict';
const registry=new Map();let opened=null;
function close(){if(!opened)return;opened.panel.hidden=true;opened.button.setAttribute('aria-expanded','false');opened=null;}
function position(entry){if(!entry||entry.panel.hidden)return;const r=entry.button.getBoundingClientRect();const w=entry.feedbackFilter?r.width:Math.max(180,r.width);const roomBelow=innerHeight-r.bottom;const roomAbove=r.top;const below=roomBelow>210||roomBelow>=roomAbove;const max=Math.min(320,Math.max(110,(below?roomBelow:roomAbove)-14));entry.panel.style.width=Math.min(w,innerWidth-20)+'px';entry.panel.style.left=Math.max(10,Math.min(r.left,innerWidth-Math.min(w,innerWidth-20)-10))+'px';entry.panel.style.maxHeight=max+'px';entry.panel.style.top=below?(r.bottom+5)+'px':'';entry.panel.style.bottom=below?'':(innerHeight-r.top+5)+'px';}
// 管理中心問題反饋的三個篩選器：以最長選項計算穩定寬度。
function sizeFeedbackFilter(entry){
 if(!entry.feedbackFilter)return;
 const {select,button,wrapper}=entry;
 const style=getComputedStyle(button);
 const ruler=document.createElement('span');
 ruler.style.cssText='position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;white-space:nowrap';
 ruler.style.fontFamily=style.fontFamily;
 ruler.style.fontSize=style.fontSize;
 ruler.style.fontWeight=style.fontWeight;
 ruler.style.fontStyle=style.fontStyle;
 ruler.style.letterSpacing=style.letterSpacing;
 document.body.append(ruler);
 let longest=0;
 for(const option of select.options){
  if(option.hidden)continue;
  ruler.textContent=option.textContent.trim();
  longest=Math.max(longest,ruler.getBoundingClientRect().width);
 }
 ruler.remove();
 const px=value=>parseFloat(value)||0;
 const space=px(style.paddingLeft)+px(style.paddingRight)+px(style.borderLeftWidth)+px(style.borderRightWidth);
 wrapper.style.setProperty('--feedback-filter-option-width',Math.ceil(longest+space+6)+'px');
}
function refresh(entry){
 const {select,button,panel}=entry;
 const selected=select.options[select.selectedIndex];
 button.textContent=selected?selected.textContent.trim():'請選擇';
 button.disabled=select.disabled;
 button.setAttribute('aria-label',(select.getAttribute('aria-label')||select.id||'選擇')+'：'+button.textContent);
 panel.replaceChildren();
 for(const option of select.options){
  if(option.disabled||option.hidden)continue;
  const item=document.createElement('button');item.type='button';item.className='l1ng-select-item';item.role='option';item.textContent=option.textContent.trim();item.setAttribute('aria-selected',String(option.selected));
  if(option.selected)item.classList.add('selected');
  item.addEventListener('click',()=>{
   select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));refresh(entry);close();button.focus({preventScroll:true});
  });panel.appendChild(item);
 }
 sizeFeedbackFilter(entry);
 position(entry);
}
function enhance(select){
 if(registry.has(select)||select.multiple||select.size>1)return;
 const wrapper=document.createElement('span');wrapper.className='l1ng-select';
 const button=document.createElement('button');button.type='button';button.className='l1ng-select-trigger';button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
 const panel=document.createElement('div');panel.className='l1ng-select-panel';panel.role='listbox';panel.hidden=true;
 wrapper.appendChild(button);select.insertAdjacentElement('afterend',wrapper);document.body.appendChild(panel);
 select.classList.add('l1ng-select-native');
 const feedbackFilter=!!select.closest('#panel-feedback .feedback-filter-grid');
 const entry={select,button,panel,wrapper,feedbackFilter};registry.set(select,entry);
 window.L1nGRefreshSelect=window.L1nGRefreshSelect||((node)=>{const e=registry.get(node);if(e)refresh(e);});
 button.addEventListener('click',()=>{if(opened===entry){close();return;}close();refresh(entry);panel.hidden=false;opened=entry;button.setAttribute('aria-expanded','true');position(entry)});
 button.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='Enter'||e.key===' '){if(!opened){e.preventDefault();button.click();}else if(e.key==='ArrowDown'){e.preventDefault();panel.querySelector('button')?.focus()}}});
 panel.addEventListener('keydown',e=>{const choices=Array.from(panel.querySelectorAll('button'));const idx=choices.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();close();button.focus()}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();choices[Math.max(0,Math.min(choices.length-1,idx+(e.key==='ArrowDown'?1:-1)))]?.focus()}});
 select.addEventListener('change',()=>refresh(entry));
 select.addEventListener('input',()=>refresh(entry));
 new MutationObserver(()=>refresh(entry)).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','hidden']});
 refresh(entry);
}
function init(){document.querySelectorAll('select:not([data-native-select])').forEach(enhance);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('pointerdown',e=>{if(opened&&!opened.panel.contains(e.target)&&!opened.button.contains(e.target))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
document.addEventListener('scroll',()=>{if(opened)position(opened)},{capture:true,passive:true});
window.addEventListener('resize',()=>{for(const entry of registry.values())if(entry.feedbackFilter)sizeFeedbackFilter(entry);if(opened)position(opened)});
})();