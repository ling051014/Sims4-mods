// ==================================================
// 【關鍵控制】 設定 - 改為監聽整個 CAT 容器
// 統一管理分類狀態，避免滑鼠移動時觸發抖動
// ==================================================
document.querySelectorAll('.keyword-cat').forEach(cat => {

    // ==================================================
    // 【展開控制】 設定 - 當滑鼠移入整個分類時
    // ==================================================
    cat.addEventListener('mouseenter', () => {
        // 【狀態互斥】 設定 - 先關閉其他所有分類
        document.querySelectorAll('.keyword-cat').forEach(c => c.classList.remove('active'));
        
        // 【狀態標記】 設定 - 啟用當前分類的 active 狀態
        cat.classList.add('active');
    });

    // ==================================================
    // 【收合控制】 設定 - 當滑鼠移出整個分類時
    // ==================================================
    cat.addEventListener('mouseleave', () => {
        // 【狀態重置】 設定 - 移除 active 狀態並觸發 CSS 收合
        cat.classList.remove('active');
    });
});
