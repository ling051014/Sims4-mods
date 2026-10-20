// 全分類通用：排序只移動現有卡片，不修改卡片資料或原分類。
(() => {
    const select = document.getElementById('mod-sort');
    const container = document.querySelector('.mod-container');
    if (!select || !container) return;
    const cards = [...container.children].filter(el => el.classList.contains('mod-card'));
    if (!cards.length) return;
    const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
    const records = cards.map((card, index) => ({
        card, index,
        author: (card.dataset.sortAuthor
            || card.querySelector('.author a')?.textContent
            || card.querySelector('.author')?.textContent.replace(/^\s*by\s*/i, '')
            || '').trim()
    }));
    const lastCard = cards[cards.length - 1];
    const boundary = lastCard.nextSibling;
    const isUnknown = s => !s || /^作者未標示$/.test(s);
    select.addEventListener('change', () => {
        const mode = select.value;
        const ordered = [...records].sort((a, b) => {
            if (mode === 'original') return a.index - b.index;
            const unknown = Number(isUnknown(a.author)) - Number(isUnknown(b.author));
            if (unknown) return unknown;
            const byAuthor = collator.compare(a.author, b.author);
            return (mode === 'author-desc' ? -byAuthor : byAuthor) || a.index - b.index;
        });
        const fragment = document.createDocumentFragment();
        for (const entry of ordered) fragment.appendChild(entry.card);
        container.insertBefore(fragment, boundary);
    });
})();
