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
        // 同步 DOM 真實顯示狀態，不依賴網站樣式表是否載入或快取。
        for (const element of document.querySelectorAll("[data-lang], [data-site-language]")) {
            const selected = (element.getAttribute("data-lang") || element.getAttribute("data-site-language")) === current;
            element.hidden = !selected;
            element.style.display = selected ? (element.tagName === "DIV" ? "block" : "inline") : "none";
        }
        document.title = {
            "zh-Hant": "使用、隱私與 Cookie 說明 · L1nG",
            "zh-Hans": "使用、隐私与 Cookie 说明 · L1nG",
            "en": "Site Policies & Information · L1nG"
        }[current];
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
    if (isEmbedded) {
        // 嵌入視窗只呈現指定條款，避免樣式表未載入時顯示整份政策。
        const chosen = params.get("section");
        for (const section of document.querySelectorAll(".policy-section")) {
            const selected = section.id === chosen;
            section.hidden = !selected;
            section.style.display = selected ? "block" : "none";
        }
        for (const element of document.querySelectorAll(
            ".policy-header, .l1ng-document-footer, .policy-eyebrow, .policy-content > h1, .policy-intro"
        )) {
            element.hidden = true;
            element.style.display = "none";
        }
    }
    document.addEventListener("click", event => {
        const button = event.target.closest?.("[data-site-language-button]");
        if (button) applyLanguage(button.dataset.siteLanguageButton, true);
    });
})();
