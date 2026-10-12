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

  function normalizeFeedback({ source, category, target, message, files, followUp, contactMethod, contactValue, version }) {
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
      version: String(version || '').trim() || null
    };
  }

  // 沒有真實收件 API 時一律拒絕；不可在前端產生假的成功／私人憑證。
  async function submit() {
    throw new Error('目前尚未開放線上提交，請稍後再試。');
  }

  global.L1nGFeedbackCore = Object.freeze({
    MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_MESSAGE_LENGTH,
    MIN_MESSAGE_LENGTH, isAllowedFile, checkFiles, checkMessage,
    checkContact, normalizeFeedback, submit
  });
})(window);
