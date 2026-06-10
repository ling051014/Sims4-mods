/**
 * ==================================================
 * 【關鍵字側邊索引模組】功能主程式
 * 1. 遠端讀取 keywords.json
 * 2. 建立三層結構：外層wrapper -> 耳朵tab -> 內容清單cat
 * 3. 處理複製動作與圖示切換
 * ==================================================
 */

async function loadKeywords(placeholderId, categoryList) {
    // 【獲取容器】鎖定目標 ID
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
        // 【資料讀取】加入時間戳記 t，強制破解瀏覽器 GitHub Pages 快取
        const response = await fetch(`keywords.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('找不到 keywords.json');
        const allData = await response.json();

        // 【結構生成】一次性建立三層 HTML 架構
        let html = `
        <div class="keyword-side-wrapper">
            <div class="keyword-side-tab"><span>索</span><span>引</span></div>
            <div class="keyword-cat-list">
        `;

        // 【資料處理】根據 categoryList 分類渲染
        categoryList.forEach(catName => {
            const list = allData.filter(i => i.cat === catName);
            
            // 【渲染內容】生成分類與對應表格
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
                                    <img src="html icons/copy.svg" class="copy-btn" onclick="copyText(this, '${i.en}')" width="16">
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
        // 【錯誤處理】若資料請求失敗，於控制台顯示原因
        console.error("模組初始化錯誤:", error);
    }
}

/**
 * 【複製控制】處理剪貼簿寫入
 * 參數 element: 被點擊的圖示
 * 參數 text: 欲複製的內容
 */
function copyText(element, text) {
    // 寫入剪貼簿
    navigator.clipboard.writeText(text);
    
    // 圖示切換邏輯
    const originalSrc = element.src;
    element.src = 'html icons/check.svg';
    element.style.opacity = '0.5';
    
    // 延遲復原
    setTimeout(() => { 
        element.src = originalSrc; 
        element.style.opacity = '1';
    }, 1000);
}
