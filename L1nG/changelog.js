// ========【公開發布紀錄】 人工維護；不使用 GitHub 提交紀錄當作玩家公告 ========
window.L1NG_PUBLIC_UPDATES = Object.freeze([
  {
    "id": "genealogy-010",
    "publishedAt": "2026-10-19",
    "project": {
      "zh-Hant": "族譜工具 / 族譜提取器",
      "en": "Genealogy Tool / Exporter"
    },
    "title": {
      "zh-Hant": "v0.1 Beta 首次公開測試",
      "en": "v0.1 Beta public launch"
    },
    "summary": {
      "zh-Hant": "正式公開族譜工具與遊戲端族譜提取器，支援建立、整理族譜及匯入遊戲資料。",
      "en": "The Genealogy Tool and in-game Exporter enter public beta, supporting family-tree editing and game-data import."
    },
    "source": "https://www.patreon.com/ling051014/posts/genealogy-v0-1-172541487"
  },
  {
    "id": "v050",
    "publishedAt": "2026-10-14",
    "project": {
      "zh-Hant": "RealDate",
      "en": "RealDate"
    },
    "title": {
      "zh-Hant": "v0.5 Beta：人生回憶錄與紀念日",
      "en": "v0.5 Beta: Life Chronicle & Anniversaries"
    },
    "summary": {
      "zh-Hant": "新增人生回憶錄、關係歷史、事件管理與紀念日社交活動，並擴展行事曆活動規劃。",
      "en": "Introduced Life Chronicle, relationship history, Event Management, anniversary events, and expanded Calendar planning."
    },
    "source": "https://www.patreon.com/ling051014/posts/realdate-v0-5-170351394"
  },
  {
    "id": "v040",
    "publishedAt": "2026-09-22",
    "project": {
      "zh-Hant": "RealDate",
      "en": "RealDate"
    },
    "title": {
      "zh-Hant": "v0.4 Beta：生日社交與年號玩法",
      "en": "v0.4 Beta: Birthday socials & Eras"
    },
    "summary": {
      "zh-Hant": "新增生日記憶與社交、年號玩法、星期校正，強化生理時間軸及第三方模組相容。",
      "en": "Added birthday memories and socials, Era gameplay, weekday recalibration, and stronger timeline compatibility."
    },
    "source": "https://www.patreon.com/ling051014/posts/realdate-v0-4-168970984"
  },
  {
    "id": "v030",
    "publishedAt": "2026-09-08",
    "project": {
      "zh-Hant": "RealDate",
      "en": "RealDate"
    },
    "title": {
      "zh-Hant": "v0.3 Beta：RealDate 月曆與生理時間軸",
      "en": "v0.3 Beta: Calendar & reproductive timeline"
    },
    "summary": {
      "zh-Hant": "將 RealDate 日期整合進 EA 月曆，加入月齡、年齡階段及生理時間軸。",
      "en": "Integrated RealDate dates with EA's Calendar and added age-in-months, life stages, and reproductive timelines."
    },
    "source": "https://www.patreon.com/ling051014/posts/realdate-v0-3-168436378"
  },
  {
    "id": "v021",
    "publishedAt": "2026-08-31",
    "project": {
      "zh-Hant": "RealDate",
      "en": "RealDate"
    },
    "title": {
      "zh-Hant": "v0.2.1 Beta：午夜換日與生日修正",
      "en": "v0.2.1 Beta: Midnight rollover fixes"
    },
    "summary": {
      "zh-Hant": "修正午夜換日延遲，以及生日當天日期可能停留在前一天的問題。",
      "en": "Fixed delayed midnight rollover and dates occasionally remaining on the previous day during birthdays."
    },
    "source": "https://www.patreon.com/ling051014/posts/realdate-v0-2-1-167674241"
  },
  {
    "id": "v020",
    "publishedAt": "2026-08-29",
    "project": {
      "zh-Hant": "RealDate",
      "en": "RealDate"
    },
    "title": {
      "zh-Hant": "v0.2 Beta：季節與年齡時間整合",
      "en": "v0.2 Beta: Seasons & aging integration"
    },
    "summary": {
      "zh-Hant": "整合四季時間、年齡進度與 RealDate 日期顯示。",
      "en": "Integrated season timing, age progression, and RealDate date display."
    }
  },
  {
    "id": "v011",
    "publishedAt": "2026-08-24",
    "project": {
      "zh-Hant": "RealDate",
      "en": "RealDate"
    },
    "title": {
      "zh-Hant": "v0.1.1 Beta：ModGuard 相容修正",
      "en": "v0.1.1 Beta: ModGuard compatibility fix"
    },
    "summary": {
      "zh-Hant": "修正可能觸發 ModGuard 安全警告的問題。",
      "en": "Fixed a compatibility issue that could trigger ModGuard security warnings."
    }
  },
  {
    "id": "v010",
    "publishedAt": "2026-08-23",
    "project": {
      "zh-Hant": "RealDate",
      "en": "RealDate"
    },
    "title": {
      "zh-Hant": "v0.1 Beta：RealDate 首次公開測試",
      "en": "v0.1 Beta: First public release"
    },
    "summary": {
      "zh-Hant": "首次公開真實日期、生日與實際年齡的基本系統。",
      "en": "First public beta featuring real dates, birthdays, and actual ages."
    }
  }
]);

