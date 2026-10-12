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
    const nativeGenealogy = !!document.querySelector("#topbarMoreMenu") && !!document.querySelector("#helpDialog .help-header");
    let activeUrl = null;
    const language = () => {
        // 族譜工具採用獨立的多語系控制器，html.lang 不一定會跟著更新。
        const selected = window.LING_I18N?.language
            || document.getElementById("languageSelect")?.value
            || document.documentElement.dataset.language
            || document.documentElement.lang
            || "zh-Hant";
        if (["zh-Hant", "zh-Hans", "en"].includes(selected)) return selected;
        return selected.toLowerCase().startsWith("en") ? "en" : "zh-Hant";
    };
    function setContentHeight(layer, value) {
        const viewportLimit = Math.max(110, Math.min(570, window.innerHeight - (nativeGenealogy ? 140 : 155)));
        const height = Math.max(110, Math.min(Math.ceil(Number(value) || 220), viewportLimit));
        const content = layer.querySelector(".l1ng-site-info-content");
        if (content) content.style.height = height + "px";
    }
    function sendNativeTheme(layer) {
        if (!nativeGenealogy || !activeUrl) return;
        const panel = layer.querySelector(".l1ng-site-info-native-panel");
        const css = getComputedStyle(panel);
        // 主題 Token 定義在 body[data-theme]，不能讀 :root 的預設晴空藍。
        const currentTheme = getComputedStyle(document.body);
        const token = key => currentTheme.getPropertyValue(key).trim();
        layer.querySelector("iframe")?.contentWindow?.postMessage({
            type: "l1ng-site-info-theme",
            colors: {
                background: css.backgroundColor,
                text: token("--text-primary") || css.color,
                secondary: token("--text-secondary") || css.color,
                border: token("--border-default") || "#e3e8ed",
                accent: token("--action-primary") || "#438cbe",
                input: token("--surface-input") || css.backgroundColor
            }
        }, activeUrl.origin);
    }
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
                <div class="l1ng-site-info-content is-loading" aria-busy="true">
                    <div class="l1ng-site-info-loading" aria-hidden="true">
                        <div class="l1ng-site-info-skeleton">
                            <span class="l1ng-site-info-skeleton-line skeleton-heading"></span>
                            <span class="l1ng-site-info-skeleton-line skeleton-text"></span>
                            <span class="l1ng-site-info-skeleton-line skeleton-text"></span>
                            <span class="l1ng-site-info-skeleton-line skeleton-text-short"></span>
                            <span class="l1ng-site-info-skeleton-line skeleton-heading"></span>
                            <span class="l1ng-site-info-skeleton-line skeleton-text"></span>
                            <span class="l1ng-site-info-skeleton-line skeleton-text-medium"></span>
                            <span class="l1ng-site-info-skeleton-line skeleton-text"></span>
                            <span class="l1ng-site-info-skeleton-line skeleton-text-short"></span>
                        </div>
                    </div>
                    <iframe class="l1ng-site-info-frame" title="網站說明內容"></iframe>
                </div>
            </section>`;
        if (nativeGenealogy) {
            // 直接採用族譜工具原有的外框、標題列與關閉控制。
            layer.className = "ui-dialog-backdrop show l1ng-site-info-native";
            const panel = layer.querySelector(".l1ng-site-info-panel");
            panel.className = "ui-dialog-panel storage-modal l1ng-site-info-native-panel";
            layer.querySelector(".l1ng-site-info-header").className = "help-header storage-header";
            const icon = layer.querySelector(".l1ng-site-info-heading-icon");
            icon.outerHTML = '<span class="l1ng-icon icon-info-circle help-heading-icon" aria-hidden="true"></span>';
            const heading = layer.querySelector(".l1ng-site-info-heading");
            heading.className = "help-heading-copy";
            const wrapper = document.createElement("div");
            wrapper.className = "help-heading";
            heading.before(wrapper);
            wrapper.append(layer.querySelector(".help-heading-icon"), heading);
            const button = layer.querySelector(".l1ng-site-info-close");
            button.className = "help-close-btn l1ng-site-info-close";
            button.innerHTML = '<span class="l1ng-icon icon-x-lg" aria-hidden="true"></span>';
            layer.querySelector(".l1ng-site-info-content").classList.add("storage-scroll-body");
        }
        layer.querySelector(".l1ng-site-info-close").addEventListener("click", close);
        layer.addEventListener("click", event => {
            if (event.target === layer) close();
        });
        layer.querySelector(".l1ng-site-info-frame").addEventListener("load", () => {
            if (dialog !== layer || !layer.isConnected) return;
            if (nativeGenealogy) sendNativeTheme(layer);
            layer.querySelector(".l1ng-site-info-loading").hidden = true;
            const content = layer.querySelector(".l1ng-site-info-content");
            content.classList.remove("is-loading");
            content.setAttribute("aria-busy", "false");
        });
        dialog = layer;
        return layer;
    }
    function open(section, trigger) {
        if (!sections.has(section)) return;
        const modal = createDialog();
        modal.dataset.siteInfoSection = section;
        const skeleton = modal.querySelector(".l1ng-site-info-skeleton");
        if (skeleton && skeleton.dataset.section !== section) {
            skeleton.dataset.section = section;
            // 族譜「關於」是簡介、版權／聲明、兩項可展開條款；骨架順序與正文一致。
            const rows = section === "genealogy"
                ? ["skeleton-text", "skeleton-text-medium", "skeleton-text-short",
                    "skeleton-heading", "skeleton-text", "skeleton-text-medium",
                    "skeleton-heading", "skeleton-heading"]
                : ["skeleton-heading", "skeleton-text", "skeleton-text",
                    "skeleton-text-short", "skeleton-heading", "skeleton-text",
                    "skeleton-text-medium", "skeleton-text", "skeleton-text-short"];
            skeleton.replaceChildren(...rows.map(name => {
                const line = document.createElement("span");
                line.className = "l1ng-site-info-skeleton-line " + name;
                return line;
            }));
        }
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
        url.searchParams.set("lang", language());
        url.searchParams.set("parent", location.origin);
        url.searchParams.set("v", "20261012-genealogy-fixed-scroll-r2");
        const frame = modal.querySelector(".l1ng-site-info-frame");
        activeUrl = url;
        // 族譜「關於」的外框尺寸固定；只有其他政策視窗維持依內容調整高度。
        const content = modal.querySelector(".l1ng-site-info-content");
        if (nativeGenealogy && section === "genealogy") {
            content.style.removeProperty("height");
        }
        if (frame.src !== url.href) {
            if (!(nativeGenealogy && section === "genealogy")) {
                setContentHeight(modal, section === "terms" ? 450 : 520);
            }
            content.classList.add("is-loading");
            content.setAttribute("aria-busy", "true");
            modal.querySelector(".l1ng-site-info-loading").hidden = false;
            frame.src = url.href;
        }
        modal.querySelector(".l1ng-site-info-panel").focus({ preventScroll: true });
    }
    function close() {
        if (!dialog || !dialog.isConnected) return;
        dialog.remove();
        activeUrl = null;
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
        if (!activeUrl || event.origin !== activeUrl.origin) return;
        if (event.data && event.data.type === "l1ng-site-info-close") close();
        if (event.data && event.data.type === "l1ng-site-info-size"
            && !(nativeGenealogy && dialog.dataset.siteInfoSection === "genealogy")) {
            setContentHeight(dialog, event.data.height);
        }
    });
})();
