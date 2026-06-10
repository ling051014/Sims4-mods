// ==================================================
// 【關鍵控制】 設定 - 載入模組主函式
// ==================================================
function loadKeywords(placeholderId, categories, dataMap) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    // 建立外層容器結構
    let html = `
    <div class="keyword-side-wrapper">
        <div class="keyword-side-title">關鍵字對照表 ▶</div>
    `;

    // 根據傳入的分類建立 CAT 區塊
    categories.forEach(catName => {
        const items = dataMap[catName] || [];
        html += `
        <div class="keyword-cat">
            <div class="keyword-cat-trigger">${catName}</div>
            <div class="keyword-cat-content">
                <table class="keyword-table">
                    ${items.map(item => `
                        <tr>
                            <td class="keyword-zh">${item.zh}</td>
                            <td class="keyword-en">${item.en}</td>
                            <td class="keyword-copy">
                                <img src="html icons/copy.svg" class="copy-btn" 
                                     onclick="copyText(this, '${item.en}')" alt="複製">
                            </td>
                        </tr>
                    `).join('')}
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
// 【複製功能】 設定 - 處理剪貼簿與圖示切換
// ==================================================
function copyText(element, text) {
    navigator.clipboard.writeText(text);
    
    // 暫存原路徑並切換為確認狀態
    const originalSrc = element.src;
    element.src = 'html icons/check.svg'; // 若有 check.svg 請確認路徑
    element.style.opacity = '0.5';

    // 1 秒後恢復為原本的 copy.svg
    setTimeout(() => {
        element.src = originalSrc;
        element.style.opacity = '1';
    }, 1000);
}

// ==================================================
// 【關鍵控制】 設定 - 統一管理分類狀態
// ==================================================
function initKeywordListeners() {
    document.querySelectorAll('.keyword-cat').forEach(cat => {
        cat.addEventListener('mouseenter', () => {
            document.querySelectorAll('.keyword-cat').forEach(c => c.classList.remove('active'));
            cat.classList.add('active');
        });
        cat.addEventListener('mouseleave', () => {
            cat.classList.remove('active');
        });
    });
}
