// ==================================================
// 【關鍵控制】 設定 - CAT 互動切換
// 透過監聽所有分類觸發器，實現懸浮展開與自動收合的效果
// ==================================================
document.querySelectorAll('.keyword-cat-trigger').forEach(trigger => {

    // 【展開控制】 設定 - 當滑鼠進入標題區時，展開對應分類
    trigger.addEventListener('mouseenter', () => {

        const parentCat = trigger.parentElement;

        // 【狀態標記】 設定 - 標記目前分類為啟用狀態，以觸發 CSS 樣式變化
        parentCat.classList.add('active');

        // 【內容展開】 設定 - 滑出動畫
        // 透過修改樣式屬性，觸發預先定義在 CSS 中的過渡動畫 (transition)
        const content = parentCat.querySelector('.keyword-cat-content');
        content.style.maxHeight = '500px';       // 設定足夠高度以展開內容
        content.style.transform = 'translateX(0)'; // 從位移狀態回到原位
        content.style.opacity = '1';              // 淡入顯示
        content.style.pointerEvents = 'auto';     // 恢復滑鼠互動能力

        // 【互斥收合】 設定 - 關閉其他非當前目標的 CAT
        // 遍歷所有分類節點，確保同一時間只有一個分類處於開啟狀態
        document.querySelectorAll('.keyword-cat').forEach(cat => {
            if (cat !== parentCat) {
                // 移除其他項目的啟用標記
                cat.classList.remove('active');

                // 將其他項目的樣式重置為隱藏狀態
                const c = cat.querySelector('.keyword-cat-content');
                c.style.maxHeight = '0';                 // 收縮高度
                c.style.transform = 'translateX(-20px)'; // 保持向左位移
                c.style.opacity = '0';                   // 淡出消失
                c.style.pointerEvents = 'none';          // 禁用滑鼠互動，避免點擊到隱藏元素
            }
        });
    });

    // ==================================================
    // 【收合控制】 設定 - 滑鼠離開時收合當前分類
    // ==================================================
    trigger.addEventListener('mouseleave', () => {

        const parentCat = trigger.parentElement;

        // 移除啟用標記
        parentCat.classList.remove('active');

        // 將當前內容重置為隱藏狀態
        const content = parentCat.querySelector('.keyword-cat-content');
        content.style.maxHeight = '0';
        content.style.transform = 'translateX(-20px)'); // 增加向左位移的隱藏效果
        content.style.opacity = '0';
        content.style.pointerEvents = 'none';
    });
});
