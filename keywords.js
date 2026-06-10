// ==================================================
// 【關鍵字側邊面板】
// 自動產生分類與表格
// ==================================================

document.addEventListener("DOMContentLoaded", () => {

    // 放置關鍵字面板的容器
    const container =
        document.getElementById("keywords-container");

    // 找不到容器就結束
    if (!container) return;

    // 開始組 HTML
    let html = "";

    keywordsData.forEach(group => {

        html += `
        <div class="keyword-panel">

            <!-- 側邊露出的標籤 -->
            <div class="keyword-tab">
                ${group.cat}
            </div>

            <!-- 滑出的內容 -->
            <div class="keyword-content">

                <table class="keyword-table">
        `;

        group.items.forEach(item => {

            html += `
            <tr>

                <td class="keyword-en">
                    ${item.en}
                </td>

                <td class="keyword-zh">
                    ${item.zh}
                </td>

                <td>

                    <button
                        class="copy-btn"
                        data-copy="${item.en}">

                        <img
                            src="icons/copy.svg"
                            alt="複製">

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
});
