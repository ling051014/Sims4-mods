/* GA4 for L1nG production sites only. Never send player or feedback contents. */
(function (global) {
  'use strict';

  const measurementId = 'G-6WM7WQP3E6';
  const sites = Object.freeze({
    'home.by-l1ng.com': 'home',
    'realdate.by-l1ng.com': 'realdate',
    'genealogy-tool.by-l1ng.com': 'genealogy',
    'genealogy-exporter.by-l1ng.com': 'extractor',
    'translations.by-l1ng.com': 'translations'
  });
  const site = sites[global.location?.hostname];
  if (!site) return; // Excludes pages.dev, local hosts and branch previews.

  const pageLocation = global.location.origin + global.location.pathname;
  global.dataLayer = global.dataLayer || [];
  function gtag() { global.dataLayer.push(arguments); }
  if (typeof global.gtag !== 'function') global.gtag = gtag;
  global.gtag('js', new Date());
  global.gtag('config', measurementId, {
    send_page_view: true,
    page_location: pageLocation, // Never send query strings or conversation receipts.
    page_path: global.location.pathname,
    page_title: document.title,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);

  function event(name, fields) {
    // Fixed event names and allowlisted values: no file names, URLs, or form contents.
    if (!['l1ng_download_click', 'l1ng_feedback_open', 'l1ng_feedback_submitted'].includes(name)
        && !/^l1ng_dl_[a-z0-9_]{4,30}$/.test(name)) return;
    const params = {
      l1ng_site: site,
      page_location: pageLocation,
      page_path: global.location.pathname
    };
    if (name === 'l1ng_download_click') {
      params.download_format = fields?.format || 'other';
      params.download_channel = fields?.channel || 'primary';
    }
    global.gtag('event', name, params);
  }

  function downloadDetails(anchor) {
    if (!['realdate','translations','extractor'].includes(site)) return null;
    let url;
    try { url = new URL(anchor.href, document.baseURI); } catch (_) { return null; }
    const localFile = url.origin === global.location.origin
      && /^\/downloads\//.test(url.pathname)
      && /\.(zip|package)$/i.test(url.pathname);
    const backup = ['realdate','translations'].includes(site)
      && url.hostname === 'www.dropbox.com'
      && /^\/scl\/(fi|fo)\//.test(url.pathname);
    if (!localFile && !backup) return null;
    const format = url.pathname.toLowerCase().endsWith('.zip') ? 'zip'
      : url.pathname.toLowerCase().endsWith('.package') ? 'package'
      : 'bundle';
    const id=anchor.dataset.l1ngDownload || '';
    return {format,channel:backup?'backup':'primary',itemId:/^[a-z0-9_]{4,30}$/.test(id)?id:''};
  }

  document.addEventListener('click', function (click) {
    const element = click.target;
    if (!element || typeof element.closest !== 'function') return;
    const anchor = element.closest('a[href]');
    const details = anchor && downloadDetails(anchor);
    if (details) { event('l1ng_download_click', details); if(details.itemId)event('l1ng_dl_'+details.itemId); }
    if ((site === 'genealogy' && element.closest('#feedbackBtn'))
        || (site === 'realdate' && element.closest('[data-open-form]'))) {
      event('l1ng_feedback_open');
    }
  });

  if(site==='realdate' && /^\/feedback(?:\.html)?\/?$/.test(global.location.pathname)) event('l1ng_feedback_open');
  global.L1nGAnalytics = Object.freeze({
    feedbackSubmitted: function () { event('l1ng_feedback_submitted'); }
  });
})(window);
