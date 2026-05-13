// ===================================================
// ========【表格控制】 勾選反應 ========
// ===================================================
function ctrlCol(index) {
    // 取得表格
    const table = document.getElementById('map-master-table');
    // 防呆：表格不存在則跳出
    if (!table) return;

    // 取得表格所有行
    const allRows = table.rows;
    for (let i = 0; i < allRows.length; i++) {
        // 取得該行對應索引的儲存格
        const cell = allRows[i].cells[index];
        if (cell) {
            // 切換隱藏樣式
            cell.classList.toggle('hide-item');
        }
    }
}

// ===================================================
// ========【橫排控制】 下拉選單篩選 ========
// ===================================================
function ctrlRow() {
    // 取得選單
    const select = document.getElementById('map-select');
    if (!select) return;

    // 取得選取的值
    const filter = select.value;
    // 取得所有具有 .map-row 類別的行
    const rows = document.querySelectorAll('.map-row');

    rows.forEach(row => {
        // 判定：值為 all 或是 符合資料標記
        if (filter === 'all' || row.getAttribute('data-map') === filter) {
            // 符合則移除隱藏類別
            row.classList.remove('hide-item');
        } else {
            // 不符則加入隱藏類別
            row.classList.add('hide-item');
        }
    });
}

// ===================================================
// ========【分類控制】 切換顯示狀態 ========
// ===================================================
function ctrlType(typeName) {
    // 取得所有該分類名稱的元素
    const elements = document.getElementsByClassName(typeName);
    for (let i = 0; i < elements.length; i++) {
        // 判斷目前顯示狀態並切換
        if (elements[i].style.display === "none") {
            elements[i].style.display = "";
        } else {
            elements[i].style.display = "none";
        }
    }
}

// ===================================================
// ========【排序控制】 狀態與變數紀錄 ========
// ===================================================
// 排序狀態紀錄：0 = 未排序, 1 = 正序, 2 = 倒序
let sortState = 0;
// 目前排序的欄位索引
let currentSortCol = null;
// 保存 HTML 原始順序的陣列
let originalRows = []; 

// ===================================================
// ========【1. 載入 DLC 表格】 ========
// ===================================================
function loadDLCTable(containerId) {
    // 取得放置表格的容器
    const container = document.getElementById(containerId);
    if (!container) return;

    // 讀取外部 HTML 檔案
    fetch('dlc-table.html')
        .then(res => res.text())
        .then(html => {
            // 將內容寫入容器
            container.innerHTML = html;

            // 確保內容渲染後執行初始化 (使用 requestAnimationFrame 避免時間差錯誤)
            requestAnimationFrame(() => {
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

    // 將當前 rows 轉換成陣列備份
    originalRows = Array.from(tbody.rows);

    // 幫每一行加上原始序號，確保穩定排序
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

    // 取得點擊的標題元素
    const th = table.querySelectorAll('th')[colIndex];

    // 切換排序狀態邏輯
    if (currentSortCol !== colIndex) {
        currentSortCol = colIndex;
        sortState = 1;
    } else {
        sortState = (sortState + 1) % 3;
    }

    // 複製備份的 rows 進行排序
    let rows = [...originalRows];

    if (sortState === 0) {
        // 回歸原始 HTML 順序
        rows = [...originalRows];
    } else {
        rows.sort((a, b) => {
            let result = 0;

            // [發行日期排序]
            if (colIndex === 0) {
                const parseDate = (text) => {
                    const match = text.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
                    if (!match) return 0;
                    return new Date(match[1], match[2] - 1, match[3]).getTime();
                };
                const aTime = parseDate(a.cells[0]?.innerText || '');
                const bTime = parseDate(b.cells[0]?.innerText || '');
                result = (sortState === 1) ? aTime - bTime : bTime - aTime;
            }
            // [序號排序] 比對 EP/GP/SP/FP 類型順序
            else if (colIndex === 1) {
                const aText = a.cells[1]?.innerText.trim() || '';
                const bText = b.cells[1]?.innerText.trim() || '';
                const order = ['EP', 'GP', 'SP', 'FP'];
                const aType = (aText.match(/[A-Z]+/) || [''])[0];
                const bType = (bText.match(/[A-Z]+/) || [''])[0];
                const aTypeIdx = order.indexOf(aType);
                const bTypeIdx = order.indexOf(bType);

                if (aTypeIdx !== bTypeIdx) {
                    result = (sortState === 1) ? aTypeIdx - bTypeIdx : bTypeIdx - aTypeIdx;
                } else {
                    const aNum = parseInt((aText.match(/\d+/) || [0])[0]);
                    const bNum = parseInt((bText.match(/\d+/) || [0])[0]);
                    result = (sortState === 1) ? aNum - bNum : bNum - aNum;
                }
            }
            // [一般文字排序]
            else {
                const aText = a.cells[colIndex].innerText.trim();
                const bText = b.cells[colIndex].innerText.trim();
                
                // 處理 '-' 字串排至最後
                if (sortState === 1) {
                    if (aText === '-' && bText !== '-') return 1;
                    if (aText !== '-' && bText === '-') return -1;
                } else {
                    if (aText === '-' && bText !== '-') return -1;
                    if (aText !== '-' && bText === '-') return 1;
                }
                
                // 使用中文語系進行文字比對
                result = (sortState === 1) 
                    ? aText.localeCompare(bText, 'zh-Hant') 
                    : bText.localeCompare(aText, 'zh-Hant');
            }

            // 若內容相同，則依照原始標記索引排列
            return result !== 0 ? result : Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
        });
    }

    // 清空 tbody 並重新填入排序後的 rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));

    // 移除所有標題的箭頭樣式並重新賦予
    table.querySelectorAll('th').forEach(t => t.classList.remove('asc', 'desc'));
    if (sortState === 1) th.classList.add('desc');
    else if (sortState === 2) th.classList.add('asc');
}

// ===================================================
// ========【點擊行選取效果】 ========
// ===================================================
document.addEventListener('click', function (e) {
    // 取得點擊目標最近的 tr 元素
    const tr = e.target.closest('tr');
    // 確保點擊的是 tbody 內的行
    if (tr && tr.closest('tbody')) {
        const table = tr.closest('table');
        // 清除該表內所有選取樣式
        table.querySelectorAll('tr').forEach(row => row.classList.remove('selected-row'));
        // 幫被點擊的行加上選取樣式
        tr.classList.add('selected-row');
    }
});

// ===================================================
// ========【頁面啟動】 ========
// ===================================================
window.addEventListener('DOMContentLoaded', () => {
    // 啟動表格載入程序
    loadDLCTable('home-table-placeholder');
});
