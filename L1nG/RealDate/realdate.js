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

// ========【RealDate 常見問題】 展開 / 收合高度與內容淡入淡出動畫 ========
(() => {
    "use strict";

    const questions = document.querySelectorAll(".faq-list > details.faq-item");
    if (!questions.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const duration = 260;

    questions.forEach((details) => {
        const summary = details.querySelector(":scope > summary");
        if (!summary) return;

        const originalOverflow = details.style.overflow;
        let desiredOpen = details.open;
        let running = null;

        summary.addEventListener("click", (event) => {
            // 保留原生 details 的鍵盤操作、無動畫環境與減少動態效果。
            if (reducedMotion.matches || typeof details.animate !== "function") {
                if (running) {
                    running.height.cancel();
                    running.fades.forEach((fade) => fade.cancel());
                    running = null;
                    details.style.overflow = originalOverflow;
                }
                details.classList.remove("is-closing");
                return;
            }

            event.preventDefault();
            const startHeight = details.getBoundingClientRect().height;
            const reversing = !!running;
            const priorOpacity = new Map();
            if (running) {
                Array.from(details.children).forEach((child) => {
                    if (child !== summary) priorOpacity.set(child, parseFloat(getComputedStyle(child).opacity));
                });
                running.height.onfinish = null;
                running.height.cancel();
                running.fades.forEach((fade) => fade.cancel());
                running = null;
            }

            desiredOpen = !desiredOpen;
            // 箭頭立即更新方向，不必等待收合動畫結束。
            details.classList.toggle("is-closing", !desiredOpen);
            // 收合期間保持 open，內容才不會在動畫完成前消失。
            details.open = true;
            const expandedHeight = details.getBoundingClientRect().height;
            const computed = getComputedStyle(details);
            const collapsedHeight = summary.getBoundingClientRect().height
                + parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth)
                + parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
            const targetHeight = desiredOpen ? expandedHeight : collapsedHeight;

            if (Math.abs(targetHeight - startHeight) < 1) {
                details.open = desiredOpen;
                details.classList.remove("is-closing");
                details.style.overflow = originalOverflow;
                return;
            }

            details.style.overflow = "hidden";
            const height = details.animate(
                [{ height: startHeight + "px" }, { height: targetHeight + "px" }],
                { duration, easing: "ease-in-out" }
            );
            const fades = Array.from(details.children)
                .filter((child) => child !== summary && getComputedStyle(child).display !== "none")
                .map((child) => child.animate(
                    [
                        { opacity: reversing ? (priorOpacity.get(child) ?? 1) : (desiredOpen ? 0 : 1) },
                        { opacity: desiredOpen ? 1 : 0 }
                    ],
                    { duration: 210, delay: desiredOpen ? 20 : 0, easing: "ease-out", fill: "both" }
                ));

            running = { height, fades };
            height.onfinish = () => {
                if (!running || running.height !== height) return;
                height.onfinish = null;
                height.cancel();
                fades.forEach((fade) => fade.cancel());
                details.open = desiredOpen;
                details.classList.remove("is-closing");
                details.style.overflow = originalOverflow;
                running = null;
            };
        });

        // 其他程式或瀏覽器原生切換仍以 details.open 為準。
        details.addEventListener("toggle", () => {
            if (!running) desiredOpen = details.open;
        });
    });
})();
