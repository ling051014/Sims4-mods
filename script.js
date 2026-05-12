// ========【關鍵字搜尋】 設定 - 搜尋模組卡片 ========
function searchMods() {
    // 取得搜尋輸入框
    const input = document.getElementById('mod-search');
    // 將輸入內容轉大寫（避免大小寫影響搜尋）
    const filter = input.value.toUpperCase();
    // 取得搜尋結果下拉視窗
    const dropdown = document.getElementById('search-results');
    // 取得所有模組卡片
    const cards = document.querySelectorAll('.mod-card');
    // 清空舊的搜尋結果
    dropdown.innerHTML = '';
    // 若沒有輸入內容則隱藏搜尋結果
    if (!filter) {
        dropdown.style.display = 'none';
        return;
    }

    // 判斷是否有找到結果
    let found = false;
    // 逐一檢查每張卡片
    cards.forEach((card, index) => {
        // 取得標題文字
        const title = card.querySelector('.mod-header').innerText;
        // 取得作者文字
        const author = card.querySelector('.author').innerText;
        // 取得整張卡片所有文字
        const fullText = card.innerText.toUpperCase();
        // 若內容包含搜尋關鍵字
        if (fullText.includes(filter)) {
            // 標記找到結果
            found = true;
            // 建立搜尋結果項目
            const item = document.createElement('div');
            // 套用搜尋項目 class
            item.className = 'search-item';
            // 產生兩位數編號
            const displayNum = (index + 1)
                .toString()
                .padStart(2, '0');
            
            // 搜尋結果內容
            item.innerHTML = `
                <strong>#${displayNum} ${title}</strong><br>
                <small>${author}</small>
            `;
            
            // 點擊搜尋結果後
            item.onclick = () => {
                // 平滑滾動至對應卡片
                card.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // 關閉搜尋結果
                dropdown.style.display = 'none';
                // 清空搜尋框
                input.value = '';
                // 卡片加上藍色外框提示
                card.style.outline = "2px solid #55acee";
                // 2 秒後移除外框
                setTimeout(() => {
                    card.style.outline = "none";
                }, 2000);
            };

            // 將結果加入下拉視窗
            dropdown.appendChild(item);
        }
    });

    // 有結果則顯示下拉視窗
    dropdown.style.display = found ? 'block' : 'none';
}

// ========【搜尋視窗】 設定 - 點擊外部自動關閉 ========
document.addEventListener('click', (e) => {
    // 若點擊的不是搜尋框
    if (e.target.id !== 'mod-search') {
        // 隱藏搜尋結果
        document.getElementById('search-results').style.display = 'none';
    }
});

// ========【DLC對照表】 設定 - 載入外部 HTML ========
function loadDLCTable(containerId, callback) {
    // 取得目標容器
    const container = document.getElementById(containerId);
    // 若容器不存在則停止
    if (!container) return;
    // 載入外部 HTML 檔案
    fetch('dlc-table.html')
        // 轉為文字格式
        .then(response => response.text())
        // 將內容插入容器
        .then(data => {
            // 插入 HTML
            container.innerHTML = data;
            // 若有回呼函式則執行
            if (callback) callback();
        })

        // 錯誤訊息
        .catch(err => {
            console.error('無法載入對照表:', err);
        });
}

// ========【DLC對照表】 設定 - 開啟 Dialog ========
function openDLCDialog() {
    // 取得內容容器
    const container =
        document.getElementById('modal-content-placeholder');
    // 取得 dialog 元件
    const dialog =
        document.getElementById('dlc-dialog');
    // 若內容尚未載入
    if (container.innerHTML === "") {
        // 先載入內容再開啟
        loadDLCTable(
            'modal-content-placeholder',
            // 載入完成後開啟
            () => dialog.showModal()
        );
    } else {
        // 已載入過則直接開啟
        dialog.showModal();
    }
}

// ========【卡片統計】 設定 - 顯示模組總數 ========
function updateModCount() {
    // 取得所有模組卡片數量
    const count =
        document.querySelectorAll('.mod-card').length;
    // 取得顯示數量的元素
    const countElement =
        document.getElementById('mod-count');
    // 若元素存在
    if (countElement) {
        // 顯示卡片數量
        countElement.innerText = count;
    }
}

// ========【滾動動畫】 設定 - 進入畫面時顯示 ========

// IntersectionObserver 觸發條件
const observerOptions = {
    // 元素出現 10% 即觸發
    threshold: 0.1
};

// 建立觀察器
const observer = new IntersectionObserver(
    // 偵測進入畫面的元素
    (entries) => {
        entries.forEach(entry => {
            // 若元素進入畫面
            if (entry.isIntersecting) {
                // 加上顯示 class
                entry.target.classList.add('is-visible');
            }
        });
    },

    // 套用設定
    observerOptions
);

// 監聽所有模組卡片
document.querySelectorAll('.mod-card')
    .forEach(card => {
        // 開始觀察
        observer.observe(card);
    });

// ========【初始化】 設定 - 頁面載入後執行 ========
// 更新模組數量
updateModCount();
