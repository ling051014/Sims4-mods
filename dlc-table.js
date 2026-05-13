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

// ========【排序控制】 設定 - 全域升序降序邏輯 ========
let isAscending = true; 

function sortTable(colIndex) {
    const table = document.getElementById('map-master-table');
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);
    const th = table.querySelectorAll('th')[colIndex];

    // 檢查目前這個標頭是否已經是升序
    const currentIsAsc = th.classList.contains('asc');
    
    // 執行邏輯排序 (不再只是單純反轉)
    rows.sort((rowA, rowB) => {
        const cellA = rowA.cells[colIndex].innerText.trim();
        const cellB = rowB.cells[colIndex].innerText.trim();
        
        // 如果是空的（例如有些 DLC 沒有職業），排在最後面
        if (cellA === '-') return 1;
        if (cellB === '-') return -1;
        
        // 使用 localeCompare 進行字串比對 (適用於日期 YYYY/MM/DD 和 序號 SP01)
        return currentIsAsc 
            ? cellB.localeCompare(cellA, undefined, { numeric: true }) // 原本升序就改降序
            : cellA.localeCompare(cellB, undefined, { numeric: true }); // 原本降序就改升序
    });

    // 重新填充排序後的行
    rows.forEach(row => tbody.appendChild(row));
    // 更新標頭 UI 狀態
    table.querySelectorAll('th').forEach(header => {
        header.classList.remove('asc', 'desc');
    });

    if (currentIsAsc) {
        th.classList.add('desc');
    } else {
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
