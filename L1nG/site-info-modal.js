/* ========【公開網站說明視窗】由各頁引用同一份 site-info.html ======== */
(() => {
    "use strict";
    const script = document.currentScript;
    if (!script) return;
    // RawGitHack serves source HTML directly, bypassing the Pages build-time
    // Cookie CSS/JS injection. Load the same shared assets for branch review.
    // Cookie consent itself blocks analytics and persistence on preview hosts.
    // 預覽支援分支網址與固定 Commit CDN 網址；只用於預覽，不開啟正式統計。
    const previewPath = /^\/ling051014\/Sims4-mods\/(?:mods-catalog-json-refactor-20261020|[0-9a-f]{40})\//i;
    const isBranchPreview = ["raw.githack.com", "rawcdn.githack.com"].includes(location.hostname)
        && previewPath.test(location.pathname);
    if (isBranchPreview && !document.querySelector('script[src*="/cookie-consent.js"]')) {
        const cookieStyle = document.createElement("link");
        cookieStyle.rel = "stylesheet";
        cookieStyle.href = new URL("cookie-consent.css?v=20261021-policy-scroll-r1", script.src).href;
        document.head.appendChild(cookieStyle);
        const cookieScript = document.createElement("script");
        cookieScript.src = new URL("cookie-consent.js?v=20261015-cookie-preferences-skeleton-r4", script.src).href;
        cookieScript.async = false;
        document.head.appendChild(cookieScript);
    }
    // Use the same source branch for all internal L1nG links in previews.
    if (isBranchPreview) {
        const previewRoot = new URL("./", script.src);
        const hosts = {
            "home.by-l1ng.com": "home.html",
            "translations.by-l1ng.com": "Translations/index.html",
            "realdate.by-l1ng.com": "RealDate/index.html",
            "genealogy-tool.by-l1ng.com": "GenealogyExporter/genealogy.html",
            "genealogy-exporter.by-l1ng.com": "GenealogyExporter/genealogy-exporter.html"
        };
        function remapPreviewLink(anchor) {
            if (!anchor?.href) return;
            let requested;
            try { requested = new URL(anchor.href); } catch (_) { return; }
            // Keep already-rewritten preview URLs unchanged.
            if (requested.hostname === location.hostname && previewPath.test(requested.pathname)) return;
            const local = hosts[requested.hostname];
            if (!local) return;
            let relative = local;
            const pathPart = requested.pathname.slice(1);
            if (requested.hostname === "home.by-l1ng.com" && pathPart === "site-info.html") {
                relative = "site-info.html";
            } else if (requested.hostname === "realdate.by-l1ng.com" && pathPart) {
                relative = "RealDate/" + pathPart;
            }
            const previewUrl = new URL(relative, previewRoot);
            previewUrl.hash = requested.hash;
            previewUrl.search = requested.search;
            anchor.href = previewUrl.href;
        }
        const remapAll = () => document.querySelectorAll("a[href]").forEach(remapPreviewLink);
        document.addEventListener("click", event => {
            const anchor = event.target.closest?.("a[href]");
            if (anchor) remapPreviewLink(anchor);
        }, true);
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", remapAll, {once:true});
        } else remapAll();
    }
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
            "zh-Hant": ["使用條款與免責聲明", "作品使用、分享、轉載與相關免責說明。"],
            "zh-Hans": ["使用条款与免责声明", "作品使用、分享、转载及相关免责声明。"],
            en: ["T.O.U.", "Terms of Use & Disclaimer."]
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
                input: token("--surface-panel") || token("--surface-input") || css.backgroundColor
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                             stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="9"></circle>
                            <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"></circle>
                            <path d="M12 11.5v5.5"></path>
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
            icon.className = "l1ng-site-info-heading-icon help-heading-icon";
            const heading = layer.querySelector(".l1ng-site-info-heading");
            heading.className = "help-heading-copy";
            const wrapper = document.createElement("div");
            wrapper.className = "help-heading";
            heading.before(wrapper);
            wrapper.append(icon, heading);
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
            // 族譜「關於」是簡介、版權、兩項可展開政策及 Cookie 設定；骨架對應正文。
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
        url.searchParams.set("v", "20261021-cookie-button-clean-r4");
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
        } else if (nativeGenealogy && section === "genealogy") {
            // 已載入的 iframe 再次開啟時，也同步當下主題。
            sendNativeTheme(modal);
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
        const section = target.dataset.siteInfoSection === "disclaimer" ? "terms" : target.dataset.siteInfoSection;
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
        if (event.data?.type === "l1ng-site-info-cookie-preferences") {
            // 先關閉「關於族譜工具」，再使用原有 Cookie 偏好視窗。
            close();
            window.L1nGCookiePreferences?.open();
            return;
        }
        if (event.data && event.data.type === "l1ng-site-info-close") close();
        if (event.data && event.data.type === "l1ng-site-info-size"
            && !(nativeGenealogy && dialog.dataset.siteInfoSection === "genealogy")) {
            setContentHeight(dialog, event.data.height);
        }
    });
})();
