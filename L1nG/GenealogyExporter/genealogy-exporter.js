// ========【Genealogy Exporter 網頁】 設定 - 語言切換、行動版導覽與內容進場 ========

(() => {
    const root = document.documentElement;
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const languageButtons = [...document.querySelectorAll('[data-language-button]')];
    const LANGUAGE_KEY = 'l1ng-genealogy-exporter-language';

    function setLanguage(language) {
        const next = language === 'en' ? 'en' : 'zh-Hant';
        root.dataset.language = next;
        root.lang = next === 'en' ? 'en' : 'zh-Hant';

        languageButtons.forEach(button => {
            const active = button.dataset.languageButton === next;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        try {
            localStorage.setItem(LANGUAGE_KEY, next);
        } catch (error) {
            // localStorage 不可用時仍可正常使用目前頁面。
        }
    }

    function initialLanguage() {
        try {
            const saved = localStorage.getItem(LANGUAGE_KEY);
            if (saved === 'en' || saved === 'zh-Hant') return saved;
        } catch (error) {
            // 忽略儲存空間錯誤。
        }
        return 'zh-Hant';
    }

    languageButtons.forEach(button => {
        button.addEventListener('click', () => setLanguage(button.dataset.languageButton));
    });

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            const open = mainNav.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        mainNav.addEventListener('click', event => {
            if (!event.target.closest('a')) return;
            mainNav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });

        document.addEventListener('click', event => {
            if (!mainNav.classList.contains('open')) return;
            if (mainNav.contains(event.target) || navToggle.contains(event.target)) return;
            mainNav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    }

    const revealItems = [...document.querySelectorAll('.reveal')];
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08 });

        revealItems.forEach(item => observer.observe(item));
    } else {
        revealItems.forEach(item => item.classList.add('is-visible'));
    }

    setLanguage(initialLanguage());
})();
