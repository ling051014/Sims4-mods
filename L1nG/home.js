// ========【首頁初始化】 設定 - 標記 JavaScript 已啟用 ========
document.documentElement.classList.add("js");


// ========【頂部導覽列】 設定 - 主視覺完全離開後才顯示 ========
const siteHeader = document.getElementById("siteHeader");
const homeHero = document.querySelector(".hero");

function updateHeaderState() {
    if (!siteHeader || !homeHero) {
        return;
    }

    const heroBottom = homeHero.getBoundingClientRect().bottom;
    const fadeDistance = 88;
    const distancePastHero = Math.max(0, -heroBottom);
    const progress = Math.min(1, distancePastHero / fadeDistance);
    const offset = -110 * (1 - progress);

    siteHeader.style.setProperty("--header-opacity", progress.toFixed(3));
    siteHeader.style.setProperty("--header-offset", offset.toFixed(2) + "%");
    siteHeader.classList.toggle("interactive", progress >= 0.98);
    siteHeader.classList.toggle("scrolled", progress > 0);

    if (progress < 0.98) {
        closeMobileNav();
    }
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


/* ========【首頁最新更新】 僅顯示正式公開發布；與完整更新日誌共用資料 ======== */
(function renderPublicAnnouncements(){
    const list = document.getElementById("homeUpdatesList");
    if (!list) return;
    const status = document.getElementById("homeUpdatesStatus");
    const language = document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "zh-Hant";
    const releases = Array.isArray(window.L1NG_PUBLIC_UPDATES) ? window.L1NG_PUBLIC_UPDATES : [];
    const recent = releases.filter(item => item && item.publishedAt && item.title && item.project && item.id)
        .slice().sort((a,b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0,5);
    if (!recent.length) {
        if (status) status.textContent = language === "en" ? "No published announcements are available." : "目前沒有可顯示的公開公告。";
        return;
    }
    const fragment = document.createDocumentFragment();
    for (const item of recent) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "home-update-link";
        a.href = "changelog.html#" + encodeURIComponent(item.id);
        const time = document.createElement("time");
        time.className = "home-update-date";
        time.dateTime = item.publishedAt;
        time.textContent = item.publishedAt.replaceAll("-","/");
        const main = document.createElement("span");
        main.className = "home-update-main";
        const project = document.createElement("span");
        project.className = "home-update-project";
        project.textContent = item.project[language] || item.project["zh-Hant"];
        const title = document.createElement("span");
        title.className = "home-update-title";
        title.textContent = item.title[language] || item.title["zh-Hant"];
        const arrow = document.createElement("span");
        arrow.className = "home-update-arrow";
        arrow.textContent = "→";
        arrow.setAttribute("aria-hidden","true");
        main.append(project,title);
        a.append(time,main,arrow);
        li.append(a);
        fragment.append(li);
    }
    list.replaceChildren(fragment);
    if (status) status.hidden = true;
})();
