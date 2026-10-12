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
      const row=document.createElement('div');row.className='file-entry';
      const span=document.createElement('span');span.textContent=describeFile(file);
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
  $('copy-receipt')?.addEventListener('click',()=>{if(lastReceipt)navigator.clipboard?.writeText(lastReceipt);});
  function newFeedback(){form.reset();files=[];displayFiles(files,$('file-list'));category='bug';updateVersion();$('char-count').textContent='0 / 2000';verifier?.reset();show('form-main');setError('');}
  $('success-new')?.addEventListener('click',newFeedback);
  function messagesFor(item){
    const stack=$('visitor-messages');stack.replaceChildren();
    const initial=document.createElement('div');initial.className='conversation-message by-player';
    initial.textContent=item.message;stack.append(initial);
    for(const msg of item.messages||[]){
      const p=document.createElement('div');p.className='conversation-message '+(msg.author==='admin'?'by-admin':'by-player');
      p.textContent=msg.body;stack.append(p);
    }
  }
  async function openThread(receipt){
    $('restore-error').hidden=true;
    try{
      const data=await core.lookup(receipt);
      current=data.feedback;activeReceipt=receipt;
      $('thread-home').classList.add('hide');$('thread-chat').classList.remove('hide');
      $('thread-ref').textContent=current.id;
      $('thread-meta').textContent=current.source+' · '+current.createdAt;
      $('thread-state').textContent=({pending:'尚未處理',progress:'處理中',done:'已完成',spam:'已結案'})[current.status]||current.status;
      $('visitor-reply-form').hidden=['done','spam'].includes(current.status);
      messagesFor(current);show('thread-pane');
      if(!['done','spam'].includes(current.status) && !replyVerifier && core.isLive()){
        const container=document.createElement('div');
        container.id='realdate-reply-turnstile';
        const actions=$('visitor-reply-form')?.querySelector('.thread-compose-actions');
        if(actions)actions.before(container);
        core.createVerification(container).then(v=>{replyVerifier=v;}).catch(err=>{
          $('visitor-reply-error').textContent=err.message;$('visitor-reply-error').hidden=false;
        });
      }
    }catch(err){$('restore-error').textContent=err.message||'憑證查詢失敗。';$('restore-error').hidden=false;show('thread-pane');}
  }
  function threadHome(){show('thread-pane');$('thread-home').classList.remove('hide');$('thread-chat').classList.add('hide');}
  document.querySelectorAll('[data-open-thread]').forEach(b=>b.addEventListener('click',threadHome));
  $('form-open-thread')?.addEventListener('click',threadHome);
  $('success-open-thread')?.addEventListener('click',()=>openThread(lastReceipt));
  $('restore-thread')?.addEventListener('click',()=>openThread($('restore-token').value.trim()));
  $('thread-back-list')?.addEventListener('click',threadHome);
  $('thread-back-form')?.addEventListener('click',newFeedback);
  $('visitor-reply-files')?.addEventListener('change',e=>{
    addFiles(replyFiles,e.target.files,null);e.target.value='';
    $('visitor-reply-file-info').textContent=replyFiles.length?replyFiles.map(f=>f.name).join('、'):'最多 3 個檔案・合計 20 MB';
  });
  $('visitor-reply-form')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const message=$('visitor-reply').value.trim();
    if(!message||!activeReceipt){$('visitor-reply-error').textContent='請先輸入回覆內容。';$('visitor-reply-error').hidden=false;return;}
    const token=replyVerifier?.getToken();
    if(!token){$('visitor-reply-error').textContent='請先完成下方的人機驗證。';$('visitor-reply-error').hidden=false;return;}
    try{await core.reply(activeReceipt,message,replyFiles,token);replyFiles=[];$('visitor-reply').value='';replyVerifier?.reset();await openThread(activeReceipt);}
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
})();