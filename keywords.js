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
// 【產生 HTML】
// 建立「CAT手風琴單層展開結構」
// 功能：將資料依照類別分組，並組合成可摺疊的面板 HTML
// ==================================================
function generateKeywordHTML(data) {

    // ========【資料分組】 設定 ========
    // 建立一個物件，用於將所有關鍵字按其類別 (cat) 進行索引分類
    const groups = {};
    data.forEach(item => {
        // 如果該類別尚未建立，則初始化為空陣列
        if (!groups[item.cat]) {
            groups[item.cat] = [];
        }
        // 將該項目加入到所屬的類別陣列中
        groups[item.cat].push(item);
    });

    let html = "";

    // ========【外層容器】 設定 ========
    // 建立一個包裹所有關鍵字組件的容器，方便透過 CSS 控制位置與顯示
    html += `<div class="keyword-side-wrapper">`;

    // ========【標題列】 設定 ========
    // 面板的頂部固定標題，通常用於顯示列表名稱或收合總開關
    html += `
    <div class="keyword-side-title">
        關鍵字對照表 ▶
    </div>
    `;

    // ========【CAT清單】 設定 ========
    // 遍歷所有分好的類別，為每個類別建立一個「手風琴」區塊
    Object.keys(groups).forEach(cat => {

        // 每個分類的容器，包含觸發開關與內容區域
        html += `
        <div class="keyword-cat">

            <div class="keyword-cat-trigger">
                ${cat} ▶
            </div>

            <div class="keyword-cat-content">
                <table class="keyword-table">
        `;

        // 產生該類別下所有的關鍵字行
        groups[cat].forEach(item => {
            html += `
            <tr>
                <td class="keyword-zh">${item.zh}</td>
                <td class="keyword-en">${item.en}</td>
                <td>
                    <button class="copy-btn" data-copy="${item.en}">
                        <img src="icons/copy.svg" alt="">
                    </button>
                </td>
            </tr>
            `;
        });

        // 關閉表格、內容區與分類容器
        html += `
                </table>
            </div>
        </div>
        `;
    });

    // 關閉最外層的容器
    html += `</div>`;
    return html;
}

// ==================================================
// 【滑鼠互動】
// CAT hover 展開 / 收合控制
// 功能：監聽滑鼠懸浮事件，自動更新分類按鈕的選中狀態
// ==================================================
document.addEventListener("mouseover", (e) => {

    // 判斷滑鼠是否懸浮在某個分類區域 (.keyword-cat)
    const cat = e.target.closest(".keyword-cat");
    // 取得選單的最外層容器
    const wrapper = document.querySelector(".keyword-side-wrapper");

    // 防錯：若選單容器不存在，直接停止執行
    if (!wrapper) return;

    // 取得所有分類按鈕的節點列表
    const cats = document.querySelectorAll(".keyword-cat");

    // ========【重置狀態】 設定 ========
    // 遍歷所有分類，將之前的 .active 樣式全部移除
    // 這確保了同一時間只有一個類別會處於展開/選中狀態
    cats.forEach(c => c.classList.remove("active"));

    // 若當前滑鼠懸浮在某個分類上
    if (cat) {
        // 為該分類添加 .active 樣式
        // 後續 CSS 可根據此類別控制子選單 (.keyword-submenu) 的顯示
        cat.classList.add("active");
    }
});

// ==================================================
// 【對外接口】
// 將主程式載入器掛載至全域視窗，以便在 HTML 中執行
// 使用方式：<script>loadKeywords('your-container-id');</script>
// ==================================================
window.loadKeywords = loadKeywords;
