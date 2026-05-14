// ===================================================
// ========【表格控制】 勾選反應 ========
// ===================================================
function ctrlCol(index) {
    // 取得表格元素
    const table = document.getElementById('map-master-table');
    // 如果表格不存在則跳出
    if (!table) return;

    // 取得表格內所有的行
    const allRows = table.rows;

    for (let i = 0; i < allRows.length; i++) {
        // 取得該行指定索引的儲存格
        const cell = allRows[i].cells[index];
        if (cell) {
            // 切換隱藏類別 (hide-item)
            cell.classList.toggle('hide-item');
        }
    }
}

// ===================================================
// ========【橫排控制】 下拉選單篩選 ========
// ===================================================
function ctrlRow() {
    // 取得下拉選單元素
    const select = document.getElementById('map-select');
    if (!select) return;

    // 取得選單當前的值
    const filter = select.value;
    // 取得所有標記為 .map-row 的行
    const rows = document.querySelectorAll('.map-row');

    rows.forEach(row => {
        // 判定：若值為 all 或 符合該行 data-map 屬性
        if (filter === 'all' || row.getAttribute('data-map') === filter) {
            // 符合則顯示 (移除隱藏類別)
            row.classList.remove('hide-item');
        }
        else {
            // 不符則隱藏 (加入隱藏類別)
            row.classList.add('hide-item');
        }
    });
}

// ===================================================
// ========【分類控制】 切換顯示狀態 ========
// ===================================================
function ctrlType(typeName) {
    // 取得所有該分類類別名稱的元素
    const elements = document.getElementsByClassName(typeName);

    for (let i = 0; i < elements.length; i++) {
        // 切換樣式顯示狀態
        if (elements[i].style.display === "none") {
            // 若隱藏則清除 display 屬性恢復顯示
            elements[i].style.display = "";
        }
        else {
            // 若顯示則設為 none 隱藏
            elements[i].style.display = "none";
        }
    }
}

// ===================================================
// ========【排序控制】 狀態與變數紀錄 ========
// ===================================================
let sortState = 0;              // 紀錄狀態：0=原始, 1=正序, 2=倒序
let currentSortCol = null;       // 紀錄當前點擊的欄位索引
let originalRows = [];          // 用於儲存初始 HTML 順序的備份陣列

// ===================================================
// ========【DLC排序核心解析器】 ========
// ===================================================
// 定義 DLC 類型的優先權順序
const DLC_ORDER = ['EP', 'GP', 'SP', 'FP'];

function parseDLC(text) {
    // 抓取文字中的英文類型 (如 EP, GP 等)
    const type = (text.match(/[A-Z]+/) || [''])[0];
    // 取得該類型在自定義順序陣列中的位置索引
    const typeIndex = DLC_ORDER.indexOf(type);

    // 抓取文字中的數字編號 (如 01, 82) 並轉為整數
    const num = parseInt((text.match(/\d+/) || ['0'])[0]);

    // 回傳解析後的類型、索引與數字
    return { type, typeIndex, num };
}

// ===================================================
// ========【1. 載入 DLC 表格】 ========
// ===================================================
function loadDLCTable(containerId) {
    // 取得外部 HTML 要插入的容器
    const container = document.getElementById(containerId);
    if (!container) return;

    // 抓取外部的 dlc-table.html
    fetch('dlc-table.html')
        .then(res => res.text()) // 轉為文字格式
        .then(html => {
            // 寫入 HTML
            container.innerHTML = html;

            // 等待瀏覽器完成 DOM 渲染
            requestAnimationFrame(() => {
                const table = document.getElementById('map-master-table');
                if (!table) return;
                // 表格確定存在後執行初始化
                initTable();
            });
        })
        .catch(err => console.error("載入 HTML 失敗:", err));
}

// ===================================================
// ========【2. 初始化表格】 ========
// ===================================================
function initTable() {
    // 取得表格與內部的 tbody
    const table = document.getElementById('map-master-table');
    if (!table) return;

    const tbody = table.tBodies[0];
    if (!tbody) return;

    // 將 tbody 內的所有行轉為陣列並存入 originalRows
    originalRows = Array.from(tbody.rows);

    // 幫每一行加上 data-original-index 屬性紀錄原始位置
    originalRows.forEach((row, index) => {
        row.dataset.originalIndex = index;
    });

    console.log("✔ 表格初始化完成");
}

