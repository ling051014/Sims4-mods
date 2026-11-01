// ========【首頁初始化】 設定 - 標記 JavaScript 已啟用 ========
document.documentElement.classList.add("js");


// ========【頂部導覽列】 手機透明 → 毛玻璃 → 實色，桌機維持既有過渡 ========
const siteHeader = document.getElementById("siteHeader");
const homeHero = document.querySelector(".hero");

function updateHeaderState() {
    if (!siteHeader || !homeHero) {
        return;
    }

    // 桌機沿用原本過渡。手機／平板分成透明 → 純毛玻璃 → 白底。
    // 毛玻璃階段的白色覆蓋為 0%；只有靠近專案區才提高背景不透明度。
    const compactNavigation = window.matchMedia("(max-width: 850px)").matches;
    const headerBottom = siteHeader.getBoundingClientRect().bottom;
    const heroBottom = homeHero.getBoundingClientRect().bottom;
    const clamp01 = value => Math.max(0, Math.min(1, value));

    let backgroundOpacity;
    let borderOpacity;
    let shadowOpacity;
    let blur;

    if (compactNavigation) {
        // 0～100px：透明背景上的 backdrop-filter 逐步增至 20px。
        const glassProgress = clamp01(window.scrollY / 100);
        const glass = 1 - Math.pow(1 - glassProgress, 3);

        // 主視覺底緣接近導覽列時才開始最後 160px 的轉白過渡。
        const whiteProgress = clamp01((headerBottom + 160 - heroBottom) / 160);
        const white = whiteProgress * whiteProgress * (3 - 2 * whiteProgress);

        backgroundOpacity = white;
        borderOpacity = 0.12 * glass * (1 - white) + 0.65 * white;
        shadowOpacity = 0.015 * glass * (1 - white) + 0.055 * white;
        blur = 20 * glass * (1 - white);
    } else {
        const progress = clamp01((headerBottom - heroBottom) / 120);
        backgroundOpacity = 0.92 * progress;
        borderOpacity = 0.78 * progress;
        shadowOpacity = 0.06 * progress;
        blur = 18 * progress;
    }

    siteHeader.style.setProperty("--header-bg-opacity", backgroundOpacity.toFixed(3));
    siteHeader.style.setProperty("--header-border-opacity", borderOpacity.toFixed(3));
    siteHeader.style.setProperty("--header-shadow-opacity", shadowOpacity.toFixed(3));
    siteHeader.style.setProperty("--header-blur", blur.toFixed(2) + "px");
}

window.addEventListener("scroll", updateHeaderState, { passive: true });
window.addEventListener("resize", updateHeaderState);


// ========【手機導覽列】 設定 - 開啟與關閉導覽選單 ========
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
const isEnglishHome = document.documentElement.lang.toLowerCase().startsWith("en");
const navLabelOpen = isEnglishHome ? "Open navigation" : "開啟導覽選單";
const navLabelClose = isEnglishHome ? "Close navigation" : "關閉導覽選單";

function closeMobileNav() {
    if (!navToggle || !mainNav) {
        return;
    }

    navToggle.classList.remove("active");
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", navLabelOpen);
}

updateHeaderState();

if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");

        navToggle.classList.toggle("active", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
        navToggle.setAttribute(
            "aria-label",
            isOpen ? navLabelClose : navLabelOpen
        );
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
        if (window.innerWidth > 850) {
            closeMobileNav();
        }
    });
}


// ========【進場動畫】 設定 - 區塊進入畫面後顯示 ========
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12
        }
    );

    revealItems.forEach((item) => {
        revealObserver.observe(item);
    });
} else {
    revealItems.forEach((item) => {
        item.classList.add("visible");
    });
}
