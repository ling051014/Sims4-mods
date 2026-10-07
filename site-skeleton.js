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

    const templates = {
        "mods-home": () =>
            '<div class="mods-home-head">' +
                block("title") +
                block("l1ng-sk-line meta") +
            '</div>' +
            '<div class="mods-category-grid">' +
                repeat(12, () =>
                    '<div class="mods-category-tile">' +
                        block("l1ng-sk-line") +
                        block("l1ng-sk-line sm") +
                    '</div>'
                ) +
            '</div>' +
            '<div class="mods-home-panels">' +
                block("mods-home-panel") +
                block("mods-home-panel") +
            '</div>',

        "mods-list": () =>
            '<div class="mods-list-toolbar">' +
                block("l1ng-sk-line crumb") +
                block("l1ng-sk-pill search") +
            '</div>' +
            '<div class="mods-card-grid">' +
                repeat(6, card) +
            '</div>',

        "mods-table": () =>
            '<div class="mods-list-toolbar">' +
                block("l1ng-sk-line crumb") +
                block("l1ng-sk-pill search") +
            '</div>' +
            '<div class="mods-table-shell">' +
                '<div class="mods-table-head">' +
                    repeat(4, () => block("l1ng-sk-line")) +
                '</div>' +
                repeat(8, () =>
                    '<div class="mods-table-row">' +
                        repeat(4, () => block("l1ng-sk-line sm")) +
                    '</div>'
                ) +
            '</div>',

        "l1ng-home": () =>
            '<div class="l1ng-home-hero">' +
                '<div class="l1ng-home-hero-inner">' +
                    block("l1ng-sk-line hero-kicker") +
                    block("hero-title") +
                    block("l1ng-sk-line hero-sub") +
                    block("l1ng-sk-pill hero-cta") +
                '</div>' +
            '</div>',

        "l1ng-content": () =>
            header() +
            '<div class="l1ng-content-main">' +
                block("content-title") +
                block("l1ng-sk-line content-sub") +
                '<div class="content-grid">' +
                    repeat(4, () => '<div class="content-panel">' + panelLines() + '</div>') +
                '</div>' +
            '</div>',

        "product": () =>
            header() +
            '<div class="l1ng-content-main">' +
                block("content-title") +
                block("l1ng-sk-line content-sub") +
                '<div class="content-grid">' +
                    repeat(4, () => '<div class="content-panel">' + panelLines() + '</div>') +
                '</div>' +
            '</div>',

        "realdate-home": () =>
            header() +
            '<div class="realdate-hero">' +
                '<div class="realdate-copy">' +
                    block("l1ng-sk-line sm") +
                    block("title") +
                    block("l1ng-sk-line sub") +
                    block("l1ng-sk-line sub") +
                    block("l1ng-sk-pill") +
                '</div>' +
                block("realdate-visual") +
            '</div>' +
            '<div class="realdate-features">' +
                repeat(3, () => '<div class="realdate-feature">' + panelLines() + '</div>') +
            '</div>',

        "realdate-content": () =>
            header() +
            '<div class="realdate-content-main">' +
                block("realdate-page-title") +
                block("l1ng-sk-line realdate-page-sub") +
                repeat(4, () => '<div class="realdate-section">' + panelLines() + '</div>') +
            '</div>',

        "translations": () =>
            header() +
            '<div class="translations-main">' +
                block("translations-title") +
                block("l1ng-sk-line translations-sub") +
                '<div class="translations-tools">' +
                    block("translations-search") +
                    block("translations-filters") +
                '</div>' +
                '<div class="translations-grid">' +
                    repeat(6, () => '<div class="translation-card">' + panelLines() + '</div>') +
                '</div>' +
            '</div>'
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
