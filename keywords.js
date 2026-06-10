// ==================================================
// 【keywords.js】
// 功能：
// 1. 讀取 keywords.json（扁平資料）
// 2. 自動依 cat 分組
// 3. 生成分類表格
// 4. 提供複製功能
// ==================================================

document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("keywords-container");

    if (!container) return;

    try {

        // ==================================================
        // 1. 讀取 JSON
        // ==================================================
        const res = await fetch("keywords.json");
        const data = await res.json();

        // ==================================================
        // 2. 自動分組（關鍵）
        // ==================================================
        const groups = {};

        data.forEach(item => {

            if (!groups[item.cat]) {
                groups[item.cat] = [];
            }

            groups[item.cat].push(item);
        });

        // ==================================================
        // 3. 生成 HTML
        // ==================================================
        let html = "";

        Object.keys(groups).forEach(cat => {

            html += `
            <div class="keyword-panel">

                <!-- 左側分類 -->
                <div class="keyword-tab">
                    ${cat}
                </div>

                <!-- 右側內容 -->
                <div class="keyword-content">

                    <table class="keyword-table">
            `;

            groups[cat].forEach(item => {

                html += `
                <tr>

                    <!-- 英文 -->
                    <td class="keyword-en">
                        ${item.en}
                    </td>

                    <!-- 中文 -->
                    <td class="keyword-zh">
                        ${item.zh}
                    </td>

                    <!-- 複製按鈕 -->
                    <td>
                        <button
                            class="copy-btn"
                            data-copy="${item.en}">

                            <img src="icons/copy.svg">

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

        container.innerHTML = html;

    } catch (err) {
        console.error("keywords 讀取失敗：", err);
    }
});
