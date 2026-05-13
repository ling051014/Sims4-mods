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

// ========【排序控制】 設定 - 序號正倒序 ========
let isAscending = true; // 紀錄當前狀態

function sortTable(colIndex) {
    // 取得表格
    const table = document.getElementById('map-master-table');
    // 取得行數
    const rows = Array.from(table.rows).slice(1); // 排除標題
    // 取得圖示
    const icon = document.getElementById('sort-icon');
    // 執行排序
    rows.sort((a, b) => {
        const valA = parseInt(a.cells[colIndex].innerText);
        const valB = parseInt(b.cells[colIndex].innerText);
        return isAscending ? valA - valB : valB - valA;
    });
    
    // 重新填充
    const tbody = table.tBodies[0];
    rows.forEach(row => tbody.appendChild(row));
    // 切換狀態
    isAscending = !isAscending;
    // 更新圖示
    icon.innerText = isAscending ? '↑' : '↓';
}

// ========【互動控制】 點擊行變色 (全域適用) ========
document.addEventListener('click', function(e) {
    // 尋找行數
    const tr = e.target.closest('tr');
    // 判定有效
    if (tr && tr.closest('table')) {
        // 清除舊項
        document.querySelectorAll('.selected-row').forEach(row => {
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
