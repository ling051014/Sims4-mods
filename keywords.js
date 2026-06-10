// ==================================================
// 【keywords.js（純渲染版）】
// 功能：
// 1. 載入 keywords.json 原始數據
// 2. 自動按類別 (cat) 進行分組與排序邏輯
// 3. 生成符合排版要求的 HTML 結構
// （本模組專注於顯示，複製邏輯由全域 JS 處理）
// ==================================================


// ==================================================
// 【載入 keywords】
// 負責發送請求並將數據傳送給渲染器
// ==================================================
function loadKeywords(containerId, cats = null) {

    const container = document.getElementById(containerId);
    if (!container) return;

    fetch("keywords.json")
        .then(res => res.json())
        .then(data => {

            // === 分類過濾（新增功能）===
            if (cats && cats.length > 0) {
                data = data.filter(item => cats.includes(item.cat));
            }

            container.innerHTML = generateKeywordHTML(data);
        })
        .catch(err => {
            console.error("keywords 載入失敗：", err);
            container.innerHTML = "<span style='color:red;'>載入失敗</span>";
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
