// ==================================================
// 【關鍵控制】 設定 - 載入模組主函式
// ==================================================
function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    // 【外層容器】 設定 - 生成 HTML 基礎結構
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
            <div class="keyword-cat-content"></div>
        </div>`;
    });

    html += `</div></div>`;
    placeholder.innerHTML = html;

    // 【事件綁定】 設定 - 初始化所有互動監聽
    initListeners();
}

// ==================================================
// 【互動控制】 設定 - 統一管理分類狀態與內容載入
// ==================================================
function initListeners() {
    document.querySelectorAll('.keyword-cat').forEach(catEl => {
        // 【展開控制】 設定 - 當滑鼠移入時觸發
        catEl.addEventListener('mouseenter', () => {
            // 【狀態互斥】 設定 - 先移除其他分類的啟用狀態
            document.querySelectorAll('.keyword-cat').forEach(c => c.classList.remove('active'));
            
            // 【內容填入】 設定 - 根據分類名稱動態載入對應清單
            const catName = catEl.getAttribute('data-category');
            const contentDiv = catEl.querySelector('.keyword-cat-content');
            
            // 注意：這裡假設您有一個全域變數 keywordData 存放您的 JSON 資料
            if (typeof window.keywordData !== 'undefined') {
                const filteredData = window.keywordData.filter(item => item.cat === catName);
                contentDiv.innerHTML = `<table class="keyword-table">${filteredData.map(item => `
                    <tr>
                        <td class="keyword-zh">${item.zh}</td>
                        <td class="keyword-en">${item.en}</td>
                        <td class="keyword-copy">
                            <img src="html icons/copy.svg" class="copy-btn" onclick="copyText(this, '${item.en}')">
                        </td>
                    </tr>
                `).join('')}</table>`;
            }
            
            // 【啟用狀態】 設定 - 將當前分類標記為啟用
            catEl.classList.add('active');
        });
    });
}

// ==================================================
// 【複製控制】 設定 - 處理剪貼簿寫入與圖示切換
// ==================================================
function copyText(element, text) {
    // 【剪貼操作】 設定 - 將文字寫入剪貼簿
    navigator.clipboard.writeText(text);
    
    // 【圖示替換】 設定 - 暫存原圖並切換為完成狀態
    const originalSrc = element.src;
    element.src = 'html icons/check.svg';
    element.style.opacity = '0.5';

    // 【恢復顯示】 設定 - 延遲一秒後恢復原始圖示
    setTimeout(() => { 
        element.src = originalSrc; 
        element.style.opacity = '1';
    }, 1000);
}
