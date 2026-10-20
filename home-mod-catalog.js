// 首頁雙檢視：分類入口保持原樣，全模組首次展開才載入 JSON 產生的卡片片段。
(() => {
    const switcher = document.querySelector('.home-mod-view-switch');
    const categoryGrid = document.getElementById('home-category-grid');
    const allSection = document.getElementById('home-mod-catalog');
    const container = document.getElementById('home-mod-container');
    const search = document.getElementById('mod-search');
    const clear = document.getElementById('home-mod-clear');
    const sort = document.getElementById('home-mod-sort');
    const reset = document.getElementById('home-category-reset');
    const status = document.getElementById('home-mod-status');
    const ageDialog = document.getElementById('home-mod-age-dialog');
    const adultButton = document.getElementById('home-mod-adult');
    const underageButton = document.getElementById('home-mod-underage');
    if (!switcher || !categoryGrid || !allSection || !container) return;

    let loaded = false;
    let loading = null;
    let cards = [];
    let activeCategory = '';
    let ageState = 'undecided';
    const lazyObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver(entries => {
            for (const entry of entries) if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                lazyObserver.unobserve(entry.target);
            }
        }, { threshold: 0.05, rootMargin: '120px 0px' })
        : null;

    function applyFilters() {
        if (!loaded) return;
        const query = search.value.trim().toLocaleLowerCase();
        let visible = 0;
        for (const card of cards) {
            const allowed = ageState === 'adult' || card.dataset.category !== 'NSFW';
            const matches = allowed && (!activeCategory || card.dataset.category === activeCategory)
                && (!query || card.dataset.searchText.includes(query));
            card.hidden = !matches;
            if (matches) visible++;
            const badge = card.querySelector('.mod-category-label');
            if (badge) badge.setAttribute('aria-pressed', String(card.dataset.category === activeCategory && !!activeCategory));
        }
        clear.hidden = !search.value;
        reset.hidden = !activeCategory;
        status.textContent = '顯示 ' + visible + ' / ' + cards.length + ' 款模組' +
            (activeCategory ? ' · ' + activeCategory : '') +
            (ageState === 'minor' ? ' · 已隱藏 18+ 模組' : '');
    }
    function bindCards() {
        cards = [...container.querySelectorAll(':scope > .mod-card')];
        if (!cards.length) throw new Error('缺少模組卡片');
        for (const card of cards) {
            card.dataset.searchText = card.textContent.toLocaleLowerCase();
            if (lazyObserver) lazyObserver.observe(card);
            else card.classList.add('is-visible');
        }
        window.L1nGModSort?.bind(sort, container);
        loaded = true;
        applyFilters();
    }
    async function loadAll() {
        if (loaded) return;
        if (loading) return loading;
        status.textContent = '載入全部模組中…';
        loading = (async () => {
            const response = await fetch('all-mods.fragment.html');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const template = document.createElement('template');
            template.innerHTML = await response.text();
            const found = template.content.querySelectorAll('.mod-card');
            if (found.length !== 194) throw new Error('模組資料不完整（' + found.length + ' / 194）');
            for (const img of template.content.querySelectorAll('img')) img.loading = 'lazy';
            for (const video of template.content.querySelectorAll('video')) video.preload = 'none';
            container.appendChild(template.content);
            bindCards();
        })();
        try { await loading; }
        catch (error) {
            status.textContent = '目前無法載入全部模組，請再切換一次重試。';
            console.error('模組收藏載入失敗', error);
        } finally { loading = null; }
    }
    function setView(mode) {
        const all = mode === 'all';
        categoryGrid.hidden = all;
        allSection.hidden = !all;
        for (const button of switcher.querySelectorAll('[data-view]'))
            button.setAttribute('aria-pressed', String(button.dataset.view === mode));
        if (all) {
            if (ageState === 'undecided') {
                status.textContent = '請確認年齡後顯示全部模組';
                ageDialog.showModal();
            } else void loadAll();
        }
    }
    adultButton.addEventListener('click', () => {
        ageState = 'adult';
        ageDialog.close();
        void loadAll();
    });
    underageButton.addEventListener('click', () => {
        ageState = 'minor';
        ageDialog.close();
        void loadAll();
    });
    ageDialog.addEventListener('close', () => {
        if (ageState === 'undecided') setView('category');
    });
    switcher.addEventListener('click', event => {
        const button = event.target.closest('button[data-view]');
        if (!button) return;
        setView(button.dataset.view);
    });
    container.addEventListener('click', event => {
        const badge = event.target.closest('.mod-category-label');
        if (!badge) return;
        const category = badge.closest('.mod-card')?.dataset.category || '';
        activeCategory = activeCategory === category ? '' : category;
        applyFilters();
    });
    reset.addEventListener('click', () => { activeCategory = ''; applyFilters(); });
    search.addEventListener('input', applyFilters);
    clear.addEventListener('click', () => {
        search.value = '';
        applyFilters();
        search.focus({ preventScroll: true });
    });
})();