// ============================================================
// RealDate Changelog
// 負責：語言切換、版本導覽搬移、內容捲動、active 版本狀態
// ============================================================

(() => {
    "use strict";

    // 共用檔亦由首頁載入；首頁不初始化更新日誌頁面的捲動與導覽。
    if (!document.querySelector("[data-changelog-scroll]")) return;

    const LANGUAGE_STORAGE_KEY = "l1ng-realdate-changelog-language";
    const DEFAULT_LANGUAGE = "zh-Hant";
    const SUPPORTED_LANGUAGES = new Set(["zh-Hant", "en"]);

    const root = document.documentElement;

    const scrollContainer =
        document.querySelector("[data-changelog-scroll]");

    const versionHome =
        document.querySelector("[data-version-index-home]");

    const versionCenter =
        document.querySelector("[data-nav-version-center]");

    const versionIndex =
        document.querySelector(".version-index");

    const languageButtons = Array.from(
        document.querySelectorAll("[data-language-button]")
    );

    const versionLinks = Array.from(
        document.querySelectorAll("[data-version-target]")
    );

    const releases = Array.from(
        document.querySelectorAll(".release")
    );

    let activeVersionId = releases[0]?.id ?? null;
    let versionIsInNav = false;
    let frameRequested = false;

    // navigationTargetId 非 null 時代表正在執行版本跳轉。
    // 在抵達目標前，active 狀態固定在使用者點選的版本。
    let navigationTargetId = null;

    // ─────────────────────────────────────────────────────────
    // 語言
    // ─────────────────────────────────────────────────────────
    function normalizeLanguage(language) {
        return SUPPORTED_LANGUAGES.has(language)
            ? language
            : DEFAULT_LANGUAGE;
    }

    function getInitialLanguage() {
        try {
            return normalizeLanguage(
                localStorage.getItem(LANGUAGE_STORAGE_KEY)
            );
        } catch (_) {
            return DEFAULT_LANGUAGE;
        }
    }

    function applyLanguage(language) {
        const nextLanguage = normalizeLanguage(language);

        root.dataset.language = nextLanguage;
        root.lang = nextLanguage;
        document.title = nextLanguage === 'en' ? 'Changelog · L1nG' : '更新日誌 · L1nG';

        languageButtons.forEach((button) => {
            const isActive =
                button.dataset.languageButton === nextLanguage;

            button.classList.toggle("active", isActive);
            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });

        try {
            localStorage.setItem(
                LANGUAGE_STORAGE_KEY,
                nextLanguage
            );
        } catch (_) {
            // 儲存不可用時，不影響目前頁面。
        }
    }

    // ─────────────────────────────────────────────────────────
    // 版本 active 狀態
    // ─────────────────────────────────────────────────────────
    function centerActiveVersionLink(link) {
        if (!versionIndex || !link || !versionIsInNav) {
            return;
        }

        const targetLeft =
            link.offsetLeft -
            (versionIndex.clientWidth - link.offsetWidth) / 2;

        versionIndex.scrollTo({
            left: Math.max(0, targetLeft),
            behavior: "smooth"
        });
    }

    function setActiveVersion(versionId, keepVisible = true) {
        if (!versionId) {
            return;
        }

        activeVersionId = versionId;

        let activeLink = null;

        versionLinks.forEach((link) => {
            const isActive =
                link.dataset.versionTarget === versionId;

            link.classList.toggle("active", isActive);

            if (isActive) {
                activeLink = link;
            }
        });

        if (keepVisible && activeLink) {
            centerActiveVersionLink(activeLink);
        }
    }

    // ─────────────────────────────────────────────────────────
    // 版本導覽在頁面與 Navbar 之間搬動
    // ─────────────────────────────────────────────────────────
    function getVersionHomeTop() {
        if (!scrollContainer || !versionHome) {
            return 0;
        }

        return (
            versionHome.getBoundingClientRect().top -
            scrollContainer.getBoundingClientRect().top +
            scrollContainer.scrollTop
        );
    }

    function shouldMoveVersionIndexIntoNav() {
        if (!scrollContainer || !versionHome) {
            return false;
        }

        return scrollContainer.scrollTop >= getVersionHomeTop();
    }

    function moveVersionIndexIntoNav() {
        if (
            versionIsInNav ||
            !versionHome ||
            !versionCenter ||
            !versionIndex
        ) {
            return;
        }

        // 保留原位高度，避免移動同一個 DOM 節點時內容跳動。
        versionHome.style.height =
            `${versionHome.getBoundingClientRect().height}px`;

        versionCenter.appendChild(versionIndex);
        versionIsInNav = true;

        const activeLink =
            versionLinks.find(
                (link) =>
                    link.dataset.versionTarget === activeVersionId
            );

        if (activeLink) {
            centerActiveVersionLink(activeLink);
        }
    }

    function moveVersionIndexHome() {
        if (
            !versionIsInNav ||
            !versionHome ||
            !versionIndex
        ) {
            return;
        }

        versionHome.appendChild(versionIndex);
        versionHome.style.height = "";
        versionIsInNav = false;

        versionIndex.scrollTo({
            left: 0,
            behavior: "auto"
        });
    }

    function updateVersionIndexLocation() {
        if (shouldMoveVersionIndexIntoNav()) {
            moveVersionIndexIntoNav();
        } else {
            moveVersionIndexHome();
        }
    }

    // ─────────────────────────────────────────────────────────
    // 垂直定位
    // ─────────────────────────────────────────────────────────
    function getReleaseScrollTop(release) {
        if (!scrollContainer || !release) {
            return 0;
        }

        const containerRect =
            scrollContainer.getBoundingClientRect();

        const releaseRect =
            release.getBoundingClientRect();

        const currentTop =
            releaseRect.top -
            containerRect.top +
            scrollContainer.scrollTop;

        // 版本卡片與可捲動區頂端保留閱讀空間。
        return Math.max(0, currentTop - 24);
    }

    function findCurrentRelease() {
        if (!scrollContainer || releases.length === 0) {
            return null;
        }

        const containerTop =
            scrollContainer.getBoundingClientRect().top;

        // 目前版本判斷線位於可捲動區頂端下方 30px。
        const markerY = containerTop + 30;
        let current = releases[0];

        for (const release of releases) {
            if (release.getBoundingClientRect().top <= markerY) {
                current = release;
            } else {
                break;
            }
        }

        const nearBottom =
            scrollContainer.scrollTop +
            scrollContainer.clientHeight >=
            scrollContainer.scrollHeight - 8;

        if (nearBottom) {
            current = releases[releases.length - 1];
        }

        return current;
    }

    function targetHasReachedPosition(targetId) {
        if (!scrollContainer || !targetId) {
            return true;
        }

        const target =
            document.getElementById(targetId);

        if (!target) {
            return true;
        }

        const desiredTop = getReleaseScrollTop(target);
        const distance =
            Math.abs(scrollContainer.scrollTop - desiredTop);

        return distance <= 2;
    }

    // ─────────────────────────────────────────────────────────
    // 程式化版本跳轉
    // ─────────────────────────────────────────────────────────
    function navigateToVersion(versionId) {
        if (!scrollContainer) {
            return;
        }

        const target =
            document.getElementById(versionId);

        if (!target) {
            return;
        }

        navigationTargetId = versionId;

        // 點選後立即固定 active；途中經過其他版本不改底線。
        setActiveVersion(versionId, true);

        scrollContainer.scrollTo({
            top: getReleaseScrollTop(target),
            behavior: "smooth"
        });

        // 保留可分享的 hash，但不讓瀏覽器再次執行原生捲動。
        if (history.replaceState) {
            history.replaceState(null, "", `#${versionId}`);
        }
    }

    function cancelProgrammaticNavigation() {
        navigationTargetId = null;
    }

    // ─────────────────────────────────────────────────────────
    // 捲動狀態
    // ─────────────────────────────────────────────────────────
    function updateScrollState() {
        frameRequested = false;

        updateVersionIndexLocation();

        if (
            navigationTargetId &&
            targetHasReachedPosition(navigationTargetId)
        ) {
            navigationTargetId = null;
        }

        // 程式化跳轉期間保持使用者選取版本；
        // 抵達後才恢復依內容位置自動追蹤。
        if (!navigationTargetId) {
            const currentRelease =
                findCurrentRelease();

            if (currentRelease) {
                setActiveVersion(
                    currentRelease.id,
                    true
                );
            }
        }
    }

    function requestScrollStateUpdate() {
        if (frameRequested) {
            return;
        }

        frameRequested = true;
        requestAnimationFrame(updateScrollState);
    }

    // ─────────────────────────────────────────────────────────
    // 事件
    // ─────────────────────────────────────────────────────────
    languageButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyLanguage(
                button.dataset.languageButton
            );
        });
    });

    versionLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            navigateToVersion(
                link.dataset.versionTarget
            );
        });
    });

    scrollContainer?.addEventListener(
        "scroll",
        requestScrollStateUpdate,
        { passive: true }
    );

    window.addEventListener(
        "resize",
        requestScrollStateUpdate
    );

    // 使用者主動介入捲動時，停止版本跳轉鎖定，
    // 立即回到實際內容位置追蹤。
    scrollContainer?.addEventListener(
        "wheel",
        cancelProgrammaticNavigation,
        { passive: true }
    );

    scrollContainer?.addEventListener(
        "touchstart",
        cancelProgrammaticNavigation,
        { passive: true }
    );

    scrollContainer?.addEventListener(
        "pointerdown",
        cancelProgrammaticNavigation,
        { passive: true }
    );

    // ─────────────────────────────────────────────────────────
    // 啟動
    // ─────────────────────────────────────────────────────────
    applyLanguage(getInitialLanguage());

    const initialHash =
        window.location.hash.replace("#", "");

    if (
        initialHash &&
        document.getElementById(initialHash)
    ) {
        // 首次載入 hash 採立即定位，避免啟動畫面先滑一次。
        const target =
            document.getElementById(initialHash);

        scrollContainer?.scrollTo({
            top: getReleaseScrollTop(target),
            behavior: "auto"
        });

        setActiveVersion(initialHash, false);
    } else if (activeVersionId) {
        setActiveVersion(
            activeVersionId,
            false
        );
    }

    updateScrollState();
})();
