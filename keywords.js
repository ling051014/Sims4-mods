// ==================================================
// 【keywords.js（純渲染版）】
// 功能：
// 1. 載入 keywords.json 原始數據
// 2. 自動按類別 (cat) 進行分組與排序邏輯
// 3. 生成符合排版要求的 HTML 結構
// （本模組專注於顯示，複製邏輯由全域 JS 處理）
// ==================================================


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
// 【產生 HTML（依 cat 分組）】
// 將扁平資料庫轉換為按分類聚合的 HTML 表格
// ==================================================
function generateKeywordHTML(data) {

    // 暫存分組數據的物件
    const groups = {};

    // 資料分組：依照 item.cat 將項目歸類到對應陣列中
    data.forEach(item => {
        if (!groups[item.cat]) {
            groups[item.cat] = [];
        }
        groups[item.cat].push(item);
    });

    let html = "";

    // 遍歷所有分類建立面板
    Object.keys(groups).forEach(cat => {

        html += `
        <div class="keyword-panel">
            <div class="keyword-tab">${cat}</div>

            <div class="keyword-content">
                <table class="keyword-table">
        `;

        // 產生該分類下的每一列項目 (Row)
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
                    <button class="copy-btn" data-copy="${item.en}">
                        <img src="icons/copy.svg" alt="複製">
                    </button>
                </td>
            </tr>
            `;
        });

        html += `
                </table>
            </div>
        </div>
        `;
    });

    return html;
}


// ==================================================
// 【對外接口】
// 將主程式載入器掛載至全域視窗，以便在 HTML 中執行
// 使用方式：<script>loadKeywords('your-container-id');</script>
// ==================================================
window.loadKeywords = loadKeywords;
