// ========【首頁初始化】 設定 - 標記 JavaScript 已啟用 ========
document.documentElement.classList.add("js");


// ========【頂部導覽列】 起始透明、手機提前漸變，避免內容穿透固定頂欄 ========
const siteHeader = document.getElementById("siteHeader");
const homeHero = document.querySelector(".hero");

function updateHeaderState() {
    if (!siteHeader || !homeHero) {
        return;
    }

    // 桌機維持原本的主視覺透明轉場；手機則在第一行文字接近頂欄前建立霧面。
    const compactNavigation = window.matchMedia("(max-width: 850px)").matches;
    const headerBottom = siteHeader.getBoundingClientRect().bottom;
    const heroBottom = homeHero.getBoundingClientRect().bottom;
    const progress = compactNavigation
        ? Math.min(1, Math.max(0, window.scrollY / 72))
        : Math.min(1, Math.max(0, (headerBottom - heroBottom) / 120));

    // 手機採 ease-out，開始捲動即逐漸形成背景，72px 內達到足夠遮蔽度。
    const amount = compactNavigation ? 1 - Math.pow(1 - progress, 3) : progress;
    const backgroundOpacity = (compactNavigation ? 0.97 : 0.92) * amount;
    const borderOpacity = (compactNavigation ? 0.35 : 0.78) * amount;
    const shadowOpacity = (compactNavigation ? 0.035 : 0.06) * amount;

    siteHeader.style.setProperty("--header-bg-opacity", backgroundOpacity.toFixed(3));
    siteHeader.style.setProperty("--header-border-opacity", borderOpacity.toFixed(3));
    siteHeader.style.setProperty("--header-shadow-opacity", shadowOpacity.toFixed(3));
    siteHeader.style.setProperty("--header-blur", (18 * amount).toFixed(2) + "px");
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
