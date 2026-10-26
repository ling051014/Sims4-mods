// ========【RealDate 啟動】 設定 - 標記 JavaScript 已啟用 ========
document.documentElement.classList.add("js");

// ========【RealDate 語言】 設定 - 語言保存與切換 ========
(() => {
    "use strict";

    const STORAGE_KEY = "l1ng-realdate-site-language";
    const DEFAULT_LANGUAGE = "zh-Hant";
    const SUPPORTED_LANGUAGES = new Set(["zh-Hant", "en"]);

    const PAGE_TITLES = {"index.html":["RealDate · L1nG","RealDate · L1nG"],"gameplay.html":["完整玩法 · RealDate · L1nG","Gameplay · RealDate · L1nG"],"download.html":["下載與安裝 · RealDate · L1nG","Download & Install · RealDate · L1nG"],"compatibility.html":["相容性 · RealDate · L1nG","Compatibility · RealDate · L1nG"],"changelog.html":["更新日誌 · RealDate · L1nG","Changelog · RealDate · L1nG"],"roadmap.html":["開發方向 · RealDate · L1nG","Roadmap · RealDate · L1nG"],"faq.html":["常見問題 · RealDate · L1nG","FAQ · RealDate · L1nG"],"feedback.html":["問題反饋 · RealDate · L1nG","Feedback · RealDate · L1nG"]};
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
        const page = location.pathname.split('/').pop() || 'index.html';
        document.title = (PAGE_TITLES[page] || PAGE_TITLES['index.html'])[nextLanguage === 'en' ? 1 : 0];

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
    const currentLabels = Array.from(quickNav.querySelectorAll("[data-doc-current-language]"));
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
        // 浮動入口直接顯示目前章節名稱，而非通用標題或頁碼。
        const activeLink = links[current];
        currentLabels.forEach((label) => {
            const language = label.dataset.docCurrentLanguage;
            const translated = activeLink?.querySelector('[data-lang="' + language + '"]');
            label.textContent = translated?.textContent.trim() ||
                activeLink?.textContent.trim() || "";
        });
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


// ========【RealDate 首頁日曆】 僅首頁啟動；捲動進度不攔截頁面 ========
(() => {
    "use strict";
    const scene = document.getElementById("rdPaperScene");
    if (!scene) return;
    const hero = scene.closest(".rd-hero-track");
    const visual = scene.closest(".rd-timeline-visual");
    const desktop = window.matchMedia("(min-width: 981px)");
    const phone = window.matchMedia("(max-width: 650px)");
    const labels = visual.querySelector(".rd-timeline-events");
    const front = scene.querySelector("[data-paper-front]");
    const back = scene.querySelector("[data-paper-back]");
    const timeline = document.querySelectorAll(".rd-hero-track .rd-timeline-event");
    const dates = [
        {day:"14",zhMonth:"10 月",enMonth:"OCTOBER",zhWeek:"星期三",enWeek:"WEDNESDAY"},
        {day:"15",zhMonth:"10 月",enMonth:"OCTOBER",zhWeek:"星期四",enWeek:"THURSDAY"},
        {day:"20",zhMonth:"10 月",enMonth:"OCTOBER",zhWeek:"星期二",enWeek:"TUESDAY"},
        {day:"01",zhMonth:"11 月",enMonth:"NOVEMBER",zhWeek:"星期日",enWeek:"SUNDAY"}
    ];
    let frame = 0;
    let currentIndex = -1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function putDate(node, date) {
        const small = node?.querySelector("small");
        const week = node?.querySelector(".rd-paper-weekday");
        if (!small || !week) return;
        node.querySelector(".rd-paper-day").textContent = date.day;
        small.querySelector('[data-lang="zh-Hant"]').textContent = date.zhMonth;
        small.querySelector('[data-lang="en"]').textContent = date.enMonth;
        week.querySelector('[data-lang="zh-Hant"]').textContent = date.zhWeek;
        week.querySelector('[data-lang="en"]').textContent = date.enWeek;
    }
    function update() {
        frame = 0;
        if (reduceMotion.matches) {
            if (currentIndex !== 0) { putDate(front,dates[0]);putDate(back,dates[1]);currentIndex=0; }
            scene.style.setProperty("--flip","0");
            scene.style.setProperty("--peel","0");
            scene.style.setProperty("--calendar-follow","0px");
            return;
        }
        // The paper alone follows scrolling; the four labels and the original
        // hero geometry stay in normal flow, at their pre-sticky positions.
        // Measure against the untransformed visual so the animation cannot
        // feed its own transform back into its scroll progress calculation.
        const top = visual.getBoundingClientRect().top + window.scrollY + scene.offsetTop;
        const heroBottom = hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight;
        const safeTravel = Math.max(0, heroBottom - top - scene.offsetHeight - 12);
        let follow, start, finish;
        if (desktop.matches) {
            // Preserve the desktop behavior that is already approved.
            follow = Math.min(window.scrollY, 250, safeTravel);
            start = Math.max(0, top - window.innerHeight * .76);
            finish = start + 340;
        } else {
            // Keep the existing tablet behavior. On phones, compare the initial
            // paper position with its final position around the label midpoint.
            // The left-side labels themselves remain entirely stationary.
            const visibleTop = Math.max(96, Math.min(window.innerHeight * .22, 210));
            const holdStart = Math.max(0, top - visibleTop);
            let mobileTravel = Math.min(250, safeTravel);
            if (phone.matches && labels) {
                const labelRect = labels.getBoundingClientRect();
                const labelCenter = labelRect.top + window.scrollY + labelRect.height / 2;
                const paperCenter = top + scene.offsetHeight / 2;
                mobileTravel = Math.min(mobileTravel,
                    Math.max(0, (labelCenter - paperCenter) * 2));
            }
            follow = Math.min(Math.max(0, window.scrollY - holdStart), mobileTravel);
            start = Math.max(0, holdStart - Math.min(140, window.innerHeight * .18));
            finish = Math.max(start + 260, holdStart + mobileTravel);
        }
        scene.style.setProperty("--calendar-follow",follow.toFixed(1)+"px");
        const p = Math.max(0, Math.min(1, (window.scrollY - start) / (finish - start)));
        const phase = Math.min(2.9999, p * 3);
        const index = Math.floor(phase);
        const f = phase - index;
        if (index !== currentIndex) {
            putDate(front,dates[index]);putDate(back,dates[index+1]);currentIndex=index;
        }
        const easing = f*f*(3-2*f);
        scene.style.setProperty("--flip",String(easing));
        scene.style.setProperty("--peel",String(Math.min(1,f*2.2)));
        timeline.forEach((element,i) => element.classList.toggle("active",i === Math.min(3,Math.round(p*3))));
    }
    function schedule() {
        if (frame) return;
        frame = window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    reduceMotion.addEventListener?.("change",schedule);
    window.addEventListener("load",schedule,{once:true});
    update();
})();

// ========【RealDate 發展方向】 紙張隨捲動輕擺；尊重減少動態設定 ========
(() => {
    "use strict";
    const sheets = Array.from(document.querySelectorAll(".rd-direction .rd-vision-stage"));
    const line = document.querySelector(".rd-direction .rd-vision-line");
    if (!sheets.length || !line) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prevY = window.scrollY, prevX = line.scrollLeft, swing = 0, target = 0, frame = 0;
    function render() {
        sheets.forEach(stage => {
            const sheet = stage.querySelector(".rd-vision-sheet");
            if (!sheet) return;
            const base = parseFloat(stage.dataset.baseRot) || 0;
            const mult = parseFloat(stage.dataset.swing) || 1;
            sheet.style.setProperty("--card-rot", (base + (reduceMotion.matches ? 0 : swing * mult)).toFixed(3) + "deg");
        });
    }
    function step() {
        swing += (target - swing) * .16;
        target *= .88;
        render();
        if (Math.abs(swing) > .02 || Math.abs(target) > .02) frame = requestAnimationFrame(step);
        else { swing=0;target=0;frame=0;render(); }
    }
    function nudge(delta) {
        if (reduceMotion.matches || !delta) return;
        target = Math.max(-3,Math.min(3,target + delta * .026));
        if (!frame) frame = requestAnimationFrame(step);
    }
    window.addEventListener("scroll",() => {
        const delta = window.scrollY - prevY; prevY = window.scrollY;
        const box = line.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) return;
        nudge(delta);
    },{passive:true});
    // The mobile swipe strip scrolls independently of window.scrollY.
    // Reuse the same spring motion so swipes and vertical scrolling agree.
    line.addEventListener("scroll",() => {
        const delta = line.scrollLeft - prevX; prevX = line.scrollLeft;
        nudge(delta);
    },{passive:true});
    reduceMotion.addEventListener?.("change",() => {
        if (reduceMotion.matches) {
            target=0; swing=0;
            if (frame) cancelAnimationFrame(frame);
            frame=0;
        }
        render();
    });
    render();
})();


// ========【RealDate Overrides FAQ】 錨點展開與複製設定（沿用族譜提取器 SVG 動畫） ========
(() => {
    "use strict";
    const guide = document.getElementById("faq-resource");
    if (!guide) return;

    function openGuideFromLink() {
        if (window.location.hash !== "#faq-resource") return;
        guide.open = true;
        window.requestAnimationFrame(() => {
            guide.scrollIntoView({ block: "start" });
        });
    }
    window.addEventListener("hashchange", openGuideFromLink);
    window.addEventListener("load", openGuideFromLink, { once:true });
    openGuideFromLink();

    const copyButton = guide.querySelector("[data-resource-copy]");
    const rule = document.getElementById("resource-cfg-rule");
    if (!copyButton || !rule) return;
    const glyph = copyButton.querySelector(".l1ng-copy-glyph");
    const feedback = copyButton.querySelector(".resource-copy-feedback");
    let resetTimer;

    async function copyText(value) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            try {
                await navigator.clipboard.writeText(value);
                return true;
            } catch (_) {
                // 剪貼簿權限不可用時，沿用族譜提取器的備援方式。
            }
        }
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;";
        document.body.appendChild(area);
        area.focus();
        area.select();
        area.setSelectionRange(0, area.value.length);
        let copied = false;
        try { copied = document.execCommand("copy"); } catch (_) {}
        area.remove();
        return copied;
    }

    copyButton.addEventListener("click", async () => {
        const copied = await copyText(rule.textContent.trim());
        if (resetTimer) window.clearTimeout(resetTimer);
        if (glyph) glyph.classList.remove("l1ng-copy-running");
        copyButton.classList.toggle("is-copy-error", !copied);
        const english = document.documentElement.dataset.language === "en";
        if (feedback) feedback.textContent = copied
            ? (english ? "Copied!" : "已複製！")
            : (english ? "Copy failed; please copy manually." : "複製失敗，請手動複製。");
        copyButton.title = copied ? (english ? "Copied!" : "已複製！")
            : (english ? "Copy failed" : "複製失敗");
        if (copied && glyph) {
            void glyph.getBoundingClientRect();
            glyph.classList.add("l1ng-copy-running");
        }
        resetTimer = window.setTimeout(() => {
            if (glyph) glyph.classList.remove("l1ng-copy-running");
            copyButton.classList.remove("is-copy-error");
            if (feedback) feedback.textContent = "";
            copyButton.title = document.documentElement.dataset.language === "en" ? "Copy settings" : "複製設定";
        }, copied ? 3900 : 1900);
    });
})();

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
