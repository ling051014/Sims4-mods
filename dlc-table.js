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

// ========【初始化】 記錄原始順序 ========
window.addEventListener('DOMContentLoaded', () => {
    const rows = document.querySelectorAll('#map-master-table tbody tr');
    rows.forEach((row, index) => {

        // 記錄原始位置
        row.dataset.originalIndex = index;
    });
});

// ========【排序功能】========
function sortTable(colIndex) {
    // 取得表格
    const table = document.getElementById('map-master-table');
    // 取得 tbody
    const tbody = table.tBodies[0];
    // 取得所有列
    let rows = Array.from(tbody.rows);
    // 取得標題
    const th = table.querySelectorAll('th')[colIndex];

    // ========【切換排序狀態】========

    // 點不同欄位 → 重置
    if (currentSortCol !== colIndex) {
        currentSortCol = colIndex;
        sortState = 1;
    }
    else {
        // 同欄位循環
        sortState++;
        // 超過 2 → 回到未排序
        if (sortState > 2) {
            sortState = 0;
        }
    }

    // ========【未排序】========
    if (sortState === 0) {
        rows.sort((a, b) => {
            return a.dataset.originalIndex - b.dataset.originalIndex;
        });
    }

    // ========【發行日期】========
    else if (colIndex === 0) {
        rows.sort((a, b) => {
            const aDate = new Date(a.cells[0].innerText.trim());
            const bDate = new Date(b.cells[0].innerText.trim());
            return sortState === 1
                ? aDate - bDate
                : bDate - aDate;
        });
    }

    // ========【序號】========
    else if (colIndex === 1) {
        
        rows.sort((a, b) => {
        // 原始序號正序
        if (sortState === 1) {
            return a.dataset.originalIndex - b.dataset.originalIndex;
        }
        // 原始序號倒序
        else {
            return b.dataset.originalIndex - a.dataset.originalIndex;
        }
    });
    }
        
    // ========【一般文字】========
    else {
        rows.sort((a, b) => {
            // 取得文字
            const aText = a.cells[colIndex].innerText.trim();
            const bText = b.cells[colIndex].innerText.trim();

            // ========【第一下：正序（▼）】========
            // 有內容在前，- 在後
            if (sortState === 1) {
                if (aText === '-' && bText !== '-') {
                    return 1;
                }
                if (aText !== '-' && bText === '-') {
                return -1;
                }
            }
                
            // ========【第二下：倒序（▲）】========
            // - 在前，有內容在後
            else if (sortState === 2) {
                if (aText === '-' && bText !== '-') {
                    return -1;
                }
                if (aText !== '-' && bText === '-') {
                    return 1;
                }
            }
            
            // 維持原本順序
            return Number(a.dataset.originalIndex)
                - Number(b.dataset.originalIndex);
        });
    }

    // ========【箭頭狀態】========
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
