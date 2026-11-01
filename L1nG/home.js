// ========【首頁初始化】 設定 - 標記 JavaScript 已啟用 ========
document.documentElement.classList.add("js");


// ========【頂部導覽列】 手機透明 → 毛玻璃 → 實色，桌機維持既有過渡 ========
const siteHeader = document.getElementById("siteHeader");
const homeHero = document.querySelector(".hero");

function updateHeaderState() {
    if (!siteHeader || !homeHero) {
        return;
    }

    // 桌機沿用原本的透明至實色過渡。手機／平板明確分成三階段：
    // ① 頂部透明 → ② 主視覺中持續毛玻璃 → ③ 接近專案區才漸變成白色。
    const compactNavigation = window.matchMedia("(max-width: 850px)").matches;
    const headerBottom = siteHeader.getBoundingClientRect().bottom;
    const heroBottom = homeHero.getBoundingClientRect().bottom;
    const clamp01 = value => Math.max(0, Math.min(1, value));

    let backgroundOpacity;
    let borderOpacity;
    let shadowOpacity;
    let blur;

    if (compactNavigation) {
        // 第一階段：前 100px 形成半透明毛玻璃，不直接跳到白底。
        const glassProgress = clamp01(window.scrollY / 100);
        const glass = 1 - Math.pow(1 - glassProgress, 3);

        // 第二階段：在主視覺其餘區域保留毛玻璃。
        // 第三階段：主視覺底緣靠近頂欄 160px 時，才淡出毛玻璃、轉為實色。
        const white = clamp01((headerBottom + 160 - heroBottom) / 160);
        const whiteEase = white * white * (3 - 2 * white);

        backgroundOpacity = 0.70 * glass + (1 - 0.70) * whiteEase;
        borderOpacity = 0.12 * glass + (0.65 - 0.12) * whiteEase;
        shadowOpacity = 0.015 * glass + (0.055 - 0.015) * whiteEase;
        blur = 22 * glass * (1 - whiteEase);
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
