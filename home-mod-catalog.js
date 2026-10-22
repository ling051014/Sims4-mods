// 首頁雙檢視：分類入口保持原樣，全模組首次展開才讀取 12 個分類 JSON。
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
    let contentLoading = null;
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
        const sorting = window.L1nGModSort?.bind(sort, container);
        sorting?.sort();
        loaded = true;
        applyFilters();
    }
    async function loadAll() {
        if (loaded) return;
        if (loading) return loading;
        status.textContent = '載入全部模組中…';
        contentLoading = window.L1nGSkeleton.start(container, 'cards', 6);
        loading = (async () => {
            const catalog = window.L1nGModCatalog;
            if (!catalog) throw new Error('共用模組資料載入器不存在');
            const selected = ageState === 'adult'
                ? [...catalog.slugs]
                : catalog.slugs.filter(slug => slug !== 'nsfw-mods');
            const data = await catalog.loadMany(selected, (done, total) => {
                status.textContent = '正在讀取模組分類 ' + done + ' / ' + total;
            });
            const fragment = document.createDocumentFragment();
            let count = 0;
            for (const { slug, data: category } of data) {
                count += category.mods.length;
                fragment.appendChild(catalog.renderCategory(category, slug, true));
            }
            const expected = ageState === 'adult' ? 194 : 188;
            if (count !== expected)
                throw new Error('模組資料不完整（' + count + ' / ' + expected + '）');
            contentLoading.ready(fragment);
            bindCards();
        })();
        try { await loading; }
        catch (error) {
            contentLoading.fail('目前無法載入全部模組，請切回分類模式後重試。');
            status.textContent = '全部模組載入失敗';
            console.error('模組收藏載入失敗', error);
        } finally { loading = null; contentLoading = null; }
    }
    function setView(mode) {
        const all = mode === 'all';
        categoryGrid.hidden = all;
        allSection.hidden = !all;
        for (const button of switcher.querySelectorAll('[data-view]'))
            button.setAttribute('aria-pressed', String(button.dataset.view === mode));
        positionSlider();
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
    function positionSlider() {
        const active = switcher.querySelector('.home-mod-view-button[aria-pressed="true"]');
        if (!active) return;
        switcher.style.setProperty('--view-slider-width', active.offsetWidth + 'px');
        switcher.style.setProperty('--view-slider-x', active.offsetLeft + 'px');
    }
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(positionSlider);
        observer.observe(switcher);
        for (const button of switcher.querySelectorAll('.home-mod-view-button')) observer.observe(button);
    } else window.addEventListener('resize', positionSlider);
    positionSlider();
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
