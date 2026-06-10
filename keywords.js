// ==================================================
// 【關鍵控制】 設定 - 自動載入模組主函式
// ==================================================
async function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
        // 【遠端讀取】 確保讀取最新的 JSON 資料
        const response = await fetch(`keywords.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('讀取資料失敗');
        const allData = await response.json();

        // 【結構生成】 一次性產生與您 CSS 完美對應的 HTML 結構
        let html = `
        <div class="keyword-side-wrapper">
            <div class="keyword-side-title">關鍵字對照表 ▶</div>
            <div class="keyword-cat-list">
        `;

        categoryList.forEach(catName => {
            const list = allData.filter(i => i.cat === catName);
            
            html += `
            <div class="keyword-cat">
                <div class="keyword-cat-trigger">${catName}</div>
                <div class="keyword-cat-content">
                    <table class="keyword-table">
                        ${list.map(i => `
                            <tr>
                                <td class="keyword-zh">${i.zh}</td>
                                <td class="keyword-en">${i.en}</td>
                                <td class="keyword-copy">
                                    <img src="html icons/copy.svg" class="copy-btn" onclick="copyText(this, '${i.en}')">
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>`;
        });

        html += `</div></div>`;
        placeholder.innerHTML = html;

    } catch (error) {
        // 【錯誤處理】 輸出讀取失敗原因
        console.error("載入失敗:", error);
    }
}

// ==================================================
// 【複製控制】 設定 - 處理剪貼簿寫入與圖示切換
// ==================================================
function copyText(element, text) {
    // 【寫入動作】 將文字存入系統剪貼簿
    navigator.clipboard.writeText(text);
    
    // 【圖示變更】 暫時切換圖示以提供回饋
    const originalSrc = element.src;
    element.src = 'html icons/check.svg';
    element.style.opacity = '0.5';
    
    // 【恢復圖示】 一秒後恢復原本圖示
    setTimeout(() => { 
        element.src = originalSrc; 
        element.style.opacity = '1';
    }, 1000);
}
