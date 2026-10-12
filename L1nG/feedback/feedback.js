(() => {
  'use strict';
  // 介面預覽：僅使用本機暫存資料，不連線也不具真正的驗證功能。
  const $ = id => document.getElementById(id);
  const icon = (name, classes='i') => `<svg class="${classes}" aria-hidden="true"><use href="#ico-${name}"/></svg>`;
  const labels = {bug:'錯誤回報',feature:'功能建議',other:'其他意見'};
  const statuses = {pending:'尚未處理',progress:'處理中',done:'已完成',spam:'垃圾訊息'};
  const demoItems = [
    {id:'LNG-1028',type:'bug',site:'Genealogy',title:'iPhone 匯出圖片時頭像沒有出現',message:'在 iPhone Safari 匯出族譜 PNG 時，人物卡片的文字和關係線正常，但是頭像區域會變成空白。切換成 2 倍尺寸後也一樣。希望可以檢查手機端的圖片處理。',status:'pending',date:'2026-10-12T07:21:00+08:00',files:[{name:'ios-export-screenshot.png',size:1278342,sample:true}]},
    {id:'LNG-1027',type:'feature',site:'Genealogy',title:'希望能搜尋已故模擬市民',message:'如果家庭成員很多，希望搜尋時可以選擇只顯示已故模擬市民，也希望能從搜尋結果直接定位至族譜中的人物卡片。',status:'pending',date:'2026-10-11T18:50:00+08:00',files:[]},
    {id:'LNG-1026',type:'bug',site:'RealDate',title:'計畫一場活動打開速度偏慢',message:'點擊電話裡面的「計畫一場活動」後，活動列表需要等一段時間才會出現。遊戲沒有卡死，但開啟速度明顯比沒有安裝模組的時候慢。',status:'progress',date:'2026-10-11T14:35:00+08:00',files:[{name:'lastException.txt',size:8220,sample:true}]},
    {id:'LNG-1025',type:'other',site:'L1nG',title:'手機版的首頁很漂亮',message:'最近發現首頁的手機版更新了，字體和動畫搭配得很舒服。謝謝你持續製作繁體中文相關內容，希望未來能繼續維護！',status:'done',date:'2026-10-10T22:06:00+08:00',files:[]},
    {id:'LNG-1024',type:'bug',site:'Genealogy',title:'自由排列的卡片拖曳偶爾會跳動',message:'在自由排列模式拖曳配偶卡片時，關係線會在放開滑鼠後突然跳到另一個位置。重新整理並不能穩定重現。',status:'progress',date:'2026-10-10T19:12:00+08:00',files:[]},
    {id:'LNG-1023',type:'feature',site:'RealDate',title:'希望日期顯示能與學校行程同步',message:'希望學校行事曆上也能完整顯示模組日期，尤其是寒暑假和節日的時間。',status:'done',date:'2026-10-09T09:40:00+08:00',files:[]},
    {id:'LNG-1022',type:'bug',site:'L1nG',title:'漢化專區有一個下載按鈕無法開啟',message:'在首頁漢化專區點擊其中一個下載按鈕時，網頁沒有跳轉。使用的是 Safari，重新整理後問題消失。',status:'done',date:'2026-10-08T16:15:00+08:00',files:[]},
    {id:'LNG-1020',type:'other',site:'Genealogy',title:'無關的廣告與重複內容',message:'您好，這是示範用的垃圾訊息，僅用來測試後台過濾與標記流程。',status:'spam',date:'2026-10-06T09:00:00+08:00',files:[]},
    {id:'LNG-1021',type:'feature',site:'Genealogy',title:'族譜可否增加備份提醒',message:'如果有很久沒有手動匯出 JSON，希望網站在關閉之前可以適時顯示提醒，避免整理好的族譜資料遺失。',status:'pending',date:'2026-10-07T12:35:00+08:00',files:[]}
  ];
  demoItems[0].contact = {method:'email',value:'player@example.com'};
  demoItems[2].contact = {method:'discord',value:'sims_player'};
  demoItems[0].moduleVersion = '0.5.0';
  demoItems[2].messages=[{by:'player',text:demoItems[2].message,date:demoItems[2].date},{by:'admin',text:'收到，請問目前安裝的是哪個 RealDate 版本？也可以附上錯誤日誌。',date:'2026-10-11T15:20:00+08:00'}];
  let records = demoItems.map(x=>({...x,files:x.files.map(f=>({...f})),messages:(x.messages||[]).map(m=>({...m}))}));
  let visitorThreadId=null,lastCreatedId=null,replyUploads=[],privateReceipts=new Map(),filterReply='all';
  let activeType = 'bug',verified=false,uploads=[],selectedRecord=null,filterStatus='all',filterSite='all',filterContact='all',searchTerm='',number=1029,screen='visitor',toastTimer=null,lastFocus=null,visitorSite='Genealogy';
  const safe = input=>String(input??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText = value=>new Intl.DateTimeFormat('zh-TW',{month:'2-digit',day:'2-digit',timeZone:'Asia/Taipei'}).format(new Date(value));
  const fullDate = value=>new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Taipei'}).format(new Date(value));
  const sizeText = n=> n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
  const notify = value=>{const el=$('toast');el.textContent=value;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800)};
  function applyTheme(){const now=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=now;$('theme-toggle').innerHTML=icon(now==='dark'?'sun':'moon');}
  $('theme-toggle').addEventListener('click',applyTheme);
  $('settings-theme').addEventListener('click',applyTheme);
  const originalFormParent = $('form-layer').parentElement;
  const publicVersions={
    RealDate:[['v0.4 Beta','v0.4 Beta（最新公開版）'],['v0.3 Beta','v0.3 Beta'],['v0.2.1 Beta','v0.2.1 Beta'],['v0.2 Beta','v0.2 Beta'],['v0.1.1 Beta','v0.1.1 Beta'],['v0.1 Beta','v0.1 Beta']],
    Genealogy:[['v0.1 Beta','v0.1 Beta（官網目前標示）']]
  };
  const previewRealDateChangelog='https://raw.githack.com/ling051014/Sims4-mods/genealogy-structural-optimization-20260926/L1nG/RealDate/changelog.html';
  const previewExporterInfo='https://raw.githack.com/ling051014/Sims4-mods/genealogy-structural-optimization-20260926/L1nG/GenealogyExporter/genealogy-exporter.html';
  let versionChoiceContext='';
  function refreshVersionOptions(){
    const context=visitorSite==='RealDate'?'RealDate':'Genealogy';
    const box=$('module-version');
    if(versionChoiceContext===context)return;
    versionChoiceContext=context;
    box.replaceChildren();
    const items=[['','請選擇版本'],...publicVersions[context],['other','其他版本（手動填寫）'],['unknown','不確定']];
    for(const [value,label] of items){const opt=document.createElement('option');opt.value=value;opt.textContent=label;box.append(opt)}
    $('manual-version').value='';
    const url=context==='RealDate'?previewRealDateChangelog:previewExporterInfo;
    $('version-changelog-link').href=url;
    $('version-changelog-link').textContent=context==='RealDate'?'查看 RealDate 更新日誌 ↗':'查看族譜提取器目前版本 ↗';
    const example=context==='RealDate'?'L1nG_RealDate_v0.4_Beta.zip':'族譜提取器下載檔';
    $('version-guide').querySelector('code').textContent=example;
    $('version-guide').open=false;
    updateManualVersion();
  }
  function updateManualVersion(){
    const manual=$('module-version').value==='other';
    $('manual-version-wrap').hidden=!manual;
    $('manual-version').disabled=!manual;
    $('version-error').classList.remove('visible');
    $('submit-error-summary').hidden=true;
  }
  function updateVersionFields(){
    const bug=activeType==='bug',realdate=visitorSite==='RealDate';
    $('bug-context').hidden=!bug;
    const target=$('issue-target').value;
    const needVersion=bug&&(target==='mod'||target==='exporter');
    $('module-version-section').hidden=!needVersion;
    $('game-version-section').hidden=!(bug&&realdate&&target==='mod');
    $('site-version-note').hidden=needVersion;
    if(needVersion)refreshVersionOptions();
    $('module-version').disabled=!needVersion;
    $('version-error').classList.remove('visible');
    $('submit-error-summary').hidden=true;
  }
  function setVisitorSite(site){
    visitorSite=site;
    const realdate=site==='RealDate';
    $('source-field').value=site;
    $('visitor-screen').classList.toggle('hide',realdate || screen!=='visitor');
    $('realdate-preview').classList.toggle('hide',!realdate || screen!=='visitor');
    for(const [id,isActive] of [['view-genealogy',!realdate],['view-realdate',realdate]]){
      $(id).classList.toggle('active',isActive);$(id).setAttribute('aria-pressed',String(isActive));
    }
    $('mock-more-menu').classList.add('hide');$('mock-more').setAttribute('aria-expanded','false');
    if(realdate){
      $('realdate-form-slot').appendChild($('form-layer'));
      $('form-layer').classList.add('standalone');
      $('form-layer').classList.remove('closed');
      $('form-main').style.overflow='visible';
      $('feedback-form').style.overflow='visible';
      $('form-title').textContent='匿名問題回饋';
      $('form-subtitle').textContent='RealDate · 不需要登入，請填寫遇到的問題。';
      $('issue-target').innerHTML='<option value="mod">RealDate 模組</option><option value="web">RealDate 網站</option>';
      $('issue-target').value='mod';
    }else{
      originalFormParent.insertBefore($('form-layer'),$('admin-screen'));
      $('form-layer').classList.remove('standalone');
      $('form-main').style.overflow='hidden';
      $('feedback-form').style.overflow='hidden';
      $('form-title').textContent='意見回饋';
      $('form-subtitle').textContent='Genealogy · 匿名提交，不需要登入。';
      $('issue-target').innerHTML='<option value="web">族譜工具網站</option><option value="exporter">族譜提取器</option>';
      $('form-layer').classList.add('closed');
    }
    updateVersionFields();
    window.scrollTo({top:0,behavior:'auto'});
  }
  $('view-genealogy').addEventListener('click',()=>setVisitorSite('Genealogy'));
  $('view-realdate').addEventListener('click',()=>setVisitorSite('RealDate'));
  $('issue-target').addEventListener('change',updateVersionFields);
  $('module-version').addEventListener('change',updateManualVersion);
  $('manual-version').addEventListener('input',()=>{$('version-error').classList.remove('visible');$('submit-error-summary').hidden=true});
  $('mock-more').addEventListener('click',()=>{
    const open=$('mock-more-menu').classList.toggle('hide')===false;
    $('mock-more').setAttribute('aria-expanded',String(open));
  });
  $('mock-more-menu').addEventListener('click',()=>{$('mock-more-menu').classList.add('hide');$('mock-more').setAttribute('aria-expanded','false')});

  function setScreen(next){screen=next;closeDetail();$('context-switch').classList.toggle('hide',next!=='visitor');$('visitor-screen').classList.toggle('hide',next!=='visitor'||visitorSite==='RealDate');$('realdate-preview').classList.toggle('hide',next!=='visitor'||visitorSite!=='RealDate');$('form-layer').classList.toggle('closed',next!=='visitor'||visitorSite!=='RealDate');$('admin-screen').classList.toggle('off',next!=='admin');for(const name of ['visitor','admin']){$('tab-'+name).classList.toggle('active',name===next);$('tab-'+name).setAttribute('aria-pressed',String(name===next))}if(next==='admin'){render();setAdminPage('overview')}else if(visitorSite==='RealDate')openForm();if(next==='visitor'&&!$('thread-pane').classList.contains('hide'))renderVisitorThread();window.scrollTo({top:0,behavior:'auto'});}
  $('tab-visitor').addEventListener('click',()=>setScreen('visitor'));
  $('tab-admin').addEventListener('click',()=>setScreen('admin'));
  $('visitor-go-admin').addEventListener('click',()=>setScreen('admin'));
  function openForm(){lastFocus=document.activeElement; $('form-layer').classList.remove('closed');$('form-layer').querySelector('.feedback-modal').scrollTop=0;}
  function closeForm(){if(visitorSite==='RealDate'&&screen==='visitor')return;$('form-layer').classList.add('closed');if(lastFocus?.focus)lastFocus.focus();}
  document.querySelectorAll('[data-open-form]').forEach(b=>b.addEventListener('click',openForm));
  $('close-form').addEventListener('click',closeForm);
  $('form-layer').addEventListener('click',e=>{if(e.target===$('form-layer'))closeForm()});
  document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{activeType=b.dataset.type;document.querySelectorAll('[data-type]').forEach(c=>{const active=c===b;c.classList.toggle('active',active);c.setAttribute('aria-pressed',String(active))});updateVersionFields()}));
  $('message-field').addEventListener('input',()=>{$('char-count').textContent=$('message-field').value.length+' / 2000';$('message-error').classList.remove('visible');$('submit-error-summary').hidden=true});
  $('verify-button').addEventListener('click',()=>{verified=!verified;$('verify-card').classList.toggle('verified',verified);$('verify-title').textContent=verified?'示範驗證已完成':'人機驗證預覽';$('verify-subtitle').textContent=verified?'僅供介面互動測試，非真實驗證':'正式版將由 Cloudflare 自動驗證';$('verify-button').textContent=verified?'重新模擬':'模擬驗證';$('verify-error').classList.remove('visible');$('submit-error-summary').hidden=true});
  const uploadArea=$('upload-zone');
  uploadArea.addEventListener('click',e=>{if(e.target!==$('file-input'))$('file-input').click()});
  uploadArea.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file-input').click()}});
  uploadArea.addEventListener('dragover',e=>{e.preventDefault();uploadArea.classList.add('drag-over')});
  uploadArea.addEventListener('dragleave',()=>uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop',e=>{e.preventDefault();uploadArea.classList.remove('drag-over');addFiles(e.dataTransfer.files)});
  $('file-input').addEventListener('change',e=>{addFiles(e.target.files);e.target.value=''});
  function fileAllowed(f){const suffix=f.name.toLowerCase().split('.').pop();return ['png','jpg','jpeg','webp','txt','log'].includes(suffix)}
  function addFiles(input){const newFiles=Array.from(input??[]);if(!newFiles.length)return;const issues=[];for(const f of newFiles){if(!fileAllowed(f)){issues.push('不支援「'+f.name+'」的格式');continue}if(uploads.length>=3){issues.push('最多只能加入 3 個附件');break}if(f.size>10*1048576){issues.push('單一附件不可超過 10 MB');continue}if(uploads.reduce((s,x)=>s+x.file.size,0)+f.size>20*1048576){issues.push('附件總大小不可超過 20 MB');continue}const url=f.type.startsWith('image/')?URL.createObjectURL(f):null;uploads.push({file:f,url,id:Math.random().toString(36).slice(2)})}renderFiles();const el=$('file-error');el.textContent=issues.slice(0,2).join('；');el.classList.toggle('visible',!!issues.length)}
  function renderFiles(){const root=$('file-list');root.replaceChildren();uploads.forEach((item,index)=>{const row=document.createElement('div');row.className='upload-file';const thumb=document.createElement('div');thumb.className='upload-thumb';if(item.url){const img=document.createElement('img');img.src=item.url;img.alt='附件縮圖';thumb.append(img)}else thumb.innerHTML=icon('file','i sm');const name=document.createElement('div');name.className='upload-name';name.textContent=item.file.name;const sub=document.createElement('small');sub.textContent=sizeText(item.file.size);name.append(sub);const remove=document.createElement('button');remove.className='icon-btn';remove.type='button';remove.setAttribute('aria-label','移除 '+item.file.name);remove.innerHTML=icon('close','i sm');remove.addEventListener('click',()=>{if(item.url)URL.revokeObjectURL(item.url);uploads.splice(index,1);renderFiles();$('file-error').classList.remove('visible')});row.append(thumb,name,remove);root.append(row)})}

  // 匿名回饋憑證只存在這次預覽的記憶體裡。正式版必須在後端驗證並妥善儲存憑證雜湊。
  function makePrivateToken(){const bytes=new Uint8Array(24);if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(bytes);else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')}
  function messagesFor(r){if(!r.messages)r.messages=[{by:'player',text:r.message,date:r.date,files:r.files}];return r.messages}
  function waitingOn(r){if(r.conversation===false)return 'once';if(r.status==='done'||r.status==='spam')return 'closed';const msgs=messagesFor(r);return msgs.some(m=>m.by==='admin')?(msgs[msgs.length-1].by==='admin'?'player':'admin'):'admin'}
  function waitingLabel(r){const who=waitingOn(r);return who==='once'?'單次回饋':who==='closed'?'已結案':who==='admin'?'待你回覆':'等待玩家回覆'}
  function addMessages(root,r){root.replaceChildren();for(const m of messagesFor(r)){
    const message=document.createElement('div');message.className='conversation-message '+(m.by==='admin'?'by-admin':'by-player');
    const who=document.createElement('span');who.className='conversation-label';who.textContent=m.by==='admin'?'L1nG · 管理員':'匿名玩家';
    const bubble=document.createElement('div');bubble.className='conversation-bubble';bubble.textContent=m.text;
    for(const f of m.files||[]){const line=document.createElement('div');line.className='conversation-attachment';line.innerHTML=icon('paperclip','i sm');line.append(document.createTextNode(' '+f.name));if(f.url){const a=document.createElement('a');a.href=f.url;a.download=f.name;a.textContent='開啟';line.append(a)}else {const note=document.createElement('small');note.textContent='（示範附件）';line.append(note)}bubble.append(line)}
    const time=document.createElement('span');time.className='conversation-time';time.textContent=fullDate(m.date);message.append(who,bubble,time);root.append(message);
  }}
  function setVisitorPane(kind){$('form-main').style.display=kind==='form'?'flex':'none';$('success-pane').classList.toggle('hide',kind!=='success');$('thread-pane').classList.toggle('hide',kind!=='thread');if(kind==='thread')renderVisitorThread()}
  function openThreadHub(){if(screen!=='visitor')setScreen('visitor');openForm();visitorThreadId=null;setVisitorPane('thread')}
  function openVisitorThread(id){if(!privateReceipts.has(id)){notify('這筆回饋需要私人憑證才能查看');return}visitorThreadId=id;setVisitorPane('thread')}
  function renderVisitorThread(){const id=visitorThreadId;const r=id?records.find(x=>x.id===id):null;const unlocked=!!(r&&privateReceipts.has(id));$('thread-home').classList.toggle('hide',unlocked);$('thread-chat').classList.toggle('hide',!unlocked);
    if(unlocked){$('thread-title').textContent='匿名回饋對話';$('thread-description').textContent='你可以查看 L1nG 的回覆，並繼續補充問題。';$('thread-ref').textContent=r.id;$('thread-meta').textContent=r.site+' · '+labels[r.type];$('thread-state').textContent=waitingOn(r)==='player'?'管理員已回覆':waitingOn(r)==='closed'?'已結案':'等待管理員回覆';addMessages($('visitor-messages'),r)}
    else{$('thread-title').textContent='我的匿名回饋';$('thread-description').textContent='只有持有私人憑證才能開啟對話。';const list=$('my-thread-list');list.replaceChildren();const ids=[...privateReceipts.keys()].filter(x=>records.some(r=>r.id===x));if(!ids.length){const p=document.createElement('p');p.className='thread-help';p.textContent='目前沒有已建立的匿名對話。可以先提交一則回饋。';list.append(p)}else for(const key of ids){const item=records.find(x=>x.id===key);const b=document.createElement('button');b.className='my-thread-card';b.type='button';b.innerHTML='<span><strong>'+safe(item.id)+' · '+safe(item.title)+'</strong><small>'+safe(item.site)+' · '+waitingLabel(item)+'</small></span>'+icon('arrow','i sm');b.addEventListener('click',()=>openVisitorThread(key));list.append(b)}}
  }
  function restoreConversation(){const raw=$('restore-token').value.trim();const match=[...privateReceipts.entries()].find(([id,token])=>raw===id+':'+token||raw===token);if(!match){$('restore-error').hidden=false;return}$('restore-error').hidden=true;$('restore-token').value='';openVisitorThread(match[0])}
  $('restore-thread').addEventListener('click',restoreConversation);
  $('thread-back-list').addEventListener('click',()=>{visitorThreadId=null;renderVisitorThread()});
  $('thread-back-form').addEventListener('click',()=>resetForm());
  $('form-open-thread').addEventListener('click',openThreadHub);
  document.querySelectorAll('[data-open-thread]').forEach(b=>b.addEventListener('click',()=>{$('mock-more-menu').classList.add('hide');openThreadHub()}));
  $('success-open-thread').addEventListener('click',()=>openVisitorThread(lastCreatedId));
  async function copyReceipt(){if(!lastCreatedId)return;const text=lastCreatedId+':'+privateReceipts.get(lastCreatedId);try{await navigator.clipboard.writeText(text);notify('已複製私人憑證')}catch{const code=$('success-token');if(window.getSelection){const range=document.createRange();range.selectNodeContents(code);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range)}notify('請手動複製畫面中的憑證')}}
  $('copy-receipt').addEventListener('click',copyReceipt);
  $('visitor-reply-files').addEventListener('change',e=>{const issues=[];for(const f of Array.from(e.target.files||[])){if(!fileAllowed(f)){issues.push('不支援此檔案格式');continue}if(replyUploads.length>=3||f.size>10*1048576||replyUploads.reduce((a,b)=>a+b.file.size,0)+f.size>20*1048576){issues.push('附件超過大小或數量限制');continue}replyUploads.push({file:f,url:f.type.startsWith('image/')?URL.createObjectURL(f):null})}e.target.value='';$('visitor-reply-file-info').textContent=replyUploads.length?replyUploads.map(x=>x.file.name).join('、'):'最多 3 個檔案・合計 20 MB';$('visitor-reply-error').textContent=issues.join('；');$('visitor-reply-error').hidden=!issues.length});
  $('visitor-reply-form').addEventListener('submit',e=>{e.preventDefault();const r=records.find(x=>x.id===visitorThreadId);if(!r||!privateReceipts.has(r.id))return;const value=$('visitor-reply').value.trim();if(!value){$('visitor-reply-error').textContent='請先輸入回覆內容。';$('visitor-reply-error').hidden=false;return}const files=replyUploads.map(x=>({name:x.file.name,size:x.file.size,url:x.url}));replyUploads=[];messagesFor(r).push({by:'player',text:value,date:new Date().toISOString(),files});if(r.status==='done')r.status='progress';$('visitor-reply').value='';$('visitor-reply-file-info').textContent='最多 3 個檔案・合計 20 MB';$('visitor-reply-error').hidden=true;renderVisitorThread();render();notify('補充訊息已加入對話（示範）')});
  $('admin-send').addEventListener('click',()=>{const r=records.find(x=>x.id===selectedRecord);if(!r)return;if(r.conversation===false){notify('玩家選擇只送出回饋，不能在網站內回覆');return}const text=$('admin-reply').value.trim();if(!text){$('admin-reply-error').hidden=false;return}messagesFor(r).push({by:'admin',text,date:new Date().toISOString()});r.status='progress';$('admin-reply').value='';$('admin-reply-error').hidden=true;render();openDetail(r.id);notify('管理員回覆已送出（示範）')});

  function resetForm(){ $('feedback-form').reset();document.getElementById('reply-once').checked=true;activeType='bug';document.querySelectorAll('[data-type]').forEach(b=>{const v=b.dataset.type==='bug';b.classList.toggle('active',v);b.setAttribute('aria-pressed',String(v))});$('char-count').textContent='0 / 2000';$('contact-option').open=false;$('module-version').value='';$('manual-version').value='';updateManualVersion();$('game-version').value='';updateVersionFields();$('contact-method').value='email';$('contact-value').value='';$('contact-value').type='email';$('contact-value').placeholder='example@email.com';verified=false;$('verify-card').classList.remove('verified');$('verify-title').textContent='人機驗證預覽';$('verify-subtitle').textContent='正式版將由 Cloudflare 自動驗證';$('verify-button').textContent='模擬驗證';document.querySelectorAll('.field-error').forEach(x=>x.classList.remove('visible'));$('submit-error-summary').hidden=true;uploads.forEach(x=>{if(x.url)URL.revokeObjectURL(x.url)});uploads=[];renderFiles();$('success-pane').classList.add('hide');$('thread-pane').classList.add('hide');$('form-main').style.display='flex';}
  $('feedback-form').addEventListener('submit',e=>{e.preventDefault();const message=$('message-field').value.trim();let invalid=false;if(message.length<10){$('message-error').classList.add('visible');invalid=true}if(!verified){$('verify-error').classList.add('visible');invalid=true}if(!$('module-version-section').hidden && (!$('module-version').value || $('module-version').value==='other' && !$('manual-version').value.trim())){$('version-error').classList.add('visible');invalid=true}const contactValue=$('contact-value').value.trim();const contactMethod=$('contact-method').value;if($('contact-option').open && contactValue && (contactMethod==='email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue) || contactMethod==='discord' && contactValue.length<2)){$('contact-error').classList.add('visible');invalid=true}if(invalid){const issues=[];if($('message-error').classList.contains('visible'))issues.push('回饋內容至少需要 10 個字');if($('version-error').classList.contains('visible'))issues.push('請確認模組版本');if($('contact-error').classList.contains('visible'))issues.push('聯絡方式格式不正確');if($('verify-error').classList.contains('visible'))issues.push('請完成模擬人機驗證');$('submit-error-detail').textContent=issues.join('；')+'。';const banner=$('submit-error-summary');banner.hidden=false;if(visitorSite==='RealDate'){banner.scrollIntoView({behavior:'smooth',block:'center'})}else{$('feedback-form').querySelector('.modal-content').scrollTo({top:0,behavior:'smooth'})}banner.focus({preventScroll:true});return}const wantsConversation=$('reply-thread').checked;const id='LNG-'+number++;const files=uploads.map(x=>({name:x.file.name,size:x.file.size,url:x.url,sample:false}));uploads=[];$('file-list').replaceChildren();records.unshift({id,type:activeType,site:$('source-field').value,issueTarget:activeType==='bug'?$('issue-target').value:null,moduleVersion:activeType==='bug'&&!$('module-version-section').hidden?($('module-version').value==='unknown'?'不確定':$('module-version').value==='other'?$('manual-version').value.trim():$('module-version').value):null,gameVersion:activeType==='bug'&&visitorSite==='RealDate'?$('game-version').value.trim():null,title:message.split(/[\n。！？!?]/)[0].trim().slice(0,32)||'匿名回饋',message,conversation:wantsConversation,status:'pending',date:new Date().toISOString(),contact:($('contact-option').open&&contactValue)?{method:contactMethod,value:contactValue}:null,files});lastCreatedId=wantsConversation?id:null;if(wantsConversation)privateReceipts.set(id,makePrivateToken());$('success-code').textContent='回饋編號 '+id;$('success-token').textContent=wantsConversation?id+':'+privateReceipts.get(id):'';$('success-credential').hidden=!wantsConversation;$('success-open-thread').hidden=!wantsConversation;$('success-description').textContent=wantsConversation?'已建立匿名對話，可在網站查看回覆；請保存私人憑證。':'已建立單次回饋，不會開啟對話，也不會產生私人憑證。';$('form-main').style.display='none';$('thread-pane').classList.add('hide');$('success-pane').classList.remove('hide');if(visitorSite==='RealDate')$('success-pane').scrollIntoView({behavior:'smooth',block:'start'});});
  $('success-new').addEventListener('click',resetForm);
  function setStatusFilter(value){setAdminPage('feedback');filterStatus=value;document.querySelectorAll('[data-statusfilter]').forEach(el=>el.classList.toggle('active',el.dataset.statusfilter===value));document.querySelectorAll('[data-stat]').forEach(el=>el.classList.toggle('chosen',el.dataset.stat===value));document.querySelectorAll('[data-mobilefilter]').forEach(el=>el.classList.toggle('active',el.dataset.mobilefilter===value));renderRows()}
  function setSiteFilter(value){setAdminPage('feedback');filterSite=value;$('site-filter').value=value;document.querySelectorAll('[data-sitefilter]').forEach(el=>el.classList.toggle('active',el.dataset.sitefilter===value));renderRows()}
  document.querySelectorAll('[data-statusfilter]').forEach(b=>b.addEventListener('click',()=>setStatusFilter(b.dataset.statusfilter)));
  document.querySelectorAll('[data-stat]').forEach(b=>b.addEventListener('click',()=>setStatusFilter(b.dataset.stat)));
  document.querySelectorAll('[data-mobilefilter]').forEach(b=>b.addEventListener('click',()=>setStatusFilter(b.dataset.mobilefilter)));
  document.querySelectorAll('[data-sitefilter]').forEach(b=>b.addEventListener('click',()=>setSiteFilter(filterSite===b.dataset.sitefilter?'all':b.dataset.sitefilter)));
  $('site-filter').addEventListener('change',e=>setSiteFilter(e.target.value));
  $('search-input').addEventListener('input',e=>{searchTerm=e.target.value.toLocaleLowerCase('zh-TW').trim();renderRows()});
  $('contact-filter').addEventListener('change',e=>{filterContact=e.target.value;renderRows()});
  $('reply-filter').addEventListener('change',e=>{filterReply=e.target.value;renderRows()});
  function render(){for(const s of ['all','pending','progress','done','spam']){const value=s==='all'?records.length:records.filter(r=>r.status===s).length;if($('count-'+s))$('count-'+s).textContent=value;if($('nav-count-'+s))$('nav-count-'+s).textContent=value}renderRows()}
  function renderRows(){const list=records.filter(r=>(filterStatus==='all'||r.status===filterStatus)&&(filterSite==='all'||r.site===filterSite)&&(filterContact==='all'||(filterContact==='contact'?!!r.contact:!r.contact))&&(filterReply==='all'||(filterReply==='admin'&&waitingOn(r)==='admin')||(filterReply==='player'&&waitingOn(r)==='player')||(filterReply==='no-reply'&&!messagesFor(r).some(m=>m.by==='admin')))&&(!searchTerm||[r.title,r.message,r.site,r.id,labels[r.type]].join(' ').toLocaleLowerCase('zh-TW').includes(searchTerm))).sort((a,b)=>new Date(b.date)-new Date(a.date));const root=$('feedback-rows');root.replaceChildren();$('list-count').textContent=list.length+' 則';$('list-bottom').textContent='顯示 '+list.length+' 則回饋 · 僅供版面與互動測試';if(!list.length){const empty=document.createElement('div');empty.className='empty-list';empty.innerHTML=icon('search','i xl')+'<h3>目前沒有符合條件的回饋</h3><p>試著調整搜尋內容或篩選條件。</p>';root.append(empty);return}const frag=document.createDocumentFragment();for(const r of list){const row=document.createElement('button');row.type='button';row.className='feedback-row';row.setAttribute('aria-label','查看 '+r.title+' 的詳細內容');row.innerHTML=`<div class="row-primary"><strong>${safe(r.title)}</strong><span class="excerpt">${safe(r.message)}</span><span class="row-id">${safe(r.id)} ${r.files.length?' · '+r.files.length+' 個附件':''}</span><span class="contact-tag ${r.contact?'has-contact':'anonymous'}">${r.contact?icon('msg','i sm')+' 已留聯絡方式':'未留聯絡方式'}</span><span class="reply-badge ${waitingOn(r)==='admin'?'':'neutral'}">${waitingLabel(r)}</span></div><span class="row-text row-source">${safe(r.site)}</span><span class="row-type"><span class="type-badge">${labels[r.type]}</span></span><span class="row-status"><span class="status-badge ${r.status}">${statuses[r.status]}</span></span><span class="row-text row-date">${dateText(r.date)}</span>`;row.addEventListener('click',()=>openDetail(r.id));frag.append(row)}root.append(frag)}
  function openDetail(id){const r=records.find(x=>x.id===id);if(!r)return;selectedRecord=r.id;const body=$('detail-body');body.replaceChildren();const safeText=safe(r.message).replace(/\n/g,'<br>');body.innerHTML=`<div class="detail-meta"><span class="status-badge ${r.status}">${statuses[r.status]}</span><span class="type-badge">${labels[r.type]}</span><span class="contact-tag ${r.contact?'has-contact':'anonymous'}">${r.contact?'已留聯絡方式':'完全匿名'}</span></div><span class="tiny-label">回饋內容</span><h3 style="font-size:18px;letter-spacing:-.025em;margin:7px 0 14px">${safe(r.title)}</h3><p style="font-size:13px;line-height:1.95;white-space:normal;overflow-wrap:anywhere">請在下方對話區查看原始訊息與後續回覆。</p><div class="divider" style="margin:27px 0 23px"></div><span class="tiny-label">回饋資訊</span><dl><div class="detail-kv"><dt>回饋編號</dt><dd>${safe(r.id)}</dd></div><div class="detail-kv"><dt>相關網站</dt><dd>${safe(r.site)}</dd></div><div class="detail-kv"><dt>提交時間</dt><dd>${fullDate(r.date)}</dd></div>${r.moduleVersion?'<div class="detail-kv"><dt>模組版本</dt><dd>'+safe(r.moduleVersion)+'</dd></div>':''}${r.gameVersion?'<div class="detail-kv"><dt>遊戲版本</dt><dd>'+safe(r.gameVersion)+'</dd></div>':''}<div class="detail-kv"><dt>提交方式</dt><dd>${r.contact?safe((r.contact.method==='email'?'電子郵件':'Discord')+' · '+r.contact.value):'完全匿名（未留聯絡方式）'}</dd></div></dl><div class="divider" style="margin:24px 0 21px"></div><div class="detail-field"><h3>附加檔案 <span class="optional">(${r.files.length})</span></h3><div id="detail-files"></div></div><h3 class="detail-thread-title">${r.conversation===false?"單次回饋":"匿名對話"} <span class="reply-indicator">${waitingLabel(r)}</span></h3><div class="conversation-stack" id="admin-conversation"></div>`;const root=$('detail-files');if(!r.files.length){const p=document.createElement('p');p.textContent='這則回饋沒有附加檔案。';root.append(p)}else for(const file of r.files){const item=document.createElement('div');item.className='detail-file';const box=document.createElement('div');box.className='thumb';if(file.url&&/\.(png|jpg|jpeg|webp)$/i.test(file.name)){const img=document.createElement('img');img.src=file.url;img.alt='附件縮圖';box.append(img)}else box.innerHTML=icon('file','i');const c=document.createElement('div');c.style.cssText='flex:1;min-width:0';const name=document.createElement('strong');name.textContent=file.name;const small=document.createElement('small');small.textContent=(file.sample?'示範附件 · 無實體檔案':'此瀏覽階段可預覽')+' · '+sizeText(file.size);c.append(name,small);item.append(box,c);if(file.url){const a=document.createElement('a');a.href=file.url;a.download=file.name;a.textContent='檢視';a.setAttribute('aria-label','檢視 '+file.name);item.append(a)}root.append(item)}const firstDivider=body.querySelector('.divider');const convoTitle=body.querySelector('.detail-thread-title');const convoBody=$('admin-conversation');if(firstDivider&&convoTitle){body.insertBefore(convoTitle,firstDivider);body.insertBefore(convoBody,firstDivider)}addMessages(convoBody,r);$('admin-reply').parentElement.hidden=r.conversation===false;$('admin-reply').value='';$('admin-reply-error').hidden=true;$('detail-status').value=r.status;$('detail-layer').classList.add('open');$('detail-layer').setAttribute('aria-hidden','false');$('detail-close').focus()}
  function closeDetail(){$('confirm-layer').classList.remove('open');$('confirm-layer').setAttribute('aria-hidden','true');$('detail-layer').classList.remove('open');$('detail-layer').setAttribute('aria-hidden','true');selectedRecord=null}
  $('contact-method').addEventListener('change',()=>{const isEmail=$('contact-method').value==='email';$('contact-value').type=isEmail?'email':'text';$('contact-value').placeholder=isEmail?'example@email.com':'Discord 使用者名稱';$('contact-error').classList.remove('visible')});
  $('contact-value').addEventListener('input',()=>$('contact-error').classList.remove('visible'));
  $('detail-close').addEventListener('click',closeDetail);
  $('detail-layer').addEventListener('click',e=>{if(e.target===$('detail-layer'))closeDetail()});
  $('detail-update').addEventListener('click',()=>{const r=records.find(x=>x.id===selectedRecord);if(!r)return;r.status=$('detail-status').value;render();openDetail(r.id);notify('處理狀態已更新（僅限本次預覽）')});
  $('detail-delete').addEventListener('click',()=>{$('confirm-layer').classList.add('open');$('confirm-layer').setAttribute('aria-hidden','false');$('cancel-delete').focus()});
  $('cancel-delete').addEventListener('click',()=>{$('confirm-layer').classList.remove('open');$('confirm-layer').setAttribute('aria-hidden','true')});
  $('confirm-delete').addEventListener('click',()=>{const r=records.find(x=>x.id===selectedRecord);if(r){for(const file of r.files){if(file.url)URL.revokeObjectURL(file.url)}}records=records.filter(x=>x.id!==selectedRecord);closeDetail();render();notify('示範回饋已刪除')});
  $('reset-demo').addEventListener('click',()=>{for(const r of records)for(const f of r.files)if(f.url)URL.revokeObjectURL(f.url);records=demoItems.map(x=>({...x,files:x.files.map(f=>({...f})),messages:(x.messages||[]).map(m=>({...m}))}));privateReceipts.clear();visitorThreadId=null;replyUploads=[];number=1029;filterStatus='all';filterSite='all';filterContact='all';filterReply='all';$('reply-filter').value='all';$('contact-filter').value='all';searchTerm='';$('search-input').value='';setStatusFilter('all');setSiteFilter('all');render();notify('範例資料已重設')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('confirm-layer').classList.contains('open')){$('cancel-delete').click();return}if($('detail-layer').classList.contains('open')){closeDetail();return}if(screen==='visitor')closeForm()}});

  // ------------------------ V4: dashboard navigation ------------------------
  let adminPage='overview', gaRange='30', gaSite='all';
  function setAdminPage(next){
    const changing=next!==adminPage;
    adminPage=next;
    for(const p of ['overview','feedback','analytics','settings'])$('panel-'+p).hidden=p!==next;
    document.querySelectorAll('[data-adminpage]').forEach(b=>{const active=b.dataset.adminpage===next;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});
    if(next==='overview')renderOverview();
    if(next==='analytics')renderAnalytics();
    if(next==='feedback')renderRows();
    if(changing){const main=document.querySelector('.admin-main');if(main)main.scrollTop=0;window.scrollTo({top:0,behavior:'instant'});}
  }
  document.querySelectorAll('[data-adminpage]').forEach(b=>b.addEventListener('click',()=>setAdminPage(b.dataset.adminpage)));
  document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>setAdminPage(b.dataset.jump)));
  // GA4 prototype: deterministic local demo data; no network requests or tracking.
  const gaNumbers = [{site:'Genealogy',weight:.55},{site:'RealDate',weight:.31},{site:'L1nG',weight:.14}];
  const formatNum=n=>Math.round(n).toLocaleString('zh-TW');
  function gaDays(){
    if(gaRange!=='custom')return Number(gaRange);
    const from=new Date($('date-from').value+'T12:00:00'),to=new Date($('date-to').value+'T12:00:00');
    return Math.max(1,Math.min(365,Math.round((to-from)/86400000)+1));
  }
  function getGaData(days=gaDays(),site=gaSite){
    const factor=site==='all'?1:gaNumbers.find(x=>x.site===site).weight;
    const points=Array.from({length:days},(_,i)=>{
      const seasonal=Math.sin((i+11)*.52)*.14+Math.cos(i*.17)*.12;
      const weekly=((i+3)%7===0?.16:0);
      return Math.max(28,Math.round((290+1.9*i)*(1+seasonal+weekly)*factor));
    });
    const users=Math.round(points.reduce((a,b)=>a+b,0)*.72);
    const views=Math.round(users*2.42);
    const downloads=Math.round(users*.147);
    return {days,site,points,users,views,downloads,newUsers:Math.round(users*.61),factor};
  }
  function makeChart(values,idPrefix='chart'){
    const width=850,height=275,left=37,right=12,top=15,bottom=37,usableW=width-left-right,usableH=height-top-bottom;
    const max=Math.max(...values)*1.18 || 1;
    const coords=values.map((v,i)=>[left+i*usableW/Math.max(1,values.length-1),top+usableH-(v/max)*usableH]);
    const path=coords.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join(' ');
    const area=path+' L'+coords.at(-1)[0].toFixed(2)+' '+(top+usableH)+' L'+left+' '+(top+usableH)+' Z';
    const grid=Array.from({length:4},(_,i)=>{const y=top+i*usableH/3;return `<line x1="${left}" x2="${width-right}" y1="${y}" y2="${y}" stroke="var(--stroke)" stroke-dasharray="4 5"/><text x="${left-7}" y="${y+4}" text-anchor="end" fill="var(--muted)" font-size="11">${formatNum(max*(1-i/3))}</text>`}).join('');
    const samples=[0,Math.round((values.length-1)/3),Math.round((values.length-1)*2/3),values.length-1];
    const labels=samples.map(i=>`<text x="${coords[i][0]}" y="${height-10}" text-anchor="middle" fill="var(--muted)" font-size="11">${i+1}日</text>`).join('');
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="流量趨勢示意"><defs><linearGradient id="${idPrefix}-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity=".25"/><stop offset="100%" stop-color="var(--primary)" stop-opacity=".005"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#${idPrefix}-fill)"/><path d="${path}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${labels}</svg>`;
  }
  function renderRank(id,entries){
    const max=Math.max(1,...entries.map(e=>e[1]));
    $(id).innerHTML=entries.map(([name,n],i)=>`<div class="rank-row"><div class="rank-top"><span class="rank-index">${String(i+1).padStart(2,'0')}</span><span class="rank-title" title="${safe(name)}">${safe(name)}</span></div><strong class="rank-value">${formatNum(n)}</strong><div class="rank-bar-bg"><div class="rank-bar" style="width:${n/max*100}%"></div></div></div>`).join('');
  }
  function renderAnalytics(){
    const d=getGaData();
    $('ga-users').textContent=formatNum(d.users);$('ga-views').textContent=formatNum(d.views);
    $('ga-downloads').textContent=formatNum(d.downloads);$('ga-new').textContent=formatNum(d.newUsers);
    $('chart-description').textContent=`${d.days} 天 · ${d.site==='all'?'全部網站':d.site} · 活躍使用者`;
    $('ga-trend-chart').innerHTML=makeChart(d.points,'ga-trend');
    const pages=d.site==='all'?[['/L1nG/genealogy.html',.51],['/L1nG/home.html',.23],['/L1nG/RealDate/',.18],['/L1nG/genealogy-exporter.html',.08]]:d.site==='Genealogy'?[['/L1nG/genealogy.html',.79],['/L1nG/genealogy-exporter.html',.16],['/L1nG/home.html',.05]]:d.site==='RealDate'?[['/L1nG/RealDate/',.86],['/L1nG/home.html',.14]]:[['/L1nG/home.html',.84],['/L1nG/',.16]];
    renderRank('ga-pages',pages.map(([name,w])=>[name,Math.round(d.views*w)]));
    renderRank('ga-countries',[['台灣',.66],['香港',.14],['美國',.09],['日本',.06],['其他',.05]].map(([a,b])=>[a,Math.round(d.users*b)]));
    const files=d.site==='RealDate'?[['RealDate 模組',.71],['RealDate 說明文件',.29]]:d.site==='Genealogy'?[['族譜提取器',.61],['族譜範例資料',.39]]:[['族譜提取器',.46],['RealDate 模組',.32],['漢化下載',.22]];
    renderRank('ga-files',files.map(([a,b])=>[a,Math.round(d.downloads*b)]));
    const devices=[['電腦',53,'#7966bd'],['手機',42,'#b7a5e6'],['平板',5,'#dcd3f3']];
    $('ga-device').innerHTML=`<div class="donut" aria-label="電腦53%、手機42%、平板5%" style="background:conic-gradient(#7966bd 0 53%,#b7a5e6 53% 95%,#dcd3f3 95% 100%)"></div><div class="device-legend">${devices.map(([n,v,c])=>`<div class="legend-item"><span><span class="dot" style="background:${c}"></span>${n}</span><b>${v}%</b></div>`).join('')}</div>`;
    renderRank('ga-referrals',[['直接流量',40],['搜尋引擎',32],['社群平台',21],['其他',7]]);
  }
  function renderOverview(){
    const d=getGaData(30,'all');$('ov-users').textContent=formatNum(d.users);$('ov-views').textContent=formatNum(d.views);$('ov-downloads').textContent=formatNum(d.downloads);$('ov-pending').textContent=records.filter(r=>r.status==='pending').length;
    $('overview-chart').innerHTML=makeChart(d.points,'overview');
    $('overview-recent').replaceChildren();records.filter(r=>r.status!=='spam').slice(0,4).forEach(r=>{
      const b=document.createElement('button');b.className='overview-entry';b.type='button';
      const name=document.createElement('strong');name.textContent=r.title;const sub=document.createElement('small');sub.textContent=r.site+' · '+statuses[r.status];b.append(name,sub);
      b.addEventListener('click',()=>{setAdminPage('feedback');openDetail(r.id)});$('overview-recent').append(b);
    });
  }
  document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{
    gaRange=b.dataset.range;document.querySelectorAll('[data-range]').forEach(x=>x.classList.toggle('active',x===b));
    $('custom-date-row').hidden=gaRange!=='custom';if(gaRange!=='custom')renderAnalytics();
  }));
  $('analytics-site').addEventListener('change',e=>{gaSite=e.target.value;renderAnalytics()});
  $('apply-date').addEventListener('click',()=>{
    const f=$('date-from').value,t=$('date-to').value;
    if(!f||!t||f>t||t>'2026-10-12'||(new Date(t)-new Date(f))>364*86400000){$('date-error').textContent='請選擇有效日期（不超過 365 天）。';return}
    $('date-error').textContent='';renderAnalytics();
  });

  setVisitorSite(document.body.classList.contains('realdate-only')?'RealDate':'Genealogy');
  render();setAdminPage('overview');
})();