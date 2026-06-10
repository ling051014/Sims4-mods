// ==================================================
// 【關鍵控制】 設定 - 自動載入模組主函式
// ==================================================
async function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
        // 【遠端讀取】 加上時間戳強制繞過 GitHub 快取
        const response = await fetch(`keywords.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('找不到 keywords.json');
        const allData = await response.json();

        // 【結構生成】 一次性建立外框、分類與表格，讓 CSS 的 max-height 能正確計算
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

        // 初始化手機版點擊事件
        initListeners();

    } catch (error) {
        console.error("讀取資料失敗:", error);
    }
}

// ==================================================
// 【互動控制】 設定 - 點擊展開互斥 (主要針對手機版)
// ==================================================
function initListeners() {
    document.querySelectorAll('.keyword-cat').forEach(catEl => {
        catEl.addEventListener('click', (e) => {
            // 如果點到複製按鈕，不要觸發收合
            if (e.target.closest('.copy-btn')) return; 
            
            // 點擊時，關閉其他分類，只展開自己
            document.querySelectorAll('.keyword-cat').forEach(c => {
                if (c !== catEl) c.classList.remove('active');
            });
            catEl.classList.toggle('active');
        });
    });
}

// ==================================================
// 【複製控制】 設定 - 處理剪貼簿寫入與圖示切換
// ==================================================
function copyText(element, text) {
    navigator.clipboard.writeText(text);
    const originalSrc = element.src;
    element.src = 'html icons/check.svg';
    element.style.opacity = '0.5';
    setTimeout(() => { 
        element.src = originalSrc; 
        element.style.opacity = '1';
    }, 1000);
}
