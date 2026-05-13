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
let isAscending = true;

// ========【排序功能】========
function sortTable(colIndex) {

    // 取得表格
    const table = document.getElementById('map-master-table');
    // 取得 tbody
    const tbody = table.tBodies[0];
    // 取得所有列
    let rows = Array.from(tbody.rows);
    // 取得目前標題
    const th = table.querySelectorAll('th')[colIndex];

    // ========【發行日期排序】========
    if (colIndex === 0) {
        rows.sort((a, b) => {
            // 取得日期文字
            const aDate = new Date(a.cells[0].innerText.trim());
            const bDate = new Date(b.cells[0].innerText.trim());
            // 正倒序切換
            return isAscending
                ? aDate - bDate
                : bDate - aDate;
        });

    // ========【序號排序】========
    } else {
        // 直接反轉
        rows.reverse();
    }

    // 清空原本內容
    tbody.innerHTML = '';
    // 重新加入
    rows.forEach(row => tbody.appendChild(row));
    // 切換排序狀態
    isAscending = !isAscending;
    // 清除所有標題狀態
    table.querySelectorAll('th').forEach(header => {
        header.classList.remove('asc', 'desc');
    });

    // 套用目前狀態
    if (isAscending) {
        th.classList.add('asc');
    } else {
        th.classList.add('desc');
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
