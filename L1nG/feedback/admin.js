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
  const label = status => statuses[status] || status || '未知';
  const categoryLabel = category => categories[category] || category || '未分類';
  const dateText = value => {
    if (!value) return '未知';
    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime()) ? '未知'
      : new Intl.DateTimeFormat('zh-TW', {dateStyle:'medium',timeStyle:'short'}).format(timestamp);
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
      type.append(el('span','type-badge',categoryLabel(item.category)));
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
  async function refresh() {
    try {
      const data = await api('/feedback');
      entries = (data.items || []).map(item => ({
        ...item, title:item.title || item.message.slice(0,32),
        site:item.source || item.site
      }));
      render();
      if ($('overview-recent')) {
        $('overview-recent').textContent = entries.length
          ? '最新回饋：' + entries[0].title : '目前沒有回饋紀錄。';
      }
    } catch (error) {
      entries = [];
      render();
      notify(error.message);
    }
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
      if (!blob.type.startsWith('image/') || requestId !== detailRequest) return;
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
    thumb.appendChild(icon('paperclip'));
    const info = el('div','detail-file-info');
    info.append(el('strong','',file.name),el('small','',sizeText(file.size)));
    const link = el('a','', '下載');
    link.href = url;
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label','下載附件：' + file.name);
    entry.append(thumb,info,link);
    root.appendChild(entry);
    if (/^image\/(png|jpeg|webp)$/.test(file.type || '')) {
      const image = document.createElement('img');
      image.alt = '附件縮圖';
      image.loading = 'lazy';
      image.addEventListener('load',() => thumb.replaceChildren(image),{once:true});
      loadThumbnail(image,url,requestId);
    }
  }
  function renderMessage(root, author, body, date) {
    const message = el('div','conversation-message ' + (author === 'admin' ? 'by-admin' : 'by-player'));
    message.append(el('span','conversation-label',author === 'admin' ? 'L1nG · 管理員' : '匿名玩家'));
    message.append(el('div','conversation-bubble',body));
    message.append(el('span','conversation-time',dateText(date)));
    root.appendChild(message);
  }
  function populateDetail(item,requestId) {
    current = item;
    releasePreviews();
    const body = $('detail-body');
    if (!body) return;
    body.replaceChildren();
    $('detail-title').textContent = item.title || item.message.slice(0,32);
    $('detail-status').value = item.status;
    const tags = el('div','detail-meta');
    tags.append(el('span','status-badge ' + item.status,label(item.status)));
    tags.append(el('span','type-badge',categoryLabel(item.category)));
    tags.append(el('span','contact-tag ' + (item.contact ? 'has-contact' : 'anonymous'),
      item.contact ? '已留聯絡方式' : '未留聯絡方式'));
    body.append(tags);
    body.append(el('span','tiny-label','回饋內容'));
    body.append(el('h3','detail-title-text',item.title || item.message.slice(0,32)));
    body.append(el('p','detail-description','原始內容與後續回覆顯示在下方對話區。'));

    const threadHeading = el('h3','detail-thread-title');
    threadHeading.append(document.createTextNode(item.followUp === 'conversation' ? '匿名對話 ' : '單次回饋 '));
    threadHeading.append(el('span','reply-indicator',replyLabel(item)));
    body.append(threadHeading);
    const stack = el('div','conversation-stack');
    renderMessage(stack,'player',item.message,item.createdAt);
    for (const msg of item.messages || []) {
      renderMessage(stack,msg.author,msg.body,msg.created_at || msg.createdAt);
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

    const fileGroup = el('div','detail-field');
    const files = item.attachments || [];
    const fileTitle = el('h3','', '附加檔案 ');
    fileTitle.append(el('span','optional','(' + files.length + ')'));
    fileGroup.append(fileTitle);
    if (!files.length) fileGroup.append(el('p','','這則回饋沒有附加檔案。'));
    else for (const file of files) renderFile(fileGroup,file,requestId);
    body.append(fileGroup);
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
    const requestId = ++detailRequest;
    try {
      const info = await api('/feedback/' + encodeURIComponent(id));
      if (requestId !== detailRequest) return;
      populateDetail(info.feedback,requestId);
    } catch (error) {
      if (requestId === detailRequest) notify(error.message);
    }
  }
  function closeDetail() {
    detailRequest++;
    releasePreviews();
    current = null;
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
      showPage('feedback');
      document.querySelectorAll('[data-status],[data-mobilefilter]').forEach(other =>
        other.classList.toggle('active',
          (other.dataset.status || other.dataset.mobilefilter) === filterStatus));
      render();
    }));
  for (const id of ['search-input','site-filter','contact-filter','reply-filter']) {
    $(id)?.addEventListener('input',render);
  }
  document.querySelectorAll('[data-range]').forEach(button =>
    button.addEventListener('click',() => {
      document.querySelectorAll('[data-range]').forEach(other => other.classList.toggle('active',other === button));
      if ($('custom-date-row')) $('custom-date-row').hidden = button.dataset.range !== 'custom';
    }));
  $('apply-date')?.addEventListener('click',() => {
    const from = $('date-from')?.value, to = $('date-to')?.value, error = $('date-error');
    if (error) error.textContent = !from || !to || from > to ? '請選擇正確的日期範圍。' : '';
  });
  $('settings-theme')?.addEventListener('click',activateTheme);
  $('detail-close')?.addEventListener('click',closeDetail);
  $('detail-layer')?.addEventListener('click',event => {
    if (event.target === $('detail-layer')) closeDetail();
  });
  $('detail-update')?.addEventListener('click',async () => {
    if (!current) return;
    const id = current.id;
    try {
      await api('/feedback/' + encodeURIComponent(id),'PATCH',{status:$('detail-status').value});
      closeDetail();
      await refresh();
      notify('已更新處理狀態。');
    } catch (error) { notify(error.message); }
  });
  $('detail-delete')?.addEventListener('click',() => {
    $('confirm-layer')?.classList.add('open');
    $('confirm-layer')?.setAttribute('aria-hidden','false');
  });
  $('admin-send')?.addEventListener('click',async () => {
    if (!current) return;
    const id = current.id, message = $('admin-reply')?.value.trim();
    if (!message) {
      $('admin-reply-error').hidden = false;
      return;
    }
    try {
      await api('/feedback/' + encodeURIComponent(id) + '/replies','POST',{message});
      await refresh();
      await openDetail(id);
      notify('已送出回覆。');
    } catch (error) { notify(error.message); }
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
  for (const id of ['ga-users','ga-views','ga-downloads','ga-new','ov-users','ov-views','ov-downloads']) {
    if ($(id)) $(id).textContent = '—';
  }
  if ($('overview-chart')) $('overview-chart').textContent = '尚未連接網站分析資料。';
  for (const id of ['ga-countries','ga-pages','ga-devices','ga-referrals','ga-trend-chart','analytics-traffic-chart']) {
    if ($(id)) $(id).textContent = '尚未連接資料來源。';
  }
  document.addEventListener('keydown',event => {
    if (event.key !== 'Escape') return;
    if ($('confirm-layer')?.classList.contains('open')) {
      $('cancel-delete')?.click();
    } else closeDetail();
  });
  showPage('overview');
  render();
  refresh();
})();
