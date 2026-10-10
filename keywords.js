// ========【關鍵字複製圖示】 SVG 筆劃與提取器頁面一致 ========
const keywordCopyIcon = () => `<svg class="l1ng-copy-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect class="l1ng-copy-stroke" x="8" y="8" width="12" height="12" rx="2" stroke-dasharray="43.314 90" style="--stroke-hide:45.314"/>
    <path class="l1ng-copy-stroke" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke-dasharray="29.427 80" style="--stroke-hide:31.427"/>
    <path class="l1ng-check-stroke" d="M5 12.5l4.2 4.2L19 7" stroke-dasharray="19.728 70" style="--stroke-hide:21.728"/>
</svg>`;
const keywordAttr = (value) => String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])
);

// ===================================================
// ========【關鍵字對照表】 載入外部資料模組 ========
// ===================================================
async function loadKeywords(placeholderId, categoryList) {
    // 【獲取容器】取得對應頁面元素
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    // 【遠端讀取】開始異步抓取資料
    fetch(`keywords.json?t=${new Date().getTime()}`)
        // 【狀態檢查】檢查回應是否成功
        .then(res => {
            if (!res.ok) throw new Error('讀取資料失敗');
            return res.json();
        })
        // 【資料處理】生成並插入 HTML 結構
        .then(allData => {
            // 【產生架構】定義主包裝容器
            let html = `
            <div class="keyword-side-wrapper">
                <div class="keyword-side-tab">關鍵字</div>
                <div class="keyword-cat-list">
            `;

            // 【迴圈生成】依照類別建立膠囊
            categoryList.forEach((catName, index) => {
                // 【篩選資料】取出當前分類內容
                const list = allData.filter(i => i.cat === catName);
                
                // 【建立膠囊】注入階梯延遲變數
                html += `
                <div class="keyword-cat" style="--delay: ${index * 0.08}s">
                    <div class="keyword-cat-trigger">${catName}</div>
                    <div class="keyword-cat-content">
                        <table class="keyword-table">
                            ${list.map(i => `
                                <tr>
                                    <td class="keyword-zh">${i.zh}</td>
                                    <td class="keyword-en">${i.en}</td>
                                    <td class="keyword-copy">
                                        <button type="button" class="copy-btn" data-copy="${keywordAttr(i.en)}" title="點擊複製" aria-label="複製 ${keywordAttr(i.en)}">${keywordCopyIcon()}</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                </div>`;
            });

            // 【封裝結尾】完成所有節點生成
            html += `</div></div>`;
            placeholder.innerHTML = html;

            // 【獲取物件】抓取側邊列與膠囊
            const wrapper = placeholder.querySelector('.keyword-side-wrapper');
            const cats = wrapper.querySelectorAll('.keyword-cat');

            // 【事件綁定】滑入膠囊進行切換
            cats.forEach(cat => {
                cat.addEventListener('mouseenter', () => {
                    // 【啟動模式】加入選取狀態類別
                    wrapper.classList.add('cat-selected');
                    // 【互斥邏輯】移除其他 active
                    cats.forEach(c => c.classList.remove('active'));
                    // 【設定狀態】標記當前為 active
                    cat.classList.add('active');
                });
            });

            // 【滑出重置】離開區域即重置
            wrapper.addEventListener('mouseleave', () => {
                // 【移除模式】離開區域即關閉
                wrapper.classList.remove('cat-selected');
                // 【清除狀態】重置所有 active
                cats.forEach(c => c.classList.remove('active'));
            });
        })
        
        // 【異常捕獲】處理錯誤提示顯示
        .catch(error => {
            console.error('關鍵字對照表載入失敗:', error);
            placeholder.innerHTML = '<span style="color:red;">關鍵字對照表載入失敗，請稍後再試。' + error.message + '</span>';
        });
}

