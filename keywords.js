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
// 【對外接口】 將函數掛載至視窗物件，供 HTML 外部呼叫
// ==================================================
window.loadKeywords = loadKeywords;
