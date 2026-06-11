// ===================================================
// ========【關鍵字對照表】 載入外部資料模組 ========
// ===================================================
async function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    // 【遠端讀取】開始異步抓取關鍵字資料
    fetch(`keywords.json?t=${new Date().getTime()}`)
        
        // 【階段一】接收回應，印出狀態碼以便除錯
        .then(res => {
            console.log('HTTP 狀態碼:', res.status);
            if (!res.ok) throw new Error('讀取資料失敗');
            return res.json();
        })

        // 【階段二】抓取資料後，生成並插入 HTML 結構
        .then(allData => {
            console.log('✔ 關鍵字對照表初始化完成');
            
            // 【結構生成】建立圓弧膠囊列表外框
            let html = `
            <div class="keyword-side-wrapper">
                <div class="keyword-side-tab">關鍵字對照表</div>
                <div class="keyword-cat-list">
            `;

            categoryList.forEach(catName => {
                const list = allData.filter(i => i.cat === catName);
                
                // 【產生區塊】確保每個 CAT 為獨立容器且結構完整
                html += `
                <div class="keyword-cat" style="transition-delay: ${index * 0.05}s">
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
        })
        
        // 【階段三】發生異常時的安全防禦回退
        .catch(error => {
            console.error('關鍵字對照表載入失敗:', error);
            placeholder.innerHTML = '<span style="color:red;">關鍵字對照表載入失敗，請稍後再試。' + error.message + '</span>';
        });
}

// ==================================================
// 【複製控制】執行剪貼與圖示切換
// ==================================================
function copyText(element, text) {
    // 【寫入剪貼】系統執行複製動作
    navigator.clipboard.writeText(text);
    
    // 【路徑設定】定義前後兩個圖示
    const originalIcon = 'html icons/copy.svg';
    const checkIcon = 'html icons/check.svg';
    
    // 【圖示變更】切換為打勾圖示
    element.src = checkIcon;
    
    // 【恢復圖示】一秒後變回原始
    setTimeout(() => { 
        element.src = originalIcon; 
    }, 1000);
}
