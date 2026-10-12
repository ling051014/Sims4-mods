/* ========【公開網站說明視窗】由各頁引用同一份 site-info.html ======== */
(() => {
    "use strict";
    const script = document.currentScript;
    if (!script) return;
    const sections = new Set(["privacy", "terms", "genealogy"]);
    const baseUrl = new URL("site-info.html", script.src);
    // 公開的獨立子網域一律引用首頁域名；分支預覽與本地路徑則沿用相對路徑。
    if (location.hostname.endsWith(".by-l1ng.com") && location.hostname !== "home.by-l1ng.com") {
        baseUrl.href = "https://home.by-l1ng.com/site-info.html";
    }
    const labels = {
        privacy: {
            "zh-Hant": ["隱私權與 Cookie", "了解本站如何使用分析工具及處理資料。"],
            "zh-Hans": ["隐私权与 Cookie", "了解本站如何使用分析工具及处理数据。"],
            en: ["Privacy & Cookies", "How this site uses analytics and handles data."]
        },
        terms: {
            "zh-Hant": ["使用與免責聲明", "閱讀模組、漢化與第三方服務的使用說明。"],
            "zh-Hans": ["使用与免责声明", "阅读模组、翻译与第三方服务的使用说明。"],
            en: ["Terms & Disclaimer", "Usage notes for mods, translations and third-party services."]
        },
        genealogy: {
            "zh-Hant": ["關於族譜工具", "查看族譜資料、備份與使用注意事項。"],
            "zh-Hans": ["关于族谱工具", "查看族谱数据、备份与使用注意事项。"],
            en: ["About Genealogy", "Genealogy data, backups and usage notes."]
        }
    };
    let dialog = null;
    let opener = null;
    let previousOverflow = "";
    let requestNumber = 0;
    const language = () => {
        const selected = document.documentElement.dataset.language || document.documentElement.lang || "zh-Hant";
        return ["zh-Hant", "zh-Hans", "en"].includes(selected) ? selected : "zh-Hant";
    };
    function createDialog() {
        if (dialog) return dialog;
        const layer = document.createElement("div");
        layer.className = "l1ng-site-info-backdrop";
        layer.innerHTML = `
            <section class="l1ng-site-info-panel" role="dialog" aria-modal="true"
                     aria-labelledby="l1ngInfoTitle" aria-describedby="l1ngInfoSubtitle" tabindex="-1">
                <header class="l1ng-site-info-header">
                    <span class="l1ng-site-info-heading-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <circle cx="12" cy="12" r="9"></circle><path d="M12 11v6M12 7h.01"></path>
                        </svg>
                    </span>
                    <div class="l1ng-site-info-heading">
                        <h2 id="l1ngInfoTitle"></h2>
                        <p id="l1ngInfoSubtitle"></p>
                    </div>
                    <button class="l1ng-site-info-close" type="button" aria-label="關閉說明視窗" title="關閉">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                             stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"></path></svg>
                    </button>
                </header>
                <div class="l1ng-site-info-content">
                    <p class="l1ng-site-info-loading" role="status">正在載入說明…</p>
                    <iframe class="l1ng-site-info-frame" title="網站說明內容"></iframe>
                </div>
            </section>`;
        layer.querySelector(".l1ng-site-info-close").addEventListener("click", close);
        layer.addEventListener("click", event => {
            if (event.target === layer) close();
        });
        layer.querySelector(".l1ng-site-info-frame").addEventListener("load", () => {
            if (dialog !== layer) return;
            layer.querySelector(".l1ng-site-info-loading").hidden = true;
        });
        dialog = layer;
        return layer;
    }
    function open(section, trigger) {
        if (!sections.has(section)) return;
        const modal = createDialog();
        if (!modal.isConnected) {
            opener = trigger || document.activeElement;
            previousOverflow = document.body.style.overflow;
            document.body.appendChild(modal);
            document.body.style.overflow = "hidden";
        }
        const words = labels[section][language()];
        modal.querySelector("#l1ngInfoTitle").textContent = words[0];
        modal.querySelector("#l1ngInfoSubtitle").textContent = words[1];
        modal.querySelector(".l1ng-site-info-close").setAttribute("aria-label",
            language() === "en" ? "Close information dialog" : "關閉說明視窗");
        const url = new URL(baseUrl.href);
        url.searchParams.set("embed", "1");
        url.searchParams.set("section", section);
        const frame = modal.querySelector(".l1ng-site-info-frame");
        if (frame.src !== url.href) {
            modal.querySelector(".l1ng-site-info-loading").hidden = false;
            frame.src = url.href;
        }
        requestNumber++;
        modal.querySelector(".l1ng-site-info-panel").focus({ preventScroll: true });
    }
    function close() {
        if (!dialog || !dialog.isConnected) return;
        dialog.remove();
        document.body.style.overflow = previousOverflow;
        const target = opener;
        opener = null;
        if (target && target.isConnected && typeof target.focus === "function") target.focus({ preventScroll: true });
    }
    document.addEventListener("click", event => {
        const target = event.target.closest && event.target.closest("a[data-site-info-section]");
        if (!target || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const section = target.dataset.siteInfoSection;
        if (!sections.has(section)) return;
        event.preventDefault();
        open(section, target);
    });
    document.addEventListener("keydown", event => {
        if (!dialog || !dialog.isConnected) return;
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopImmediatePropagation();
            close();
        } else if (event.key === "Tab" && document.activeElement === dialog.querySelector(".l1ng-site-info-close") && !event.shiftKey) {
            // 鍵盤可繼續進入 iframe，而不會跳到背景頁面的控制項。
            event.preventDefault();
            dialog.querySelector(".l1ng-site-info-frame").focus();
        } else if (event.key === "Tab" && document.activeElement === dialog.querySelector(".l1ng-site-info-frame") && event.shiftKey) {
            event.preventDefault();
            dialog.querySelector(".l1ng-site-info-close").focus();
        }
    }, true);
    window.addEventListener("message", event => {
        if (!dialog || !dialog.isConnected || event.source !== dialog.querySelector("iframe").contentWindow) return;
        if (event.data && event.data.type === "l1ng-site-info-close") close();
    });
})();
