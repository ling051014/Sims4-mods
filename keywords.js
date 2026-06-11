// ===================================================
// ========【關鍵字對照表】 載入外部資料模組 ========
// ===================================================
async function loadKeywords(placeholderId, categoryList) {
    // 【獲取容器】取得對應頁面元素
    const placeholder = document.getElementById(placeholderId);
    // 【異常檢查】若容器不存在則終止
    if (!placeholder) return;

    // 【遠端讀取】開始異步抓取資料
    fetch(`keywords.json?t=${new Date().getTime()}`)
        // 【狀態檢查】檢查回應是否成功
        .then(res => {
            if (!res.ok) throw new Error('讀取資料失敗');
            return res.json();
        })
        // 【資料處理】生成並插入 HTML 結構
        .then(allData => {
            // 【產生架構】定義主包裝容器
            let html = `
            <div class="keyword-side-wrapper">
                <div class="keyword-side-tab">關鍵字對照表 ▶</div>
                <div class="keyword-cat-list">
            `;

            // 【迴圈生成】依照類別建立膠囊
            categoryList.forEach((catName, index) => {
                // 【篩選資料】取出當前分類內容
                const list = allData.filter(i => i.cat === catName);
                
                // 【建立膠囊】注入階梯延遲變數
                html += `
                <div class="keyword-cat" style="--delay: ${index * 0.08}s">
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

            // 【封裝結尾】完成所有節點生成
            html += `</div></div>`;
            placeholder.innerHTML = html;

            // 【獲取物件】抓取側邊列與膠囊
            const wrapper = placeholder.querySelector('.keyword-side-wrapper');
            const cats = wrapper.querySelectorAll('.keyword-cat');

            // 【事件綁定】滑入膠囊進行切換
            cats.forEach(cat => {
                cat.addEventListener('mouseenter', () => {
                    // 【啟動模式】加入選取狀態類別
                    wrapper.classList.add('cat-selected');
                    
                    // 【互斥邏輯】移除其他 active
                    cats.forEach(c => c.classList.remove('active'));
                    // 【設定狀態】標記當前為 active
                    cat.classList.add('active');
                });
            });

            // 【重置狀態】滑鼠離開移除全部
            wrapper.addEventListener('mouseleave', () => {
                // 【移除模式】離開區域即關閉
                wrapper.classList.remove('cat-selected');
                // 【清除狀態】重置所有 active
                cats.forEach(c => c.classList.remove('active'));
            });
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
