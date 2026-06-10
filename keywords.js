// ==================================================
// 【資料容器】 設定 - 分類儲存物件
// 用於全域儲存處理後的 JSON 資料，結構為 { 類別名稱: [項目1, 項目2...] }
// ==================================================
let keywordGroups = {};

// ==================================================
// 【介面生成 + 載入資料】
// 負責從伺服器取得 JSON，執行資料分組，並觸發介面初始化
// ==================================================
function loadKeywords(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // 確保目標容器存在

    fetch("keywords.json")
        .then(res => res.json())
        .then(data => {

            // 【資料分組】 將扁平的 JSON 資料依照 item.cat 屬性歸類到 keywordGroups 物件中
            keywordGroups = {};
            data.forEach(item => {
                if (!keywordGroups[item.cat]) keywordGroups[item.cat] = [];
                keywordGroups[item.cat].push(item);
            });

            // 【建立 UI】 呼叫 renderUI 產生 HTML 字串並寫入頁面
            container.innerHTML = renderUI();

            // 【事件綁定】 初始化滑鼠懸浮互動邏輯
            bindEvent();
        })
        .catch(err => {
            console.error("載入關鍵字失敗:", err);
            container.innerHTML = "載入失敗";
        });
}

// ==================================================
// 【介面生成】 設定 - 產生側邊懸浮的三層結構
// 結構：容器 > 標題 + 分類列表 + 內容面板(預留位)
// ==================================================
function renderUI() {
    let html = `
    <div class="keyword-side-wrapper">
        <div class="keyword-side-title">關鍵字對照表 ▶</div>
        <div class="keyword-cat-list">
    `;

    // 遍歷所有分類，建立左側分類按鈕 (catCard)
    Object.keys(keywordGroups).forEach(cat => {
        html += `<div class="keyword-cat-card" data-cat="${cat}">${cat} ▶</div>`;
    });

    html += `
        </div>
        <div class="keyword-content-panel"></div>
    </div>
    `;
    return html;
}

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
// 【關鍵字側邊索引模組】 設定 - CAT互斥
// ==================================================
const cats = document.querySelectorAll(".keyword-cat");
cats.forEach(cat => {
    cat.addEventListener("mouseenter", () => {
        // 取消其他展開
        cats.forEach(c => c.classList.remove("active"));
        // 展開當前
        cat.classList.add("active");
    });
});

// ==================================================
// 【對外接口】 將函數掛載至視窗物件，供 HTML 外部呼叫
// ==================================================
window.loadKeywords = loadKeywords;
