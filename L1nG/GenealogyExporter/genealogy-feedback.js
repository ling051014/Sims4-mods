/* ========【問題反饋】族譜原生視窗控制。外觀直接使用 genealogy.css。 ======== */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const $ = id => document.getElementById(id);
  const backdrop = $('genealogyFeedbackDialog');
  const panel = backdrop?.querySelector('.genealogy-feedback-panel');
  const openButton = $('feedbackBtn');
  const closeButton = $('genealogyFeedbackCloseBtn');
  const form = $('genealogyFeedbackForm');
  const core = window.L1nGFeedbackCore;

  if (!backdrop || !panel || !openButton || !closeButton || !form || !core) {
    console.error('[問題反饋] 原生表單或共用資料規則未載入。');
    return;
  }

  const tabs = [
    { tab: $('genealogyFeedbackWriteTab'), panel: $('genealogyFeedbackWritePanel') },
    { tab: $('genealogyFeedbackHistoryTab'), panel: $('genealogyFeedbackHistoryPanel') }
  ];
  const fileInput = $('genealogyFeedbackFiles');
  const fileList = $('genealogyFeedbackFileList');
  const message = $('genealogyFeedbackMessage');
  const target = $('genealogyFeedbackTarget');
  const error = $('genealogyFeedbackError');
  const submitButton = $('genealogyFeedbackSubmit');
  const contactMethod = $('genealogyFeedbackContactMethod');
  const contactValue = $('genealogyFeedbackContact');
  const attached = [];
  let lastFocus = null;
  let verification = null;
  const verificationCard = backdrop.querySelector('.genealogy-feedback-verify-card');
  const originalVerifyHelp = verificationCard?.nextElementSibling;
  if (verificationCard) {
    const oldButton = verificationCard.querySelector('button[disabled]');
    oldButton?.remove();
    const host = document.createElement('div');
    host.id = 'genealogy-feedback-turnstile';
    verificationCard.appendChild(host);
    if (core.isLive()) {
      core.createVerification(host).then(v => {
        verification = v;
        if (originalVerifyHelp) originalVerifyHelp.textContent = '送出前請完成人機驗證。';
      }).catch(e => {
        if (originalVerifyHelp) originalVerifyHelp.textContent = e.message;
      });
    } else if (originalVerifyHelp) {
      originalVerifyHelp.textContent = '請完成安全驗證後送出回饋。';
    }
  }


  // 標題下方是便利貼黏貼處：右下角先翻出紙背，再逐漸拉開，最後從上緣脫離。
  const pages = $('genealogyFeedbackPages');
  let activePage = 0;
  let pendingPage = null;
  let peelFrame = null;
  let floatingPaper = null;
  const peelDuration = 1080;
  const svgNS = 'http://www.w3.org/2000/svg';
  const pageCorners = (width, height) => [
    { x: 0, y: 0 }, { x: width, y: 0 },
    { x: width, y: height }, { x: 0, y: height }
  ];

  function paperClip(points, threshold, keepTop) {
    const within = point => keepTop
      ? point.x + point.y <= threshold + .001
      : point.x + point.y >= threshold - .001;
    const output = [];
    for (let i = 0; i < points.length; i++) {
      const from = points[i], to = points[(i + 1) % points.length];
      const a = within(from), b = within(to);
      if (a) output.push(from);
      if (a !== b) {
        const sumA = from.x + from.y, sumB = to.x + to.y;
        const fraction = (threshold - sumA) / (sumB - sumA);
        output.push({
          x: from.x + (to.x - from.x) * fraction,
          y: from.y + (to.y - from.y) * fraction
        });
      }
    }
    return output;
  }

  const paperPoint = point => point.x.toFixed(2) + ',' + point.y.toFixed(2);
  function foldEnds(threshold, width, height) {
    const points = [
      { x: threshold, y: 0 }, { x: 0, y: threshold },
      { x: threshold - height, y: height }, { x: width, y: threshold - width }
    ].filter(point =>
      point.x >= -.01 && point.y >= -.01
      && point.x <= width + .01 && point.y <= height + .01
    );
    return points.filter((point, index) => points.findIndex(other =>
      Math.abs(point.x - other.x) < .01 && Math.abs(point.y - other.y) < .01
    ) === index).slice(0, 2);
  }

  // 真正的紙背是摺線外側紙面沿 x+y=threshold 鏡射的多邊形，不是透明三角遮罩。
  function makePeelVisual() {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'genealogy-feedback-peel-visual');
    svg.setAttribute('aria-hidden', 'true');

    const el = (name, className) => {
      const element = document.createElementNS(svgNS, name);
      element.setAttribute('class', className);
      svg.appendChild(element);
      return element;
    };
    const shadow = el('path', 'genealogy-feedback-peel-shadow');
    const back = el('path', 'genealogy-feedback-peel-paper');
    const crease = el('path', 'genealogy-feedback-peel-crease');
    return { svg, shadow, back, crease };
  }

  function smoothstep(value) {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  }

  function peelAmount(time) {
    // 首段慢慢挑起角落；中段拉起整張紙；上方膠帶處略有阻力，最後快速釋放。
    if (time < .15) return .10 * smoothstep(time / .15);
    if (time < .79) return .10 + .78 * smoothstep((time - .15) / .64);
    if (time < .91) return .88 + .055 * smoothstep((time - .79) / .12);
    return .935 + .065 * smoothstep((time - .91) / .09);
  }

  function drawPeel(progress, outgoing, visual, width, height) {
    const threshold = Math.max(0, (width + height) * (1 - peelAmount(progress)));
    const corners = pageCorners(width, height);
    const near = paperClip(corners, threshold, true);
    const lifted = paperClip(corners, threshold, false);
    const flipped = lifted.map(point => ({
      x: threshold - point.y,
      y: threshold - point.x
    }));
    outgoing.style.clipPath = near.length >= 3
      ? 'polygon(' + near.map(point => point.x.toFixed(2) + 'px ' + point.y.toFixed(2) + 'px').join(',') + ')'
      : 'polygon(0 0,0 0,0 0)';
    const ends = foldEnds(threshold, width, height);
    // 紙張折痕不是尺畫出的硬直線：摺背邊緣與陰影共用同一條微彎曲線。
    const bend = Math.min(15, Math.min(width, height) * .025)
      * Math.sin(Math.PI * Math.min(1, progress * 1.06));
    const foldedPath = flipped.length ? flipped.reduce((path, point, index) => {
      const next = flipped[(index + 1) % flipped.length];
      const onFold = Math.abs(point.x + point.y - threshold) < .08
        && Math.abs(next.x + next.y - threshold) < .08;
      if (!index) path = 'M' + paperPoint(point);
      return path + (onFold && flipped.length >= 3
        ? ' Q' + paperPoint({
          x: (point.x + next.x) / 2 - bend,
          y: (point.y + next.y) / 2 - bend
        }) + ' ' + paperPoint(next)
        : ' L' + paperPoint(next));
    }, '') + ' Z' : '';
    visual.back.setAttribute('d', foldedPath);
    if (ends.length === 2) {
      const start = ends[0], end = ends[1];
      const middle = {
        x: (start.x + end.x) / 2 - bend,
        y: (start.y + end.y) / 2 - bend
      };
      const path = 'M' + paperPoint(start) + ' Q' + paperPoint(middle) + ' ' + paperPoint(end);
      visual.shadow.setAttribute('d', path);
      visual.crease.setAttribute('d', path);

    } else {
      for (const path of [visual.shadow, visual.crease]) path.setAttribute('d', '');
    }
    // 膠帶拉開後，讓最後一小塊紙帶著慣性離開，而非突然消失。
    // 紙背在上緣撕開後飛出整個對話框；不再被原本的圓角和視窗邊界裁掉。
    const flight = smoothstep(Math.max(0, (progress - .79) / .21));
    // 撕下的紙從開始到完全飛離都必須不透明，不再以淡出冒充紙張離場。
    visual.svg.style.opacity = '1';
    visual.svg.style.transformOrigin = '0 0';
    visual.svg.style.transform = flight
      ? 'translate3d(' + (-width * .29 * flight).toFixed(2) + 'px,'
        + (-height * .38 * flight).toFixed(2) + 'px,0) rotate('
        + (-13 * flight).toFixed(2) + 'deg)'
      : '';
  }

  // 將「紙張本體」暫時複製到視窗外的最上層：翻折與飛離不受原彈窗 overflow 裁切。
  // 原始輸入欄位及事件永遠留在原處；動畫副本不帶 ID、沒有事件，也不能被操作。
  function createFloatingPaper(outgoing, rect) {
    const overlay = document.createElement('div');
    overlay.className = 'genealogy-feedback-panel genealogy-feedback-tear-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    // 取真正的問題反饋視窗背景，不使用畫布色或額外產生的紙張漸層。
    // 這也能完整跟隨淺色、深色與自訂主題。
    const isOpaque = value => {
      if (!value || value === 'transparent') return false;
      const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
      if (!rgb) return true;
      const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
      return parts.length < 4 || Number(parts[3]) >= 1;
    };
    // 使用已經渲染的視窗背景，且只接受不透明顏色；透明主題值則回退到卡片底色。
    const windowSurface = [
      getComputedStyle(panel).backgroundColor,
      getComputedStyle(pages).backgroundColor,
      getComputedStyle(document.body).getPropertyValue('--surface-card').trim()
    ].find(isOpaque) || '#ffffff';
    overlay.style.setProperty('--gf-surface', windowSurface);
    overlay.style.setProperty('--gf-paper-surface', windowSurface);

    const stage = document.createElement('div');
    stage.className = 'genealogy-feedback-pages genealogy-feedback-tear-stage is-tearing';
    stage.style.left = rect.left + 'px';
    stage.style.top = rect.top + 'px';
    stage.style.width = rect.width + 'px';
    stage.style.height = rect.height + 'px';

    const sheet = outgoing.cloneNode(true);
    sheet.classList.add('is-tearing-page');
    sheet.inert = true;
    const originals = [outgoing, ...outgoing.querySelectorAll('*')];
    const copies = [sheet, ...sheet.querySelectorAll('*')];
    const scrollPositions = [];
    originals.forEach((original, index) => {
      const copy = copies[index];
      if (copy.hasAttribute('id')) copy.removeAttribute('id');
      if (copy.hasAttribute('for')) copy.removeAttribute('for');
      if (copy.hasAttribute('hidden')) copy.style.display = 'none';
      if ('value' in original && 'value' in copy) copy.value = original.value;
      if ('checked' in original && 'checked' in copy) copy.checked = original.checked;
      if (original.scrollTop || original.scrollLeft) {
        scrollPositions.push([copy, original.scrollTop, original.scrollLeft]);
      }
    });
    // 不複製仍在執行的 Turnstile／媒體 iframe，以免轉場副本重啟外部服務。
    sheet.querySelectorAll('iframe, video, audio, object, embed').forEach(element => {
      const standIn = document.createElement('span');
      standIn.className = 'genealogy-feedback-peel-placeholder';
      element.replaceWith(standIn);
    });
    stage.appendChild(sheet);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);
    scrollPositions.forEach(([copy, top, left]) => {
      copy.scrollTop = top;
      copy.scrollLeft = left;
    });

    const visual = makePeelVisual();
    visual.svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    // iOS Safari 對 SVG 中的 CSS 變數填色可能不穩定；直接指定有效的純色。
    visual.back.setAttribute('fill', windowSurface);
    visual.back.style.fill = windowSurface;
    visual.back.style.fillOpacity = '1';
    visual.back.style.opacity = '1';
    stage.appendChild(visual.svg);
    return { overlay, sheet, visual };
  }

  function stopPeel() {
    if (peelFrame !== null) {
      cancelAnimationFrame(peelFrame);
      peelFrame = null;
    }
    floatingPaper?.remove();
    floatingPaper = null;
    pages?.classList.remove('is-tearing');
    tabs.forEach(({ panel: view }) => {
      view.classList.remove('is-tearing-page', 'is-under-page');
      view.style.removeProperty('clip-path');
      view.style.removeProperty('visibility');
      view.inert = false;
    });
  }

  function setTab(index, focus = false) {
    stopPeel();
    tabs.forEach(({ tab, panel: view }, i) => {
      const active = index === i;
      view.removeAttribute('aria-hidden');
      view.hidden = !active;
      tab.hidden = active;
      tab.tabIndex = active ? -1 : 0;
    });
    pendingPage = null;
    activePage = index;
    if (focus) tabs[index === 0 ? 1 : 0].tab.focus({ preventScroll: true });
  }

  function turnPage(index) {
    if (pendingPage !== null || index === activePage) return;
    if (!pages || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTab(index, true);
      return;
    }
    const outgoing = tabs[activePage].panel;
    const incoming = tabs[index].panel;
    const rect = pages.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      setTab(index, true);
      return;
    }
    pendingPage = index;
    panel.focus({ preventScroll: true });
    incoming.hidden = false;
    outgoing.inert = true;
    incoming.inert = true;
    outgoing.classList.add('is-tearing-page');
    incoming.classList.add('is-under-page');
    pages.classList.add('is-tearing');
    const paper = createFloatingPaper(outgoing, rect);
    floatingPaper = paper.overlay;
    // 原頁保持原來的 DOM、表單數值與捲動狀態，只把可見紙面交給浮層。
    outgoing.style.visibility = 'hidden';

    let start = null;
    const animate = timestamp => {
      if (pendingPage !== index) return;
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / peelDuration);
      drawPeel(progress, paper.sheet, paper.visual, rect.width, rect.height);
      if (progress >= 1) {
        setTab(index, true);
      } else {
        peelFrame = requestAnimationFrame(animate);
      }
    };
    peelFrame = requestAnimationFrame(animate);
  }

  tabs.forEach(({ tab }, index) => {
    tab.addEventListener('click', () => turnPage(index));
  });

  function openFeedback() {
    if (backdrop.classList.contains('show')) return;
    lastFocus = document.activeElement;
    const more = $('topbarMoreBtn');
    if (more?.getAttribute('aria-expanded') === 'true') more.click();
    backdrop.classList.add('show');
    backdrop.setAttribute('aria-hidden', 'false');
    setTab(0);
    panel.focus({ preventScroll: true });
  }

  function closeFeedback() {
    if (!backdrop.classList.contains('show')) return;
    stopPolling();
    backdrop.classList.remove('show');
    backdrop.setAttribute('aria-hidden', 'true');
    setTab(0);
    error.hidden = true;
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }

  function showError(text) {
    $('genealogyFeedbackErrorDetail').textContent = text;
    error.hidden = !text;
    if (text) {
      setTab(0);
      error.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function updateFields() {
    const category = form.elements.genealogyFeedbackCategory.value;
    const versionVisible = category === 'bug' && target.value === 'exporter';
    $('genealogyFeedbackVersionRow').hidden = !versionVisible;
    showError('');
  }

  function updateFileList() {
    fileList.replaceChildren();
    attached.forEach((file, index) => {
      const entry = document.createElement('li');
      const name = document.createElement('span');
      name.className='genealogy-feedback-file-text';
      const pin=document.createElementNS('http://www.w3.org/2000/svg','svg');
      pin.setAttribute('viewBox','0 0 24 24');pin.setAttribute('aria-hidden','true');pin.classList.add('genealogy-feedback-paperclip');
      const stroke=document.createElementNS('http://www.w3.org/2000/svg','path');
      stroke.setAttribute('d','m8.5 12.5 6.5-6.5a3.5 3.5 0 0 1 5 5l-9.5 9.5a5.5 5.5 0 0 1-8-7.5L13 3');
      pin.append(stroke);
      const title=document.createElement('span');title.textContent=file.name;
      const size=document.createElement('small');size.textContent=Math.max(1,Math.round(file.size/1024))+' KB';
      name.append(pin,title,size);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary';
      remove.textContent = '移除';
      remove.setAttribute('aria-label', '移除附件：' + file.name);
      remove.addEventListener('click', () => {
        attached.splice(index, 1);
        updateFileList();
      });
      entry.append(name, remove);
      fileList.append(entry);
    });
  }

  function addFiles(nextFiles) {
    const result = core.checkFiles(attached, nextFiles);
    attached.splice(0, attached.length, ...result.files);
    updateFileList();
    if(result.errors.length){$('genealogyFeedbackFilesError').textContent=result.errors.join('；');$('genealogyFeedbackFilesError').hidden=false;}else $('genealogyFeedbackFilesError').hidden=true;
  }

  const uploadZone = $('genealogyFeedbackAddFile');
  uploadZone.addEventListener('click', () => fileInput.click());
  // 上傳卡片支援電腦拖放；觸控裝置仍使用原生檔案選取器。
  uploadZone.addEventListener('dragenter', event => {
    event.preventDefault();
    uploadZone.classList.add('is-dragover');
  });
  uploadZone.addEventListener('dragover', event => {
    event.preventDefault();
    uploadZone.classList.add('is-dragover');
  });
  uploadZone.addEventListener('dragleave', event => {
    if (!uploadZone.contains(event.relatedTarget)) uploadZone.classList.remove('is-dragover');
  });
  uploadZone.addEventListener('drop', event => {
    event.preventDefault();
    uploadZone.classList.remove('is-dragover');
    if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files);
    fileInput.value = '';
  });
  form.querySelectorAll('input[name="genealogyFeedbackCategory"]').forEach(input => {
    input.addEventListener('change', updateFields);
  });
  target.addEventListener('change', updateFields);
  message.addEventListener('input', () => {
    $('genealogyFeedbackCount').textContent = message.value.length + ' / 2000';
    message.classList.remove('genealogy-feedback-invalid');$('genealogyFeedbackMessageError').hidden=true;
    if (!error.hidden) showError('');
  });
  contactValue.addEventListener('input',()=>{contactValue.classList.remove('genealogy-feedback-invalid');$('genealogyFeedbackContactError').hidden=true;});

  contactMethod.addEventListener('change', () => {
    contactValue.placeholder = contactMethod.value === 'email' ? 'example@email.com' : 'Discord 使用者名稱';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const checked = core.checkMessage(message.value);
    if (!checked.valid) {
      message.classList.add('genealogy-feedback-invalid');
      $('genealogyFeedbackMessageError').hidden=false;
      message.focus({ preventScroll: true });
      return;
    }
    const contact = contactValue.value.trim();
    if (!core.checkContact(contactMethod.value, contact)) {
      contactValue.classList.add('genealogy-feedback-invalid');
      $('genealogyFeedbackContactError').hidden=false;
      contactValue.focus({ preventScroll: true });
      return;
    }
    const payload = core.normalizeFeedback({
      source: 'Genealogy',
      category: form.elements.genealogyFeedbackCategory.value,
      target: target.value,
      message: checked.text,
      files: attached,
      followUp: form.elements.genealogyFeedbackFollowUp.value,
      contactMethod: contactMethod.value,
      contactValue: contact,
      version: $('genealogyFeedbackVersionRow').hidden ? '' : $('genealogyFeedbackVersion').value
    });
    submitButton.disabled = true;
    submitButton.classList.add('is-loading');
    try {
      const result = await core.submit(payload, verification?.getToken());
      const status = $('genealogyFeedbackHistoryStatus');
      const receipt = $('genealogyFeedbackReceipt');
      if(status)status.hidden=true;
      if(receipt&&result.receipt)receipt.value=result.receipt;
      $('genealogyFeedbackSuccessCode').textContent='回饋編號 '+result.id;
      $('genealogyFeedbackSuccessDescription').textContent=result.receipt?'已建立匿名對話，請保存私人憑證。':'已收到這次回饋，不會建立匿名對話。';
      $('genealogyFeedbackSuccessToken').textContent=result.receipt||'';
      $('genealogyFeedbackCredential').hidden=!result.receipt;
      $('genealogyFeedbackSuccessOpen').hidden=!result.receipt;
      $('genealogyFeedbackSuccess').hidden=false;
      $('genealogyFeedbackThread').hidden=true;
      historyForm.hidden=true;
      lastReceipt=result.receipt||'';
      if(lastReceipt)rememberReceipt(lastReceipt);else clearReceipt();
      setTab(1);
      verification?.reset();
      form.reset();
      attached.splice(0, attached.length);
      updateFileList();
      updateFields();
    } catch (err) {
      showError(err?.message || '目前無法送出回饋，請稍後再試。');
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
    }
  });

  const historyForm = $('genealogyFeedbackHistoryForm');
  const receiptInput = $('genealogyFeedbackReceipt');
  let lastReceipt='',activeReceipt='',activeItem=null,refreshTimer=null,lastCheck=0,loadingThread=false,replyVerification=null,copyReset=null;
  const storageKey='l1ng-genealogy-feedback-receipt-v1',replyFiles=[];
  const rememberReceipt=value=>{try{sessionStorage.setItem(storageKey,value);}catch(_){}};
  const storedReceipt=()=>{try{return sessionStorage.getItem(storageKey)||'';}catch(_){return ''}};
  const clearReceipt=()=>{try{sessionStorage.removeItem(storageKey);}catch(_){}};
  const stopPolling=()=>{if(refreshTimer){clearInterval(refreshTimer);refreshTimer=null;}};
  const threadVisible=()=>!!activeReceipt&&document.visibilityState==='visible'&&backdrop.classList.contains('show')&&!$('genealogyFeedbackHistoryPanel').hidden&&!$('genealogyFeedbackThread').hidden;
  function dateText(value){
    const date=new Date(value||'');if(!Number.isFinite(date.getTime()))return '';
    const minutes=-date.getTimezoneOffset(),abs=Math.abs(minutes);
    return new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date)+'（UTC'+(minutes<0?'−':'+')+Math.floor(abs/60)+(abs%60?':'+String(abs%60).padStart(2,'0'):'')+'）';
  }
  function pin(){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('genealogy-feedback-paperclip');
    const line=document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d','m8.5 12.5 6.5-6.5a3.5 3.5 0 0 1 5 5l-9.5 9.5a5.5 5.5 0 0 1-8-7.5L13 3');
    svg.append(line);return svg;
  }
  function renderAttachments(parent,attachments){
    for(const file of attachments){
      const row=document.createElement('div');row.className='genealogy-feedback-message-attachment';
      const title=document.createElement('span');title.textContent=file.name||'附件';
      const size=document.createElement('small');size.textContent=Math.max(1,Math.round((file.size||0)/1024))+' KB';
      row.append(pin(),title,size);parent.append(row);
    }
  }
  function drawThread(item){
    activeItem=item;
    $('genealogyFeedbackThreadId').textContent=item.id;
    $('genealogyFeedbackThreadTime').textContent=dateText(item.createdAt);
    const list=$('genealogyFeedbackMessages');list.replaceChildren();
    const messages=[{author:'player',body:item.message,created_at:item.createdAt},...(item.messages||[])];
    messages.forEach((msg,index)=>{
      const row=document.createElement('div'),player=msg.author!=='admin';
      row.className='genealogy-feedback-conversation-message'+(player?' is-player':'');
      const by=document.createElement('span');by.textContent=player?'你':'管理員';
      const bubble=document.createElement('div');bubble.className='genealogy-feedback-conversation-bubble';bubble.textContent=msg.body||'';
      const stamp=document.createElement('span');stamp.textContent=dateText(msg.created_at||msg.createdAt);
      row.append(by,bubble,stamp);
      if(index===0)renderAttachments(row,item.attachments||[]);
      list.append(row);
    });
    const last=(item.messages||[]).at(-1);
    $('genealogyFeedbackThreadState').textContent=item.status==='done'?'已完成':item.status==='spam'?'已結案':last?.author==='admin'?'管理員已回覆':last?.author==='player'?'等待管理員回覆':item.status==='progress'?'處理中':'尚未處理';
    $('genealogyFeedbackReplyForm').hidden=['done','spam'].includes(item.status);
    if(!$('genealogyFeedbackReplyForm').hidden&&!replyVerification&&core.isLive()){
      core.createVerification($('genealogyFeedbackReplyVerify')).then(v=>{replyVerification=v;}).catch(e=>{
        $('genealogyFeedbackReplyError').textContent=e.message;$('genealogyFeedbackReplyError').hidden=false;
      });
    }
  }
  async function openThread(value){
    const receipt=String(value||'').trim();if(!receipt)return;
    stopPolling();
    const status=$('genealogyFeedbackHistoryStatus');status.hidden=true;
    try{
      const response=await core.lookup(receipt);
      activeReceipt=receipt;rememberReceipt(receipt);receiptInput.value=receipt;
      $('genealogyFeedbackSuccess').hidden=true;historyForm.hidden=true;
      $('genealogyFeedbackThread').hidden=false;
      lastCheck=Date.now();drawThread(response.feedback);setTab(1);
      $('genealogyFeedbackThreadRefreshInfo').textContent='每 60 秒檢查新回覆';
      refreshTimer=setInterval(()=>{if(threadVisible())updateThread();},60000);
    }catch(e){
      status.textContent=e?.message||'無法開啟對話。';status.hidden=false;
      historyForm.hidden=false;$('genealogyFeedbackThread').hidden=true;
    }
  }
  async function updateThread(force=false){
    if(!threadVisible()||loadingThread)return;
    if(force&&Date.now()-lastCheck<15000)return;
    loadingThread=true;lastCheck=Date.now();
    $('genealogyFeedbackThreadRefreshInfo').textContent='正在更新…';
    try{
      const receipt=activeReceipt,data=await core.lookup(receipt);
      if(activeReceipt!==receipt)return;
      drawThread(data.feedback);
      $('genealogyFeedbackThreadRefreshInfo').textContent='更新時間：'+dateText(new Date().toISOString());
    }catch(_){$('genealogyFeedbackThreadRefreshInfo').textContent='暫時無法更新，稍後重試。';}
    finally{loadingThread=false;}
  }
  function showHistory(){
    stopPolling();activeReceipt='';
    $('genealogyFeedbackSuccess').hidden=true;$('genealogyFeedbackThread').hidden=true;
    historyForm.hidden=false;
  }
  $('genealogyFeedbackSuccessOpen').addEventListener('click',()=>openThread(lastReceipt));
  $('genealogyFeedbackSuccessNew').addEventListener('click',()=>{showHistory();clearReceipt();setTab(0);});
  $('genealogyFeedbackThreadRefresh').addEventListener('click',()=>updateThread(true));
  $('genealogyFeedbackCopyCredential').addEventListener('click',async()=>{
    if(!lastReceipt)return;
    let copied=false;
    try{await navigator.clipboard.writeText(lastReceipt);copied=true;}catch(_){}
    if(!copied){
      const field=document.createElement('textarea');field.value=lastReceipt;field.readOnly=true;
      field.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
      document.body.append(field);field.select();
      try{copied=document.execCommand('copy');}catch(_){}field.remove();
    }
    if(!copied)return;
    const glyph=$('genealogyFeedbackCopyCredential').querySelector('.l1ng-copy-glyph');
    clearTimeout(copyReset);glyph.classList.remove('l1ng-copy-running');
    void glyph.getBoundingClientRect();glyph.classList.add('l1ng-copy-running');
    copyReset=setTimeout(()=>glyph.classList.remove('l1ng-copy-running'),3900);
  });
  function showReplyFiles(){
    const root=$('genealogyFeedbackReplyFileList');root.replaceChildren();
    replyFiles.forEach((file,index)=>{
      const row=document.createElement('li'),text=document.createElement('span');text.className='genealogy-feedback-file-text';
      const name=document.createElement('span');name.textContent=file.name;
      const size=document.createElement('small');size.textContent=Math.max(1,Math.round(file.size/1024))+' KB';
      text.append(pin(),name,size);
      const remove=document.createElement('button');remove.type='button';remove.textContent='移除';
      remove.onclick=()=>{replyFiles.splice(index,1);showReplyFiles();};
      row.append(text,remove);root.append(row);
    });
  }
  $('genealogyFeedbackReplyFiles').addEventListener('change',e=>{
    const checked=core.checkFiles(replyFiles,e.target.files);
    replyFiles.splice(0,replyFiles.length,...checked.files);showReplyFiles();e.target.value='';
    if(checked.errors.length){$('genealogyFeedbackReplyError').textContent=checked.errors.join('；');$('genealogyFeedbackReplyError').hidden=false;}
  });
  $('genealogyFeedbackReplyForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const content=$('genealogyFeedbackReply').value.trim(),err=$('genealogyFeedbackReplyError');
    if(!content||!activeReceipt){err.textContent='請輸入回覆內容。';err.hidden=false;return;}
    const token=replyVerification?.getToken();
    if(!token){err.textContent='請先完成安全驗證。';err.hidden=false;return;}
    const button=$('genealogyFeedbackReplySubmit');button.disabled=true;
    try{
      await core.reply(activeReceipt,content,replyFiles,token);
      $('genealogyFeedbackReply').value='';replyFiles.length=0;showReplyFiles();err.hidden=true;
      replyVerification?.reset();await openThread(activeReceipt);
    }catch(ex){err.textContent=ex.message||'送出失敗。';err.hidden=false;replyVerification?.reset();}
    finally{button.disabled=false;}
  });
  $('genealogyFeedbackReply').addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();$('genealogyFeedbackReplyForm').requestSubmit();}
  });
  document.addEventListener('visibilitychange',()=>{if(threadVisible()&&Date.now()-lastCheck>15000)updateThread();});
  window.addEventListener('focus',()=>{if(threadVisible()&&Date.now()-lastCheck>15000)updateThread();});

  historyForm.addEventListener('submit', async event => {
    event.preventDefault();
    const status = $('genealogyFeedbackHistoryStatus');
    const receipt = receiptInput.value.trim();
    if (!receipt) { status.textContent = '請先貼上私人回饋憑證。'; status.hidden = false; return; }
    status.textContent = '正在查詢回饋…'; status.hidden = false;
    try {
      await openThread(receipt);
    } catch (err) { status.textContent = err?.message || '查詢失敗，請稍後再試。'; }
  });
  // 憑證欄按 Enter 等同點擊「查詢」；Shift+Enter 保留換行，輸入法選字不觸發。
  receiptInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229
        || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    historyForm.requestSubmit();
  });

  const saved=storedReceipt();
  if(saved)receiptInput.value=saved;
  tabs[1].tab.addEventListener('click',showHistory);
  openButton.addEventListener('click',()=>{
    openFeedback();
    if(saved && !lastReceipt) openThread(saved);
  });
  closeButton.addEventListener('click', closeFeedback);
  backdrop.addEventListener('pointerdown', event => {
    if (event.target === backdrop) closeFeedback();
  });
  backdrop.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeFeedback();
      return;
    }
    if (event.key !== 'Tab') return;
    const nodes = [...backdrop.querySelectorAll(
      'button:not(:disabled), input:not([disabled]):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'
    )].filter(el => !el.closest('[hidden]') && el.getClientRects().length > 0);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  updateFields();
  setTab(0);
});
