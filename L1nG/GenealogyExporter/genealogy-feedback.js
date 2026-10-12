
/* 回饋表單只操作自己的 dialog，不碰族譜畫布或相關事件 */
document.addEventListener('DOMContentLoaded',()=>{
  const dialog=document.getElementById('genealogyFeedbackDialog');
  const button=document.getElementById('feedbackBtn');
  const frame=document.getElementById('genealogyFeedbackFrame');
  if(!dialog||!button||!frame)return;
  button.addEventListener('click',()=>{
    if(dialog.open)return;
    const more=document.getElementById('topbarMoreBtn');
    if(more&&more.getAttribute('aria-expanded')==='true')more.click();
    dialog.showModal();
  });
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
    if(event.data?.type==='l1ng-feedback-close'&&dialog.open)dialog.close();
  });
});
