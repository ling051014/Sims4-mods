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

// ========【RealDate 更多選單】 設定 - 點擊外部自動收合 ========
const moreMenus = document.querySelectorAll(".nav-more");

document.addEventListener("click", (event) => {
    moreMenus.forEach((menu) => {
        if (menu.open && !menu.contains(event.target)) {
            menu.open = false;
        }
    });
});

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
