/* RealDate 正式回饋：沿用既有表單、成功頁與匿名對話外觀，不使用展示資料。 */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const core=window.L1nGFeedbackCore;
  if(!core || !$('feedback-form'))return;
  let category='bug', files=[], replyFiles=[], verifier=null, replyVerifier=null, activeReceipt='', current=null, lastReceipt='';
  const verificationHost=$('realdate-turnstile');
  const setError=(msg,field)=>{
    const nodes=['message-error','version-error','game-version-error','contact-error','file-error','submit-inline-error'];
    for(const id of nodes){const node=$(id);if(node){node.classList.remove('visible');node.textContent='';}}
    for(const id of ['message-field','module-version','manual-version','game-version','contact-value'])$(id)?.classList.remove('feedback-invalid');
    $('submit-error-summary').hidden=true;
    if(!msg)return;
    const target=field||(msg.includes('版本')?'version':msg.includes('聯絡')?'contact':msg.includes('附件')?'file':msg.includes('回饋內容')?'message':'submit');
    const lookup={version:'version-error',gameVersion:'game-version-error',contact:'contact-error',file:'file-error',message:'message-error',submit:'submit-inline-error'};
    const node=$(lookup[target]||'submit-inline-error');
    if(node){node.textContent=msg;node.classList.add('visible');}
    const input={version: $('manual-version-wrap')?.hidden?$('module-version'):$('manual-version'),gameVersion:$('game-version'),contact:$('contact-value'),message:$('message-field')}[target];
    input?.classList.add('feedback-invalid');
  };
  const captureFormHeight=()=>{
    const form=$('form-main');
    if(!form||form.classList.contains('hide')||getComputedStyle(form).display==='none')return;
    const height=Math.ceil(Math.max(form.scrollHeight,form.getBoundingClientRect().height));
    if(height>0)$('thread-pane')?.style.setProperty('--realdate-form-height',height+'px');
  };
  const show=(id)=>{
    captureFormHeight();
    for(const name of ['form-main','success-pane','thread-pane']){
      const el=$(name);el.classList.toggle('hide',id!==name);
      if(name==='form-main')el.style.display=id===name?'flex':'none';
    }
    if(id==='form-main')requestAnimationFrame(captureFormHeight);
  };
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
      if(node.id==='visitor-reply-selected'&&file.type.startsWith('image/')){
        const image=document.createElement('img');image.className='feedback-reply-thumb';image.alt='附件縮圖';
        const url=URL.createObjectURL(file);image.src=url;
        image.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true});
        image.addEventListener('error',()=>URL.revokeObjectURL(url),{once:true});
        span.append(image);
      }else if(node.id==='visitor-reply-selected'){
        const doc=document.createElementNS('http://www.w3.org/2000/svg','svg');doc.setAttribute('viewBox','0 0 24 24');doc.classList.add('feedback-paperclip');
        const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d','M7 3h7l5 5v13H7z M14 3v6h5 M9 13h8 M9 17h8');doc.append(p);span.append(doc);
      }else span.append(svg);
      span.append(label,size);
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
    const needsGameVersion=isBug && targetSelect?.value==='mod';
    if($('game-version-section'))$('game-version-section').hidden=!needsGameVersion;
    const gameVersionField=$('game-version');
    if(gameVersionField)gameVersionField.required=needsGameVersion;
    if(!needsGameVersion){
      gameVersionField?.classList.remove('feedback-invalid');
      if($('game-version-error'))$('game-version-error').classList.remove('visible');
    }
  }
  // RealDate 使用自己的公開版本選單選項。
  const version=$('module-version');
  if(version){
    version.replaceChildren();
    for(const [value,label] of [
      ['','請選擇版本'],['v0.5 Beta','v0.5 Beta'],['v0.4 Beta','v0.4 Beta'],['v0.3 Beta','v0.3 Beta'],
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
  // 共用版本說明：原生小視窗不影響表單高度，兩顆 i 按鈕都開啟同一份內容。
  const versionHelp=$('version-guide');
  let versionHelpOpener=null;
  if(versionHelp && typeof versionHelp.showModal==='function'){
    document.querySelectorAll('[data-version-help]').forEach(button=>button.addEventListener('click',()=>{
      if(versionHelp.open)return;
      versionHelpOpener=button;
      versionHelp.showModal();
    }));
    versionHelp.querySelector('[data-close-version-help]')?.addEventListener('click',()=>versionHelp.close());
    versionHelp.addEventListener('click',event=>{
      if(event.target===versionHelp){
        const rect=versionHelp.getBoundingClientRect();
        if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)versionHelp.close();
      }
    });
    versionHelp.addEventListener('close',()=>{
      if(versionHelpOpener?.isConnected)versionHelpOpener.focus({preventScroll:true});
      versionHelpOpener=null;
    });
  }
  version?.addEventListener('change',()=>{$('manual-version-wrap').hidden=version.value!=='other';});
  targetSelect?.addEventListener('change',updateVersion);
  $('message-field')?.addEventListener('input',()=>{$('char-count').textContent=$('message-field').value.length+' / 2000';setError('');});
  $('game-version')?.addEventListener('input',()=>{
    $('game-version').classList.remove('feedback-invalid');
    $('game-version-error')?.classList.remove('visible');
  });
  $('contact-method')?.addEventListener('change',()=>{$('contact-value').type=$('contact-method').value==='email'?'email':'text';});
  const emailOption=$('rd-email-option'),emailCheckbox=$('rd-email-notify'),emailHint=$('rd-email-hint');
  function updateEmailOption(){
    const allowed=$('reply-thread')?.checked && $('contact-option')?.open && $('contact-method')?.value==='email';
    emailOption.hidden=!allowed;emailHint.hidden=!allowed;
    if(!allowed)emailCheckbox.checked=false;
  }
  $('contact-method')?.addEventListener('change',updateEmailOption);
  $('contact-option')?.addEventListener('toggle',updateEmailOption);
  for(const radio of document.querySelectorAll('input[name="reply-mode"]'))radio.addEventListener('change',updateEmailOption);
  updateEmailOption();
  let emailStatusTimer=null,emailReceipt='',emailState='',emailDeadline=0,emailResendAt=0,emailClockOffset=0,emailPolledAt=0;
  const emailText=()=>{
    const en=document.documentElement.dataset.language==='en';
    return en?{
      pending:'Waiting for email verification',verified:'Email verified',disabled:'Email notifications turned off',unavailable:'Verification email could not be delivered',
      instruction:'Check your inbox and follow the confirmation link to receive notifications when we reply.',
      active:'Email reply notifications are enabled.',error:'Email delivery is currently unavailable. You can still use your private receipt to view replies.',
      resend:'Resend verification email',remaining:'Verification link expires in',expired:'Verification link expired. Request a new email.',wait:'Resend available in'
    }:{
      pending:'等待電子郵件驗證',verified:'電子郵件已驗證',disabled:'Email 回覆通知已關閉',unavailable:'驗證信未能寄送',
      instruction:'請前往信箱點擊驗證連結，完成後即可接收管理員回覆通知。',
      active:'管理員回覆時，將透過 Email 通知你。',error:'目前無法寄送驗證信，但仍可使用私人憑證查看回覆。',
      resend:'重新寄送驗證信',remaining:'驗證連結剩餘',expired:'驗證連結已過期，請重新寄送驗證信。',wait:'可於以下時間後重新寄送'
    };
  };
  function setEmailTiming(item,serverNow){
    if(serverNow && Number.isFinite(Date.parse(serverNow)))emailClockOffset=Date.parse(serverNow)-Date.now();
    emailDeadline=item?.expiresAt?Date.parse(item.expiresAt)||0:0;
    emailResendAt=item?.resendAt?Date.parse(item.resendAt)||0:0;
  }
  const timeLeft=end=>Math.max(0,Math.ceil((end-Date.now()-emailClockOffset)/1000));
  const readableTime=seconds=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  function renderEmailStatus(state){
    emailState=state||'';
    const box=$('rd-email-status'),copy=emailText();
    box.hidden=!state;if(!state)return;
    const left=timeLeft(emailDeadline),cool=timeLeft(emailResendAt);
    $('rd-email-title').textContent=state==='verified'?copy.verified:state==='disabled'?copy.disabled:state==='delivery_unavailable'?copy.unavailable:copy.pending;
    let description=state==='verified'?copy.active:state==='delivery_unavailable'?copy.error:state==='pending'?copy.instruction:'';
    if(state==='pending'&&emailDeadline)description+=' '+(left>0?copy.remaining+' '+readableTime(left):copy.expired);
    $('rd-email-description').textContent=description;
    const resend=$('rd-email-resend');
    resend.hidden=state!=='pending'&&state!=='delivery_unavailable';
    resend.disabled=!resend.hidden&&cool>0;
    resend.textContent=copy.resend+(!resend.hidden&&cool>0?' · '+readableTime(cool):'');
  }
  function startEmailStatus(){
    if(emailStatusTimer!==null)clearInterval(emailStatusTimer);
    emailStatusTimer=setInterval(()=>{renderEmailStatus(emailState);if(emailReceipt&&document.visibilityState==='visible'&&Date.now()-emailPolledAt>12000){emailPolledAt=Date.now();void checkEmailStatus();}},1000);
  }
  async function checkEmailStatus(){
    if(!emailReceipt||$('success-pane')?.classList.contains('hide')||document.visibilityState!=='visible')return;
    try{
      const result=await core.emailStatus(emailReceipt);
      setEmailTiming(result.email,result.serverNow);
      const state=result.email?.state||'';
      renderEmailStatus(state);
      if(state==='verified'||state==='disabled')stopEmailClock();
    }catch(_){}
  }
  function stopEmailClock(){if(emailStatusTimer!==null)clearInterval(emailStatusTimer);emailStatusTimer=null;}
  function stopEmailStatus(){stopEmailClock();emailReceipt='';emailDeadline=0;emailResendAt=0;emailClockOffset=0;}
  $('rd-email-resend')?.addEventListener('click',async()=>{
    const button=$('rd-email-resend');if(!emailReceipt||button.disabled)return;
    button.disabled=true;
    try{
      const data=await core.resendVerification(emailReceipt);
      setEmailTiming(data.email,data.serverNow);renderEmailStatus('pending');startEmailStatus();
    }catch(err){$('rd-email-description').textContent=err.message||emailText().error;}
    finally{renderEmailStatus(emailState);}
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkEmailStatus();});
  window.addEventListener('focus',()=>{if(emailReceipt)void checkEmailStatus();});
  document.querySelectorAll('[data-language-button]').forEach(button=>button.addEventListener('click',()=>queueMicrotask(()=>renderEmailStatus(emailState))));


  // RealDate 直接顯示 Cloudflare 原生元件，避免舊卡片與驗證框在手機上互相擠壓。
  const verificationStatus=$('realdate-turnstile-status');
  const verificationRetry=$('realdate-turnstile-retry');
  let verificationLoading=false, verificationState='idle';
  function updateVerificationStatus(state,message){
    verificationState=state;
    // 換新文字節點，讓現有繁中／英文切換能正確翻譯動態驗證狀態。
    if(verificationStatus){
      verificationStatus.replaceChildren(document.createTextNode(message));
      // Cloudflare 自帶驗證進度與成功狀態，只在異常或預覽限制時顯示說明。
      verificationStatus.hidden=!['error','expired','preview'].includes(state);
    }
    if(verificationRetry)verificationRetry.hidden=state!=='error';
  }
  async function ensureVerification(){
    if(!verificationHost||verificationLoading||verifier)return;
    if(!core.isLive()){
      updateVerificationStatus('preview','預覽不會送出正式回饋');
      return;
    }
    verificationLoading=true;
    updateVerificationStatus('loading','正在載入 Cloudflare 安全驗證…');
    try{
      const widget=await core.createVerification(verificationHost,{
        size:'flexible',
        onStatus:state=>{
          if(state==='success')updateVerificationStatus('success','安全驗證已完成。');
          else if(state==='expired')updateVerificationStatus('expired','驗證已過期，請重新完成驗證。');
          else if(state==='error'||state==='timeout')updateVerificationStatus('error','安全驗證發生問題，請重新載入驗證。');
          else if(state==='pending')updateVerificationStatus('ready','請完成上方的安全驗證。');
        }
      });
      verifier=widget;
      if(verificationState==='loading'){
        updateVerificationStatus(widget.getToken()?'success':'ready',
          widget.getToken()?'安全驗證已完成。':'請完成上方的安全驗證。');
      }
    }catch(err){
      verificationHost.replaceChildren();
      updateVerificationStatus('error',err?.message||'安全驗證載入失敗，請重新載入驗證。');
    }finally{
      verificationLoading=false;
    }
  }
  verificationRetry?.addEventListener('click',()=>{
    if(verificationLoading)return;
    verifier?.remove();
    verifier=null;
    verificationHost?.replaceChildren();
    ensureVerification();
  });
  if(verificationHost)requestAnimationFrame(ensureVerification);
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
    const gameVersion=category==='bug'&&targetSelect?.value==='mod'
      ? ($('game-version')?.value.trim()||'') : '';
    if(category==='bug'&&targetSelect?.value==='mod'&&!gameVersion){
      setError('請填寫遊戲版本，可查看 RealDate 日誌確認。','gameVersion');return;
    }
    const selected=version?.value==='other'?$('manual-version').value:version?.value||'';
    const button=form.querySelector('button[type="submit"]');button.disabled=true;button.classList.add('is-loading');
    setError('');
    try{
      const result=await core.submit(core.normalizeFeedback({
        source:'RealDate',category,target:targetSelect?.value||'mod',message,files,followUp:chosen,
        contactMethod:method,contactValue:contact,version:selected,gameVersion,
        emailNotify:chosen==='conversation' && method==='email' && !!contact && !!emailCheckbox.checked,
        language:document.documentElement.dataset.language==='en'?'en':'zh-Hant'
      }),token);
      resetReceiptCopyState();
      lastReceipt=result.receipt||'';
      $('success-code').textContent='回饋編號 '+result.id;
      $('success-token').textContent=lastReceipt;
      $('success-credential').hidden=!lastReceipt;
      $('success-open-thread').hidden=!lastReceipt;
      $('success-description').textContent=lastReceipt?'已建立匿名對話，請保存私人憑證。':'已收到單次回饋，不會建立匿名對話。';
      stopEmailStatus();
      emailReceipt=result.emailState&&lastReceipt?lastReceipt:'';
      setEmailTiming(result.email,result.serverNow);renderEmailStatus(result.emailState||'');
      if(emailReceipt && (result.emailState==='pending'||result.emailState==='delivery_unavailable'))startEmailStatus();
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
  function appendMessage(stack,author,body,time,attachments=[]){
    const player=author!=='admin';
    const wrapper=document.createElement('div');
    wrapper.className='conversation-message '+(player?'by-player':'by-admin');
    const label=document.createElement('span');
    label.className='conversation-label';
    label.textContent=player?'你':'L1nG';
    const bubble=document.createElement('div');
    bubble.className='conversation-bubble';
    bubble.textContent=body||'';
    wrapper.append(label,bubble);
    for(const a of attachments){
      const row=document.createElement('div');
      row.className='conversation-attachment feedback-attachment-row';
      const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.setAttribute('viewBox','0 0 24 24');
      icon.setAttribute('aria-hidden','true');
      icon.classList.add('feedback-paperclip');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','m8.5 12.5 6.5-6.5a3.5 3.5 0 0 1 5 5l-9.5 9.5a5 5 0 0 1-8-7.5L13 3');
      icon.append(path);
      const name=document.createElement('span');name.textContent=a.name||'附件';
      const size=document.createElement('small');size.textContent=Math.max(1,Math.round((a.size||0)/1024))+' KB';
      row.append(icon,name,size);
      wrapper.append(row);
    }
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
    const nearEnd=stack.scrollHeight-stack.scrollTop-stack.clientHeight<90;
    const oldPosition=stack.scrollTop;
    stack.replaceChildren();
    const attachments=item.attachments||[];
    appendMessage(stack,'player',item.message,item.createdAt,attachments.filter(a=>a.replyId==null));
    for(const msg of item.messages||[])appendMessage(stack,msg.author,msg.body,msg.created_at||msg.createdAt,
      attachments.filter(a=>a.replyId===msg.id));
    stack.scrollTop=nearEnd?stack.scrollHeight:oldPosition;
  }
  function threadVersion(item){
    return JSON.stringify([item.id,item.status,item.updatedAt,item.message,
      (item.messages||[]).map(x=>[x.id,x.author,x.body,x.created_at]),
      (item.attachments||[]).map(x=>[x.id,x.name,x.replyId])]);
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
      syncNotice('更新時間：'+formatMessageTime(new Date()));
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
    stopEmailStatus();renderEmailStatus("");
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
        const container=$('realdate-reply-turnstile');
        core.createVerification(container,{size:'flexible'}).then(v=>{replyVerifier=v;}).catch(err=>{
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
  const replyDrop=$('visitor-reply-files')?.closest('.feedback-reply-drop-target');
  if(replyDrop){
    const clear=()=>replyDrop.classList.remove('is-drag-over');
    replyDrop.addEventListener('dragover',e=>{if(!e.dataTransfer?.types.includes('Files'))return;e.preventDefault();replyDrop.classList.add('is-drag-over');});
    replyDrop.addEventListener('dragleave',e=>{if(!replyDrop.contains(e.relatedTarget))clear();});
    replyDrop.addEventListener('drop',e=>{
      if(!e.dataTransfer?.files.length)return;e.preventDefault();clear();
      const checked=core.checkFiles(replyFiles,e.dataTransfer.files);
      replyFiles.splice(0,replyFiles.length,...checked.files);displayFiles(replyFiles,$('visitor-reply-selected'));
      const error=$('visitor-reply-error');error.hidden=!checked.errors.length;
      if(checked.errors.length)error.textContent=checked.errors.join('；');
    });
  }
  $('visitor-reply-form')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const message=$('visitor-reply').value.trim();
    const error=$('visitor-reply-error');
    if(!message||!activeReceipt){error.textContent='請先輸入回覆內容。';error.hidden=false;error.scrollIntoView({block:'nearest'});return;}
    const token=replyVerifier?.getToken();
    if(!token){error.textContent='請先完成安全驗證，再送出回覆。';error.hidden=false;error.scrollIntoView({block:'nearest'});return;}
    const submit=$('visitor-reply-form').querySelector('button[type="submit"]');
    if(submit.disabled)return;
    submit.disabled=true;submit.classList.add('is-loading');error.hidden=true;
    try{await core.reply(activeReceipt,message,replyFiles,token);replyFiles=[];displayFiles(replyFiles,$('visitor-reply-selected'));$('visitor-reply').value='';replyVerifier?.reset();await openThread(activeReceipt);}
    catch(err){error.textContent=err.message;error.hidden=false;error.scrollIntoView({block:'nearest'});replyVerifier?.reset();}
    finally{submit.disabled=false;submit.classList.remove('is-loading');}
  });
  $('visitor-reply')?.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.shiftKey||event.ctrlKey||event.altKey||event.metaKey||event.repeat||event.isComposing||event.keyCode===229)return;
    event.preventDefault();
    const form=$('visitor-reply-form'),submit=form?.querySelector('button[type="submit"]');
    if(form&&!submit?.disabled)form.requestSubmit();
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
  // 信件僅攜帶固定頁面錨點，不攜帶私人憑證；直接開啟現有「我的回饋」。
  const fromEmail=window.location.hash==='#my-feedback';
  if(fromEmail){
    window.history.replaceState(null,'',window.location.pathname+window.location.search);
    const saved=rememberedThread();
    if(saved && core.isLive())openThread(saved,{recover:true});
    else {
      $('thread-home').classList.remove('hide');
      $('thread-chat').classList.add('hide');
      show('thread-pane');
    }
  }else if(core.isLive()){
    // F5 保留本分頁的私人對話，不要求再次貼上憑證。
    const previous=rememberedThread();
    if(previous)openThread(previous,{recover:true});
  }
})();