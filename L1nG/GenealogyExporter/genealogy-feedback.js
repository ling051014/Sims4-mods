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

  // 右下角先掀起，紙面往上剝離至標題下緣的黏貼線；標題與分隔線保持固定。
  const pages = $('genealogyFeedbackPages');
  let activePage = 0;
  let pendingPage = null;
  let pageTimer = null;

  function setTab(index, focus = false) {
    if (pageTimer !== null) {
      clearTimeout(pageTimer);
      pageTimer = null;
    }
    pages?.classList.remove('is-tearing');
    tabs.forEach(({ tab, panel: view }, i) => {
      const active = index === i;
      view.classList.remove('is-tearing-page', 'is-under-page');
      view.inert = false;
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
    pendingPage = index;
    // 頁面仍然可見以供動畫使用，但切換期間不可觸發第二次操作。
    panel.focus({ preventScroll: true });
    incoming.hidden = false;
    outgoing.inert = true;
    incoming.inert = true;
    outgoing.classList.add('is-tearing-page');
    incoming.classList.add('is-under-page');
    pages.classList.add('is-tearing');
    // 動畫收尾時才隱藏舊頁，表單值與捲動位置均不清空。
    pageTimer = window.setTimeout(() => setTab(index, true), 860);
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
      name.textContent = file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)';
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
    if (result.errors.length) showError(result.errors.join('；'));
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
    if (!error.hidden) showError('');
  });

  contactMethod.addEventListener('change', () => {
    contactValue.placeholder = contactMethod.value === 'email' ? 'example@email.com' : 'Discord 使用者名稱';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const checked = core.checkMessage(message.value);
    if (!checked.valid) {
      showError('回饋內容至少需要 10 個字，最多 2000 字。');
      message.focus({ preventScroll: true });
      return;
    }
    const contact = contactValue.value.trim();
    if (!core.checkContact(contactMethod.value, contact)) {
      showError('請確認聯絡方式格式，或將聯絡資料留空。');
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
      await core.submit(payload);
    } catch (err) {
      showError(err?.message || '目前無法送出回饋，請稍後再試。');
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
    }
  });

  const historyForm = $('genealogyFeedbackHistoryForm');
  const receiptInput = $('genealogyFeedbackReceipt');
  historyForm.addEventListener('submit', event => {
    event.preventDefault();
    const status = $('genealogyFeedbackHistoryStatus');
    status.textContent = receiptInput.value.trim()
      ? '目前尚未開放回饋紀錄查詢，請稍後再試。'
      : '請先貼上私人回饋憑證。';
    status.hidden = false;
  });
  // 憑證欄按 Enter 等同點擊「查詢」；Shift+Enter 保留換行，輸入法選字不觸發。
  receiptInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229
        || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    historyForm.requestSubmit();
  });

  openButton.addEventListener('click', openFeedback);
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
