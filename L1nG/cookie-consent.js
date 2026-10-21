/* GA4: honor opt-in jurisdictions and consent choices; opt-out only where reviewed. */
(() => {
  'use strict';

  const hosts = new Set([
    'home.by-l1ng.com','realdate.by-l1ng.com','genealogy-tool.by-l1ng.com',
    'genealogy-exporter.by-l1ng.com','translations.by-l1ng.com'
  ]);
  const production = hosts.has(location.hostname);
  // Make the interface testable on branch previews without enabling GA4 or production cookies.
  const preview = !production && (
    ['raw.githack.com', 'rawcdn.githack.com'].includes(location.hostname) &&
      /^\/ling051014\/Sims4-mods\/(?:genealogy-structural-optimization-20260926|[0-9a-f]{40})\//i.test(location.pathname) ||
    /^(?:[a-z0-9-]+\.)?l1ng-(?:home|realdate|genealogy-tool|genealogy-exporter|translations)\.pages\.dev$/.test(location.hostname)
  );
  if (!production && !preview) return;
  const embedded = window.parent !== window;
  const genealogyStyle = !!document.querySelector('body[data-theme] #topbarMoreMenu');
  let previewChoice = null;
  const key = 'l1ng_analytics_consent';
  const scriptUrl = new URL('analytics.js?v=20261015-ga4-region-r1', document.currentScript.src);
  const regionUrl = new URL('l1ng-analytics-region', document.currentScript.src);
  let regionMode = 'opt-in'; // Safe default; never rely on language or time zone.
  let regionResolved = false;
  const copy = {
    'zh-Hant': {
      heading:'網站統計與 Cookie',
      message:'為了解網站使用情況，我們希望使用 Google Analytics 4 了解網站流量與使用趨勢。你可以接受、拒絕，或查看詳細設定。',
      autoMessage:'本站目前使用 Google Analytics 4 統計網站流量及使用趨勢。你可以拒絕統計，或查看偏好設定。',
      accept:'接受統計',keep:'維持統計',reject:'拒絕',settings:'偏好設定',
      title:'Cookie 偏好設定',necessary:'必要功能',
      necessaryNote:'記住你的 Cookie 選擇，並維持網站基本功能。',
      analytics:'分析統計（Google Analytics 4）',
      analyticsNote:'統計網頁瀏覽、下載點擊及功能使用情況。是否需要事先同意，會依訪客所在地區判斷。',
      save:'儲存偏好',close:'關閉',details:'隱私權與 Cookie 說明',
      note:'你可以隨時回來更改選擇。'
    },
    'zh-Hans': {
      heading:'网站统计与 Cookie',
      message:'为了了解网站使用情况，我们希望使用 Google Analytics 4 了解网站流量与使用趋势。你可以接受、拒绝，或查看详细设置。',
      autoMessage:'本站目前使用 Google Analytics 4 统计网站流量和使用趋势。你可以拒绝统计，或查看偏好设置。',
      accept:'接受统计',keep:'继续统计',reject:'拒绝',settings:'偏好设置',
      title:'Cookie 偏好设置',necessary:'必要功能',
      necessaryNote:'记住你的 Cookie 选择，并维持网站基本功能。',
      analytics:'分析统计（Google Analytics 4）',
      analyticsNote:'统计页面浏览、下载点击及功能使用情况。是否需要事先同意，依访客所在地判断。',
      save:'保存偏好',close:'关闭',details:'隐私权与 Cookie 说明',
      note:'你可以随时回来更改选择。'
    },
    en: {
      heading:'Analytics & Cookies',
      message:'We would like to use Google Analytics 4 to understand website traffic and usage trends. You can accept, reject, or review your preferences.',
      autoMessage:'This site is using Google Analytics 4 to measure traffic and usage trends. You may opt out or review preferences.',
      accept:'Accept analytics',keep:'Keep analytics',reject:'Reject',settings:'Preferences',
      title:'Cookie preferences',necessary:'Essential functions',
      necessaryNote:'Remember your cookie choice and support basic site functions.',
      analytics:'Analytics (Google Analytics 4)',
      analyticsNote:'Measure page views, download clicks and feature use. Regions requiring opt-in will not be tracked before consent.',
      save:'Save preferences',close:'Close',details:'Privacy & Cookies',
      note:'You can come back to change your choice at any time.'
    }
  };
  function language() {
    const lang = document.documentElement.dataset.language || document.documentElement.lang || 'zh-Hant';
    return /^en/i.test(lang) ? 'en' : /zh-(Hans|CN)|^zh-CN/i.test(lang) ? 'zh-Hans' : 'zh-Hant';
  }
  function savedChoice() {
    if (preview) return previewChoice;
    const match = document.cookie.split('; ').find(part => part.startsWith(key + '='));
    const value = match && match.slice(key.length + 1);
    return value === 'accepted' || value === 'rejected' ? value : null;
  }
  function storeChoice(value) {
    if (preview) { previewChoice = value; return; }
    document.cookie = key + '=' + value +
      '; Domain=.by-l1ng.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure';
  }
  function forgetAnalyticsCookies() {
    const names = document.cookie.split(';').map(part => part.trim().split('=')[0])
      .filter(name => /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name));
    for (const name of names) {
      for (const domain of ['', '; Domain=.by-l1ng.com', '; Domain=' + location.hostname]) {
        document.cookie = name + '=; Path=/; Max-Age=0; SameSite=Lax; Secure' + domain;
      }
    }
  }
  let analyticsLoaded = false;
  function permittedToTrack() {
    const choice = savedChoice();
    return choice === 'accepted' || (choice !== 'rejected' && regionResolved && regionMode === 'opt-out');
  }
  function loadAnalytics() {
    if (!production || analyticsLoaded || !permittedToTrack() || embedded) return;
    analyticsLoaded = true;
    const script = document.createElement('script');
    script.src = scriptUrl.href;
    script.async = true;
    document.head.appendChild(script);
  }
  let banner, overlay, opener = null, switchValue = false;
  let bannerSkeletonObserver = null;
  let preferencesReadyFrame = null;
  function removeBanner() {
    bannerSkeletonObserver?.disconnect();
    bannerSkeletonObserver = null;
    banner?.remove();
    banner = null;
  }
  function installFooterEntry() {
    const nav = document.querySelector('.l1ng-document-footer .l1ng-footer-policy-links');
    if (!nav || nav.querySelector('[data-l1ng-cookie-footer]')) return;
    const link = document.createElement('a');
    link.href = '#cookie-settings';
    link.dataset.l1ngCookieSettings = '';
    link.dataset.l1ngCookieFooter = '';
    nav.appendChild(link);
    updateLabels();
  }
  function updateLabels() {
    const t = copy[language()];
    const footerLink = document.querySelector('[data-l1ng-cookie-footer]');
    if (footerLink) footerLink.textContent = language() === 'en' ? 'Cookie settings'
      : language() === 'zh-Hans' ? 'Cookie 设置' : 'Cookie 設定';
    if (banner) {
      banner.querySelector('[data-cookie-heading]').textContent = t.heading;
      const autoTracking = regionResolved && regionMode === 'opt-out' && !savedChoice();
      banner.querySelector('[data-cookie-message]').textContent = autoTracking ? t.autoMessage : t.message;
      banner.querySelector('[data-cookie-accept]').textContent = autoTracking ? t.keep : t.accept;
      banner.querySelector('[data-cookie-reject]').textContent = t.reject;
      banner.querySelector('[data-cookie-preferences]').textContent = t.settings;
    }
    if (overlay) {
      overlay.querySelector('[data-cookie-title]').textContent = t.title;
      overlay.querySelector('[data-cookie-close]').setAttribute('aria-label', t.close);
      overlay.querySelector('[data-cookie-necessary]').textContent = t.necessary;
      overlay.querySelector('[data-cookie-necessary-note]').textContent = t.necessaryNote;
      overlay.querySelector('[data-cookie-analytics]').textContent = t.analytics;
      overlay.querySelector('[data-cookie-analytics-note]').textContent = t.analyticsNote;
      overlay.querySelector('[data-cookie-save]').textContent = t.save;
      overlay.querySelector('[data-cookie-all-reject]').textContent = t.reject;
      overlay.querySelector('[data-cookie-note]').textContent = t.note;
    }
  }
  function choose(accepted) {
    const previous = savedChoice();
    storeChoice(accepted ? 'accepted' : 'rejected');
    removeBanner();
    closePreferences();
    if (accepted) loadAnalytics();
    else {
      forgetAnalyticsCookies();
      if (analyticsLoaded || previous === 'accepted') location.reload(); // Stop already-loaded gtag.
    }
  }
  function showBanner() {
    if (banner || savedChoice() || embedded) return;
    banner = document.createElement('section');
    banner.className = 'l1ng-cookie-banner';
    banner.setAttribute('aria-label', copy[language()].heading);
    banner.innerHTML =
      '<div class="l1ng-cookie-skeleton" aria-hidden="true">' +
      '<span class="l1ng-cookie-skeleton-line is-title"></span>' +
      '<span class="l1ng-cookie-skeleton-line"></span>' +
      '<span class="l1ng-cookie-skeleton-line is-medium"></span>' +
      '<span class="l1ng-cookie-skeleton-line is-short"></span>' +
      '<div class="l1ng-cookie-skeleton-actions"><span></span><span></span><span></span></div></div>' +
      '<div class="l1ng-cookie-live"><strong data-cookie-heading></strong><p data-cookie-message></p>' +
      '<div class="l1ng-cookie-actions">' +
      '<button type="button" class="l1ng-cookie-accept" data-cookie-accept></button>' +
      '<button type="button" data-cookie-reject></button>' +
      '<button type="button" data-cookie-preferences></button></div></div>';
    const pageSkeleton = document.querySelector(
      '.l1ng-site-skeleton:not(.is-hidden), #appSkeleton:not(.is-hidden)'
    );
    if (pageSkeleton) {
      banner.classList.add('is-loading');
      banner.setAttribute('aria-busy', 'true');
      bannerSkeletonObserver = new MutationObserver(() => {
        if (pageSkeleton.isConnected && !pageSkeleton.classList.contains('is-hidden')) return;
        banner?.classList.remove('is-loading');
        banner?.removeAttribute('aria-busy');
        bannerSkeletonObserver?.disconnect();
        bannerSkeletonObserver = null;
      });
      bannerSkeletonObserver.observe(pageSkeleton, {attributes:true,attributeFilter:['class']});
    }
    document.body.appendChild(banner);
    banner.querySelector('[data-cookie-accept]').addEventListener('click', () => choose(true));
    banner.querySelector('[data-cookie-reject]').addEventListener('click', () => choose(false));
    banner.querySelector('[data-cookie-preferences]').addEventListener('click', openPreferences);
    updateLabels();
  }
  function closePreferences() {
    if (!overlay) return;
    if (preferencesReadyFrame !== null) cancelAnimationFrame(preferencesReadyFrame);
    preferencesReadyFrame = null;
    overlay.remove();
    overlay = null;
    opener?.focus?.({preventScroll:true});
    opener = null;
  }
  function openPreferences() {
    if (embedded) {
      window.parent.postMessage({type:'l1ng-cookie-open-preferences'}, '*');
      return;
    }
    if (overlay) return;
    opener = document.activeElement;
    switchValue = permittedToTrack();
    overlay = document.createElement('div');
    overlay.className = genealogyStyle
      ? 'ui-dialog-backdrop show l1ng-cookie-backdrop l1ng-cookie-genealogy'
      : 'l1ng-cookie-backdrop';
    const infoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="7.5" r="1.1" ' +
      'fill="currentColor" stroke="none"></circle><path d="M12 11.5v5.5"></path></svg>';
    const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M5 5l14 14M19 5L5 19"></path></svg>';
    const header = genealogyStyle
      ? '<div class="help-heading"><span class="l1ng-icon icon-info-circle help-heading-icon" aria-hidden="true"></span>' +
        '<div class="help-heading-copy"><h2 id="l1ng-cookie-title" data-cookie-title></h2>' +
        '<p class="l1ng-cookie-subtitle" id="l1ng-cookie-subtitle" data-cookie-note></p></div></div>' +
        '<button type="button" class="help-close-btn l1ng-cookie-close" data-cookie-close aria-label="Close">' +
        '<span class="l1ng-icon icon-x-lg" aria-hidden="true"></span></button>'
      : '<span class="l1ng-site-info-heading-icon" aria-hidden="true">' + infoIcon + '</span>' +
        '<div class="l1ng-site-info-heading"><h2 id="l1ng-cookie-title" data-cookie-title></h2>' +
        '<p id="l1ng-cookie-subtitle" data-cookie-note></p></div>' +
        '<button type="button" class="l1ng-site-info-close l1ng-cookie-close" data-cookie-close aria-label="Close">' +
        closeIcon + '</button>';
    overlay.className = genealogyStyle
      ? 'ui-dialog-backdrop show l1ng-cookie-backdrop l1ng-cookie-genealogy'
      : 'l1ng-cookie-backdrop l1ng-site-info-backdrop l1ng-cookie-regular';
    overlay.innerHTML =
      '<section class="' + (genealogyStyle
          ? 'ui-dialog-panel storage-modal l1ng-cookie-dialog'
          : 'l1ng-site-info-panel l1ng-cookie-dialog') +
        '" role="dialog" aria-modal="true" aria-labelledby="l1ng-cookie-title" aria-describedby="l1ng-cookie-subtitle">' +
        '<header class="' + (genealogyStyle ? 'help-header storage-header' : 'l1ng-site-info-header') +
        '">' + header + '</header>' +
        '<div class="l1ng-cookie-preferences-skeleton" aria-hidden="true">' +
        '<span class="l1ng-cookie-skeleton-line is-title"></span>' +
        '<span class="l1ng-cookie-skeleton-line"></span>' +
        '<span class="l1ng-cookie-skeleton-line is-medium"></span>' +
        '<span class="l1ng-cookie-skeleton-line"></span>' +
        '<span class="l1ng-cookie-skeleton-line is-short"></span></div>' +
        '<div class="' + (genealogyStyle ? 'storage-scroll-body l1ng-cookie-body' : 'l1ng-cookie-body') + '">' +
        '<div class="l1ng-cookie-setting"><span><strong data-cookie-necessary></strong>' +
        '<small data-cookie-necessary-note></small></span>' +
        '<span class="l1ng-cookie-switch is-on" aria-hidden="true"></span></div>' +
        '<div class="l1ng-cookie-setting"><span><strong data-cookie-analytics></strong>' +
        '<small data-cookie-analytics-note></small></span>' +
        '<button type="button" class="l1ng-cookie-switch" role="switch" aria-label="Google Analytics 4" aria-checked="false" data-cookie-switch></button></div></div>' +
        '<div class="l1ng-cookie-actions"><button type="button" data-cookie-all-reject></button>' +
        '<button type="button" class="l1ng-cookie-accept" data-cookie-save></button></div>' +
      '</section>';
    overlay.classList.add('is-loading');
    overlay.setAttribute('aria-busy','true');
    document.body.appendChild(overlay);
    // A real initial render: let the skeleton paint before revealing populated controls.
    preferencesReadyFrame = requestAnimationFrame(() => {
      preferencesReadyFrame = requestAnimationFrame(() => {
        if (overlay) {
          overlay.classList.remove('is-loading');
          overlay.removeAttribute('aria-busy');
        }
        preferencesReadyFrame = null;
      });
    });
    overlay.querySelector('[data-cookie-switch]').addEventListener('click', () => {
      switchValue = !switchValue;
      overlay.querySelector('[data-cookie-switch]').setAttribute('aria-checked',String(switchValue));
    });
    overlay.querySelector('[data-cookie-switch]').setAttribute('aria-checked',String(switchValue));
    overlay.querySelector('[data-cookie-save]').addEventListener('click', () => choose(switchValue));
    overlay.querySelector('[data-cookie-all-reject]').addEventListener('click', () => choose(false));
    overlay.querySelector('[data-cookie-close]').addEventListener('click', closePreferences);
    overlay.addEventListener('click', e => {if(e.target === overlay)closePreferences();});
    updateLabels();
    overlay.querySelector('[data-cookie-close]').focus();
  }
  document.addEventListener('click',event => {
    const trigger = event.target.closest?.('[data-l1ng-cookie-settings]');
    if (!trigger) return;
    event.preventDefault();
    openPreferences();
  });
  document.addEventListener('keydown',event => {
    if (!overlay) return;
    if (event.key === 'Escape') { event.preventDefault(); closePreferences(); }
    if (event.key === 'Tab') {
      const controls = [...overlay.querySelectorAll('button:not([disabled])')];
      const first = controls[0], last = controls[controls.length-1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
  });
  window.addEventListener('message', event => {
    if (embedded) return;
    let senderHost='';
    try { senderHost=new URL(event.origin).hostname; } catch (_) { return; }
    if (!hosts.has(senderHost) && !(preview && senderHost === location.hostname)) return;
    if (event.data?.type === 'l1ng-cookie-open-preferences') openPreferences();
  });
  async function resolveRegion() {
    if (!production) { regionResolved = true; regionMode = 'opt-in'; updateLabels(); return; }
    const choice = savedChoice();
    // Explicit consent/opt-out overrides regional defaults.
    if (choice === 'accepted') { loadAnalytics(); return; }
    if (choice === 'rejected') return;
    try {
      const response = await fetch(regionUrl.href, {
        credentials:'same-origin', cache:'no-store', redirect:'error'
      });
      if (!response.ok) throw new Error('Region unavailable');
      const data = await response.json();
      regionMode = data?.mode === 'opt-out' ? 'opt-out' : 'opt-in';
    } catch (_) {
      regionMode = 'opt-in'; // Missing Functions route or unavailable region => no tracking.
    }
    regionResolved = true;
    if (savedChoice() === 'rejected') return;
    if (permittedToTrack()) loadAnalytics();
    if (banner) updateLabels();
    else showBanner();
  }
  function init() {
    if (embedded) return;
    installFooterEntry();
    const choice = savedChoice();
    if (choice === 'accepted') loadAnalytics();
    else if (!choice) {
      // Render immediately. Do not hide the choice while the country request is pending.
      showBanner();
      resolveRegion();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  new MutationObserver(updateLabels).observe(document.documentElement, {
    attributes:true, attributeFilter:['lang','data-language']
  });
  window.L1nGCookiePreferences = Object.freeze({open:openPreferences});
})();
