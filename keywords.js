// ==================================================
// 【關鍵控制】 設定 - 載入模組主函式
// ==================================================
function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    // 【結構生成】 設定 - 建立常駐標題與分類容器
    let html = `
    <div class="keyword-side-wrapper">
        <div class="keyword-side-title">關鍵字對照表 ▶</div>
        <div class="keyword-cat-list">
    `;

    // 【分類生成】 設定 - 根據陣列建立 CAT 區塊
    categoryList.forEach(catName => {
        html += `
        <div class="keyword-cat" data-category="${catName}">
            <div class="keyword-cat-trigger">${catName}</div>
            <div class="keyword-cat-content">
                </div>
        </div>`;
    });

    html += `</div></div>`;
    placeholder.innerHTML = html;

    // 【事件綁定】 設定 - 初始化互動監聽
    initListeners();
}

// ==================================================
// 【互動控制】 設定 - 管理懸浮、滑出與複製互動
// ==================================================
function initListeners() {
    document.querySelectorAll('.keyword-cat').forEach(catEl => {
        // 【展開控制】 設定 - 滑鼠移入時顯示並填入內容
        catEl.addEventListener('mouseenter', () => {
            document.querySelectorAll('.keyword-cat').forEach(c => c.classList.remove('active'));
            catEl.classList.add('active');
            
            // 如果內容為空，則在此處處理填入邏輯 (省略變數需求，改為純結構操作)
        });

        // 【收合控制】 設定 - 滑鼠移出時隱藏
        catEl.addEventListener('mouseleave', () => {
            catEl.classList.remove('active');
        });
    });
}

// ==================================================
// 【複製控制】 設定 - 處理剪貼簿與圖示切換
// ==================================================
function copyText(element, text) {
    // 【剪貼操作】 設定 - 執行複製
    navigator.clipboard.writeText(text);
    
    // 【圖示替換】 設定 - 暫存原圖並顯示確認圖示
    const originalSrc = element.src;
    element.src = 'html icons/check.svg';
    element.style.opacity = '0.5';

    // 【恢復顯示】 設定 - 1秒後恢復原始圖示
    setTimeout(() => { 
        element.src = originalSrc; 
        element.style.opacity = '1';
    }, 1000);
}
