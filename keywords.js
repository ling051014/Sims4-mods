// ==================================================
// 初始化一個空物件，用來儲存分類後的資料
// 例如：{ "妝容": [...], "面部配飾": [...] }
// ==================================================
const groups = {};

// 遍歷原始資料陣列 (data)
data.forEach(item => {
    // 檢查該類別是否存在於 groups 中
    // 如果該類別還沒被建立過，就先初始化為一個空陣列
    if (!groups[item.cat]) {
        groups[item.cat] = [];
    }
    
    // 將當前的項目 (item) 推入對應類別的陣列中
    groups[item.cat].push(item);
});

// ==================================================
// 載入關鍵字資料並渲染至指定容器
// @param {string} containerId - 目標容器的 HTML ID
// @param {Array} cats - 選填參數，若傳入陣列則只顯示符合這些分類的項目
// ==================================================
function loadKeywords(containerId, cats = null) {

    const container = document.getElementById(containerId);
    // 防錯機制：若目標容器不存在，則結束函式
    if (!container) return;

    fetch("keywords.json")
        .then(res => res.json()) // 解析 JSON 數據
        .then(data => {

            // === 分類過濾邏輯 ===
            // 檢查是否有傳入 cats 參數且陣列非空
            if (cats && cats.length > 0) {
                // 使用 filter 篩選出 cat 屬性存在於 cats 陣列中的項目
                data = data.filter(item => cats.includes(item.cat));
            }

            // 將篩選後的資料 (或完整資料) 傳入渲染函式並填入容器
            container.innerHTML = generateKeywordHTML(data);
        })
        .catch(err => {
            // 錯誤處理：捕獲網路異常或 JSON 格式錯誤
            console.error("關鍵字對照表載入失敗：", err);
            container.innerHTML = "<span style='color:red;'>對照表載入失敗，請稍後再試</span>";
        });
}

// ==================================================
// 【產生 HTML（雙層索引懸浮版）】
// 將資料分組後，分別構建「左側索引列」與「右側詳細內容區」
// ==================================================
function generateKeywordHTML(data) {

    // ========【資料分組】 設定 - 依 cat 分類 ========
    // 建立字典物件，將所有項目按 cat 屬性進行歸類
    const groups = {};
    data.forEach(item => {
        if (!groups[item.cat]) {
            groups[item.cat] = [];
        }
        groups[item.cat].push(item);
    });

    let html = "";

    // ========【主結構】 設定 - 包裹整個左右分欄的容器 ========
    html += `<div class="keyword-cat-wrapper">`;

    // ========【左側CAT】 設定 - 索引清單 ========
    html += `<div class="keyword-cat-list">`;
    // 遍歷所有類別，產生左側導航按鈕
    Object.keys(groups).forEach((cat, index) => {
        // 設定預設第一個類別為 active (啟動狀態)
        html += `
        <div class="keyword-cat ${index === 0 ? 'active' : ''}" data-cat="${cat}">
            ${cat}
        </div>
        `;
    });
    html += `</div>`;

    // ========【右側內容】 設定 - 所有類別對應的內容區 ========
    html += `<div class="keyword-content-area">`;
    Object.keys(groups).forEach((cat, index) => {
        // 只有預設的第一個內容區顯示 (show)
        html += `
        <div class="keyword-content ${index === 0 ? 'show' : ''}" data-cat="${cat}">
            <table class="keyword-table">
        `;

        // 在該類別下生成對應的每一行數據
        groups[cat].forEach(item => {
            html += `
            <tr>
                <td class="keyword-zh">${item.zh}</td>
                <td class="keyword-en">${item.en}</td>
                <td>
                    <button class="copy-btn" data-copy="${item.en}">
                        <img class="copy-icon" src="icons/copy.svg" alt="">
                    </button>
                </td>
            </tr>
            `;
        });

        html += `
            </table>
        </div>
        `;
    });

    html += `</div></div>`; // 關閉內容區與主容器

    return html;
}

// ==================================================
// 【滑鼠懸浮切換效果】
// 監聽左側索引的滑鼠移入事件，自動同步顯示右側對應內容
// ==================================================
document.addEventListener("mouseover", (e) => {
    // 透過事件代理找出點擊到的索引按鈕
    const cat = e.target.closest(".keyword-cat");
    if (!cat) return; // 若點擊的不是左側索引列，直接跳過

    // 取得該索引按鈕對應的類別名稱
    const target = cat.dataset.cat;

    // 清除所有索引按鈕的 active 狀態
    document.querySelectorAll(".keyword-cat").forEach(el => {
        el.classList.remove("active");
    });

    // 清除所有內容區域的 show 狀態 (隱藏所有)
    document.querySelectorAll(".keyword-content").forEach(el => {
        el.classList.remove("show");
    });

    // 將當前滑鼠移入的按鈕標記為 active
    cat.classList.add("active");

    // 透過屬性選擇器找到對應類別的內容區，並加上 show 類別顯示出來
    // (使用 ?. 安全取值運算子，防止找不到元素時報錯)
    document.querySelector(`.keyword-content[data-cat="${target}"]`)
        ?.classList.add("show");
});

// ==================================================
// 【對外接口】
// 將主程式載入器掛載至全域視窗，以便在 HTML 中執行
// 使用方式：<script>loadKeywords('your-container-id');</script>
// ==================================================
window.loadKeywords = loadKeywords;
