// ========【首頁初始化】 設定 - 標記 JavaScript 已啟用 ========
document.documentElement.classList.add("js");


// ========【頂部導覽列】 設定 - 滾動後切換導覽列陰影 ========
const siteHeader = document.getElementById("siteHeader");

function updateHeaderState() {
    if (!siteHeader) {
        return;
    }

    siteHeader.classList.toggle("scrolled", window.scrollY > 10);
}

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });


// ========【手機導覽列】 設定 - 開啟與關閉導覽選單 ========
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

function closeMobileNav() {
    if (!navToggle || !mainNav) {
        return;
    }

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
        navToggle.setAttribute(
            "aria-label",
            isOpen ? "關閉導覽選單" : "開啟導覽選單"
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
