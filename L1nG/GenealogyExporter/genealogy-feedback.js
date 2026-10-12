/* 問題反饋視窗沿用族譜主題變數，不修改畫布互動。 */
document.addEventListener('DOMContentLoaded',()=>{
 const dialog=document.getElementById('genealogyFeedbackDialog');
 const button=document.getElementById('feedbackBtn');
 const frame=document.getElementById('genealogyFeedbackFrame');
 if(!dialog||!button||!frame)return;
 const vars={'--bg':'--surface-canvas','--surface':'--surface-card','--subtle':'--surface-panel','--subtle-2':'--surface-panel','--ink':'--text-primary','--muted':'--text-secondary','--faint':'--text-secondary','--stroke':'--border-default','--line':'--border-default','--primary':'--action-primary','--primary-hover':'--action-primary-hover','--primary-pale':'--brand-tint-start','--primary-line':'--border-default'};
 function themeData(){
  const style=getComputedStyle(document.body);
  const values={};
  for(const [target,source] of Object.entries(vars))values[target]=style.getPropertyValue(source).trim();
  return{type:'l1ng-feedback-theme',variables:values};
 }
 function syncTheme(){
  if(!frame.contentWindow)return;
  frame.contentWindow.postMessage(themeData(),window.location.origin);
 }
 button.addEventListener('click',()=>{
  if(dialog.open)return;
  const more=document.getElementById('topbarMoreBtn');
  if(more&&more.getAttribute('aria-expanded')==='true')more.click();
  dialog.showModal();syncTheme();
 });
 frame.addEventListener('load',syncTheme);
 const observer=new MutationObserver(()=>{if(dialog.open)syncTheme()});
 observer.observe(document.body,{attributes:true,attributeFilter:['data-theme','class','style']});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class','style']});
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='l1ng-feedback-close'&&dialog.open)dialog.close();
 });
});
