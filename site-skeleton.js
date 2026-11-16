// ========【全站骨架屏】 設定 - 解析頁面骨架並在 DOM 初始化完成後淡出 ========
(() => {
    "use strict";

    const script = document.currentScript;
    if (!script) return;

    const layout = script.dataset.skeletonLayout || "l1ng-content";
    const autoReady = script.dataset.skeletonAuto !== "manual";

    const block = (className = "") =>
        '<span class="l1ng-sk-block ' + className + '"></span>';

    const header = () =>
        '<div class="l1ng-sk-header">' +
            block("l1ng-sk-line lg brand") +
            '<div class="nav">' +
                block("l1ng-sk-line") +
                block("l1ng-sk-line") +
                block("l1ng-sk-line") +
                block("l1ng-sk-square") +
            '</div>' +
        '</div>';

    const card = () =>
        '<div class="l1ng-sk-card">' +
            block("l1ng-sk-card-media") +
            '<div class="l1ng-sk-card-body">' +
                block("l1ng-sk-line lg") +
                block("l1ng-sk-line sm") +
                block("l1ng-sk-line") +
                block("l1ng-sk-line") +
            '</div>' +
        '</div>';

    const panelLines = () =>
        block("l1ng-sk-line lg") +
        block("l1ng-sk-line") +
        block("l1ng-sk-line") +
        block("l1ng-sk-line sm");

    const repeat = (count, factory) =>
        Array.from({ length: count }, (_, index) => factory(index)).join("");


    const bar = (type) => {
        // 品牌名稱、站內導覽、右側工具必須各佔一格；漢化頁沒有語言切換。
        const links = type === "realdate" ? 7 : (type === "home" || type === "translations" ? 3 : 4);
        const language = type === "realdate" || type === "product";
        return '<div class="sk-sitebar sk-sitebar-' + type + '"><div class="sk-sitebar-inner">' +
            '<div class="sk-site-brand">' +
                block("sk-brand") + (type === "home" ? "" : block("sk-brand-section")) +
            '</div>' +
            '<div class="sk-site-links">' + repeat(links, () => block("sk-nav-link")) + '</div>' +
            '<div class="sk-site-controls">' +
                (language ? block("sk-language") : "") + block("sk-mobile-menu") +
            '</div></div></div>';
    };
    const eyebrow = () => block("sk-eyebrow");
    const rowLines = () => panelLines();
    const feature = () => '<div class="sk-feature-card">' + rowLines() + '</div>';
    const twoButtons = () => '<div class="sk-button-row">' + block("sk-button") + block("sk-button") + '</div>';
    const pageHero = (extra = "", small = false) =>
        '<div class="sk-page-hero"><div class="sk-page-hero-inner">' + eyebrow() +
            block("sk-page-title") + (small ? "" : block("sk-wide-copy") + block("sk-medium-copy")) + extra +
        '</div></div>';
    const rd = (extra, small = false) => bar("realdate") + pageHero(extra || "", small);
    const title = () => '<div class="sk-section-heading">' + eyebrow() + block("sk-section-title") + '</div>';
    const docIndex = n => '<div class="sk-doc-index">' + repeat(n, () => block("sk-index-link")) + '</div>';
    // 長頁骨架依主要章節延伸，避免捲動後只剩第一屏佔位。
    const documentSection = (count = 3) =>
        '<section class="sk-document-section">' + title() +
        '<div class="sk-feature-grid">' + repeat(count, feature) + '</div></section>';
    const documentRows = (count = 4) =>
        '<div class="sk-document-rows">' + repeat(count, () =>
            '<div class="sk-document-row">' + rowLines() + '</div>') + '</div>';
    const roadRow = () => '<div class="sk-timeline-row"><span class="sk-timeline-dot"></span><div class="sk-timeline-card">' +
        block("sk-status-pill") + rowLines() + '</div></div>';
    const releaseRow = () => '<div class="sk-release-row"><span class="sk-timeline-dot"></span><div class="sk-release-card">' +
        '<div class="sk-release-heading">' + block("sk-status-pill") + block("sk-medium-copy") + '</div>' +
        block("sk-wide-copy") + block("sk-medium-copy") +
        '<div class="sk-release-sections">' + repeat(2, () =>
            '<div class="sk-release-section">' + block("sk-release-section-label") +
                '<div class="sk-release-section-items">' + repeat(3, () => block("sk-wide-copy")) +
            '</div></div>') + '</div></div></div>';

    // 與首頁更新日誌共用的五筆佔位；網路請求尚未完成時持續顯示。
    const homeUpdates = () =>
        '<div class="sk-home-updates" aria-hidden="true">' +
            '<div class="sk-home-updates-heading">' + block("sk-home-update-heading") + '</div>' +
            '<div class="sk-home-updates-list">' + repeat(5, () =>
                '<div class="sk-home-update-row">' +
                    block("sk-home-update-date") +
                    '<div class="sk-home-update-main">' +
                        block("sk-home-update-project") + block("sk-home-update-title") +
                    '</div>' +
                    block("sk-home-update-arrow") +
                '</div>') +
            '</div>' +
        '</div>';

    const templates = {
        "mods-home": () =>
            '<div class="mods-home-head">' + block("title") + block("l1ng-sk-line meta") + '</div>' +
            '<div class="mods-category-grid">' + repeat(12, () =>
                '<div class="mods-category-tile">' + block("l1ng-sk-line") + block("l1ng-sk-line sm") + '</div>'
            ) + '</div><div class="mods-home-panels">' +
                block("mods-home-panel") + block("mods-home-panel") + '</div>',

        "mods-list": () =>
            '<div class="mods-list-toolbar">' + block("l1ng-sk-line crumb") + block("l1ng-sk-pill search") + '</div>' +
            '<div class="sk-mods-scroll"><div class="mods-card-grid">' + repeat(12, card) + '</div></div>',

        "mods-table": () =>
            '<div class="mods-list-toolbar">' + block("l1ng-sk-line crumb") + block("l1ng-sk-pill search") + '</div>' +
            '<div class="sk-mods-scroll"><div class="mods-table-shell"><div class="mods-table-head">' +
            repeat(4, () => block("l1ng-sk-line")) + '</div>' + repeat(18, () =>
                '<div class="mods-table-row">' + repeat(4, () => block("l1ng-sk-line sm")) + '</div>'
            ) + '</div></div>',

        "l1ng-home": () =>
            '<div class="l1ng-home-hero"><div class="l1ng-home-hero-inner">' +
                block("l1ng-sk-line hero-kicker") + block("hero-title") +
                block("l1ng-sk-line hero-description") +
                '<div class="sk-home-creator-links">' + repeat(4, () =>
                    '<div class="sk-home-creator-link">' + block("sk-home-creator-icon") +
                    block("sk-home-creator-label") + '</div>') + '</div>' +
                homeUpdates() +
            '</div>' + block("sk-scroll-hint") + '</div>' +
            '<div class="sk-home-projects">' + title() + '<div class="sk-home-project-grid">' +
            repeat(3, feature) + '</div></div>',

        "l1ng-changelog": () =>
            '<div class="sk-changelog-header">' + block("sk-changelog-brand") +
                '<div class="sk-changelog-versions">' + repeat(5, () => block("sk-index-link")) + '</div>' +
                block("sk-language") + '</div>' +
            '<div class="sk-changelog-body">' + eyebrow() + block("sk-changelog-title") +
                block("sk-wide-copy") + block("sk-medium-copy") +
                '<div class="sk-changelog-pills">' + repeat(6, () => block("sk-status-pill")) + '</div>' +
                repeat(5, releaseRow) + '</div>',

        "genealogy-exporter": () =>
            bar("product") +
            '<div class="sk-exporter-hero"><div class="sk-exporter-copy">' +
                eyebrow() + block("sk-exporter-title") + block("sk-wide-copy") +
                block("sk-medium-copy") + block("sk-wide-copy") + twoButtons() +
            '</div><div class="sk-exporter-visual"><div class="sk-exporter-visual-head"></div>' +
                '<div class="sk-exporter-portrait-row">' + repeat(3, () => block("sk-exporter-portrait")) + '</div>' +
                block("sk-medium-copy") + '</div></div>' +
            '<div class="sk-exporter-features">' + repeat(7, feature) + '</div>' +
            '<div class="sk-realdate-body">' + documentSection(4) +
            documentSection(3) + documentRows(4) + '</div>',

        "translations": () =>
            bar("translations") +
            '<div class="sk-translations-hero"><div class="sk-translations-copy">' + eyebrow() +
                '<div class="sk-translations-title-row">' + block("sk-translation-mark") + block("sk-translation-title") + '</div>' +
                block("sk-wide-copy") + block("sk-medium-copy") + block("sk-wide-copy") +
            '</div><div class="sk-translation-stats">' + repeat(2, () =>
                '<div class="sk-translation-stat">' + block("sk-stat-value") + block("sk-medium-copy") + '</div>'
            ) + '<div class="sk-translation-stat sk-translation-stat-wide">' +
                block("sk-stat-value") + block("sk-medium-copy") + '</div>' +
                block("sk-translation-summary-note") + '</div></div>' +
            '<div class="sk-translations-body">' + title() +
                '<div class="sk-translation-toolbar">' + block("sk-search") +
                    repeat(3, () => block("sk-filter")) + '</div>' +
                '<div class="sk-translation-grid">' + repeat(8, () =>
                    '<div class="sk-translation-card">' + rowLines() + block("sk-button") + '</div>'
                ) + '</div>' + documentSection(3) + documentSection(3) + '</div>',

        "realdate-home": () =>
            bar("realdate") +
            '<div class="sk-realdate-home-hero"><div class="sk-realdate-copy">' +
                eyebrow() + block("sk-realdate-title") + block("sk-wide-copy") +
                block("sk-medium-copy") + block("sk-wide-copy") + twoButtons() +
                '<div class="sk-realdate-release">' + repeat(3, () =>
                    '<div class="sk-realdate-release-item">' + block("sk-release-label") +
                    block("sk-release-value") + '</div>') + '</div>' +
            '</div><div class="sk-calendar-scene"><div class="sk-calendar-sheet">' +
                block("sk-medium-copy") + block("sk-section-title") +
                '<div class="sk-calendar-days">' + repeat(28, () => block("sk-calendar-day")) + '</div>' +
            '</div><div class="sk-calendar-floating">' + rowLines() + '</div></div></div>' +
            '<div class="sk-realdate-home-features">' + repeat(6, feature) + '</div>' +
            '<div class="sk-realdate-body">' + title() + '<div class="sk-feature-grid">' +
            repeat(2, feature) + '</div></div>',

        "realdate-download": () =>
            rd() + '<div class="sk-realdate-body">' + title() +
                '<div class="sk-download-card"><div class="sk-download-copy">' +
                    rowLines() + twoButtons() + '</div><div class="sk-download-files">' + rowLines() + '</div></div>' +
                title() + '<div class="sk-step-grid">' + repeat(3, feature) + '</div>' +
            documentSection(3) + documentSection(2) + documentRows(7) + '</div>',

        "realdate-faq": () =>
            rd("", true) + '<div class="sk-realdate-body sk-faq-list">' +
                '<div class="sk-faq-row">' + block("sk-faq-line") + block("sk-faq-icon") + '</div>' +
                '<div class="sk-faq-answer">' + block("sk-wide-copy") + block("sk-medium-copy") + '</div>' +
                repeat(5, () => '<div class="sk-faq-row">' + block("sk-faq-line") +
                    block("sk-faq-icon") + '</div>') + '</div>',

        "realdate-roadmap": () =>
            rd() + '<div class="sk-realdate-body sk-roadmap-list">' + repeat(5, roadRow) + '</div>',

        "realdate-gameplay": () =>
            rd('<div class="sk-doc-note">' + block("sk-medium-copy") + '</div>') +
                '<div class="sk-realdate-body">' + title() +
                    '<div class="sk-doc-copy">' + rowLines() +
                        '<div class="sk-feature-grid">' + repeat(2, feature) + '</div></div>' +
                        repeat(7, () => documentSection(3)) + '</div>',

        "realdate-compatibility": () =>
            rd() + '<div class="sk-realdate-body">' + title() +
                '<div class="sk-environment-grid">' + repeat(3, feature) + '</div>' +
                title() + '<div class="sk-feature-grid">' + repeat(2, feature) + '</div>' +
                repeat(9, () => documentSection(2)) + '</div>',

        "realdate-changelog": () =>
            rd('<div class="sk-release-facts">' + block("sk-medium-copy") + block("sk-medium-copy") +
                '</div>' + twoButtons()) +
                '<div class="sk-realdate-body sk-changelog-list">' + repeat(8, releaseRow) + '</div>',

        "realdate-content": () => rd() + '<div class="sk-realdate-body sk-feedback-layout">' +
            '<aside class="sk-feedback-aside">' + title() + rowLines() + rowLines() + '</aside>' +
            '<div class="sk-feedback-form">' + title() +
            repeat(5, () => '<div class="sk-feedback-field">' + block("sk-medium-copy") +
                block("sk-feedback-input") + '</div>') +
            block("sk-button") + '</div></div>',
        "l1ng-content": () => bar("home") + '<div class="sk-realdate-body">' + title() + feature() + '</div>',
        "product": () => bar("product") + '<div class="sk-realdate-body">' + title() + feature() + '</div>'
    };

    // 普通文件跟隨 document 捲動；模組索引本身使用獨立 .page-scroll。
    const internalScroll = layout === "mods-list" || layout === "mods-table";
    const skeleton = document.createElement("div");
    skeleton.className = "l1ng-site-skeleton layout-" + layout +
        (internalScroll ? " is-internal-scroll" : " is-document-scroll");
    skeleton.setAttribute("aria-hidden", "true");
    skeleton.innerHTML =
        '<div class="l1ng-sk-shell">' +
            (templates[layout] || templates["l1ng-content"])() +
        '</div>';

    script.insertAdjacentElement("afterend", skeleton);

    let finished = false;
    let layoutObserver = null;
    let heightFrame = 0;

    function sizeToDocument() {
        heightFrame = 0;
        if (finished || internalScroll || !document.body?.getBoundingClientRect || !skeleton.style) return;
        // 使用實際頁面自然高度，不讓骨架自己撐大捲動範圍。
        const height = Math.max(
            document.body.getBoundingClientRect().height,
            document.body.offsetHeight || 0,
            document.documentElement?.clientHeight || 0,
            window.innerHeight || 0
        );
        if (height > 0) skeleton.style.height = Math.ceil(height) + "px";
    }
    function scheduleDocumentHeight() {
        if (!heightFrame && !finished) heightFrame = requestAnimationFrame(sizeToDocument);
    }
    function watchDocument() {
        if (internalScroll || !document.body?.getBoundingClientRect) return;
        sizeToDocument();
        if (typeof window.ResizeObserver === "function") {
            layoutObserver = new window.ResizeObserver(scheduleDocumentHeight);
            layoutObserver.observe(document.body);
        }
        window.addEventListener?.("resize", scheduleDocumentHeight, { passive: true });
    }
    if (!internalScroll) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", watchDocument, { once: true });
        } else watchDocument();
    }

    function ready() {
        if (finished) return;
        finished = true;
        layoutObserver?.disconnect();
        if (heightFrame) cancelAnimationFrame(heightFrame);
        if (!internalScroll) window.removeEventListener?.("resize", scheduleDocumentHeight);
        else {
            // 固定工作區的模組索引：交還骨架捲動進度，避免退場後跳回頂端。
            const placeholder = skeleton.querySelector?.(".sk-mods-scroll");
            const content = document.querySelector?.(".page-scroll");
            if (placeholder && content) content.scrollTop = placeholder.scrollTop;
        }
        skeleton.classList.add("is-hidden");
        let removed = false;
        const remove = () => {
            if (removed) return;
            removed = true;
            skeleton.remove();
        };
        skeleton.addEventListener("transitionend", remove, { once:true });
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) remove();
        else setTimeout(remove, 260); // 被取消的轉場也必須完成退場
    }

    window.L1nGSkeleton = Object.assign(window.L1nGSkeleton || {}, { ready, homeUpdates });

    if (autoReady) {
        const scheduleReady = () =>
            requestAnimationFrame(() =>
                requestAnimationFrame(ready)
            );

        // 等待第一屏的重要圖片，減少骨架先消失而圖片仍留白的跳動。
        // 最多等待 750ms；圖片失敗或網路過慢時仍會解除骨架。
        const waitForFirstScreen = () => {
            const images = [...document.querySelectorAll(
                ".hero img, .page-hero img, .preview-img img, .mod-card img, .translation-card img"
            )].slice(0, 4).filter(image => !image.complete);

            if (!images.length) {
                scheduleReady();
                return;
            }

            let completed = false;
            let limit;
            const finish = () => {
                if (completed) return;
                completed = true;
                clearTimeout(limit);
                scheduleReady();
            };

            limit = setTimeout(finish, 750);
            Promise.all(images.map(image => new Promise(resolve => {
                if (image.complete) {
                    resolve();
                    return;
                }
                image.addEventListener("load", resolve, { once:true });
                image.addEventListener("error", resolve, { once:true });
            }))).then(finish, finish);
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", waitForFirstScreen, { once:true });
        } else {
            waitForFirstScreen();
        }
    }
})();
