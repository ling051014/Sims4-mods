// ========【頁面載入】 強制顯示年齡驗證 ========
window.addEventListener('load', function () {
    // 顯示遮罩
    document.getElementById("age-verify-overlay").style.display = "flex";
    // 禁止背景滾動
    document.body.style.overflow = "hidden";
});

// ========【跳窗控制】 未成年離開頁面 ========
function leavePage() {
    window.location.href = "index.html";
}

// ========【跳窗控制】 已成年進入頁面 ========
function enterPage() {
    document.getElementById("age-verify-overlay").style.display = "none";
    document.body.style.overflow = "auto";
    // 驗證成年後才開始讀取限制級分類 JSON 與建立模組卡片。
    const container = document.querySelector('.mod-card-region[data-catalog-category="nsfw-mods"]');
    if (container) void window.L1nGModCatalog?.mountCategory(container, 'nsfw-mods');
}
