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
        if (chosen === "genealogy") {
            // 族譜工具沒有網站頁腳：把同一份版權聲明及完整政策搬進「關於」視窗。
            // 不複製免責內容，修改共用說明頁即可同步更新。
            const genealogy = document.getElementById("genealogy");
            const legal = document.querySelector(".l1ng-footer-legal");
            if (genealogy && legal) {
                legal.classList.add("policy-embedded-legal");
                legal.querySelector(".l1ng-footer-policy-links")?.remove();
                genealogy.appendChild(legal);
                for (const id of ["terms", "privacy"]) {
                    const section = document.getElementById(id);
                    const heading = section?.querySelector("h2");
                    if (!section || !heading) continue;
                    const details = document.createElement("details");
                    details.className = "policy-embedded-details";
                    const summary = document.createElement("summary");
                    for (const node of heading.childNodes) {
                        summary.appendChild(node.cloneNode(true));
                    }
                    details.append(summary, section);
                    genealogy.appendChild(details);
                    // 內容仍由同一份條款及翻譯供應，開合僅影響閱讀方式。
                    section.hidden = false;
                    section.style.display = "block";
                }
            }
        }
    }
    // 族譜嵌入頁自有捲動容器與細滑塊，不使用 iOS／瀏覽器原生卷軸。
    if (isEmbedded && params.get("section") === "genealogy") {
        const scroller = document.body;
        const track = document.createElement("div");
        track.className = "policy-scroll-track";
        track.setAttribute("aria-hidden", "true");
        const thumb = document.createElement("div");
        thumb.className = "policy-scroll-thumb";
        track.appendChild(thumb);
        scroller.appendChild(track);
        let maxTop = 0;
        let maxMove = 0;
        const refreshScroll = () => {
            const height = scroller.clientHeight;
            const total = scroller.scrollHeight;
            const overflow = Math.max(0, total - height);
            track.hidden = overflow <= 1;
            if (track.hidden) return;
            const trackHeight = track.clientHeight;
            const thumbHeight = Math.min(trackHeight, Math.max(28, trackHeight * height / total));
            maxTop = overflow;
            maxMove = trackHeight - thumbHeight;
            thumb.style.height = thumbHeight + "px";
            thumb.style.transform = "translateY(" + (overflow ? scroller.scrollTop / overflow * maxMove : 0) + "px)";
        };
        scroller.addEventListener("scroll", refreshScroll, { passive: true });
        window.addEventListener("resize", refreshScroll);
        if ("ResizeObserver" in window) {
            new ResizeObserver(refreshScroll).observe(document.querySelector(".policy-content"));
        }
        document.querySelectorAll(".policy-embedded-details").forEach(details => {
            details.addEventListener("toggle", refreshScroll);
        });
        let dragging = false;
        let pointerStartY = 0;
        let startTop = 0;
        track.addEventListener("pointerdown", event => {
            if (track.hidden || event.button !== 0) return;
            dragging = true;
            pointerStartY = event.clientY;
            startTop = scroller.scrollTop;
            if (event.target === track) {
                const rect = track.getBoundingClientRect();
                const target = Math.max(0, Math.min(maxMove, event.clientY - rect.top - thumb.offsetHeight / 2));
                scroller.scrollTop = maxMove ? target / maxMove * maxTop : 0;
                startTop = scroller.scrollTop;
            }
            track.setPointerCapture(event.pointerId);
            event.preventDefault();
        });
        track.addEventListener("pointermove", event => {
            if (!dragging) return;
            scroller.scrollTop = startTop + (maxMove ? (event.clientY - pointerStartY) / maxMove * maxTop : 0);
        });
        const finishDrag = () => { dragging = false; };
        track.addEventListener("pointerup", finishDrag);
        track.addEventListener("pointercancel", finishDrag);
        requestAnimationFrame(refreshScroll);
        document.fonts?.ready?.then(refreshScroll);
    }
    if (isEmbedded && window.parent !== window) {
        const parentOrigin = params.get("parent") || "*";
        const content = document.querySelector(".policy-content");
        let reportedHeight = 0;
        const reportHeight = () => {
            if (!content) return;
            const height = Math.ceil(content.getBoundingClientRect().height);
            if (height === reportedHeight) return;
            reportedHeight = height;
            window.parent.postMessage({ type: "l1ng-site-info-size", height }, parentOrigin);
        };
        requestAnimationFrame(reportHeight);
        if ("ResizeObserver" in window && content) new ResizeObserver(reportHeight).observe(content);
        document.fonts?.ready?.then(reportHeight);
        window.addEventListener("resize", reportHeight);
        window.addEventListener("message", event => {
            if (params.get("section") !== "genealogy"
                || event.source !== window.parent || event.origin !== parentOrigin
                || event.data?.type !== "l1ng-site-info-theme") return;
            const colors = event.data.colors || {};
            const vars = {
                background: "--site-info-bg",
                text: "--site-info-text",
                secondary: "--site-info-secondary",
                border: "--site-info-border",
                accent: "--site-info-accent",
                input: "--site-info-input"
            };
            for (const [key, cssVar] of Object.entries(vars)) {
                const value = colors[key];
                if (typeof value === "string" && CSS.supports("color", value)) {
                    root.style.setProperty(cssVar, value);
                }
            }
        });
    }
    document.addEventListener("click", event => {
        const button = event.target.closest?.("[data-site-language-button]");
        if (button) applyLanguage(button.dataset.siteLanguageButton, true);
    });
})();
