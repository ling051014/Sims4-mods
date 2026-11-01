/* ========【跨站語言偏好】瀏覽器語言、手動選擇與分支預覽 ======== */
(() => {
    "use strict";

    const COOKIE_KEY = "l1ng_language";
    const PREVIEW_STORAGE_KEY = "l1ng_preview_language_v1";
    const DEFAULT_LANGUAGE = "zh-Hant";
    const SUPPORTED = ["zh-Hant", "zh-Hans", "en"];
    const hostname = location.hostname.toLowerCase();
    const isPreview = ["raw.githack.com", "rawcdn.githack.com"].includes(hostname)
        && /^\/ling051014\/Sims4-mods\/(?:genealogy-structural-optimization-20260926|[0-9a-f]{40})\//i.test(location.pathname);
    const isOfficial = hostname === "by-l1ng.com" || hostname.endsWith(".by-l1ng.com");

    function normalize(value) {
        if (!value) return null;
        const lang = String(value).trim().replace(/_/g, "-").toLowerCase();
        if (lang === "en" || lang.startsWith("en-")) return "en";
        if (lang === "zh-hans" || lang.startsWith("zh-hans-")
            || /^zh-(cn|sg)(-|$)/.test(lang)) return "zh-Hans";
        if (lang === "zh" || lang === "zh-hant" || lang.startsWith("zh-hant-")
            || /^zh-(tw|hk|mo)(-|$)/.test(lang)) return "zh-Hant";
        return null;
    }

    function previewOverride() {
        if (!isPreview) return null;
        return normalize(new URLSearchParams(location.search).get("l1ng_test_lang"));
    }

    function sharedPreference() {
        if (isOfficial) {
            const match = document.cookie.split("; ").find(part => part.startsWith(COOKIE_KEY + "="));
            if (match) {
                try { return normalize(decodeURIComponent(match.slice(COOKIE_KEY.length + 1))); }
                catch (_) { return null; }
            }
            return null;
        }
        if (isPreview) {
            try { return normalize(localStorage.getItem(PREVIEW_STORAGE_KEY)); }
            catch (_) { return null; }
        }
        return null;
    }

    function legacyPreference(key) {
        if (!key) return null;
        try { return normalize(localStorage.getItem(key)); }
        catch (_) { return null; }
    }

    function browserLanguage(allowed) {
        const preferred = Array.isArray(navigator.languages) && navigator.languages.length
            ? navigator.languages : [navigator.language || ""];
        for (const name of preferred) {
            const code = normalize(name);
            if (code && allowed.includes(code)) return code;
        }
        return DEFAULT_LANGUAGE;
    }

    function resolve(supported, legacyKey) {
        const allowed = SUPPORTED.filter(lang => supported.includes(lang));
        if (!allowed.includes(DEFAULT_LANGUAGE)) allowed.push(DEFAULT_LANGUAGE);
        const explicit = previewOverride() || sharedPreference() || legacyPreference(legacyKey);
        if (explicit) return allowed.includes(explicit) ? explicit : DEFAULT_LANGUAGE;
        return browserLanguage(allowed);
    }

    function remember(value) {
        const language = normalize(value);
        if (!language || previewOverride()) return;
        if (isOfficial) {
            document.cookie = COOKIE_KEY + "=" + encodeURIComponent(language)
                + "; Domain=by-l1ng.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure";
        } else if (isPreview) {
            try { localStorage.setItem(PREVIEW_STORAGE_KEY, language); }
            catch (_) { /* 預覽儲存不可用時，只影響跨頁記憶。 */ }
        }
    }

    function redirectHome() {
        const file = location.pathname.split("/").pop();
        const isHomeRoot = (location.pathname === "/" || file === "index.html") &&
            hostname === "home.by-l1ng.com";
        if (!isHomeRoot && file !== "home.html" && file !== "home-en.html") return;
        const desired = resolve(["zh-Hant", "en"]) === "en" ? "home-en.html" : "home.html";
        if ((isHomeRoot && desired === "home-en.html") ||
            (!isHomeRoot && file !== desired)) {
            const destination = new URL(desired, location.href);
            destination.search = location.search;
            destination.hash = location.hash;
            location.replace(destination.href);
        }
    }

    window.L1nGLanguage = Object.freeze({
        normalize, resolve, remember,
        previewOverride,
        isPreview
    });

    if (document.currentScript?.hasAttribute("data-l1ng-home")) {
        redirectHome();
        document.addEventListener("DOMContentLoaded", () => {
            document.querySelectorAll(".language-switch a[lang]").forEach(link => {
                link.addEventListener("click", () => remember(link.getAttribute("lang")));
            });
        }, { once: true });
    }
})();
