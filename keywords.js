// ==================================================
// 【關鍵字側邊索引模組】功能主程式
//==================================================
async function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
        // 【遠端讀取】獲取 JSON 資料
        const response = await fetch(`keywords.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('讀取資料失敗');
        const allData = await response.json();

        // 【結構生成】建立圓弧耳朵與分類列表
        let html = `
        <div class="keyword-side-wrapper">
            <div class="keyword-side-tab">關鍵字<br>對照表</div>
            <div class="keyword-cat-list">
        `;

        categoryList.forEach(catName => {
            const list = allData.filter(i => i.cat === catName);
            
            // 【產生區塊】確保每個 CAT 為獨立容器
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
        // 【錯誤處理】顯示載入錯誤
        console.error("載入失敗:", error);
    }
}

// ==================================================
// 【複製控制】執行剪貼與圖示切換
// ==================================================
function copyText(element, text) {
    // 【寫入剪貼】執行複製動作
    navigator.clipboard.writeText(text);
    
    // 【路徑設定】請確認您的資料夾內真的有這個檔案
    // 如果檔案名稱不是 check.svg，請在此處修改為您實際的檔名
    const checkIconPath = 'html icons/check.svg'; 
    const originalSrc = element.src;
    
    // 【圖示變更】切換為打勾圖示
    element.src = checkIconPath;
    
    // 【恢復圖示】1秒後切回原始圖示
    setTimeout(() => { 
        element.src = originalSrc; 
    }, 1000);
}

