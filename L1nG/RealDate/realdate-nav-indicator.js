// RealDate: 跨頁導覽共用的單一滑動底線，保留原有文字及手機選單。
(() => {
    const init = () => {
        const nav = document.getElementById('mainNav');
        if (!nav || nav.querySelector('.l1ng-nav-indicator')) return;
        const anchors = [...nav.querySelectorAll(':scope > a[href]')];
        const active = anchors.find(link => link.classList.contains('active'));
        if (!active) return; // 首頁及舊版「更多」內頁沒有直接選取的主導覽項。
        const indicator = document.createElement('span');
        indicator.className = 'l1ng-nav-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        nav.append(indicator);
        const key = 'l1ng-realdate-nav-transition-v1';
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        function position(link) {
            const navRect = nav.getBoundingClientRect();
            const rect = link.getBoundingClientRect();
            return { x: rect.left - navRect.left + nav.scrollLeft,
                y: rect.bottom - navRect.top + nav.scrollTop + 8, width: rect.width };
        }
        function write(p) {
            indicator.style.setProperty('--l1ng-nav-x', p.x + 'px');
            indicator.style.setProperty('--l1ng-nav-y', p.y + 'px');
            indicator.style.setProperty('--l1ng-nav-width', p.width + 'px');
        }
        const target = position(active);
        let previous = null;
        try {
            const raw = sessionStorage.getItem(key);
            sessionStorage.removeItem(key);
            if (raw) {
                const value = JSON.parse(raw);
                if (value.destination === location.pathname && Date.now() - value.at < 3000) previous = value;
            }
        } catch (_) { /* 封鎖儲存時直接顯示當前底線 */ }
        const desktop = () => getComputedStyle(nav).flexDirection !== 'column' && !nav.classList.contains('open');
        if (previous && desktop() && !reduce.matches) write(previous);
        else write(target);
        nav.classList.add('l1ng-nav-indicator-ready');
        requestAnimationFrame(() => {
            if (previous && desktop() && !reduce.matches) {
                requestAnimationFrame(() => { indicator.classList.add('is-animated'); write(position(active)); });
            } else indicator.classList.add('is-animated');
        });
        nav.addEventListener('click', event => {
            const link = event.target.closest('a[href]');
            if (!link || !anchors.includes(link) || event.defaultPrevented ||
                event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const destination = new URL(link.href);
            if (destination.origin !== location.origin || destination.pathname === location.pathname || !desktop()) return;
            try {
                const before = position(active);
                sessionStorage.setItem(key, JSON.stringify({ ...before, destination: destination.pathname, at: Date.now() }));
            } catch (_) { /* 儲存失敗不影響頁面連結 */ }
        });
        const update = () => write(position(active));
        if ('ResizeObserver' in window) {
            const resize = new ResizeObserver(update);
            resize.observe(nav);
            anchors.forEach(link => resize.observe(link));
        } else window.addEventListener('resize', update);
        const mutation = new MutationObserver(update);
        mutation.observe(nav, { attributes: true, attributeFilter: ['class'] });
        anchors.forEach(link => mutation.observe(link, { attributes: true, attributeFilter: ['class'] }));
        nav.addEventListener('scroll', update, { passive: true });
        document.fonts?.ready.then(update).catch(() => {});
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
    else init();
})();
