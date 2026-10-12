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

  function setTab(index, focus = false) {
    tabs.forEach(({ tab, panel: view }, i) => {
      const active = index === i;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      view.hidden = !active;
    });
    if (focus) tabs[index].tab.focus({ preventScroll: true });
  }

  tabs.forEach(({ tab }, index) => {
    tab.addEventListener('click', () => setTab(index));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0
        : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      setTab(next, true);
    });
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
    error.hidden = true;
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }

  function showError(text) {
    error.textContent = text;
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

  $('genealogyFeedbackAddFile').addEventListener('click', () => fileInput.click());
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
    try {
      await core.submit(payload);
    } catch (err) {
      showError(err?.message || '目前無法送出回饋，請稍後再試。');
    } finally {
      submitButton.disabled = false;
    }
  });

  $('genealogyFeedbackHistoryForm').addEventListener('submit', event => {
    event.preventDefault();
    const status = $('genealogyFeedbackHistoryStatus');
    status.textContent = $('genealogyFeedbackReceipt').value.trim()
      ? '目前尚未開放回饋紀錄查詢，請稍後再試。'
      : '請先貼上私人回饋憑證。';
    status.hidden = false;
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
