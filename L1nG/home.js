// ========【首頁初始化】 設定 - 標記 JavaScript 已啟用 ========
document.documentElement.classList.add("js");


// ========【頂部導覽列】 桌機保留透明起始；手機起始毛玻璃隨捲動增強 ========
const siteHeader = document.getElementById("siteHeader");
const homeHero = document.querySelector(".hero");

function updateHeaderState() {
    if (!siteHeader || !homeHero) {
        return;
    }

    // 桌機維持原本的透明封面：離開主視覺後才逐漸顯示底色。
    // 手機／平板則先有輕毛玻璃，從開始捲動就逐漸加深，避免文字穿過固定頂欄。
    const compactNavigation = window.matchMedia("(max-width: 850px)").matches;
    const headerBottom = siteHeader.getBoundingClientRect().bottom;
    const heroBottom = homeHero.getBoundingClientRect().bottom;
    const progress = compactNavigation
        ? Math.min(1, Math.max(0, window.scrollY / 200))
        : Math.min(1, Math.max(0, (headerBottom - heroBottom) / 120));

    const from = compactNavigation
        ? { background: 0.78, border: 0.14, shadow: 0.015, blur: 12 }
        : { background: 0, border: 0, shadow: 0, blur: 0 };

    siteHeader.style.setProperty("--header-bg-opacity", (from.background + (0.92 - from.background) * progress).toFixed(3));
    siteHeader.style.setProperty("--header-border-opacity", (from.border + (0.78 - from.border) * progress).toFixed(3));
    siteHeader.style.setProperty("--header-shadow-opacity", (from.shadow + (0.06 - from.shadow) * progress).toFixed(3));
    siteHeader.style.setProperty("--header-blur", (from.blur + (18 - from.blur) * progress).toFixed(2) + "px");
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
