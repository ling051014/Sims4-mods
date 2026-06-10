// ==================================================
// 【資料容器】 設定 - 分類儲存物件
// ==================================================
let keywordGroups = {};

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
// 【資料載入】 設定 - 讀取 JSON
// ==================================================
function loadKeywords(containerId) {

    const container = document.getElementById(containerId);

    // 防呆
    if (!container) return;

    fetch("keywords.json")
        .then(res => res.json())
        .then(data => {

            // 【資料分類】 設定 - cat 分組
            keywordGroups = {};

            data.forEach(item => {
                if (!keywordGroups[item.cat]) {
                    keywordGroups[item.cat] = [];
                }
                keywordGroups[item.cat].push(item);
            });

            // 【畫面渲染】 設定 - 建立DOM
            container.innerHTML = renderUI();

            // 【事件綁定】 設定 - hover控制
            bindEvent();

        })
        .catch(err => {
            console.error(err);
            container.innerHTML = "載入失敗";
        });
}

// ==================================================
// 【介面生成】 設定 - UI結構
// ==================================================
function renderUI() {

    let html = "";

    html += `
    <div class="keyword-side-wrapper">

        <!-- ===== 第一層：標題（固定）===== -->
        <div class="keyword-side-title">
            關鍵字對照表 ▶
        </div>

        <!-- ===== 第二層：CAT列表 ===== -->
        <div class="keyword-cat-panel">
    `;

    Object.keys(keywordGroups).forEach(cat => {

        html += `
        <div class="keyword-cat" data-cat="${cat}">
            ${cat} ▶
        </div>
        `;
    });

    html += `
        </div>

        <!-- ===== 第三層：內容區 ===== -->
        <div class="keyword-content-panel"></div>

    </div>
    `;

    return html;
}

// ==================================================
// 【互動控制】 設定 - hover行為
// ==================================================
function bindEvent() {

    const wrapper = document.querySelector(".keyword-side-wrapper");
    const content = document.querySelector(".keyword-content-panel");

    if (!wrapper) return;

    // 【面板展開】 設定 - 顯示CAT
    wrapper.addEventListener("mouseenter", () => {
        wrapper.classList.add("open");
    });

    wrapper.addEventListener("mouseleave", () => {
        wrapper.classList.remove("open");
        content.innerHTML = "";
    });

    // 【CAT hover】 設定 - 顯示對照表
    document.querySelectorAll(".keyword-cat").forEach(el => {

        el.addEventListener("mouseenter", () => {

            const cat = el.dataset.cat;
            const list = keywordGroups[cat] || [];

            // 清除 active
            document.querySelectorAll(".keyword-cat")
                .forEach(c => c.classList.remove("active"));

            el.classList.add("active");

            // 【內容渲染】 設定 - 右側表格
            content.innerHTML = `
                <div class="keyword-content-box">
                    <div class="keyword-content-title">${cat}</div>

                    <table class="keyword-table">
                        ${list.map(item => `
                            <tr>
                                <td class="keyword-zh">${item.zh}</td>
                                <td class="keyword-en">${item.en}</td>
                                <td>
                                    <button class="copy-btn" data-copy="${item.en}">
                                        📋
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </table>
                </div>
            `;
        });
    });
}

// ==================================================
// 【對外接口】
// 將主程式載入器掛載至全域視窗，以便在 HTML 中執行
// 使用方式：<script>loadKeywords('your-container-id');</script>
// ==================================================
window.loadKeywords = loadKeywords;
