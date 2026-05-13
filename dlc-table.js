// ========【表格控制】 修正勾選反應 ========
function ctrlCol(index) {
    // 取得表格
    const table = document.getElementById('map-master-table');
    // 取得行數
    const rows = table.rows;
    for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].cells[index];
        if (cell) {
            // 切換類別
            cell.classList.toggle('hide-item');
        }
    }
}

// ========【橫排控制】 下拉選單篩選 ========
function ctrlRow() {
    // 取得選單
    const select = document.getElementById('map-select');
    // 取得數值
    const filter = select.value;
    // 取得行數
    const rows = document.querySelectorAll('.map-row');
    rows.forEach(row => {
        if (filter === 'all' || row.getAttribute('data-map') === filter) {
            // 符合顯示
            row.classList.remove('hide-item');
        } else {
            // 不符隱藏
            row.classList.add('hide-item');
        }
    });
}

// ========【分類控制】 切換顯示狀態 ========
function ctrlType(typeName) {
    // 取得分類
    const elements = document.getElementsByClassName(typeName);
    for (let i = 0; i < elements.length; i++) {
        // 切換顯示
        if (elements[i].style.display === "none") {
            elements[i].style.display = "";
        } else {
            elements[i].style.display = "none";
        }
    }
}

// ========【排序控制】 設定 - 狀態紀錄 ========

// 排序狀態
// 0 = 未排序
// 1 = 正序
// 2 = 倒序
let sortState = 0;

// 目前排序欄位
let currentSortCol = null;

// ========【初始化】 保存 HTML 原始順序 ========
// 原始 HTML 順序
let originalRows = [];
window.addEventListener('DOMContentLoaded', () => {

    // 取得 tbody
    const tbody = document.querySelector('#map-master-table tbody');
    // 保存真正 HTML 順序
    originalRows = Array.from(tbody.rows);
    // 記錄原始位置
    originalRows.forEach((row, index) => {
        row.dataset.originalIndex = index;
    });
});

// ========【排序功能】========
function sortTable(colIndex) {
    // 取得表格
    const table = document.getElementById('map-master-table');
    // 取得 tbody
    const tbody = table.tBodies[0];
    // 取得標題
    const th = table.querySelectorAll('th')[colIndex];

    // ========【切換排序狀態】========
    // 點不同欄位
    if (currentSortCol !== colIndex) {
        currentSortCol = colIndex;

        // 第一下
        sortState = 1;
    }

    // 點同欄位
    else {
        sortState++;

        // 第三下 → 回原始
        if (sortState > 2) {
            sortState = 0;
        }
    }

    // ========【複製原始 rows】========
    let rows = [...originalRows];

    // ========【未排序】========
    if (sortState === 0) {
        // 完全恢復 HTML 原順序
        rows = [...originalRows];
    }

    // ========【發行日期】========
    else if (colIndex === 0) {
        rows.sort((a, b) => {

            // 取得日期
            const aDate = new Date(a.cells[0].innerText.trim());
            const bDate = new Date(b.cells[0].innerText.trim());

            // 排序結果
            let result;
            
            // ========【日期排序】========
            // 正序
            if (sortState === 1) {
                result = aDate - bDate;
            }
            // 倒序
            else {
                result = bDate - aDate;
            }

            // ========【日期不同】========
            // 直接回傳排序結果
            if (result !== 0) {
                return result;
            }

            // ========【日期相同】========
            // 保持 HTML 原始順序
            return Number(a.dataset.originalIndex)
                - Number(b.dataset.originalIndex);
        });
    }

    // ========【序號】========
    else if (colIndex === 1) {
        rows.sort((a, b) => {
            const aText = a.cells[1].innerText.trim();
            const bText = b.cells[1].innerText.trim();

            // 取得類型
            const aType = aText.match(/[A-Z]+/)[0];
            const bType = bText.match(/[A-Z]+/)[0];

            // 類型順序
            const order = ['EP', 'GP', 'SP', 'FP'];

            const aTypeIndex = order.indexOf(aType);
            const bTypeIndex = order.indexOf(bType);

            // ========【先比 DLC 類型】========
            if (aTypeIndex !== bTypeIndex) {

                // 正序
                if (sortState === 1) {
                    return aTypeIndex - bTypeIndex;
                }

                // 倒序
                else {
                    return bTypeIndex - aTypeIndex;
                }
            }

            // ========【再比數字】========
            const aNum = parseInt(aText.match(/\d+/)[0]);
            const bNum = parseInt(bText.match(/\d+/)[0]);

            // 正序
            if (sortState === 1) {
                return aNum - bNum;
            }

            // 倒序
            else {
                return bNum - aNum;
            }
        });
    }

    // ========【一般文字】========
    else {
        rows.sort((a, b) => {
            const aText = a.cells[colIndex].innerText.trim();
            const bText = b.cells[colIndex].innerText.trim();

            // ========【- 排序控制】========
            // 正序 → - 最後
            if (sortState === 1) {
                if (aText === '-' && bText !== '-') return 1;
                if (aText !== '-' && bText === '-') return -1;
            }

            // 倒序 → - 最前
            else {
                if (aText === '-' && bText !== '-') return -1;
                if (aText !== '-' && bText === '-') return 1;
            }

            // ========【主要文字排序】========
            let result;

            // 正序
            if (sortState === 1) {
                result = aText.localeCompare(bText, 'zh-Hant');
            }

            // 倒序
            else {
                result = bText.localeCompare(aText, 'zh-Hant');
            }

            // ========【文字不同】========
            if (result !== 0) {
                return result;
            }

            // ========【文字相同】========
            // 保持 HTML 原順序
            return Number(a.dataset.originalIndex)
                 - Number(b.dataset.originalIndex);
        });
    }

    // ========【重新填入表格】========
    tbody.innerHTML = '';

    rows.forEach((row) => {
        tbody.appendChild(row);
    });

    // ========【箭頭狀態】========
    table.querySelectorAll('th').forEach((header) => {
        header.classList.remove('asc', 'desc');
    });

    // 第一下 ▼
    if (sortState === 1) {
        th.classList.add('desc');
    }

    // 第二下 ▲
    else if (sortState === 2) {
        th.classList.add('asc');
    }
}

// ========【互動控制】 點擊行變色 (排除標題) ========
document.addEventListener('click', function(e) {
    // 尋找行數
    const tr = e.target.closest('tr');

    // 判定有效：確保點擊的不是 <thead> 內的元素
    if (tr && tr.closest('table') && !tr.closest('thead')) {
        // 取得容器
        const table = tr.closest('table');
        // 清除同表
        table.querySelectorAll('tr').forEach(row => {
            row.classList.remove('selected-row');
        });
        // 套用選取
        tr.classList.add('selected-row');
    }
});

// ========【彈窗控制】 設定 - 點擊外部自動關閉 ========
const dlcModal = document.querySelector('.dlc-modal');

dlcModal.addEventListener('click', (event) => {
    // 取得視窗
    const rect = dlcModal.getBoundingClientRect();
    // 位置判定
    const isInModal = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
    );

    // 點擊外部
    if (!isInModal) {
        // 執行關閉
        dlcModal.close();
    }
});
