/**
 * ==================================================
 * 【關鍵字側邊索引模組】功能主程式
 * ==================================================
 */
async function loadKeywords(placeholderId, categoryList) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
        const response = await fetch(`keywords.json?t=${new Date().getTime()}`);
        const allData = await response.json();

        // 【結構生成】增加 keyword-side-tab (圓弧耳朵)
        let html = `
        <div class="keyword-side-wrapper">
            <div class="keyword-side-tab">索<br>引</div>
            <div class="keyword-cat-list">
        `;

        categoryList.forEach((catName, index) => {
            const list = allData.filter(i => i.cat === catName);
            
            // 【產生區塊】每一個 CAT 為獨立容器
            html += `
            <div class="keyword-cat" style="transition-delay: ${index * 0.05}s">
                <div class="keyword-cat-trigger">${catName}</div>
                <div class="keyword-cat-content">
                    <table class="keyword-table" style="width:100%; border-collapse:collapse;">
                        ${list.map(i => `
                            <tr>
                                <td style="padding: 5px 10px; font-size: 12px;">${i.zh}</td>
                                <td style="padding: 5px 10px; font-size: 11px; color: #888;">${i.en}</td>
                                <td style="padding: 5px; width: 20px;">
                                    <img src="html icons/copy.svg" class="copy-btn" onclick="copyText(this, '${i.en}')">
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>`;
        });

        html += `</div></div>`;
        placeholder.innerHTML = html;
    } catch (error) {
        console.error("載入失敗:", error);
    }
}

/**
 * 【複製控制】純粹複製，無多餘動畫
 */
function copyText(element, text) {
    navigator.clipboard.writeText(text);
    const originalSrc = element.src;
    element.src = 'html icons/check.svg';
    setTimeout(() => { element.src = originalSrc; }, 800);
}
