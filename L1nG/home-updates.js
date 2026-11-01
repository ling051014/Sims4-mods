// ========【首頁更新日誌】 插入 home-updates.html，僅顯示日期最新的五筆公開公告 ========
(() => {
    "use strict";

    const mount = document.getElementById("homeChangelogMount");
    if (!mount) return;

    // 首屏骨架淡出後，沿用相同佔位直到 changelog.html 載入完畢。
    const skeletonMarkup = window.L1nGSkeleton?.homeUpdates?.();
    if (skeletonMarkup) mount.innerHTML = skeletonMarkup;

    const english = document.documentElement.lang.toLowerCase().startsWith("en");
    const errorMessage = english
        ? "Recent announcements are temporarily unavailable."
        : "目前無法載入最新更新。";

    async function insertChangelog() {
        try {
            const response = await fetch("home-updates.html", { cache: "no-cache" });
            if (!response.ok) throw new Error("Changelog request failed");

            const source = new DOMParser().parseFromString(await response.text(), "text/html");
            const section = source.querySelector("[data-home-changelog]");
            const list = section?.querySelector(".home-updates-list");
            if (!section || !list) throw new Error("Changelog section missing");

            const releases = Array.from(list.children).filter(item =>
                item.matches("li[data-release-date]") &&
                /^\d{4}-\d{2}-\d{2}$/.test(item.dataset.releaseDate) &&
                item.querySelector("a.home-update-link[href]")
            );
            if (!releases.length) throw new Error("No public releases");

            releases.sort((a, b) => b.dataset.releaseDate.localeCompare(a.dataset.releaseDate));
            list.replaceChildren(...releases.slice(0, 5));
            for (const [index, item] of Array.from(list.children).entries()) {
                item.style.setProperty("--release-index", index);
            }

            const imported = document.importNode(section, true);
            mount.replaceChildren(imported);
            if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                imported.classList.add("is-loaded");
            }
        } catch (_) {
            const message = document.createElement("p");
            message.className = "home-changelog-loading";
            message.textContent = errorMessage;
            mount.replaceChildren(message);
        } finally {
            mount.setAttribute("aria-busy", "false");
        }
    }

    insertChangelog();
})();
