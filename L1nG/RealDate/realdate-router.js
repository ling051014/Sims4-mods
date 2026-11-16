/* RealDate persistent navigation: one header from index.html, route content loaded in place. */
(() => {
  'use strict';
  window.L1nGRealDateRouterActive = true;
  const script = document.currentScript;
  const base = new URL('./', script.src);
  const pages = new Set([
    'index.html', 'gameplay.html', 'download.html', 'compatibility.html',
    'changelog.html', 'roadmap.html', 'faq.html', 'feedback.html'
  ]);
  const routeStyles = /(?:^|\/)(?:realdate|changelog|feedback|feedback-loading)\.css$/;
  let route = routeName(location.href);
  let sequence = 0;
  let pending = null;
  let appReady = false;
  const loadedScripts = new Map();

  function routeName(target) {
    let u;
    try { u = new URL(target, location.href); } catch (_) { return null; }
    if (u.origin !== location.origin || !u.pathname.startsWith(base.pathname)) return null;
    const rest = u.pathname.slice(base.pathname.length);
    const name = rest || 'index.html';
    return pages.has(name) ? name : null;
  }
  function isPlainClick(event, anchor) {
    return !event.defaultPrevented && event.button === 0 && !event.ctrlKey &&
      !event.metaKey && !event.shiftKey && !event.altKey &&
      !anchor.hasAttribute('download') && (!anchor.target || anchor.target === '_self') &&
      !anchor.hasAttribute('data-site-info-section');
  }
  async function header() {
    if (document.getElementById('siteHeader')) return;
    const slot = document.querySelector('[data-realdate-header-slot]');
    if (!slot) throw new Error('RealDate shared header slot not found');
    const response = await fetch(new URL('index.html', base), { credentials: 'same-origin' });
    if (!response.ok) throw new Error('RealDate shared header unavailable: ' + response.status);
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const source = doc.querySelector('header#siteHeader');
    if (!source) throw new Error('RealDate header source is missing');
    slot.replaceWith(document.importNode(source, true));
  }
  function headerReady() {
    window.L1nGRealDate?.initHeader?.();
    window.L1nGRealDateNav?.init?.();
    window.L1nGRealDateNav?.activate?.(location.pathname, true);
    window.L1nGRealDate?.refreshTitle?.();
  }
  function scriptOnce(name) {
    const globals = {
      'realdate-select-ui.js': 'L1nGSelectUI',
      'feedback-core.js': 'L1nGFeedbackCore',
      'realdate-feedback-live.js': 'L1nGFeedbackLive',
      'feedback-i18n.js': 'L1nGFeedbackI18n'
    };
    if (window[globals[name]]) return Promise.resolve();
    const url = new URL(name === 'realdate-select-ui.js' ? name : '../feedback/' + name, base);
    url.searchParams.set('v', (name === 'feedback-i18n.js' || name === 'realdate-feedback-live.js') ? '20261115-feedback-versions-only-r1' : (name === 'realdate-select-ui.js' ? '20261115-version-placeholder-r3' : '20261115-shell-r1'));
    if (loadedScripts.has(name)) return loadedScripts.get(name);
    const promise = new Promise((resolve, reject) => {
      const node = document.createElement('script');
      node.src = url.href;
      node.async = false;
      node.onload = resolve;
      node.onerror = () => reject(new Error('Missing RealDate feedback script: ' + name));
      document.head.appendChild(node);
    });
    loadedScripts.set(name, promise);
    return promise;
  }
  async function feedbackReady() {
    const scripts = [
      'realdate-select-ui.js', 'feedback-core.js', 'realdate-feedback-live.js', 'feedback-i18n.js'
    ];
    for (const name of scripts) await scriptOnce(name);
    window.L1nGSelectUI?.init?.();
    window.L1nGFeedbackLive?.init?.();
    window.L1nGFeedbackI18n?.init?.();
  }
  function cleanupPage() {
    window.L1nGRealDate?.destroyPage?.();
    window.L1nGFeedbackLive?.dispose?.();
    window.L1nGFeedbackI18n?.dispose?.();
    window.L1nGSelectUI?.dispose?.();
  }
  function styleLinks(doc, url) {
    return [...doc.querySelectorAll('link[rel="stylesheet"][href]')]
      .map(node => new URL(node.getAttribute('href'), url))
      .filter(u => routeStyles.test(u.pathname));
  }
  function currentRouteStyles() {
    return [...document.querySelectorAll('link[rel="stylesheet"][href]')]
      .filter(node => routeStyles.test(new URL(node.href).pathname));
  }
  async function prepareStyles(doc, url) {
    const required = styleLinks(doc, url);
    const existing = currentRouteStyles();
    const known = new Set(existing.map(node => node.href));
    await Promise.all(required.filter(u => !known.has(u.href)).map(u => new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = u.href;
      link.dataset.realdateRouteStyle = '';
      link.onload = resolve;
      link.onerror = () => { link.remove(); reject(new Error('Missing route stylesheet: ' + u.pathname)); };
      document.head.appendChild(link);
    })));
    return () => {
      const keep = new Set(required.map(u => u.href));
      for (const link of currentRouteStyles()) if (!keep.has(link.href)) link.remove();
    };
  }
  function scrollToTarget(url, restore) {
    requestAnimationFrame(() => {
      if (Number.isFinite(restore)) {
        scrollTo({ top: restore, behavior: 'instant' });
      } else if (url.hash) {
        let node = null;
        try { node = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (_) {}
        if (node) node.scrollIntoView({ block: 'start' });
        else scrollTo({ top: 0, behavior: 'instant' });
      } else {
        scrollTo({ top: 0, behavior: 'instant' });
      }
    });
  }
  function rememberPosition() {
    const current = history.state || {};
    history.replaceState({ ...current, realdateRoute: true, scrollY: scrollY }, '', location.href);
  }
  async function navigate(url, { pop = false, restore = null } = {}) {
    const name = routeName(url.href);
    if (!name) return;
    const id = ++sequence;
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    const oldMain = document.querySelector('main');
    oldMain?.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url.href, {
        credentials: 'same-origin',
        headers: { 'Accept': 'text/html' },
        signal: controller.signal
      });
      if (!response.ok || !/text\/html/i.test(response.headers.get('content-type') || ''))
        throw new Error('Failed to load RealDate page: ' + response.status);
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const next = doc.querySelector('[data-realdate-page]');
      if (!next || !next.querySelector('main') || !doc.querySelector('footer.l1ng-document-footer'))
        throw new Error('Incomplete RealDate page: ' + name);
      const finishStyles = await prepareStyles(doc, url.href);
      if (id !== sequence) return;
      cleanupPage();
      document.querySelector('[data-realdate-page]').replaceWith(document.importNode(next, true));
      document.body.classList.toggle('realdate-only', doc.body.classList.contains('realdate-only'));
      finishStyles();
      if (!pop) {
        rememberPosition();
        history.pushState({ realdateRoute: true, scrollY: 0 }, '', url.href);
      }
      route = name;
      window.L1nGRealDate?.refreshTitle?.();
      window.L1nGRealDate?.closeMobileNav?.();
      window.L1nGRealDateNav?.activate?.(location.pathname);
      window.L1nGRealDate?.initPage?.();
      if (name === 'feedback.html') await feedbackReady();
      if (id !== sequence) return;
      scrollToTarget(url, pop ? restore : null);
      // The initial page view is sent by GA4 config; SPA route views need their own event.
      // The analytics object only exists after consent permits the tracking script.
      if (window.L1nGAnalytics && typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
          page_location: location.origin + location.pathname,
          page_path: location.pathname,
          page_title: document.title,
          l1ng_site: 'realdate'
        });
      }
    } catch (error) {
      if (controller.signal.aborted || id !== sequence) return;
      console.error('[RealDate navigation]', error);
      if (pop) location.reload();
      else location.assign(url.href);
    } finally {
      if (id === sequence) {
        pending = null;
        document.querySelector('main')?.removeAttribute('aria-busy');
      }
    }
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (!appReady || !anchor || !isPlainClick(event, anchor)) return;
    const url = new URL(anchor.href, location.href);
    const name = routeName(url.href);
    if (!name || url.search) return;
    if (name === route && url.pathname === location.pathname) return; // Native anchors.
    event.preventDefault();
    navigate(url);
  });
  window.addEventListener('popstate', event => {
    const name = routeName(location.href);
    if (!name) return;
    const url = new URL(location.href);
    if (name === route) {
      scrollToTarget(url, Number.isFinite(event.state?.scrollY) ? event.state.scrollY : null);
      return;
    }
    navigate(url, { pop: true, restore: Number.isFinite(event.state?.scrollY) ? event.state.scrollY : null });
  });
  async function start() {
    try {
      await header();
      headerReady();
      appReady = true;
      window.L1nGRealDate?.initPage?.();
      if (route === 'feedback.html') await feedbackReady();
      if (location.hash) scrollToTarget(new URL(location.href), null);
      history.scrollRestoration = 'manual';
    } catch (error) {
      console.error('[RealDate shared header]', error);
      appReady = false;
      // The document itself remains available even if shared navigation fails.
      const slot = document.querySelector('[data-realdate-header-slot]');
      if (slot) {
        const fallback = document.createElement('a');
        fallback.href = 'index.html';
        fallback.textContent = 'RealDate 首頁 / Home';
        slot.replaceWith(fallback);
      }
      window.L1nGRealDate?.initPage?.();
    }
  }
  // Wait for all initial deferred scripts (including the feedback form) before booting.
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();