/* RealDate persistent header: one indicator survives all in-site route changes. */
(() => {
  'use strict';
  let nav = null, indicator = null, links = [], active = null;
  function coordinates(link) {
    const rect = link.getBoundingClientRect();
    const parent = nav.getBoundingClientRect();
    return { x: rect.left - parent.left + nav.scrollLeft,
      y: rect.bottom - parent.top + nav.scrollTop + 8, width: rect.width };
  }
  function write(position) {
    if (!indicator || !position) return;
    indicator.style.setProperty('--l1ng-nav-x', position.x + 'px');
    indicator.style.setProperty('--l1ng-nav-y', position.y + 'px');
    indicator.style.setProperty('--l1ng-nav-width', position.width + 'px');
  }
  function recalculate() { if (active && indicator) write(coordinates(active)); }
  function activate(pathname, immediate = false) {
    if (!nav) return;
    // Both /faq and /faq.html identify the same navigation item.
    const normalize = path => path.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
    const next = links.find(link => normalize(new URL(link.href, location.href).pathname) === normalize(pathname)) || null;
    for (const link of links) {
      const selected = link === next;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    const wasVisible = indicator.style.opacity !== '0';
    active = next;
    if (!next) {
      indicator.style.opacity = '0';
      return;
    }
    if (immediate || !wasVisible) indicator.classList.remove('is-animated');
    indicator.style.opacity = '1';
    write(coordinates(next));
    requestAnimationFrame(() => indicator.classList.add('is-animated'));
  }
  function init() {
    const element = document.getElementById('mainNav');
    if (!element || nav === element) return;
    nav = element;
    links = [...nav.querySelectorAll(':scope > a[href]')];
    indicator = nav.querySelector('.l1ng-nav-indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'l1ng-nav-indicator';
      indicator.setAttribute('aria-hidden', 'true');
      nav.appendChild(indicator);
    }
    indicator.style.opacity = '0';
    nav.classList.add('l1ng-nav-indicator-ready');
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(recalculate);
      resize.observe(nav);
      links.forEach(link => resize.observe(link));
    } else {
      window.addEventListener('resize', recalculate);
    }
    nav.addEventListener('scroll', recalculate, { passive: true });
    document.fonts?.ready.then(recalculate).catch(() => {});
    activate(location.pathname, true);
  }
  window.L1nGRealDateNav = Object.freeze({ init, activate });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();