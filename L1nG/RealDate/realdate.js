// ========【RealDate 啟動】 設定 - 標記 JavaScript 已啟用 ========
document.documentElement.classList.add("js");

// ========【RealDate 語言】 設定 - 語言保存與切換 ========
(() => {
    "use strict";

    const STORAGE_KEY = "l1ng-realdate-site-language";
    const DEFAULT_LANGUAGE = "zh-Hant";
    const SUPPORTED_LANGUAGES = new Set(["zh-Hant", "en"]);

    const root = document.documentElement;
    const buttons = Array.from(document.querySelectorAll("[data-language-button]"));

    function normalizeLanguage(language) {
        return SUPPORTED_LANGUAGES.has(language) ? language : DEFAULT_LANGUAGE;
    }

    function getInitialLanguage() {
        try {
            return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
        } catch (_) {
            return DEFAULT_LANGUAGE;
        }
    }

    function applyLanguage(language) {
        const nextLanguage = normalizeLanguage(language);

        root.dataset.language = nextLanguage;
        root.lang = nextLanguage;

        buttons.forEach((button) => {
            const active = button.dataset.languageButton === nextLanguage;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });

        try {
            localStorage.setItem(STORAGE_KEY, nextLanguage);
        } catch (_) {
            // 儲存不可用時，不影響目前頁面。
        }
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            applyLanguage(button.dataset.languageButton);
        });
    });

    applyLanguage(getInitialLanguage());
})();

// ========【RealDate 頂部導覽】 設定 - 滾動後增加層次 ========
const siteHeader = document.getElementById("siteHeader");

function updateHeaderState() {
    if (!siteHeader) return;

    siteHeader.classList.toggle("scrolled", window.scrollY > 8);
}

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });

// ========【RealDate 手機導覽】 設定 - 展開與關閉 ========
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

function closeMobileNav() {
    if (!navToggle || !mainNav) return;

    navToggle.classList.remove("active");
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "開啟導覽選單");
}

if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");

        navToggle.classList.toggle("active", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
        navToggle.setAttribute("aria-label", isOpen ? "關閉導覽選單" : "開啟導覽選單");
    });

    mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMobileNav);
    });

    document.addEventListener("click", (event) => {
        if (
            mainNav.classList.contains("open") &&
            !mainNav.contains(event.target) &&
            !navToggle.contains(event.target)
        ) {
            closeMobileNav();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 980) closeMobileNav();
    });
}

// ========【RealDate 進場動畫】 設定 - 進入畫面後顯示 ========
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
        (entries, revealObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            });
        },
        { threshold: 0.08 }
    );

    revealItems.forEach((item) => observer.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("visible"));
}

// ========【星座相容性連結】 從完整玩法進入時展開並定位對應說明 ========
(() => {
    const zodiac = document.getElementById("zodiac-compatibility");
    if (!zodiac) return;

    function revealZodiac() {
        if (window.location.hash !== "#zodiac-compatibility") return;
        zodiac.open = true;
        window.requestAnimationFrame(() => zodiac.scrollIntoView({ block: "start" }));
    }

    window.addEventListener("hashchange", revealZodiac);
    window.addEventListener("load", revealZodiac, { once: true });
    revealZodiac();
})();

// ========【章節快速導覽】 追蹤所在章節、切換與返回頁首 ========
(() => {
    "use strict";
    const quickNav = document.querySelector("[data-doc-quick-nav]");
    if (!quickNav) return;
    const summary = quickNav.querySelector("summary");
    const links = Array.from(quickNav.querySelectorAll(".doc-quick-links a"));
    const sections = links.map((link) => document.getElementById(link.hash.slice(1)));
    const position = quickNav.querySelector("[data-doc-position]");
    const topButton = quickNav.querySelector("[data-doc-to-top]");
    let frameScheduled = false;

    function updateCurrentSection() {
        frameScheduled = false;
        const headerHeight = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
        const threshold = headerHeight + 72;
        let current = 0;
        sections.forEach((section, index) => {
            if (section && section.getBoundingClientRect().top <= threshold) current = index;
        });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            current = sections.length - 1;
        }
        links.forEach((link, index) => {
            if (index === current) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
        });
        if (position) {
            position.textContent = String(current + 1).padStart(2, "0") + " / " +
                String(links.length).padStart(2, "0");
        }
    }

    function scheduleUpdate() {
        if (frameScheduled) return;
        frameScheduled = true;
        window.requestAnimationFrame(updateCurrentSection);
    }

    links.forEach((link) => {
        link.addEventListener("click", () => {
            quickNav.open = false;
            scheduleUpdate();
        });
    });

    if (topButton) {
        topButton.addEventListener("click", () => {
            quickNav.open = false;
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

    document.addEventListener("click", (event) => {
        if (quickNav.open && !quickNav.contains(event.target)) quickNav.open = false;
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && quickNav.open) {
            quickNav.open = false;
            summary.focus();
        }
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("hashchange", scheduleUpdate);
    updateCurrentSection();
})();
