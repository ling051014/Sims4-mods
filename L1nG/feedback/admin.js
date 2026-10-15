/* L1nG Dashboard：正式回饋列表與對話沿用 feedback.css 的原版型。
 * 僅呈現 Worker/D1 實際回傳的資料，不載入示範回饋。
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  };
  const API = '/feedback/admin-api';
  const statuses = {pending:'尚未處理',progress:'處理中',done:'已完成',spam:'垃圾訊息'};
  const categories = {bug:'錯誤回報',feature:'功能建議',other:'其他意見'};
  const idList = ['all','pending','progress','done','spam'];
  let page = 'overview', entries = [], current = null, filterStatus = 'all';
  let detailRequest = 0, previewUrls = [];
  let listBusy=false,listLoaded=false,lastListCheck=0,refreshTimer=null,detailBusy=false,knownRevisions=new Map();
  const savedAdminViewKey = 'l1ng-admin-view-v1';
  function readSavedView() {
    try {
      const data = JSON.parse(sessionStorage.getItem(savedAdminViewKey) || 'null');
      return data && typeof data === 'object' ? data : {};
    } catch (_) { return {}; }
  }
  const initialView = readSavedView();
  let activeDetailId = null;
  function saveView() {
    try {
      sessionStorage.setItem(savedAdminViewKey, JSON.stringify({
        page,filterStatus,detailId:activeDetailId
      }));
    } catch (_) {}
  }

  // 預覽只能由管理員手動點附件開啟；不會跟回饋詳情同時自動彈出。
  let fullPreviewUrl = null, fullPreviewRequest = 0, previewOpener = null;
  function closeFullPreview(restoreFocus = true) {
    fullPreviewRequest++;
    $('admin-attachment-preview').hidden = true;
    if (fullPreviewUrl) {
      URL.revokeObjectURL(fullPreviewUrl);
      fullPreviewUrl = null;
    }
    $('admin-preview-content').replaceChildren();
    if (restoreFocus && previewOpener?.isConnected) previewOpener.focus({preventScroll:true});
    previewOpener = null;
  }
  async function openFullPreview(file, url, trigger) {
    const type = String(file.type || '').toLowerCase();
    if (!/^(image\/(png|jpeg|webp)|text\/plain)$/.test(type)) return;
    closeFullPreview(false);
    previewOpener = trigger;
    const requestId = ++fullPreviewRequest;
    $('admin-preview-title').textContent = file.name;
    $('admin-preview-size').textContent = sizeText(file.size);
    $('admin-preview-download').href = url;
    $('admin-preview-download').setAttribute('download',file.name);
    $('admin-preview-zoom-out').hidden = true;
    $('admin-preview-zoom-in').hidden = true;
    const content = $('admin-preview-content');
    content.replaceChildren(el('p','preview-placeholder','正在讀取附件…'));
    $('admin-attachment-preview').hidden = false;
    $('admin-preview-close').focus({preventScroll:true});
    try {
      const response = await fetch(url,{cache:'no-store',credentials:'include'});
      if (!response.ok) throw new Error('附件無法讀取，請改用下載。');
      const blob = await response.blob();
      if (requestId !== fullPreviewRequest) return;
      content.replaceChildren();
      if (type.startsWith('image/')) {
        fullPreviewUrl = URL.createObjectURL(blob);
        const image = document.createElement('img');
        image.alt = file.name;
        image.src = fullPreviewUrl;
        image.style.width = '100%';
        content.append(image);
        let zoom = 1;
        for (const [id,change] of [['admin-preview-zoom-in',.25],['admin-preview-zoom-out',-.25]]) {
          const button = $(id);
          button.hidden = false;
          button.onclick = () => {
            zoom = Math.max(.5,Math.min(3,Math.round((zoom+change)*100)/100));
            image.style.width = zoom*100+'%';
            image.style.maxWidth = zoom > 1 ? 'none' : '100%';
          };
        }
      } else {
        // TXT/LOG 只能作純文字顯示，禁止把附件當作 HTML 執行。
        const text = document.createElement('pre');
        text.textContent = await blob.text();
        if (requestId !== fullPreviewRequest) return;
        content.append(text);
      }
    } catch (error) {
      if (requestId === fullPreviewRequest) {
        content.replaceChildren(el('p','preview-placeholder',error.message || '預覽失敗，請使用下載。'));
      }
    }
  }
  const label = status => statuses[status] || status || '未知';
  const categoryLabel = category => categories[category] || category || '未分類';
  const categoryBadgeClass = category => ['bug','feature','other'].includes(category) ? category : 'uncategorized';
  const dateText = value => {
    if (!value) return '未知';
    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime()) ? '未知'
      : new Intl.DateTimeFormat('zh-TW', {dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Taipei'}).format(timestamp) + '（UTC+8）';
  };
  const sizeText = n => {
    const size = Number(n) || 0;
    return size < 1024 ? size + ' B' : size < 1048576 ? (size / 1024).toFixed(1) + ' KB'
      : (size / 1048576).toFixed(1) + ' MB';
  };
  const replyState = item => {
    if (item.followUp !== 'conversation') return 'no-reply';
    if (item.lastReplyAuthor === 'admin') return 'player';
    if (item.lastReplyAuthor === 'player' || item.lastReplyAuthor === null) return 'admin';
    // 舊版 Worker 未提供最後一則訊息作者時，不虛構對話的等待對象。
    return 'unknown';
  };
  const replyLabel = item => {
    if (item.followUp !== 'conversation') return '單次回饋';
    if (item.status === 'done' || item.status === 'spam') return '已結案';
    const state = replyState(item);
    return state === 'admin' ? '等待我回覆' : state === 'player' ? '等待玩家回覆' : '匿名對話';
  };
  const icon = name => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','i sm');
    svg.setAttribute('aria-hidden','true');
    const use = document.createElementNS('http://www.w3.org/2000/svg','use');
    use.setAttribute('href','#ico-' + name);
    svg.appendChild(use);
    return svg;
  };
  function notify(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
  }
  async function api(path, method = 'GET', payload) {
    const response = await fetch(API + path, {
      method, cache:'no-store', credentials:'include',
      headers:payload ? {'content-type':'application/json'} : undefined,
      body:payload ? JSON.stringify(payload) : undefined
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || '無法讀取管理資料，請確認 Cloudflare Access 登入狀態。');
    }
    return data;
  }
  function showPage(next) {
    if (!['overview','analytics','feedback','settings'].includes(next)) return;
    page = next;
    saveView();
    for (const name of ['overview','analytics','feedback','settings']) {
      const panel = $('panel-' + name);
      if (panel) panel.hidden = name !== next;
    }
    document.querySelectorAll('[data-adminpage]').forEach(button => {
      const active = button.dataset.adminpage === next;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    const area = document.querySelector('.admin-main');
    if (area) area.scrollTop = 0;
  }
  function render() {
    for (const key of idList) {
      const n = key === 'all' ? entries.length : entries.filter(e => e.status === key).length;
      if ($('count-' + key)) $('count-' + key).textContent = String(n);
      if ($('nav-count-' + key)) $('nav-count-' + key).textContent = String(n);
    }
    if ($('ov-pending')) $('ov-pending').textContent = String(entries.filter(e => e.status === 'pending').length);
    const search = ($('search-input')?.value || '').trim().toLocaleLowerCase('zh-TW');
    const site = $('site-filter')?.value || 'all';
    const contact = $('contact-filter')?.value || 'all';
    const reply = $('reply-filter')?.value || 'all';
    const selected = entries.filter(item =>
      (filterStatus === 'all' || item.status === filterStatus) &&
      (site === 'all' || item.site === site) &&
      (contact === 'all' || (!!item.contact === (contact === 'contact'))) &&
      (reply === 'all' || replyState(item) === reply) &&
      (!search || [item.title,item.message,item.id,item.site,categoryLabel(item.category)]
        .join(' ').toLocaleLowerCase('zh-TW').includes(search))
    );
    const root = $('feedback-rows');
    if (!root) return;
    root.replaceChildren();
    if ($('list-count')) $('list-count').textContent = selected.length + ' 則';
    if ($('list-bottom')) $('list-bottom').textContent = '顯示 ' + selected.length + ' 則回饋';
    if (!selected.length) {
      const box = el('div','empty-list');
      box.append(el('h3','',entries.length ? '目前沒有符合條件的回饋' : '目前沒有回饋紀錄'));
      box.append(el('p','',entries.length ? '請試著調整篩選或搜尋條件。' : '玩家提交的回饋會顯示在這裡。'));
      root.appendChild(box);
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const item of selected) {
      const row = el('button','feedback-row');
      row.type = 'button';
      row.setAttribute('aria-label','查看 ' + item.title + ' 的詳細內容');
      const primary = el('div','row-primary');
      primary.append(el('strong','',item.title));
      primary.append(el('span','excerpt',item.message));
      primary.append(el('span','row-id',item.id));
      const contactTag = el('span','contact-tag ' + (item.contact ? 'has-contact' : 'anonymous'),
        item.contact ? '已留聯絡方式' : '未留聯絡方式');
      primary.append(contactTag);
      primary.append(el('span','reply-badge ' + (replyState(item) === 'unknown' ? 'neutral' : ''),replyLabel(item)));
      row.append(primary);
      row.append(el('span','row-text row-source',item.site));
      const type = el('span','row-type');
      type.append(el('span','type-badge '+categoryBadgeClass(item.category),categoryLabel(item.category)));
      row.append(type);
      const status = el('span','row-status');
      status.append(el('span','status-badge ' + item.status,label(item.status)));
      row.append(status);
      row.append(el('span','row-text row-date',dateText(item.createdAt)));
      row.addEventListener('click',() => openDetail(item.id));
      fragment.append(row);
    }
    root.appendChild(fragment);
  }
  function showListSkeleton(){
    const root=$('feedback-rows');if(!root)return;root.replaceChildren();
    for(let i=0;i<4;i++){const row=el('div','feedback-skeleton-row');row.setAttribute('aria-hidden','true');row.append(el('span','feedback-skeleton-main'),el('span','feedback-skeleton-short'));root.append(row);}
    root.setAttribute('aria-busy','true');
  }
  const revisionOf=item=>[item.updatedAt,item.lastReplyAuthor,item.status].join('|');
  async function refresh({manual=false,quiet=false}={}){
    if(listBusy)return;
    listBusy=true;const button=$('feedback-refresh');if(button)button.disabled=true;
    if(!listLoaded)showListSkeleton();
    if(manual)$('feedback-sync-status').textContent='正在更新回饋…';
    try {
      const data = await api('/feedback');
      const next=(data.items||[]).map(item=>({...item,title:item.title||item.message.slice(0,32),site:item.source||item.site}));
      const additions=next.filter(item=>!knownRevisions.has(item.id)||(knownRevisions.get(item.id)!==revisionOf(item)&&item.lastReplyAuthor==='player'));
      const needsDetail=current&&next.some(item=>item.id===current.id&&knownRevisions.get(item.id)!==revisionOf(item));
      const shouldNotify=listLoaded&&additions.length&&!quiet;
      entries=next;knownRevisions=new Map(next.map(item=>[item.id,revisionOf(item)]));listLoaded=true;lastListCheck=Date.now();
      const area=document.querySelector('.admin-main'),scroll=area?.scrollTop||0;render();if(area)area.scrollTop=scroll;
      if(needsDetail)void refreshVisibleDetail();
      if(shouldNotify)$('feedback-sync-status').textContent='收到 '+additions.length+' 則新回饋或更新';
      else if(manual)$('feedback-sync-status').textContent='已更新 · '+new Date().toLocaleTimeString('zh-TW');
      if ($('overview-recent')) {
        $('overview-recent').textContent = entries.length
          ? '最新回饋：' + entries[0].title : '目前沒有回饋紀錄。';
        $('overview-recent').removeAttribute('aria-busy');
      }
    } catch (error) {
      $('feedback-sync-status').textContent='更新失敗，請稍後重試。';
      if(manual||!listLoaded)notify(error.message);
      if(!listLoaded){const root=$('feedback-rows');root.replaceChildren(el('p','empty-list','回饋載入失敗，請按「立即更新」重試。'));}
    }finally{listBusy=false;if(button)button.disabled=false;$('feedback-rows')?.removeAttribute('aria-busy');}
  }
  async function refreshVisibleDetail(){
    if(detailBusy||!current||!$('detail-layer')?.classList.contains('open'))return;
    detailBusy=true;const id=current.id;
    try{
      const response=await api('/feedback/'+encodeURIComponent(id));
      if(!current||current.id!==id)return;
      const item=response.feedback,root=$('detail-body'),stack=root?.querySelector('.conversation-stack');
      if(!stack)return;
      const scroll=root.scrollTop;
      releasePreviews();stack.replaceChildren();
      const attachments=item.attachments||[];
      renderMessage(stack,'player',item.message,item.createdAt,attachments.filter(f=>f.replyId==null),detailRequest);
      for(const msg of item.messages||[])renderMessage(stack,msg.author,msg.body,msg.created_at||msg.createdAt,attachments.filter(f=>f.replyId===msg.id),detailRequest);
      root.scrollTop=scroll;current=item;updateDetailTags(item);
      $('detail-status').value=item.status;window.L1nGRefreshSelect?.($('detail-status'));
    }catch(_){/* keep prior conversation and unsent reply */}
    finally{detailBusy=false;}
  }
  function addField(root, name, value) {
    if (value === null || value === undefined || value === '') return;
    const line = el('div','detail-kv');
    line.append(el('dt','',name),el('dd','',value));
    root.appendChild(line);
  }
  function releasePreviews() {
    for (const url of previewUrls) URL.revokeObjectURL(url);
    previewUrls = [];
  }
  async function loadThumbnail(image, url, requestId) {
    try {
      const response = await fetch(url,{cache:'no-store',credentials:'include'});
      if (!response.ok) return;
      const blob = await response.blob();
      if (requestId !== detailRequest) return;
      const objectUrl = URL.createObjectURL(blob);
      previewUrls.push(objectUrl);
      image.src = objectUrl;
    } catch (_) {
      // 失敗時保留 SVG 圖示；附件仍可從已驗證的下載連結存取。
    }
  }
  function renderFile(root, file, requestId) {
    const url = API + '/feedback/' + encodeURIComponent(current.id)
      + '/attachments/' + encodeURIComponent(file.id);
    const entry = el('div','detail-file');
    const thumb = el('div','thumb');
    thumb.appendChild(icon('file'));
    const info = el('div','detail-file-info');
    info.append(el('strong','',file.name),el('small','',sizeText(file.size)));
    const link = el('a','', '下載');
    link.href = url;
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label','下載附件：' + file.name);
    const previewable = /^(image\/(png|jpeg|webp)|text\/plain)$/.test(file.type || '');
    if (previewable) {
      const preview = el('button','detail-file-preview-button','預覽');
      preview.type = 'button';
      preview.setAttribute('aria-label','預覽附件：' + file.name);
      preview.addEventListener('click',()=>openFullPreview(file,url,preview));
      entry.classList.add('is-previewable');
      entry.addEventListener('click',event => {
        if (event.target.closest('a,button')) return;
        openFullPreview(file,url,preview);
      });
      entry.append(thumb,info,preview,link);
    } else entry.append(thumb,info,link);
    root.appendChild(entry);
    if (/^image\/(png|jpeg|webp)$/.test(file.type || '')) {
      const image = document.createElement('img');
      image.alt = '附件縮圖';
      image.loading = 'lazy';
      image.addEventListener('load',() => thumb.replaceChildren(image),{once:true});
      loadThumbnail(image,url,requestId);
    }
  }
  function renderMessage(root, author, body, date, files=[], requestId=0) {
    const message = el('div','conversation-message ' + (author === 'admin' ? 'by-admin' : 'by-player'));
    message.append(el('span','conversation-label',author === 'admin' ? 'L1nG · 管理員' : '匿名玩家'));
    message.append(el('div','conversation-bubble',body));
    for (const file of files) renderFile(message,file,requestId);
    message.append(el('span','conversation-time',dateText(date)));
    root.appendChild(message);
  }
  function updateDetailTags(item){
    const tags=$('detail-head-tags');if(!tags)return;tags.replaceChildren();
    tags.append(el('span','status-badge '+item.status,label(item.status)),el('span','type-badge '+categoryBadgeClass(item.category),categoryLabel(item.category)),el('span','contact-tag '+(item.contact?'has-contact':'anonymous'),item.contact?'已留聯絡方式':'未留聯絡方式'));
  }
  function populateDetail(item,requestId) {
    current = item;
    activeDetailId = item.id;
    saveView();
    closeFullPreview(false);
    releasePreviews();
    const body = $('detail-body');
    if (!body) return;
    body.replaceChildren();
    $('detail-title').textContent = item.title || item.message.slice(0,32);
    $('detail-status').value = item.status;window.L1nGRefreshSelect?.($('detail-status'));
    updateDetailTags(item);

    const threadHeading = el('h3','detail-thread-title');
    const typeName = item.followUp === 'conversation' ? '匿名對話' : '單次回饋';
    const stateName = replyLabel(item);
    threadHeading.append(document.createTextNode(typeName));
    if(stateName !== typeName) threadHeading.append(el('span','reply-indicator',stateName));
    body.append(threadHeading);
    const stack = el('div','conversation-stack');
    const files = item.attachments || [];
    renderMessage(stack,'player',item.message,item.createdAt,
      files.filter(file=>file.replyId==null),requestId);
    for (const msg of item.messages || []) {
      renderMessage(stack,msg.author,msg.body,msg.created_at || msg.createdAt,
        files.filter(file=>file.replyId===msg.id),requestId);
    }
    body.append(stack);

    body.append(el('div','divider'));
    body.append(el('span','tiny-label','回饋資訊'));
    const details = document.createElement('dl');
    addField(details,'回饋編號',item.id);
    addField(details,'相關網站',item.source || item.site);
    addField(details,'問題分類',item.target);
    addField(details,'提交時間',dateText(item.createdAt));
    addField(details,'模組版本',item.version);
    addField(details,'遊戲版本',item.gameVersion);
    addField(details,'提交方式',item.contact
      ? (item.contact.method === 'email' ? '電子郵件：' : 'Discord：') + item.contact.value
      : '未留聯絡方式');
    body.append(details);

    const compose = document.querySelector('.admin-reply-compose');
    const canReply = item.followUp === 'conversation' && !['done','spam'].includes(item.status);
    if (compose) compose.hidden = !canReply;
    if ($('admin-reply')) $('admin-reply').value = '';
    if ($('admin-reply-error')) $('admin-reply-error').hidden = true;
    $('detail-layer').classList.add('open');
    $('detail-layer').setAttribute('aria-hidden','false');
    $('detail-close')?.focus();
  }
  async function openDetail(id) {
    const requestId = ++detailRequest;detailBusy=true;
    const root=$('detail-body');root.replaceChildren();for(let i=0;i<3;i++)root.append(el('div','feedback-detail-skeleton'));
    root.setAttribute('aria-busy','true');
    $('detail-layer').classList.add('open');$('detail-layer').setAttribute('aria-hidden','false');
    try {
      const info = await api('/feedback/' + encodeURIComponent(id));
      if (requestId !== detailRequest) return;
      populateDetail(info.feedback,requestId);
    } catch (error) {
      if (requestId === detailRequest) {
        activeDetailId = null;
        saveView();
        notify(error.message);closeDetail();
      }
    }finally{detailBusy=false;root.removeAttribute('aria-busy');}
  }
  function closeDetail() {
    detailRequest++;
    closeFullPreview(false);
    releasePreviews();
    current = null;
    activeDetailId = null;
    saveView();
    $('detail-layer')?.classList.remove('open');
    $('detail-layer')?.setAttribute('aria-hidden','true');
    $('confirm-layer')?.classList.remove('open');
    $('confirm-layer')?.setAttribute('aria-hidden','true');
  }
  function activateTheme() {
    document.documentElement.dataset.theme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  }
  document.querySelectorAll('[data-adminpage]').forEach(button =>
    button.addEventListener('click',() => showPage(button.dataset.adminpage)));
  document.querySelectorAll('[data-jump]').forEach(button =>
    button.addEventListener('click',() => showPage(button.dataset.jump)));
  document.querySelectorAll('[data-status],[data-mobilefilter]').forEach(button =>
    button.addEventListener('click',() => {
      filterStatus = button.dataset.status || button.dataset.mobilefilter || 'all';
      saveView();
      showPage('feedback');
      document.querySelectorAll('[data-status],[data-mobilefilter]').forEach(other =>
        other.classList.toggle('active',
          (other.dataset.status || other.dataset.mobilefilter) === filterStatus));
      render();
    }));
  for (const id of ['search-input','site-filter','contact-filter','reply-filter']) {
    $(id)?.addEventListener('input',render);
  }
  // GA4 date filters are managed by the dedicated, live report module.
  $('settings-theme')?.addEventListener('click',activateTheme);
  $('detail-close')?.addEventListener('click',closeDetail);
  $('admin-preview-close')?.addEventListener('click',()=>closeFullPreview());
  $('admin-attachment-preview')?.addEventListener('click',event=>{
    if (event.target === $('admin-attachment-preview')) closeFullPreview();
  });
  $('detail-layer')?.addEventListener('click',event => {
    if (event.target === $('detail-layer')) closeDetail();
  });
  $('detail-update')?.addEventListener('click',async () => {
    if (!current) return;const button=$('detail-update');if(button.disabled)return;button.disabled=true;button.classList.add('is-loading');
    const id = current.id;
    try {
      await api('/feedback/' + encodeURIComponent(id),'PATCH',{status:$('detail-status').value});
      closeDetail();
      await refresh();
      notify('已更新處理狀態。');
    } catch (error) { notify(error.message); }
    finally{button.disabled=false;button.classList.remove('is-loading');}
  });
  $('detail-delete')?.addEventListener('click',() => {
    $('confirm-layer')?.classList.add('open');
    $('confirm-layer')?.setAttribute('aria-hidden','false');
  });
  $('admin-reply')?.addEventListener('keydown',event=>{
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (!$('admin-send')?.disabled) $('admin-send')?.click();
  });
  $('admin-send')?.addEventListener('click',async () => {
    if (!current) return;
    const id = current.id, message = $('admin-reply')?.value.trim();
    if (!message) {
      $('admin-reply-error').hidden = false;
      return;
    }
    const button = $('admin-send');
    if (button.disabled) return;
    button.disabled = true;button.classList.add('is-loading');
    try {
      await api('/feedback/' + encodeURIComponent(id) + '/replies','POST',{message});
      await refresh();
      await openDetail(id);
      notify('已送出回覆。');
    } catch (error) { notify(error.message); }
    finally { button.disabled = false;button.classList.remove('is-loading'); }
  });
  $('cancel-delete')?.addEventListener('click',() => {
    $('confirm-layer')?.classList.remove('open');
    $('confirm-layer')?.setAttribute('aria-hidden','true');
  });
  $('confirm-delete')?.addEventListener('click',async () => {
    if (!current) return;
    try {
      await api('/feedback/' + encodeURIComponent(current.id),'DELETE');
      closeDetail();
      await refresh();
      notify('已刪除回饋。');
    } catch (error) { notify(error.message); }
  });
  $('feedback-refresh')?.addEventListener('click',()=>void refresh({manual:true}));
  const poll=()=>{if(document.visibilityState==='visible'&&Date.now()-lastListCheck>15000)void refresh();};
  refreshTimer=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh();},60000);
  document.addEventListener('visibilitychange',poll);window.addEventListener('focus',poll);window.addEventListener('online',poll);
  // GA4 statistics, charts and loading/error states are rendered by ga4-dashboard.js.
  document.addEventListener('keydown',event => {
    if (event.key !== 'Escape') return;
    if ($('confirm-layer')?.classList.contains('open')) $('cancel-delete')?.click();
    else if (!$('admin-attachment-preview')?.hidden) closeFullPreview();
    else if ($('detail-layer')?.classList.contains('open')) closeDetail();
  });
  if (idList.includes(initialView.filterStatus)) filterStatus = initialView.filterStatus;
  document.querySelectorAll('[data-status],[data-mobilefilter]').forEach(button =>
    button.classList.toggle('active',(button.dataset.status || button.dataset.mobilefilter) === filterStatus));
  showPage(['overview','analytics','feedback','settings'].includes(initialView.page)
    ? initialView.page : 'overview');
  showListSkeleton();
  const recent=$('overview-recent');
  if(recent){
    recent.replaceChildren();
    for(let i=0;i<2;i++){const skeleton=el('div','feedback-overview-skeleton');skeleton.setAttribute('aria-hidden','true');recent.append(skeleton);}
    recent.setAttribute('aria-busy','true');
  }
  refresh({quiet:true}).then(()=>{
    if (initialView.detailId && page === 'feedback') openDetail(initialView.detailId);
  });
})();
