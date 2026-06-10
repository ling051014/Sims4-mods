// ==================================================
// 【互動控制】 設定 - 管理滑鼠懸浮與內容切換
// ==================================================
function bindEvent() {
    const wrapper = document.querySelector(".keyword-side-wrapper");
    const title = wrapper.querySelector(".keyword-side-title");
    const catCards = wrapper.querySelectorAll(".keyword-cat-card");
    const contentPanel = wrapper.querySelector(".keyword-content-panel");

    if (!wrapper) return;

    // --- Hover 標題 - 展開主面板 ---
    title.addEventListener("mouseenter", () => wrapper.classList.add("open"));
    
    // --- 當滑鼠移出整個容器時，重置所有狀態與內容 ---
    wrapper.addEventListener("mouseleave", () => {
        wrapper.classList.remove("open");
        catCards.forEach(c => c.classList.remove("active"));
        contentPanel.classList.remove("show");
        contentPanel.innerHTML = "";
    });

    // --- Hover 各個分類卡片 ---
    catCards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            const cat = card.dataset.cat; // 取得目標分類名稱
            const list = keywordGroups[cat] || []; // 從全域物件中提取對應資料

            // 隱藏其他分類的啟動樣式，並標記當前分類為 active
            catCards.forEach(c => c !== card ? c.classList.remove("active") : c.classList.add("active"));

            // 動態渲染右側內容區：使用 map 將資料陣列轉為 HTML 表格列
            contentPanel.innerHTML = `
                <div class="keyword-content-box">
                    <div class="keyword-content-title">${cat}</div>
                    <table class="keyword-table">
                        ${list.map(item => `
                            <tr>
                                <td class="keyword-zh">${item.zh}</td>
                                <td class="keyword-en">${item.en}</td>
                                <td>
                                    <button class="copy-btn" data-copy="${item.en}">📋</button>
                                </td>
                            </tr>
                        `).join("")}
                    </table>
                </div>
            `;
            // 顯示內容面板
            contentPanel.classList.add("show");
        });
    });
}
// ==================================================
// 為所有分類的標題觸發器 (.keyword-cat-trigger) 綁定事件
// ==================================================
document.querySelectorAll('.keyword-cat-trigger').forEach(trigger => {
    
    // 【展開邏輯】當滑鼠移入標題時
    trigger.addEventListener('mouseenter', () => {
        // 取得當前分類的父容器 (.keyword-cat)
        const parentCat = trigger.parentElement;
        
        // 加入 active 類別以標記該項為選中狀態
        parentCat.classList.add('active');
        
        // 設定內容區域的最大高度，觸發 CSS 的展開動畫 (假設 500px 足以顯示內容)
        parentCat.querySelector('.keyword-cat-content').style.maxHeight = '500px';

        // 【互斥收合邏輯】確保同一時間只有一個分類展開
        // 遍歷所有分類容器，檢查是否為當前操作對象
        document.querySelectorAll('.keyword-cat').forEach(cat => {
            // 如果不是當前移入的分類，則將其收合並移除 active 狀態
            if (cat !== parentCat) {
                cat.classList.remove('active');
                cat.querySelector('.keyword-cat-content').style.maxHeight = '0';
            }
        });
    });

    // 【收合邏輯】當滑鼠移出標題時
    trigger.addEventListener('mouseleave', () => {
        const parentCat = trigger.parentElement;
        
        // 移除 active 樣式
        parentCat.classList.remove('active');
        
        // 將高度歸零，觸發 CSS 收合動畫
        parentCat.querySelector('.keyword-cat-content').style.maxHeight = '0';
    });
});

// ==================================================
// 【對外接口】 將函數掛載至視窗物件，供 HTML 外部呼叫
// ==================================================
window.loadKeywords = loadKeywords;
