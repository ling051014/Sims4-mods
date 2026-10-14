/* ========【共用回饋規則】 RealDate／族譜共用資料限制；不包含任何視覺樣式 ======== */
(function (global) {
  'use strict';

  const MAX_FILES = 3;
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
  const MAX_MESSAGE_LENGTH = 2000;
  const MIN_MESSAGE_LENGTH = 10;
  const EXTENSIONS = Object.freeze(['png', 'jpg', 'jpeg', 'webp', 'txt', 'log']);

  function isAllowedFile(file) {
    if (!file || typeof file.name !== 'string') return false;
    const extension = file.name.split('.').pop().toLowerCase();
    return EXTENSIONS.includes(extension);
  }

  function checkFiles(files, incoming) {
    const accepted = Array.from(files || []);
    const rejected = [];
    for (const file of Array.from(incoming || [])) {
      if (!isAllowedFile(file)) {
        rejected.push('不支援「' + file.name + '」的格式');
      } else if (accepted.length >= MAX_FILES) {
        rejected.push('最多只能加入 3 個附件');
      } else if (file.size > MAX_FILE_BYTES) {
        rejected.push('單一附件不可超過 10 MB');
      } else if (accepted.reduce((sum, entry) => sum + entry.size, 0) + file.size > MAX_TOTAL_BYTES) {
        rejected.push('附件總大小不可超過 20 MB');
      } else {
        accepted.push(file);
      }
    }
    return { files: accepted, errors: rejected };
  }

  function checkMessage(value) {
    const text = String(value || '').trim();
    return {
      valid: text.length >= MIN_MESSAGE_LENGTH && text.length <= MAX_MESSAGE_LENGTH,
      text
    };
  }

  function checkContact(method, value) {
    const text = String(value || '').trim();
    if (!text) return true;
    return method === 'email'
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
      : method === 'discord' && text.length >= 2;
  }

  function normalizeFeedback({ source, category, target, message, files, followUp, contactMethod, contactValue, version, gameVersion }) {
    return {
      source: source === 'RealDate' ? 'RealDate' : 'Genealogy',
      category: ['bug', 'feature', 'other'].includes(category) ? category : 'other',
      target: String(target || ''),
      message: checkMessage(message).text,
      files: Array.from(files || []),
      followUp: followUp === 'conversation' ? 'conversation' : 'once',
      contact: String(contactValue || '').trim()
        ? { method: contactMethod, value: String(contactValue).trim() }
        : null,
      version: String(version || '').trim() || null,
      gameVersion: String(gameVersion || '').trim() || null
    };
  }

  // 只有正式網域可以呼叫回饋 API。分支預覽不送出正式玩家資料。
  const API_URL = 'https://l1ng-feedback-api.zpl74520.workers.dev';
  const SITE_KEY = '0x4AAAAAAFUwHYgvdSfW7wI_';
  const LIVE_HOSTS = Object.freeze([
    'realdate.by-l1ng.com', 'genealogy-tool.by-l1ng.com'
  ]);
  let turnstileLoading = null;
  function isLive() { return LIVE_HOSTS.includes(global.location.hostname); }
  function loadTurnstile() {
    if (!isLive()) return Promise.reject(new Error('此預覽不會提交正式回饋。'));
    if (global.turnstile) return Promise.resolve(global.turnstile);
    if (turnstileLoading) return turnstileLoading;
    turnstileLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let settled = false;
      let timeoutId;
      const finish = (error, api) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (error) { script.remove(); reject(error); }
        else resolve(api);
      };
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => global.turnstile
        ? finish(null, global.turnstile) : finish(new Error('無法載入人機驗證。'));
      script.onerror = () => finish(new Error('無法載入人機驗證，請確認網路連線。'));
      timeoutId = setTimeout(() => finish(new Error('安全驗證載入逾時，請重新載入驗證。')), 15000);
      document.head.appendChild(script);
    }).catch(error => { turnstileLoading = null; throw error; });
    return turnstileLoading;
  }
  async function createVerification(container, options = {}) {
    const ts = await loadTurnstile();
    if (typeof options.shouldRender === 'function' && !options.shouldRender()) {
      throw new Error('安全驗證視窗已關閉。');
    }
    let token = '', widgetId;
    const notify = status => {
      if (typeof options.onStatus === 'function') options.onStatus(status);
    };
    widgetId = ts.render(container, {
      sitekey: SITE_KEY,
      theme: 'auto',
      ...(options.size ? { size: options.size } : {}),
      appearance: 'always',
      callback: value => { token = value; notify('success'); },
      'expired-callback': () => { token = ''; notify('expired'); },
      'error-callback': () => { token = ''; notify('error'); return true; },
      'timeout-callback': () => { token = ''; notify('timeout'); }
    });
    if (widgetId === undefined || widgetId === null) {
      throw new Error('無法建立安全驗證，請重新載入。');
    }
    return {
      getToken: () => token,
      reset: () => { token = ''; ts.reset(widgetId); notify('pending'); },
      remove: () => { ts.remove(widgetId); token = ''; }
    };
  }
  async function request(path, payload) {
    const response = await fetch(API_URL + path, {
      method: 'POST',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
      headers: payload instanceof FormData ? undefined : { 'content-type': 'application/json' },
      cache: 'no-store'
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || '服務暫時無法使用，請稍後再試。');
    return data;
  }
  async function submit(payload, token) {
    if (!isLive()) throw new Error('此預覽不會提交正式回饋。');
    if (!token) throw new Error('請先完成人機驗證。');
    const form = new FormData();
    for (const name of ['source','category','target','message','followUp','version','gameVersion']) {
      form.append(name, payload[name] || '');
    }
    form.append('contactMethod', payload.contact?.method || '');
    form.append('contactValue', payload.contact?.value || '');
    form.append('turnstileToken', token);
    for (const file of payload.files || []) form.append('files', file, file.name);
    const result = await request('/v1/feedback', form);
    // Only a successful API response counts. Do not pass user content to GA4.
    global.L1nGAnalytics?.feedbackSubmitted?.();
    return result;
  }
  async function lookup(receipt) { return request('/v1/feedback/lookup', {receipt}); }
  async function reply(receipt, message, files, token) {
    if (!token) throw new Error('請先完成人機驗證。');
    const form = new FormData();
    form.append('receipt', receipt); form.append('message', message);
    form.append('turnstileToken', token);
    for (const file of files || []) form.append('files', file, file.name);
    return request('/v1/feedback/reply', form);
  }

  global.L1nGFeedbackCore = Object.freeze({
    MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_MESSAGE_LENGTH,
    MIN_MESSAGE_LENGTH, isAllowedFile, checkFiles, checkMessage,
    checkContact, normalizeFeedback, isLive, createVerification, submit, lookup, reply
  });
})(window);
