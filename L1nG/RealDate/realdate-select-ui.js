/* RealDate feedback custom select controls, with explicit page lifecycle. */
(() => {
  'use strict';
  const registry = new Map();
  let opened = null;
  let active = false;
  let repositionFrame = 0;
  let nativeMetricsDirty = false;
  const nativeAnchorName = '--l1ng-realdate-feedback-anchor';
  const supportsNativeAnchor = typeof CSS !== 'undefined' &&
    CSS.supports('position-anchor: --l1ng-feedback-anchor') &&
    CSS.supports('top: anchor(bottom)') &&
    CSS.supports('position-try-fallbacks: flip-block');
  const nativeAnchorVisibility = typeof CSS !== 'undefined' &&
    (CSS.supports('position-visibility: anchors-visible') ? 'anchors-visible'
    : CSS.supports('position-visibility: anchor-visible') ? 'anchor-visible' : '');
  function close() {
    if (!opened) return;
    opened.panel.hidden = true;
    opened.button.setAttribute('aria-expanded', 'false');
    if (supportsNativeAnchor) {
      opened.button.style.removeProperty('anchor-name');
      opened.panel.style.removeProperty('position-anchor');
      opened.panel.style.removeProperty('position-try-fallbacks');
      opened.panel.style.removeProperty('position-visibility');
    }
    opened = null;
  }
  function anchorVisible(button) {
    if (!button.isConnected) return false;
    const rect = button.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 ||
        rect.bottom <= 0 || rect.top >= innerHeight ||
        rect.right <= 0 || rect.left >= innerWidth) return false;
    // 桌機表單另有捲動容器，欄位完全離開可視區時不保留 Portal。
    const scrollport = button.closest('.modal-content');
    if (!scrollport) return true;
    const clip = scrollport.getBoundingClientRect();
    return rect.bottom > clip.top && rect.top < clip.bottom &&
      rect.right > clip.left && rect.left < clip.right;
  }
  function position(entry) {
    if (!entry || entry.panel.hidden) return;
    if (!anchorVisible(entry.button)) {
      if (opened === entry) close();
      return;
    }
    const r = entry.button.getBoundingClientRect(), w = Math.max(180, r.width);
    if (supportsNativeAnchor) {
      const width = Math.min(w, Math.max(1, innerWidth - 20));
      const room = Math.max(r.top, innerHeight - r.bottom) - 14;
      entry.button.style.anchorName = nativeAnchorName;
      entry.panel.style.positionAnchor = nativeAnchorName;
      entry.panel.style.positionTryFallbacks = 'flip-block';
      entry.panel.style.positionVisibility = nativeAnchorVisibility;
      entry.panel.style.width = width + 'px';
      entry.panel.style.left = 'clamp(10px, anchor(left), calc(100vw - ' + width + 'px - 10px))';
      entry.panel.style.top = 'calc(anchor(bottom) + 5px)';
      entry.panel.style.bottom = '';
      entry.panel.style.maxHeight = Math.max(40, Math.min(320, room)) + 'px';
      return;
    }
    const roomBelow = innerHeight - r.bottom, roomAbove = r.top;
    const below = roomBelow > 210 || roomBelow >= roomAbove;
    const max = Math.min(320, Math.max(110, (below ? roomBelow : roomAbove) - 14));
    entry.panel.style.width = Math.min(w, innerWidth - 20) + 'px';
    entry.panel.style.left = Math.max(10, Math.min(r.left, innerWidth - Math.min(w, innerWidth - 20) - 10)) + 'px';
    entry.panel.style.maxHeight = max + 'px';
    entry.panel.style.top = below ? (r.bottom + 5) + 'px' : '';
    entry.panel.style.bottom = below ? '' : (innerHeight - r.top + 5) + 'px';
  }
  function refresh(entry) {
    if (!entry.select.isConnected) return;
    const { select, button, panel } = entry;
    const selected = select.options[select.selectedIndex];
    const placeholder = document.documentElement.dataset.language === 'en'
      ? (select.dataset.placeholderEn || select.dataset.placeholder || 'Select a version')
      : (select.dataset.placeholder || '請選擇');
    button.textContent = selected ? selected.textContent.trim() : placeholder;
    button.classList.toggle('is-placeholder', !selected && Boolean(select.dataset.placeholder));
    button.disabled = select.disabled;
    button.setAttribute('aria-label', (select.getAttribute('aria-label') || select.id || '選擇') + '：' + button.textContent);
    panel.replaceChildren();
    for (const option of select.options) {
      if (option.disabled || option.hidden) continue;
      const item = document.createElement('button');
      item.type = 'button'; item.className = 'l1ng-select-item'; item.role = 'option';
      item.textContent = option.textContent.trim();
      item.setAttribute('aria-selected', String(option.selected));
      if (option.selected) item.classList.add('selected');
      item.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        refresh(entry); close(); button.focus({ preventScroll: true });
      });
      panel.appendChild(item);
    }
    position(entry);
  }
  function enhance(select) {
    if (registry.has(select) || select.multiple || select.size > 1) return;
    const wrapper = document.createElement('span'); wrapper.className = 'l1ng-select';
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'l1ng-select-trigger';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    const panel = document.createElement('div');
    panel.className = 'l1ng-select-panel'; panel.role = 'listbox'; panel.hidden = true;
    wrapper.appendChild(button);
    select.insertAdjacentElement('afterend', wrapper);
    document.body.appendChild(panel);
    select.classList.add('l1ng-select-native');
    const entry = { select, wrapper, button, panel, observer: null };
    registry.set(select, entry);
    button.addEventListener('click', () => {
      if (opened === entry) { close(); return; }
      close(); refresh(entry); panel.hidden = false; opened = entry;
      button.setAttribute('aria-expanded', 'true'); position(entry);
    });
    button.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        if (!opened) { e.preventDefault(); button.click(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); panel.querySelector('button')?.focus(); }
      }
    });
    panel.addEventListener('keydown', e => {
      const choices = [...panel.querySelectorAll('button')], idx = choices.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); close(); button.focus(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        choices[Math.max(0, Math.min(choices.length - 1, idx + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
      }
    });
    select.addEventListener('change', () => refresh(entry));
    select.addEventListener('input', () => refresh(entry));
    entry.observer = new MutationObserver(() => refresh(entry));
    entry.observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected', 'hidden'] });
    refresh(entry);
  }
  function dispose() {
    if (repositionFrame) cancelAnimationFrame(repositionFrame);
    repositionFrame = 0;
    nativeMetricsDirty = false;
    close();
    for (const entry of registry.values()) {
      entry.observer.disconnect();
      entry.panel.remove();
      entry.wrapper.remove();
      entry.select.classList.remove('l1ng-select-native');
    }
    registry.clear();
    active = false;
  }
  function init() {
    if (!active) active = true;
    document.querySelectorAll('#feedback-form select:not([data-native-select])').forEach(enhance);
  }
  window.L1nGRefreshSelect = node => { const entry = registry.get(node); if (entry) refresh(entry); };
  window.L1nGSelectUI = Object.freeze({ init, dispose });
  new MutationObserver(() => { for (const entry of registry.values()) refresh(entry); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-language'] });
  document.addEventListener('pointerdown', e => {
    if (opened && !opened.panel.contains(e.target) && !opened.button.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // 合併連續捲動事件，避免同步重算下拉定位阻塞捲動。
  function repositionOpened(event) {
    if (event?.type === 'resize') nativeMetricsDirty = true;
    if (!opened || repositionFrame) return;
    repositionFrame = requestAnimationFrame(() => {
      repositionFrame = 0;
      const refreshMetrics = nativeMetricsDirty;
      nativeMetricsDirty = false;
      if (!opened) return;
      if (!anchorVisible(opened.button)) close();
      else if (!supportsNativeAnchor || refreshMetrics) position(opened);
    });
  }
  document.addEventListener('scroll', repositionOpened, { capture: true, passive: true });
  window.addEventListener('resize', repositionOpened, { passive: true });
  window.visualViewport?.addEventListener('resize', repositionOpened, { passive: true });
  window.visualViewport?.addEventListener('scroll', repositionOpened, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();