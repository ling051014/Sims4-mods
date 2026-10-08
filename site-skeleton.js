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


    const bar = (type) =>
        '<div class="sk-sitebar sk-sitebar-' + type + '"><div class="sk-sitebar-inner">' +
            block("sk-brand") + (type === "home" ? "" : block("sk-brand-section")) +
            '<div class="sk-site-links">' +
                repeat(type === "realdate" ? 5 : type === "home" ? 3 : 4, () => block("sk-nav-link")) +
            '</div><div class="sk-site-controls">' + (type === "home" ? "" : block("sk-language")) + block("sk-mobile-menu") +
            '</div></div></div>';
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
    const roadRow = () => '<div class="sk-timeline-row"><span class="sk-timeline-dot"></span><div class="sk-timeline-card">' +
        block("sk-status-pill") + rowLines() + '</div></div>';
    const releaseRow = () => '<div class="sk-release-row"><span class="sk-timeline-dot"></span><div class="sk-release-card">' +
        rowLines() + '<div class="sk-release-grid">' + feature() + feature() + '</div></div></div>';

    const templates = {
        "mods-home": () =>
            '<div class="mods-home-head">' + block("title") + block("l1ng-sk-line meta") + '</div>' +
            '<div class="mods-category-grid">' + repeat(12, () =>
                '<div class="mods-category-tile">' + block("l1ng-sk-line") + block("l1ng-sk-line sm") + '</div>'
            ) + '</div><div class="mods-home-panels">' +
                block("mods-home-panel") + block("mods-home-panel") + '</div>',

        "mods-list": () =>
            '<div class="mods-list-toolbar">' + block("l1ng-sk-line crumb") + block("l1ng-sk-pill search") + '</div>' +
            '<div class="mods-card-grid">' + repeat(6, card) + '</div>',

        "mods-table": () =>
            '<div class="mods-list-toolbar">' + block("l1ng-sk-line crumb") + block("l1ng-sk-pill search") + '</div>' +
            '<div class="mods-table-shell"><div class="mods-table-head">' +
            repeat(4, () => block("l1ng-sk-line")) + '</div>' + repeat(8, () =>
                '<div class="mods-table-row">' + repeat(4, () => block("l1ng-sk-line sm")) + '</div>'
            ) + '</div>',

        "l1ng-home": () =>
            '<div class="l1ng-home-hero"><div class="l1ng-home-hero-inner">' +
                block("l1ng-sk-line hero-kicker") + block("hero-title") +
                block("l1ng-sk-line hero-sub") + block("l1ng-sk-line hero-sub") +
                block("l1ng-sk-pill hero-cta") +
            '</div>' + block("sk-scroll-hint") + '</div>',

        "l1ng-changelog": () =>
            '<div class="sk-changelog-header">' + block("sk-changelog-brand") +
                '<div class="sk-changelog-versions">' + repeat(5, () => block("sk-index-link")) + '</div>' +
                block("sk-language") + '</div>' +
            '<div class="sk-changelog-body">' + eyebrow() + block("sk-changelog-title") +
                block("sk-wide-copy") + block("sk-medium-copy") +
                '<div class="sk-changelog-pills">' + repeat(6, () => block("sk-status-pill")) + '</div>' +
                releaseRow() + releaseRow() + '</div>',

        "genealogy-exporter": () =>
            bar("product") +
            '<div class="sk-exporter-hero"><div class="sk-exporter-copy">' +
                eyebrow() + block("sk-exporter-title") + block("sk-wide-copy") +
                block("sk-medium-copy") + block("sk-wide-copy") + twoButtons() +
            '</div><div class="sk-exporter-visual"><div class="sk-exporter-visual-head"></div>' +
                '<div class="sk-exporter-portrait-row">' + repeat(3, () => block("sk-exporter-portrait")) + '</div>' +
                block("sk-medium-copy") + '</div></div>' +
            '<div class="sk-exporter-features">' + repeat(3, feature) + '</div>',

        "translations": () =>
            bar("home") +
            '<div class="sk-translations-hero"><div class="sk-translations-copy">' + eyebrow() +
                '<div class="sk-translations-title-row">' + block("sk-translation-mark") + block("sk-translation-title") + '</div>' +
                block("sk-wide-copy") + block("sk-medium-copy") + block("sk-wide-copy") +
            '</div><div class="sk-translation-stats">' + repeat(2, () =>
                '<div class="sk-translation-stat">' + block("sk-stat-value") + block("sk-medium-copy") + '</div>'
            ) + '</div></div>' +
            '<div class="sk-translations-body">' + title() +
                '<div class="sk-translation-toolbar">' + block("sk-search") +
                    repeat(3, () => block("sk-filter")) + '</div>' +
                '<div class="sk-translation-grid">' + repeat(4, () =>
                    '<div class="sk-translation-card">' + rowLines() + block("sk-button") + '</div>'
                ) + '</div></div>',

        "realdate-home": () =>
            bar("realdate") +
            '<div class="sk-realdate-home-hero"><div class="sk-realdate-copy">' +
                eyebrow() + block("sk-realdate-title") + block("sk-wide-copy") +
                block("sk-medium-copy") + block("sk-wide-copy") + twoButtons() +
            '</div><div class="sk-calendar-scene"><div class="sk-calendar-sheet">' +
                block("sk-medium-copy") + block("sk-section-title") +
                '<div class="sk-calendar-days">' + repeat(28, () => block("sk-calendar-day")) + '</div>' +
            '</div><div class="sk-calendar-floating">' + rowLines() + '</div></div></div>' +
            '<div class="sk-realdate-home-features">' + repeat(3, feature) + '</div>',

        "realdate-download": () =>
            rd() + docIndex(4) + '<div class="sk-realdate-body">' + title() +
                '<div class="sk-download-card"><div class="sk-download-copy">' +
                    rowLines() + twoButtons() + '</div><div class="sk-download-files">' + rowLines() + '</div></div>' +
                title() + '<div class="sk-step-grid">' + repeat(3, feature) + '</div></div>',

        "realdate-installation": () =>
            rd('<div class="sk-button-row">' + block("sk-button") + '</div>'),

        "realdate-faq": () =>
            rd("", true) + '<div class="sk-realdate-body sk-faq-list">' +
                repeat(7, () => '<div class="sk-faq-row">' + block("sk-faq-line") +
                    block("sk-faq-icon") + '</div>') + '</div>',

        "realdate-roadmap": () =>
            rd() + '<div class="sk-realdate-body sk-roadmap-list">' + repeat(3, roadRow) + '</div>',

        "realdate-gameplay": () =>
            rd('<div class="sk-doc-note">' + block("sk-medium-copy") + '</div>') +
                docIndex(8) + '<div class="sk-realdate-body">' + title() +
                    '<div class="sk-doc-copy">' + rowLines() +
                        '<div class="sk-feature-grid">' + repeat(2, feature) + '</div></div></div>',

        "realdate-compatibility": () =>
            rd() + '<div class="sk-realdate-body">' + title() +
                '<div class="sk-environment-grid">' + repeat(3, feature) + '</div>' +
                title() + '<div class="sk-feature-grid">' + repeat(2, feature) + '</div></div>',

        "realdate-changelog": () =>
            rd('<div class="sk-release-facts">' + block("sk-medium-copy") + block("sk-medium-copy") +
                '</div>' + twoButtons()) +
                '<div class="sk-realdate-body sk-changelog-list">' + releaseRow() + releaseRow() + '</div>',

        "realdate-content": () => rd() + '<div class="sk-realdate-body">' + title() + feature() + '</div>',
        "l1ng-content": () => bar("home") + '<div class="sk-realdate-body">' + title() + feature() + '</div>',
        "product": () => bar("product") + '<div class="sk-realdate-body">' + title() + feature() + '</div>'
    };

    const skeleton = document.createElement("div");
    skeleton.className = "l1ng-site-skeleton layout-" + layout;
    skeleton.setAttribute("aria-hidden", "true");
    skeleton.innerHTML =
        '<div class="l1ng-sk-shell">' +
            (templates[layout] || templates["l1ng-content"])() +
        '</div>';

    script.insertAdjacentElement("afterend", skeleton);

    let finished = false;
    function ready() {
        if (finished) return;
        finished = true;
        skeleton.classList.add("is-hidden");

        const remove = () => skeleton.remove();
        skeleton.addEventListener("transitionend", remove, { once:true });

        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            remove();
        }
    }

    window.L1nGSkeleton = Object.assign(window.L1nGSkeleton || {}, { ready });

    if (autoReady) {
        const scheduleReady = () =>
            requestAnimationFrame(() =>
                requestAnimationFrame(ready)
            );

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", scheduleReady, { once:true });
        } else {
            scheduleReady();
        }
    }
})();
