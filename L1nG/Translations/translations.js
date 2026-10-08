document.documentElement.classList.add("js");

const siteHeader = document.getElementById("siteHeader");
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
const searchInput = document.getElementById("translationSearch");
const filterGroup = document.getElementById("translationFilters");
const cards = Array.from(document.querySelectorAll("[data-translation-card]"));
const emptyState = document.getElementById("translationEmpty");

let activeFilter = "all";
let linkedTargetCard = null;
let linkedTargetTimeout = null;

// ========【跨頁漢化定位】 設定 - 僅回應有效卡片錨點，不更動一般分類／搜尋行為 ========
function clearLinkedTarget() {
    if (linkedTargetTimeout !== null) {
        window.clearTimeout(linkedTargetTimeout);
        linkedTargetTimeout = null;
    }
    if (!linkedTargetCard) return;

    linkedTargetCard.classList.remove("is-linked-target");
    linkedTargetCard.querySelector(".translation-target-hint")?.remove();
    linkedTargetCard = null;
}

function revealLinkedTranslation() {
    let targetId = "";

    try {
        targetId = decodeURIComponent(window.location.hash.slice(1));
    } catch (_) {
        clearLinkedTarget();
        return;
    }

    const target = cards.find((card) => card.id === targetId);
    if (!target) {
        clearLinkedTarget();
        return;
    }

    // 使用既有全部分類，避免先前的搜尋或篩選令目標卡被隱藏。
    if (activeFilter !== "all" || (searchInput && searchInput.value)) {
        activeFilter = "all";
        if (searchInput) searchInput.value = "";
        filterGroup?.querySelectorAll("[data-filter]").forEach((button) => {
            button.classList.toggle("active", button.dataset.filter === "all");
        });
        updateTranslations();
    }

    clearLinkedTarget();
    linkedTargetCard = target;
    target.classList.add("visible", "is-linked-target");

    const hint = document.createElement("span");
    hint.className = "translation-target-hint";
    hint.setAttribute("role", "status");
    hint.textContent = "已定位此漢化";
    target.appendChild(hint);

    // 待分類、卡片可見狀態和版面完成後，再避開固定頂條定位。
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            if (linkedTargetCard === target && !target.hidden) {
                target.scrollIntoView({ behavior:"instant", block:"start" });
                // 只短暫提示；計時到後完整還原原本卡片外觀。
                linkedTargetTimeout = window.setTimeout(() => {
                    if (linkedTargetCard === target) clearLinkedTarget();
                }, 1600);
            }
        });
    });
}

window.addEventListener("hashchange", revealLinkedTranslation);

function closeNavigation() {
    if (!mainNav || !navToggle) return;

    mainNav.classList.remove("open");
    navToggle.classList.remove("active");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "開啟導覽選單");
}

if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
        const nextOpen = !mainNav.classList.contains("open");

        mainNav.classList.toggle("open", nextOpen);
        navToggle.classList.toggle("active", nextOpen);
        navToggle.setAttribute("aria-expanded", String(nextOpen));
        navToggle.setAttribute("aria-label", nextOpen ? "關閉導覽選單" : "開啟導覽選單");
    });

    mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeNavigation);
    });
}

function updateHeaderState() {
    if (!siteHeader) return;
    siteHeader.classList.toggle("scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", updateHeaderState, { passive: true });
updateHeaderState();


function normalizeText(value) {
    return String(value || "").trim().toLocaleLowerCase("zh-Hant");
}

function updateTranslations() {
    const query = normalizeText(searchInput ? searchInput.value : "");
    let visibleCount = 0;

    cards.forEach((card) => {
        const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
        const searchText = normalizeText(card.dataset.search);
        const matchesSearch = !query || searchText.includes(query);
        const visible = matchesFilter && matchesSearch;

        card.hidden = !visible;

        if (visible) {
            visibleCount += 1;
        }
    });

    if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
    }
}

if (filterGroup) {
    filterGroup.addEventListener("click", (event) => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;

        clearLinkedTarget();
        activeFilter = button.dataset.filter || "all";

        filterGroup.querySelectorAll("[data-filter]").forEach((item) => {
            item.classList.toggle("active", item === button);
        });

        updateTranslations();
    });
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        clearLinkedTarget();
        updateTranslations();
    });
}

const countTarget = document.querySelector("[data-translation-count]");
const categoryTarget = document.querySelector("[data-category-count]");

if (countTarget) {
    countTarget.textContent = String(cards.length);
}

if (categoryTarget) {
    const categories = new Set(cards.map((card) => card.dataset.category).filter(Boolean));
    categoryTarget.textContent = String(categories.size);
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.08,
            rootMargin: "0px 0px -20px 0px"
        }
    );

    revealItems.forEach((item) => observer.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("visible"));
}

document.addEventListener("click", (event) => {
    if (!mainNav || !navToggle) return;
    if (!mainNav.classList.contains("open")) return;
    if (mainNav.contains(event.target) || navToggle.contains(event.target)) return;

    closeNavigation();
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        closeNavigation();
    }
});

updateTranslations();
revealLinkedTranslation();
