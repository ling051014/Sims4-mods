// ==================================================
// 【關鍵控制】 設定 - 載入模組主函式
// ==================================================
function loadKeywords(placeholderId, categories) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    // 建立外層容器結構
    let html = `
    <div class="keyword-side-wrapper">
        <div class="keyword-side-title">關鍵字對照表 ▶</div>
    `;

    // 根據傳入的分類名稱建立 CAT 區塊
    categories.forEach(catName => {
        html += `
        <div class="keyword-cat">
            <div class="keyword-cat-trigger">${catName}</div>
            <div class="keyword-cat-content">
                <table class="keyword-table">
                    <tr><td class="keyword-zh">載入中...</td></tr>
                </table>
            </div>
        </div>`;
    });

    html += `</div>`;
    placeholder.innerHTML = html;

    // 綁定監聽事件
    initKeywordListeners();
}

// ==================================================
// 【關鍵控制】 設定 - 統一管理分類狀態
// ==================================================
function initKeywordListeners() {
    document.querySelectorAll('.keyword-cat').forEach(cat => {
        // 展開控制
        cat.addEventListener('mouseenter', () => {
            document.querySelectorAll('.keyword-cat').forEach(c => c.classList.remove('active'));
            cat.classList.add('active');
        });
        // 收合控制
        cat.addEventListener('mouseleave', () => {
            cat.classList.remove('active');
        });
    });
}
