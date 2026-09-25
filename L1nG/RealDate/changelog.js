// ========【版本快速導覽】 設定 - 追蹤目前閱讀版本 ========
(() => {
    "use strict";

    const links = Array.from(
        document.querySelectorAll(
            ".version-link[data-version-target]"
        )
    );

    const releases = Array.from(
        document.querySelectorAll(
            ".release[id]"
        )
    );

    if (!links.length || !releases.length) {
        return;
    }

    function setActiveVersion(versionId) {
        links.forEach((link) => {
            link.classList.toggle(
                "active",
                link.dataset.versionTarget === versionId
            );
        });
    }

    links.forEach((link) => {
        link.addEventListener("click", () => {
            setActiveVersion(
                link.dataset.versionTarget
            );
        });
    });

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntries = entries
                .filter((entry) => entry.isIntersecting)
                .sort(
                    (a, b) =>
                        Math.abs(a.boundingClientRect.top) -
                        Math.abs(b.boundingClientRect.top)
                );

            if (!visibleEntries.length) {
                return;
            }

            setActiveVersion(
                visibleEntries[0].target.id
            );
        },
        {
            root: null,
            rootMargin: "-25% 0px -58% 0px",
            threshold: 0
        }
    );

    releases.forEach((release) => {
        observer.observe(release);
    });

    const hashId =
        window.location.hash.replace("#", "");

    if (
        hashId &&
        releases.some(
            (release) => release.id === hashId
        )
    ) {
        setActiveVersion(hashId);
    }
})();