// ===================================================
// ========【3. 排序核心功能】 ========
// ===================================================
function sortTable(colIndex) {
    const table = document.getElementById('map-master-table');
    if (!table) return;

    const tbody = table.tBodies[0];
    if (!tbody) return;

    // 取得被點擊的表頭 (th) 元素
    const th = table.querySelectorAll('th')[colIndex];

    // 切換排序狀態邏輯
    if (currentSortCol !== colIndex) {
        // 若點擊新欄位，重置為正序
        currentSortCol = colIndex;
        sortState = 1;
    }
    else {
        // 若點擊同欄位，在 0, 1, 2 之間循環
        sortState = (sortState + 1) % 3;
    }

    // 複製原始陣列準備排序
    let rows = [...originalRows];

    if (sortState === 0) {
        // 回歸原始順序
        rows = [...originalRows];
    }
    else {
        // 執行排序邏輯
        rows.sort((a, b) => {
            let result = 0;

            // 欄位索引 0：發行日期
            if (colIndex === 0) {
                const parseDate = (text) => {
                    const m = text.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
                    if (!m) return 0;
                    return new Date(m[1], m[2] - 1, m[3]).getTime();
                };

                const aTime = parseDate(a.cells[0]?.innerText || '');
                const bTime = parseDate(b.cells[0]?.innerText || '');

                // 先依日期排序
                result = (sortState === 1) ? aTime - bTime : bTime - aTime;

                // 若日期相同，依 DLC 序號排序
                if (result === 0) {
                    const aDlc = parseDLC(a.cells[1]?.innerText || '');
                    const bDlc = parseDLC(b.cells[1]?.innerText || '');
                    result = (sortState === 1)
                        ? aDlc.num - bDlc.num
                        : bDlc.num - aDlc.num;
                }
            }

            // 欄位索引 1：DLC 序號
            else if (colIndex === 1) {
                const aText = a.cells[1]?.innerText.trim() || '';
                const bText = b.cells[1]?.innerText.trim() || '';

                const aDlc = parseDLC(aText);
                const bDlc = parseDLC(bText);

                // DLC 類型優先
                if (aDlc.typeIndex !== bDlc.typeIndex) {
                    result = (sortState === 1) ? aDlc.typeIndex - bDlc.typeIndex : bDlc.typeIndex - aDlc.typeIndex;
                }
                else {
                    // DLC 編號排序
                    result = (sortState === 1) ? aDlc.num - bDlc.num : bDlc.num - aDlc.num;
                }
            }

            // 其餘欄位：地圖 / 職業 / 種族 / 一般文字 / ★ / -// 其餘欄位：地圖 / 職業 / 種族 / 一般文字 / ★ / -
            else {
                const aText = a.cells[colIndex].innerText.trim();
                const bText = b.cells[colIndex].innerText.trim();
                const aDlc = parseDLC(a.cells[1]?.innerText || '');
                const bDlc = parseDLC(b.cells[1]?.innerText || '');

                // 1. 定義權重 (數字越小越靠前)
                const getWeight = (text) => {
                    if (text.includes('★')) return 1; // 星星最優先
                    if (text === '-') return 3;       // 減號最後
                    return 2;                        // 一般文字在中間
                };

                const weightA = getWeight(aText);
                const weightB = getWeight(bText);

                // ======== 【第一步：比權重】 ========
                if (weightA !== weightB) {
                    result = (sortState === 1) ? weightA - weightB : weightB - weightA;
                } 
                // ======== 【第二步：權重一樣 (例如兩邊都是星星，或兩邊都是普通文字)】 ========
                else {
                    // 比 DLC 類型
                    if (aDlc.typeIndex !== bDlc.typeIndex) {
                        result = (sortState === 1) ? aDlc.typeIndex - bDlc.typeIndex : bDlc.typeIndex - aDlc.typeIndex;
                    } 
                    // 比 DLC 編號
                    else if (aDlc.num !== bDlc.num) {
                        result = (sortState === 1) ? aDlc.num - bDlc.num : bDlc.num - aDlc.num;
                    }
                    // ======== 【第三步：DLC 也一樣，比文字】 ========
                    else {
                        result = (sortState === 1)
                            ? aText.localeCompare(bText, 'zh-Hant')
                            : bText.localeCompare(aText, 'zh-Hant');
                    }
                }
            }

            // 若排序結果相同，則依原始索引排列確保穩定排序
            return result !== 0
                ? result
                : Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
        });
    }
    
    // ===================================================
    // ========【重新渲染排序後內容】 ========
    // ===================================================

    // 清空 tbody 並重新塞入排序後的 rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));

    // ===================================================
    // ========【更新排序箭頭樣式】 ========
    // ===================================================

    // 移除所有排序樣式
    table.querySelectorAll('th').forEach(t => {
        t.classList.remove('asc', 'desc');
    });

    // 加入當前排序樣式
    if (sortState === 1) {
        th.classList.add('desc');
    }
    else if (sortState === 2) {
        th.classList.add('asc');
    }
}

// ===================================================
// ========【點擊行選取】 ========
// ===================================================
document.addEventListener('click', function (e) {
    // 取得點擊目標向上尋找最近的 tr
    const tr = e.target.closest('tr');

    // 確保點擊的是 tbody 內部的行
    if (tr && tr.closest('tbody')) {
        const table = tr.closest('table');
        // 移除同表格內所有行的選取類別
        table.querySelectorAll('tr').forEach(row =>
            row.classList.remove('selected-row')
        );
        // 為當前點擊行加上選取類別
        tr.classList.add('selected-row');
    }
});

// ===================================================
// ========【頁面啟動】 ========
// ===================================================
window.addEventListener('DOMContentLoaded', () => {
    // 呼叫載入 DLC 表格函式
    loadDLCTable('home-table-placeholder');
});
