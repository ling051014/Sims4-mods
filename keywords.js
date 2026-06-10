// ==================================================
// 【關鍵控制】 設定 - CAT 互動切換
// 只負責切換 active 狀態，動畫全部交給 CSS
// ==================================================
document.querySelectorAll('.keyword-cat-trigger').forEach(trigger => {

    // 【展開控制】 設定 - 滑鼠進入展開當前 CAT
    trigger.addEventListener('mouseenter', () => {

        const parentCat = trigger.parentElement;

        // 【關鍵狀態】 設定 - 移除其他 active
        document.querySelectorAll('.keyword-cat').forEach(cat => {
            if (cat !== parentCat) {
                cat.classList.remove('active');
            }
        });

        // 【關鍵狀態】 設定 - 啟用當前 CAT
        parentCat.classList.add('active');
    });

    // 【收合控制】 設定 - 滑鼠離開時收合當前 CAT
    trigger.addEventListener('mouseleave', () => {

        const parentCat = trigger.parentElement;

        // 【關鍵狀態】 設定 - 移除 active
        parentCat.classList.remove('active');
    });
});
