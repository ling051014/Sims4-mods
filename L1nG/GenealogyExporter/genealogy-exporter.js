// ========【Genealogy Exporter 網頁】 設定 - 語言切換、行動版導覽與內容進場 ========

(() => {
    const root = document.documentElement;
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const languageButtons = [...document.querySelectorAll('[data-language-button]')];
    const LANGUAGE_KEY = 'l1ng-genealogy-exporter-language';
    const commandButtons = [...document.querySelectorAll('[data-copy-command]')];
    const commandFeedbackTimers = new WeakMap();

    // 點擊原本的指令框即可複製；本機開啟單檔時也提供備援方式。
    async function copyCommandText(text) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (_) {
                // 部分瀏覽器或本機預覽可能沒有剪貼簿權限。
            }
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        let copied = false;
        try { copied = document.execCommand('copy'); } catch (_) {}
        textarea.remove();
        return copied;
    }

    function setCommandFeedback(button, result = '') {
        const english = root.dataset.language === 'en';
        const feedback = button.querySelector('.command-copy-feedback');
        if (feedback) feedback.textContent = result === 'success'
            ? (english ? 'Copied!' : '已複製！')
            : result === 'error'
                ? (english ? 'Copy failed; please copy manually.' : '複製失敗，請手動複製。')
                : '';
        button.setAttribute('aria-label',
            (english ? 'Copy command: ' : '複製指令：') + button.dataset.copyCommand);
        button.title = result === 'success'
            ? (english ? 'Copied!' : '已複製！')
            : result === 'error'
                ? (english ? 'Copy failed' : '複製失敗')
                : (english ? 'Click to copy' : '點擊複製指令');
    }

    commandButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const value = button.dataset.copyCommand || '';
            if (!value) return;
            const copied = await copyCommandText(value);
            const previous = commandFeedbackTimers.get(button);
            if (previous) clearTimeout(previous);
            const glyph = button.querySelector('.l1ng-copy-glyph');
            if (glyph) glyph.classList.remove('l1ng-copy-running');
            setCommandFeedback(button, copied ? 'success' : 'error');
            if (copied && glyph) {
                // 沿著 SVG 筆劃重播；快速連點時從第一筆重新開始。
                void glyph.getBoundingClientRect();
                glyph.classList.add('l1ng-copy-running');
            }
            commandFeedbackTimers.set(button, setTimeout(() => {
                if (glyph) glyph.classList.remove('l1ng-copy-running');
                setCommandFeedback(button);
            }, copied ? 3900 : 1900));
        });
    });


    function setLanguage(language) {
        const next = language === 'en' ? 'en' : 'zh-Hant';
        root.dataset.language = next;
        root.lang = next === 'en' ? 'en' : 'zh-Hant';
        document.title = next === 'en'
            ? 'Genealogy Exporter · L1nG'
            : '族譜提取器 · L1nG';

        languageButtons.forEach(button => {
            const active = button.dataset.languageButton === next;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        commandButtons.forEach(button => {
            const previous = commandFeedbackTimers.get(button);
            if (previous) clearTimeout(previous);
            setCommandFeedback(button);
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
