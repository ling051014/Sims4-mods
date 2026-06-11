// ===================================================
// ========【關鍵字對照表】 強化除錯載入模組 ========
// ===================================================
async function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    // 【遠端讀取】開始異步抓取關鍵字資料
    fetch(`keywords.json?t=${new Date().getTime()}`)
        
        // 【階段一】檢查回應，特別是檔案內容
        .then(res => {
            console.log('HTTP 狀態碼:', res.status); 
            // 如果狀態碼不是 200，這裡會拋出錯誤
            if (!res.ok) throw new Error('HTTP 錯誤代碼: ' + res.status);
            
            // 【關鍵修改】先轉成文字，讓我們檢查內容是不是純文字，還是網頁 HTML
            return res.text(); 
        })
        .then(text => {
            // 【檢查點】如果控制台印出的不是 JSON 字串，而是 <!DOCTYPE html>...
            // 那就是路徑指向了錯誤的檔案（例如 index.html）
            console.log('實際抓取到的檔案內容前 50 字:', text.substring(0, 50));
            
            // 嘗試手動解析 JSON
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error('JSON 解析失敗，檔案內容可能不是 JSON 格式');
            }
        })

        // 【階段二】抓取資料後，生成並插入 HTML 結構
        .then(allData => {
            console.log('✔ 關鍵字對照表初始化完成');
            
            // 【結構生成】建立圓弧膠囊列表外框
            let html = `
            <div class="keyword-side-wrapper">
                <div class="keyword-side-tab">關鍵字<br>對照表</div>
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
