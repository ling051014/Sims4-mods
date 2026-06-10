// ==================================================
// 【關鍵控制】 設定 - 自動載入模組主函式
// ==================================================
async function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
        // 【遠端讀取】 設定 - 直接讀取您現有的 keywords.json
        const response = await fetch('keywords.json');
        const allData = await response.json();

        // 【結構生成】 設定 - 建立常駐標題與分類容器
        let html = `
        <div class="keyword-side-wrapper">
            <div class="keyword-side-title">關鍵字對照表 ▶</div>
            <div class="keyword-cat-list">
        `;

        // 【層次生成】 設定 - 建立每個分類的 Trigger 與 Content 容器
        categoryList.forEach(catName => {
            html += `
            <div class="keyword-cat" data-category="${catName}">
                <div class="keyword-cat-trigger">${catName}</div>
                <div class="keyword-cat-content"></div>
            </div>`;
        });

        html += `</div></div>`;
        placeholder.innerHTML = html;

        // 【事件綁定】 設定 - 初始化互動監聽並傳入資料
        initListeners(allData);

    } catch (error) {
        console.error("讀取 keywords.json 失敗:", error);
    }
}

// ==================================================
// 【互動控制】 設定 - 管理懸浮、動態載入與狀態互斥
// ==================================================
function initListeners(allData) {
    document.querySelectorAll('.keyword-cat').forEach(catEl => {
        // 【展開控制】 設定 - 滑鼠移入時載入該分類內容
        catEl.addEventListener('mouseenter', () => {
            // 【狀態互斥】 設定 - 標記當前為 active，其餘移除
            document.querySelectorAll('.keyword-cat').forEach(c => c.classList.remove('active'));
            catEl.classList.add('active');
            
            const contentDiv = catEl.querySelector('.keyword-cat-content');
            
            // 【資料渲染】 設定 - 當內容為空時，直接從讀取到的資料進行過濾
            if (contentDiv.innerHTML.trim() === "") {
                const catName = catEl.getAttribute('data-category');
                const list = allData.filter(i => i.cat === catName);
                
                contentDiv.innerHTML = `<table class="keyword-table">${list.map(i => `
                    <tr>
                        <td class="keyword-zh">${i.zh}</td>
                        <td class="keyword-en">${i.en}</td>
                        <td class="keyword-copy">
                            <img src="html icons/copy.svg" class="copy-btn" onclick="copyText(this, '${i.en}')">
                        </td>
                    </tr>
                `).join('')}</table>`;
            }
        });

        // 【收合控制】 設定 - 滑鼠移出時隱藏
        catEl.addEventListener('mouseleave', () => {
            catEl.classList.remove('active');
        });
    });
}

// ==================================================
// 【複製控制】 設定 - 處理剪貼簿寫入與圖示切換
// ==================================================
function copyText(element, text) {
    // 【剪貼操作】 設定 - 只複製英文 text 變數
    navigator.clipboard.writeText(text);
    
    // 【圖示替換】 設定 - 暫存原圖並切換為確認狀態
    const originalSrc = element.src;
    element.src = 'html icons/check.svg';
    element.style.opacity = '0.5';

    // 【恢復顯示】 設定 - 延遲一秒後恢復原始圖示
    setTimeout(() => { 
        element.src = originalSrc; 
        element.style.opacity = '1';
    }, 1000);
}
