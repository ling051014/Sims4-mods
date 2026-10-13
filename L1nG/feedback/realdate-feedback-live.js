/* RealDate 正式回饋：沿用既有表單、成功頁與匿名對話外觀，不使用展示資料。 */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const core=window.L1nGFeedbackCore;
  if(!core || !$('feedback-form'))return;
  let category='bug', files=[], replyFiles=[], verifier=null, replyVerifier=null, activeReceipt='', current=null, lastReceipt='';
  const siteKeyHost=$('verify-card');
  const setError=msg=>{
    $('submit-error-detail').textContent=msg;
    $('submit-error-summary').hidden=!msg;
  };
  const show=(id)=>{for(const name of ['form-main','success-pane','thread-pane']){const el=$(name);el.classList.toggle('hide',id!==name);if(name==='form-main')el.style.display=id===name?'flex':'none';}};
  const describeFile=f=>f.name+' · '+Math.max(1,Math.round(f.size/1024))+' KB';
  const displayFiles=(list,node)=>{
    node.replaceChildren();
    list.forEach((file,i)=>{
      const row=document.createElement('div');row.className='file-entry feedback-attachment-row';
      const span=document.createElement('span');span.className='feedback-attachment-name';
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('feedback-paperclip');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','m8.5 12.5 6.5-6.5a3.5 3.5 0 0 1 5 5l-9.5 9.5a5.5 5.5 0 0 1-8-7.5L13 3');svg.append(path);
      const label=document.createElement('span');label.textContent=file.name;
      const size=document.createElement('small');size.textContent=Math.max(1,Math.round(file.size/1024))+' KB';
      span.append(svg,label,size);
      const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='移除';
      button.addEventListener('click',()=>{list.splice(i,1);displayFiles(list,node);});
      row.append(span,button);node.append(row);
    });
  };
  function addFiles(list,next,target){
    const checked=core.checkFiles(list,next);
    list.splice(0,list.length,...checked.files);
    if(target)displayFiles(list,target);
    if(checked.errors.length)setError(checked.errors.join('；'));
  }
  if($('upload-zone'))$('upload-zone').addEventListener('click',event=>{if(event.target!==$('file-input'))$('file-input').click();});
  if($('file-input'))$('file-input').addEventListener('change',event=>{addFiles(files,event.target.files,$('file-list'));event.target.value='';});
  const upload=$('upload-zone');
  if(upload){
    upload.addEventListener('keydown',e=>{if(e.target===upload&&(e.key==='Enter'||e.key===' ')){e.preventDefault();$('file-input')?.click();}});
    upload.addEventListener('dragover',e=>{e.preventDefault();upload.classList.add('drag-over');});
    upload.addEventListener('dragleave',e=>{if(!upload.contains(e.relatedTarget))upload.classList.remove('drag-over');});
    upload.addEventListener('drop',e=>{e.preventDefault();upload.classList.remove('drag-over');addFiles(files,e.dataTransfer?.files||[],$('file-list'));});
  }
  for(const button of document.querySelectorAll('[data-type]'))button.addEventListener('click',()=>{
    category=button.dataset.type;
    document.querySelectorAll('[data-type]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    updateVersion();
  });
  function updateVersion(){
    const isBug=category==='bug';
    if($('bug-context'))$('bug-context').hidden=!isBug;
    if($('module-version-section'))$('module-version-section').hidden=!(isBug && targetSelect?.value==='mod');
    if($('game-version-section'))$('game-version-section').hidden=!isBug;
  }
  // 沿用原預覽的公開版本選單，不再讓 RealDate 顯示族譜提取器的選項。
  const version=$('module-version');
  if(version){
    version.replaceChildren();
    for(const [value,label] of [
      ['','請選擇版本'],['v0.4 Beta','v0.4 Beta'],['v0.3 Beta','v0.3 Beta'],
      ['v0.2.1 Beta','v0.2.1 Beta'],['v0.2 Beta','v0.2 Beta'],
      ['v0.1.1 Beta','v0.1.1 Beta'],['v0.1 Beta','v0.1 Beta'],
      ['other','其他版本（手動填寫）'],['unknown','不確定']
    ])version.add(new Option(label,value));
  }
  $('form-title').textContent='問題反饋';
  $('form-subtitle').textContent='你的想法，讓 RealDate 變得更好。';
  const targetSelect=$('issue-target');
  if(targetSelect){
    targetSelect.replaceChildren(new Option('RealDate 模組','mod'),new Option('RealDate 網站','web'));
    targetSelect.value='mod';
  }
  $('bug-context')?.querySelector('label')?.replaceChildren(document.createTextNode('回饋對象'));
  if($('version-changelog-link'))$('version-changelog-link').href='changelog.html';
  version?.addEventListener('change',()=>{$('manual-version-wrap').hidden=version.value!=='other';});
  targetSelect?.addEventListener('change',updateVersion);
  $('message-field')?.addEventListener('input',()=>{$('char-count').textContent=$('message-field').value.length+' / 2000';setError('');});
  $('contact-method')?.addEventListener('change',()=>{$('contact-value').type=$('contact-method').value==='email'?'email':'text';});
  // 保留原本驗證卡片的設計，將停用按鈕換成真正的 Turnstile。
  if(siteKeyHost){
    const button=$('verify-button');button?.remove();
    const target=document.createElement('div');target.id='realdate-turnstile';siteKeyHost.append(target);
    if(core.isLive()){
      core.createVerification(target).then(v=>{
        verifier=v;$('verify-title').textContent='Cloudflare 人機驗證';
        $('verify-subtitle').textContent='驗證通過後才可送出回饋';
        const help=document.querySelector('.verify-legal');if(help)help.textContent='由 Cloudflare 提供安全驗證。';
      }).catch(err=>{$('verify-subtitle').textContent=err.message;});
    }else {$('verify-subtitle').textContent='預覽不會送出正式回饋';}
  }
  const form=$('feedback-form');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const message=$('message-field').value.trim();
    if(!core.checkMessage(message).valid){setError('回饋內容至少 10 字，最多 2000 字。');return;}
    const contact= $('contact-option')?.open?$('contact-value').value.trim():'';
    const method=$('contact-method').value;
    if(!core.checkContact(method,contact)){setError('請確認聯絡方式格式。');return;}
    const token=verifier?.getToken();
    if(!token){setError('請先完成 Cloudflare 人機驗證。');return;}
    const chosen=$('reply-thread').checked?'conversation':'once';
    if(category==='bug'&&targetSelect?.value==='mod'&&(!version?.value||(version.value==='other'&&!$('manual-version').value.trim()))){
      setError('請選擇模組版本，或選擇「不確定」。');return;
    }
    const selected=version?.value==='other'?$('manual-version').value:version?.value||'';
    const button=form.querySelector('button[type="submit"]');button.disabled=true;button.classList.add('is-loading');
    setError('');
    try{
      const result=await core.submit(core.normalizeFeedback({
        source:'RealDate',category,target:targetSelect?.value||'mod',message,files,followUp:chosen,
        contactMethod:method,contactValue:contact,version:selected
      }),token);
      resetReceiptCopyState();
      lastReceipt=result.receipt||'';
      $('success-code').textContent='回饋編號 '+result.id;
      $('success-token').textContent=lastReceipt;
      $('success-credential').hidden=!lastReceipt;
      $('success-open-thread').hidden=!lastReceipt;
      $('success-description').textContent=lastReceipt?'已建立匿名對話，請保存私人憑證。':'已收到單次回饋，不會建立匿名對話。';
      show('success-pane');verifier?.reset();
      if(lastReceipt)activeReceipt=lastReceipt;
    }catch(err){setError(err.message||'送出失敗。');verifier?.reset();}
    finally{button.disabled=false;button.classList.remove('is-loading');}
  });
  // 正式回饋沿用族譜提取器已選定的 SVG 筆劃動畫：複製輪廓收回、勾勾寫出後復原。
  // 只有真正寫入剪貼簿後才觸發動畫；連續點擊要重設前一次的計時器。
  const receiptCopyButton=$('copy-receipt');
  let receiptCopyResetTimer=null;
  function resetReceiptCopyState(){
    if(receiptCopyResetTimer!==null){
      clearTimeout(receiptCopyResetTimer);
      receiptCopyResetTimer=null;
    }
    receiptCopyButton?.querySelector('.l1ng-copy-glyph')?.classList.remove('l1ng-copy-running');
    receiptCopyButton?.setAttribute('aria-label','複製回饋憑證');
  }
  async function copyReceiptToClipboard(value){
    if(navigator.clipboard?.writeText){
      try{await navigator.clipboard.writeText(value);return true;}catch(_){}
    }
    // iOS 網頁內瀏覽器若拒絕 Clipboard API，嘗試原生選取複製作為備援。
    const field=document.createElement('textarea');
    field.value=value;
    field.readOnly=true;
    field.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(field);
    try{
      field.focus({preventScroll:true});
      field.select();
      field.setSelectionRange(0,value.length);
      return !!document.execCommand('copy');
    }catch(_){
      return false;
    }finally{
      field.remove();
    }
  }
  receiptCopyButton?.addEventListener('click',async()=>{
    if(!lastReceipt)return;
    const value=lastReceipt;
    if(!(await copyReceiptToClipboard(value))){
      resetReceiptCopyState();
      receiptCopyButton.setAttribute('aria-label','複製失敗，請長按憑證手動複製');
      return;
    }
    resetReceiptCopyState();
    const glyph=receiptCopyButton.querySelector('.l1ng-copy-glyph');
    if(glyph){
      // 與族譜提取器相同：重複點擊時讓 SVG 從第一筆重新描繪。
      void glyph.getBoundingClientRect();
      glyph.classList.add('l1ng-copy-running');
    }
    receiptCopyButton.setAttribute('aria-label','已複製回饋憑證');
    receiptCopyResetTimer=window.setTimeout(resetReceiptCopyState,3900);
  });
  // 私人憑證僅保存在目前瀏覽器分頁，用於重新整理後恢復對話；不放在網址或長期儲存。
  const activeThreadKey='l1ng-realdate-feedback-active-thread-v1';
  const refreshInterval=60000;
  let refreshTimer=null,refreshBusy=false,threadFingerprint='',lastCheckAt=0;
  function rememberThread(receipt){
    try{sessionStorage.setItem(activeThreadKey,receipt);}catch(_){}
  }
  function clearRememberedThread(){
    try{sessionStorage.removeItem(activeThreadKey);}catch(_){}
  }
  function rememberedThread(){
    try{return sessionStorage.getItem(activeThreadKey)||'';}catch(_){return '';}
  }
  function stopThreadRefresh(){
    if(refreshTimer!==null){clearInterval(refreshTimer);refreshTimer=null;}
  }
  function threadIsVisible(){
    return document.visibilityState==='visible' &&
      !$('thread-pane').classList.contains('hide') &&
      !$('thread-chat').classList.contains('hide') &&
      !$('form-layer').classList.contains('closed');
  }
  function formatMessageTime(value){
    const parsed=new Date(value||'');
    if(!Number.isFinite(parsed.getTime()))return '';
    const minutes=-parsed.getTimezoneOffset();
    const offset='UTC'+(minutes<0?'−':'+')+Math.floor(Math.abs(minutes)/60)+(Math.abs(minutes)%60?':'+String(Math.abs(minutes)%60).padStart(2,'0'):'');
    return new Intl.DateTimeFormat('zh-TW',{
      year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false
    }).format(parsed)+'（'+offset+'）';
  }
  function appendMessage(stack,author,body,time){
    const player=author!=='admin';
    const wrapper=document.createElement('div');
    wrapper.className='conversation-message '+(player?'by-player':'by-admin');
    const label=document.createElement('span');
    label.className='conversation-label';
    label.textContent=player?'你':'管理員';
    const bubble=document.createElement('div');
    bubble.className='conversation-bubble';
    bubble.textContent=body||'';
    wrapper.append(label,bubble);
    const formatted=formatMessageTime(time);
    if(formatted){
      const stamp=document.createElement('time');
      stamp.className='conversation-time';
      stamp.dateTime=time;
      stamp.textContent=formatted;
      wrapper.append(stamp);
    }
    stack.append(wrapper);
  }
  function messagesFor(item){
    const stack=$('visitor-messages');
    const body=$('thread-pane').querySelector('.thread-body');
    const nearEnd=body.scrollHeight-body.scrollTop-body.clientHeight<90;
    const oldPosition=body.scrollTop;
    stack.replaceChildren();
    appendMessage(stack,'player',item.message,item.createdAt);
    for(const msg of item.messages||[])appendMessage(stack,msg.author,msg.body,msg.created_at||msg.createdAt);
    // API 目前回傳附件清單，但沒有將附件 ID 配對到每則回覆；因此單獨列示，不虛構歸屬。
    const files=$('thread-attachment-list');
    if(files){
      files.replaceChildren();
      const attachments=item.attachments||[];
      files.hidden=!attachments.length;
      for(const a of attachments){
        const row=document.createElement('div');
        row.className='conversation-attachment feedback-attachment-row';
        const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
        icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.classList.add('feedback-paperclip');
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d','m8.5 12.5 6.5-6.5a3.5 3.5 0 0 1 5 5l-9.5 9.5a5.5 5.5 0 0 1-8-7.5L13 3');icon.append(path);
        const name=document.createElement('span');name.textContent=a.name||'附件';
        const size=document.createElement('small');size.textContent=Math.max(1,Math.round((a.size||0)/1024))+' KB';
        row.append(icon,name,size);files.append(row);
      }
    }
    body.scrollTop=nearEnd?body.scrollHeight:oldPosition;
  }
  function threadVersion(item){
    return JSON.stringify([item.id,item.status,item.updatedAt,item.message,
      (item.messages||[]).map(x=>[x.id,x.author,x.body,x.created_at]),
      (item.attachments||[]).map(x=>[x.id,x.name])]);
  }
  function updateThread(item){
    const fingerprint=threadVersion(item);
    current=item;
    $('thread-ref').textContent=item.id;
    $('thread-meta').textContent=item.source+' · '+formatMessageTime(item.createdAt);
    const latest=(item.messages||[]).at(-1);
    const statusText=item.status==='done'?'已完成':item.status==='spam'?'已結案'
      :latest?.author==='admin'?'管理員已回覆':latest?.author==='player'?'等待管理員回覆'
      :item.status==='progress'?'處理中':'尚未處理';
    $('thread-state').textContent=statusText;
    $('visitor-reply-form').hidden=['done','spam'].includes(item.status);
    if(fingerprint!==threadFingerprint){
      threadFingerprint=fingerprint;
      messagesFor(item);
    }
  }
  function syncNotice(text){
    const node=$('thread-refresh-status');
    if(node)node.textContent=text;
  }
  async function refreshThread(manual=false){
    if(!activeReceipt||refreshBusy||!threadIsVisible())return;
    if(manual && Date.now()-lastCheckAt<15000){
      syncNotice('剛剛已更新，請稍後再試。');
      return;
    }
    const receipt=activeReceipt;
    refreshBusy=true;
    lastCheckAt=Date.now();
    const button=$('thread-refresh');
    if(button)button.disabled=true;
    syncNotice('正在檢查新回覆…');
    try{
      const data=await core.lookup(receipt);
      if(activeReceipt!==receipt || !threadIsVisible())return;
      updateThread(data.feedback);
      syncNotice('上次更新：'+new Intl.DateTimeFormat('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()));
    }catch(err){
      if(activeReceipt!==receipt)return;
      const message=err?.message||'更新失敗';
      syncNotice(message.includes('過於頻繁')?'查詢已達限制，請稍後再試。':'暫時無法更新，稍後會自動重試。');
      if(message.includes('過於頻繁'))stopThreadRefresh();
    }finally{
      refreshBusy=false;
      if(button)button.disabled=false;
    }
  }
  function startThreadRefresh(){
    stopThreadRefresh();
    refreshTimer=window.setInterval(()=>{if(threadIsVisible())refreshThread();},refreshInterval);
  }
  function newFeedback(){
    stopThreadRefresh();clearRememberedThread();activeReceipt='';current=null;threadFingerprint='';
    resetReceiptCopyState();form.reset();files=[];displayFiles(files,$('file-list'));
    category='bug';updateVersion();$('char-count').textContent='0 / 2000';
    verifier?.reset();show('form-main');setError('');
  }
  $('success-new')?.addEventListener('click',newFeedback);
  async function openThread(receipt,{recover=false}={}){
    const value=String(receipt||'').trim();
    if(!value)return;
    stopThreadRefresh();
    $('restore-error').hidden=true;
    syncNotice('正在載入對話…');
    try{
      const data=await core.lookup(value);
      activeReceipt=value;threadFingerprint='';lastCheckAt=Date.now();
      updateThread(data.feedback);
      rememberThread(value);
      $('thread-home').classList.add('hide');
      $('thread-chat').classList.remove('hide');
      show('thread-pane');
      syncNotice('每 60 秒自動更新，切回頁面會立即檢查。');
      startThreadRefresh();
      if(!['done','spam'].includes(current.status) && !replyVerifier && core.isLive()){
        const container=document.createElement('div');
        container.id='realdate-reply-turnstile';
        const actions=$('visitor-reply-form')?.querySelector('.thread-compose-actions');
        if(actions)actions.before(container);
        core.createVerification(container).then(v=>{replyVerifier=v;}).catch(err=>{
          $('visitor-reply-error').textContent=err.message;$('visitor-reply-error').hidden=false;
        });
      }
    }catch(err){
      // 失效的憑證不再自動恢復；網路暫時失敗則保留分頁憑證供使用者重試。
      if(recover && /無效|查無資料/.test(err?.message||''))clearRememberedThread();
      $('thread-home').classList.remove('hide');
      $('thread-chat').classList.add('hide');
      $('restore-token').value=value;
      $('restore-error').textContent=err?.message||'憑證查詢失敗。';
      $('restore-error').hidden=false;
      show('thread-pane');
    }
  }
  function threadHome(){
    stopThreadRefresh();activeReceipt='';current=null;threadFingerprint='';clearRememberedThread();
    show('thread-pane');$('thread-home').classList.remove('hide');$('thread-chat').classList.add('hide');
  }
  document.querySelectorAll('[data-open-thread]').forEach(b=>b.addEventListener('click',threadHome));
  $('form-open-thread')?.addEventListener('click',threadHome);
  $('success-open-thread')?.addEventListener('click',()=>openThread(lastReceipt));
  $('restore-thread')?.addEventListener('click',()=>openThread($('restore-token').value.trim()));
  $('thread-back-list')?.addEventListener('click',threadHome);
  $('thread-refresh')?.addEventListener('click',()=>refreshThread(true));
  function checkVisibleThread(){
    if(threadIsVisible() && Date.now()-lastCheckAt>15000)refreshThread();
  }
  document.addEventListener('visibilitychange',checkVisibleThread);
  window.addEventListener('focus',checkVisibleThread);
  window.addEventListener('online',checkVisibleThread);
  $('thread-back-form')?.addEventListener('click',newFeedback);
  $('visitor-reply-files')?.addEventListener('change',e=>{
    addFiles(replyFiles,e.target.files,null);e.target.value='';
    $('visitor-reply-file-info').textContent='最多 3 個檔案・合計 20 MB';
    displayFiles(replyFiles,$('visitor-reply-selected'));
  });
  $('visitor-reply-form')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const message=$('visitor-reply').value.trim();
    if(!message||!activeReceipt){$('visitor-reply-error').textContent='請先輸入回覆內容。';$('visitor-reply-error').hidden=false;return;}
    const token=replyVerifier?.getToken();
    if(!token){$('visitor-reply-error').textContent='請先完成下方的人機驗證。';$('visitor-reply-error').hidden=false;return;}
    try{await core.reply(activeReceipt,message,replyFiles,token);replyFiles=[];displayFiles(replyFiles,$('visitor-reply-selected'));$('visitor-reply').value='';replyVerifier?.reset();await openThread(activeReceipt);}
    catch(err){$('visitor-reply-error').textContent=err.message;$('visitor-reply-error').hidden=false;replyVerifier?.reset();}
  });
  // 示範管理入口與假資料不得在正式網站對外開啟。
  $('admin-screen')?.remove();
  $('context-switch')?.remove();
  $('visitor-go-admin')?.remove();
  document.querySelector('.preview-bar')?.remove();
  $('reset-demo')?.remove();
  if($('source-field'))$('source-field').value='RealDate';
  $('close-form')?.addEventListener('click',()=>{$('form-layer').classList.add('closed');});
  document.querySelectorAll('[data-open-form]').forEach(button=>button.addEventListener('click',()=>{$('form-layer').classList.remove('closed');newFeedback();}));
  $('thread-back-form')?.addEventListener('click',()=>{$('form-layer').classList.remove('closed');});
  updateVersion();show('form-main');
  // F5 保留本分頁的私人對話，不要求再次貼上憑證。
  if(core.isLive()){
    const previous=rememberedThread();
    if(previous)openThread(previous,{recover:true});
  }
})();