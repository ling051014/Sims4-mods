/* ========【網站說明多語系】獨立頁可切換，嵌入時繼承來源網站語言 ======== */
(() => {
    "use strict";
    const root = document.documentElement;
    const allowed = new Set(["zh-Hant", "zh-Hans", "en"]);
    const params = new URLSearchParams(location.search);
    const isEmbedded = params.get("embed") === "1" && ["privacy", "terms", "genealogy"].includes(params.get("section"));
    const normalize = value => allowed.has(value) ? value : "zh-Hant";
    const saved = () => {
        try { return localStorage.getItem("l1ng-site-info-language"); }
        catch (_) { return null; }
    };
    function applyLanguage(lang, remember = false) {
        const current = normalize(lang);
        root.dataset.language = current;
        root.lang = current;
        for (const button of document.querySelectorAll("[data-site-language-button]")) {
            const active = button.dataset.siteLanguageButton === current;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        }
        if (remember && !isEmbedded) {
            try { localStorage.setItem("l1ng-site-info-language", current); }
            catch (_) { /* 不影響切換 */ }
        }
    }
    const initial = normalize(params.get("lang") || (!isEmbedded && saved()) || "zh-Hant");
    applyLanguage(initial);
    document.addEventListener("click", event => {
        const button = event.target.closest?.("[data-site-language-button]");
        if (button) applyLanguage(button.dataset.siteLanguageButton, true);
    });
})();
