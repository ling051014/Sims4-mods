/* ========【族譜焦點管理】視窗層級、鍵盤作用域、返回焦點 ======== */
(function genealogyFocusModule(global) {
  'use strict';

  const registry = new Map();
  const stack = [];
  const generations = new WeakMap();
  const focusableSelector = [
    'a[href]', 'button:not(:disabled)', 'input:not(:disabled):not([type="hidden"])',
    'select:not(:disabled)', 'textarea:not(:disabled)', 'summary',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  let lastInteraction = null;
  let redirecting = false;

  function visible(element) {
    if (!element?.isConnected || element.hidden || element.closest('[hidden], [inert]')) return false;
    if (element.matches?.(':disabled') || element.getAttribute?.('aria-hidden') === 'true') return false;
    if (!element.getClientRects().length) return false;
    return global.getComputedStyle(element).visibility !== 'hidden';
  }

  function canReturn(element) {
    if (!visible(element) || element === document.body) return false;
    if (element.matches?.('input, textarea, select, button, a[href], summary, [tabindex]')) return true;
    return false;
  }

  function canvas() {
    return document.getElementById('genealogyCanvasViewport');
  }

  function focusCanvas() {
    const viewport = canvas();
    if (!viewport?.isConnected) return false;
    viewport.focus({ preventScroll:true });
    return document.activeElement === viewport;
  }

  function focusedWithin(owner, target = document.activeElement) {
    return !!(owner && target && owner.contains(target));
  }

  function top() {
    sync();
    return stack[stack.length - 1] || null;
  }

  function restore(entry) {
    const parent = stack[stack.length - 1];
    const origin = entry.origin;
    const fallback = parent?.element.querySelector('[role="dialog"], [tabindex="-1"]') || parent?.element;
    const target = canReturn(origin) && (!parent || parent.element.contains(origin))
      ? origin
      : parent && visible(fallback) ? fallback : canvas();
    if (!target || !visible(target)) return;
    global.requestAnimationFrame(() => {
      const current = top();
      if (current && current !== parent) return;
      if (document.activeElement && document.activeElement !== document.body &&
          !entry.element.contains(document.activeElement) && (parent ? parent.element.contains(document.activeElement) : document.activeElement !== document.documentElement)) return;
      if (target === canvas()) focusCanvas();
      else target.focus({ preventScroll:true });
    });
  }

  function enter(element, initial = null, origin = null) {
    if (!registry.has(element) || !element.classList.contains('show')) return;
    if (stack.some(entry => entry.element === element)) return;
    const active = document.activeElement;
    const candidate = origin || (active && !element.contains(active) ? active : lastInteraction);
    stack.push({ element, origin:canReturn(candidate) ? candidate : null });
    if (initial) focusLater(initial, element, 0);
  }

  function leave(element) {
    const index = stack.findIndex(entry => entry.element === element);
    if (index < 0) return;
    const wasTop = index === stack.length - 1;
    const [entry] = stack.splice(index, 1);
    generations.set(element, (generations.get(element) || 0) + 1);
    if (wasTop) restore(entry);
  }

  function sync() {
    for (let i = stack.length - 1; i >= 0; i--) {
      const entry = stack[i];
      if (!registry.has(entry.element) || !entry.element.isConnected || !entry.element.classList.contains('show')) {
        leave(entry.element);
      }
    }
    for (const element of registry.keys()) {
      if (element.isConnected && element.classList.contains('show') &&
          !stack.some(entry => entry.element === element)) enter(element);
    }
  }

  function register(element, close) {
    if (!element) return () => {};
    registry.set(element, { close:typeof close === 'function' ? close : null });
    sync();
    return () => {
      leave(element);
      registry.delete(element);
    };
  }

  function focusLater(target, owner, delay = 0) {
    if (!target || !owner) return;
    const generation = generations.get(owner) || 0;
    const apply = () => {
      if ((generations.get(owner) || 0) !== generation || !owner.isConnected ||
          !target.isConnected || !visible(target)) return;
      const modal = registry.has(owner);
      if (modal && (!owner.classList.contains('show') || top()?.element !== owner)) return;
      if (!modal && !owner.classList.contains('ui-select-open')) return;
      target.focus({ preventScroll:true });
    };
    if (delay > 0) global.setTimeout(apply, delay);
    else global.requestAnimationFrame(apply);
  }

  function ownsKeyboard(element) {
    const current = top();
    return !current || current.element.contains(element);
  }

  function isCanvasShortcutTarget(target) {
    if (top()) return false;
    if (!target || target === document || target === document.body || target === document.documentElement) return true;
    if (target.closest?.('input, textarea, select, [contenteditable], button, a[href], [role="button"], [role="combobox"], [role="menuitem"], [role="textbox"], [role="dialog"]')) return false;
    return !!canvas()?.contains(target);
  }

  function focusables(owner) {
    return [...owner.querySelectorAll(focusableSelector)].filter(visible);
  }

  document.addEventListener('pointerdown', event => {
    const target = event.target?.closest?.('button, a[href], input, select, textarea, [tabindex]');
    lastInteraction = canReturn(target) ? target : (canReturn(document.activeElement) ? document.activeElement : canvas());
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (canReturn(document.activeElement)) lastInteraction = document.activeElement;
    }
  }, true);

  // 以 show 狀態為準；原有視窗開關處理器保留，焦點層只管理堆疊。
  const observer = new MutationObserver(() => sync());
  const start = () => observer.observe(document.documentElement, {
    attributes:true, attributeFilter:['class'], subtree:true
  });
  if (document.documentElement) start();

  document.addEventListener('focusin', event => {
    if (redirecting) return;
    const current = top();
    if (!current || focusedWithin(current.element, event.target)) return;
    // 下拉選單可能透過 portal 掛到 body，但仍屬於目前的視窗。
    if (event.target?.closest?.('.ui-select-dropdown-portal')) return;
    const next = focusables(current.element)[0] ||
      current.element.querySelector('[role="dialog"]') || current.element;
    if (visible(next)) {
      redirecting = true;
      next.focus({ preventScroll:true });
      redirecting = false;
    }
  });

  const handleModalKeyboard = event => {
    if (event.key !== 'Tab' && event.key !== 'Escape') return;
    const current = top();
    if (!current) return;
    if (event.key === 'Escape') {
      // 子元件自行處理的 Esc 不可以再送往後面的全域處理器。
      if (event.defaultPrevented) {
        event.stopImmediatePropagation();
        return;
      }
      const action = registry.get(current.element)?.close;
      if (!action) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      action();
      return;
    }
    if (event.defaultPrevented || event.target?.closest?.('.ui-select-dropdown-portal')) return;
    const all = focusables(current.element);
    if (!all.length) {
      event.preventDefault();
      current.element.querySelector('[role="dialog"]')?.focus({ preventScroll:true });
      return;
    }
    const currentIndex = all.indexOf(document.activeElement);
    if (event.shiftKey && (currentIndex <= 0)) {
      event.preventDefault();
      all[all.length - 1].focus({ preventScroll:true });
    } else if (!event.shiftKey && (currentIndex < 0 || currentIndex === all.length - 1)) {
      event.preventDefault();
      all[0].focus({ preventScroll:true });
    }
  };
  // 放在原有元件的 keydown 處理器後面，讓下拉選單先消費 Esc。
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => document.addEventListener('keydown', handleModalKeyboard), {once:true});
  else global.setTimeout(() => document.addEventListener('keydown', handleModalKeyboard), 0);

  global.L1nGGenealogyFocus = Object.freeze({
    register, enter, leave, top, sync, focusCanvas, focusLater,
    ownsKeyboard, isCanvasShortcutTarget
  });
})(window);
