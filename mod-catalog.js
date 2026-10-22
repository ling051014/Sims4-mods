// 共用模組收藏庫：由瀏覽器直接載入根目錄 JSON，分類頁與首頁使用同一套卡片結構。
(() => {
    const slugs = Object.freeze([
        'prep-mods', 'cheat-mods', 'ui-mods', 'world-mods',
        'default-mods', 'nsfw-mods', 'social-mods', 'build-buy',
        'cas', 'slider', 'pose-mods', 'other'
    ]);
    const catalog = new Map();
    const allowedTags = new Set([
        'a', 'b', 'br', 'button', 'details', 'div', 'em', 'i', 'del',
        'img', 'input', 'label', 'p', 'small', 'span', 'strong', 'summary',
        'svg', 'path', 'video', 'source', 'wbr', 'hr', 'code', 'kbd', 'ul', 'li', 'ol'
    ]);
    const allowedAttrs = new Set([
        'href', 'target', 'src', 'class', 'autoplay', 'muted', 'loop', 'playsinline',
        'width', 'height', 'style', 'type', 'data-tooltip-id', 'id', 'role',
        'aria-label', 'onclick'
    ]);
    const allowedHandlers = new Set(['toggleMute(this)', 'openDLCDialog()']);
    const escapeAttr = value => String(value).replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const keyOf = slug => slug.replace(/-mods$/, '').replace(/-/g, '').toUpperCase();

    function rich(nodes) {
        if (!Array.isArray(nodes)) throw new Error('無效的模組富文字欄位');
        return nodes.map(node => {
            if (typeof node === 'string') return node;
            if (!node || typeof node !== 'object') throw new Error('無效的模組文字節點');
            if (Object.hasOwn(node, 'comment')) return '<!--' + node.comment + '-->';
            if (Object.hasOwn(node, 'close')) return '</' + node.close + '>';
            if (!allowedTags.has(node.tag)) throw new Error('未支援的模組標籤：' + node.tag);
            const attrs = Object.entries(node.attrs || {}).map(([name, value]) => {
                if (!allowedAttrs.has(name)) throw new Error('未支援的模組屬性：' + name);
                if (name === 'onclick' && !allowedHandlers.has(value))
                    throw new Error('未支援的模組操作');
                return value === null ? ' ' + name : ' ' + name + '="' + escapeAttr(String(value).replace(/&amp;/g, '&')) + '"';
            }).join('');
            return '<' + node.tag + attrs + '>' +
                (node.children ? rich(node.children) + (node.unclosed ? '' : '</' + node.tag + '>') : '');
        }).join('');
    }

    function checkData(data, slug) {
        if (data.schemaVersion !== 2 || data.category !== slug ||
            data.sourceFile !== slug + '.html' || !Array.isArray(data.mods))
            throw new Error(slug + '.json 資料結構不正確');
        const ids = new Set(), orders = new Set();
        for (const mod of data.mods) {
            if (!/^[a-z0-9-]+$/.test(mod.id) || ids.has(mod.id) ||
                !Number.isInteger(mod.order) || orders.has(mod.order) ||
                !Array.isArray(mod.preview) || !Array.isArray(mod.title) ||
                !Array.isArray(mod.byline) || !Array.isArray(mod.fields))
                throw new Error(slug + '.json 含不完整或重複卡片');
            ids.add(mod.id); orders.add(mod.order);
        }
        return data;
    }

    async function loadCategory(slug) {
        if (!slugs.includes(slug)) throw new Error('無效的模組分類：' + slug);
        if (!catalog.has(slug)) {
            const task = fetch(slug + '.json').then(response => {
                if (!response.ok) throw new Error(slug + '.json HTTP ' + response.status);
                return response.json();
            }).then(data => checkData(data, slug)).catch(error => {
                catalog.delete(slug); // 網路錯誤可以重新載入
                throw error;
            });
            catalog.set(slug, task);
        }
        return catalog.get(slug);
    }

    function createCard(mod, slug, showCategory = false) {
        const layout = mod.layout || {};
        const noteTag = layout.notesTag || 'div';
        if (!['p', 'div'].includes(noteTag)) throw new Error('無效的模組備註位置');
        const notes = mod.notes
            ? '<' + noteTag + ' class="tips">' + rich(mod.notes) + '</' + noteTag + '>'
            : '';
        const category = keyOf(slug);
        const author = escapeAttr(mod.authors?.[0]?.name || '');
        const style = layout.previewStyle ? ' style="' + escapeAttr(layout.previewStyle) + '"' : '';
        const rows = [
            '<div class="mod-card" id="mod-' + mod.id + '" data-sort-author="' + author + '"' +
                (showCategory ? ' data-category="' + category + '"' : '') + '>'
        ];
        if (showCategory) rows.push(
            '<button type="button" class="mod-category-label" aria-pressed="false" ' +
            'aria-label="篩選 ' + category + ' 分類">' + category + '</button>'
        );
        rows.push(
            '<div class="preview-img"' + style + '>' + rich(mod.preview) + '</div>',
            '<div class="content">',
            '<h2 class="mod-header">' + rich(mod.title) + '</h2>',
            '<div class="author">' + rich(mod.byline) + '</div>',
            '<div class="details">'
        );
        for (const field of mod.fields)
            rows.push('<div class="info-row"><strong>' + field.label + '</strong>' +
                rich(field.value) + '</div>');
        rows.push('</div>');
        if (!layout.notesOutside && notes) rows.push(notes);
        rows.push('</div>');
        if (layout.notesOutside && notes) rows.push(notes);
        rows.push('</div>');
        const template = document.createElement('template');
        template.innerHTML = rows.join('');
        const card = template.content.firstElementChild;
        if (!card || !card.classList.contains('mod-card'))
            throw new Error('模組卡片建立失敗：' + mod.id);
        for (const image of card.querySelectorAll('img')) {
            image.loading = 'lazy';
            image.decoding = 'async';
        }
        for (const video of card.querySelectorAll('video')) video.preload = 'none';
        return card;
    }

    function renderCategory(data, slug, showCategory = false) {
        const fragment = document.createDocumentFragment();
        for (const mod of [...data.mods].sort((a, b) => a.order - b.order))
            fragment.appendChild(createCard(mod, slug, showCategory));
        return fragment;
    }

    async function loadMany(list, onProgress) {
        const selected = list || slugs;
        let done = 0;
        // 一次請求多個分類，瀏覽器 HTTP 快取與此 Map 都可重複使用結果。
        return Promise.all(selected.map(async slug => {
            const data = await loadCategory(slug);
            done++;
            if (typeof onProgress === 'function') onProgress(done, selected.length);
            return { slug, data };
        }));
    }

    async function mountCategory(container, slug) {
        if (!container || container.dataset.catalogStatus === 'ready') return;
        if (container.dataset.catalogStatus === 'loading') return;
        container.dataset.catalogStatus = 'loading';
        const loading = window.L1nGSkeleton?.start(container, 'cards', 6);
        try {
            const data = await loadCategory(slug);
            if (data.mods.length === 0) {
                if (loading) loading.empty('目前沒有模組');
                else container.textContent = '目前沒有模組';
            } else {
                const cards = renderCategory(data, slug);
                if (loading) loading.ready(cards);
                else container.replaceChildren(cards);
                window.L1nGModCardUI?.initialize(container);
                window.L1nGModSort?.bind(document.getElementById('mod-sort'), container);
            }
            container.dataset.catalogStatus = 'ready';
        } catch (error) {
            console.error('分類模組載入失敗', slug, error);
            if (loading) loading.fail('目前無法載入模組，請重新整理後再試。');
            else container.textContent = '目前無法載入模組，請重新整理後再試。';
            container.dataset.catalogStatus = 'error';
        }
    }

    window.L1nGModCatalog = Object.freeze({
        slugs, keyOf, loadCategory, loadMany, createCard, renderCategory, mountCategory
    });
    function initializePage() {
        const container = document.querySelector('.mod-list-page .mod-card-region[data-catalog-category]');
        if (!container) return;
        // 成人分類須先經原本的 enterPage() 驗證，不可提早取得 JSON。
        if (container.dataset.catalogCategory !== 'nsfw-mods')
            void mountCategory(container, container.dataset.catalogCategory);
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', initializePage, { once: true });
    else initializePage();
})();
