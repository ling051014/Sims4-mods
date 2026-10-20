// 共用作者排序：分類頁和首頁全模組共用同一段邏輯。
(() => {
    const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
    const unknown = name => !name || name === '作者未標示';

    function bind(select, container) {
        if (!select || !container) return null;
        const cards = [...container.children].filter(card => card.classList.contains('mod-card'));
        if (!cards.length) return null;
        const records = cards.map((card, index) => ({
            card, index,
            author: (card.dataset.sortAuthor
                || card.querySelector('.author a')?.textContent
                || card.querySelector('.author')?.textContent.replace(/^\s*by\s*/i, '')
                || '').trim()
        }));
        const boundary = cards[cards.length - 1].nextSibling;
        function sort() {
            const mode = select.value;
            const ordered = [...records].sort((a, b) => {
                if (mode === 'original') return a.index - b.index;
                const missing = Number(unknown(a.author)) - Number(unknown(b.author));
                if (missing) return missing;
                const compared = collator.compare(a.author, b.author);
                return (mode === 'author-desc' ? -compared : compared) || a.index - b.index;
            });
            const fragment = document.createDocumentFragment();
            for (const entry of ordered) fragment.appendChild(entry.card);
            container.insertBefore(fragment, boundary);
        }
        select.addEventListener('change', sort);
        return { sort, cards };
    }
    window.L1nGModSort = { bind };
    bind(document.getElementById('mod-sort'), document.querySelector('.mod-container'));
})();
