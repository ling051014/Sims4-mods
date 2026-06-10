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
// 【產生 HTML（雙層懸浮選單版）】
// 功能：將資料依照 CAT 進行分組，並建立「類別標題 → 子選單表格」的結構
// 第一層：CAT 分類 (點擊或 hover 時會展開)
// 第二層：該分類下的詳細對照表
// ==================================================
function generateKeywordHTML(data) {

    // ========【資料分組】 設定 - 依 CAT 分類 ========
    // 建立一個關聯物件，用於存放分組後的資料
    const groups = {};

    // 遍歷所有項目，根據 cat 屬性將其歸類到對應陣列中
    data.forEach(item => {
        // 如果該分類尚未初始化，則建立一個新陣列
        if (!groups[item.cat]) {
            groups[item.cat] = [];
        }
        // 將項目加入對應分類
        groups[item.cat].push(item);
    });

    let html = "";

    // ========【分類清單】 設定 - CAT 索引 ========
    // 遍歷分類物件的 Key (即所有類別名稱)
    Object.keys(groups).forEach(cat => {

        // 建立外層區塊，包含類別標題與隱藏的選單區
        html += `
        <div class="keyword-cat">

            <div class="keyword-cat-title">
                ${cat} ▶
            </div>

            <div class="keyword-submenu">

                <table class="keyword-table">
        `;

        // ========【內容產生】 設定 - 產生該類別下的每一列 ========
        groups[cat].forEach(item => {

            html += `
            <tr>
                <td class="keyword-zh">
                    ${item.zh}
                </td>

                <td class="keyword-en">
                    ${item.en}
                </td>

                <td>
                    <button
                        class="copy-btn"
                        data-copy="${item.en}"
                    >
                        <img
                            class="copy-icon"
                            src="icons/copy.svg"
                            alt=""
                        >
                    </button>
                </td>
            </tr>
            `;

        });

        // 關閉表格與分類容器
        html += `
                </table>
            </div>

        </div>
        `;
    });

    // 將組裝完成的 HTML 字串回傳給外層呼叫函數
    return html;
}

// ==================================================
// 【對外接口】
// 將主程式載入器掛載至全域視窗，以便在 HTML 中執行
// 使用方式：<script>loadKeywords('your-container-id');</script>
// ==================================================
window.loadKeywords = loadKeywords;
