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

// ========【彈窗控制】 設定 - 點擊外部自動關閉 ========
const dlcModal = document.querySelector('.dlc-modal');

if (dlcModal) {
    dlcModal.addEventListener('click', (event) => {

        // ========【取得視窗範圍】========
        const rect = dlcModal.getBoundingClientRect();

        // ========【判定是否點擊在 modal 內】========
        const isInModal = (
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
        );

        // ========【點擊外部 → 關閉】========
        if (!isInModal) {

            // 防呆：避免 close 不存在
            if (typeof dlcModal.close === "function") {
                dlcModal.close();
            }
        }
    });
}

// ========【影片預覽】 設定 - 切換靜音狀態 ========
function toggleMute(btn) {
    // 找到該按鈕的父容器 (preview-img)
    const wrapper = btn.parentElement;
    // 找到該容器內的影片元素
    const video = wrapper.querySelector('video');
    
    if (video.muted) {
        // 取消靜音
        video.muted = false;
        // 更換圖示文字
        btn.innerText = "🔊";
    } else {
        // 變回靜音
        video.muted = true;
        // 更換圖示文字
        btn.innerText = "🔇";
    }
}

// ========【懸浮小視窗】 設定 - 模組卡片用 ========
// 取得提示視窗 DOM 元素
const tooltip = document.getElementById('mod-tooltip');

// 隱藏倒數計時器變數
let hideTimeout = null;
// 滑鼠離開後延遲隱藏的時間（毫秒），提供滑鼠移動至視窗內部的緩衝空間
const HIDE_DELAY = 150;

// 鎖定狀態（點擊後維持顯示不消失，直到再次點擊或點擊外部）
let locked = false;
// 紀錄當前觸發的元素
let currentTrigger = null;

// 顯示 Tooltip
function showTooltip(trigger) {
    currentTrigger = trigger;

    // 根據觸發器上的 data-tooltip-id 屬性抓取隱藏的原始 HTML 內容
    const noteId = trigger.getAttribute('data-tooltip-id');
    const source = document.getElementById(noteId);
    
    // 若找不到對應的內容區塊則終止
    if (!source) return;

    // 將內容複製到提示窗本體中
    tooltip.innerHTML = source.innerHTML;

    // 顯示視窗：將 display 設為 block，透明度設為 1
    tooltip.style.display = 'block';
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';

    // 定位邏輯：將提示窗放置在觸發元素的正下方
    const rect = trigger.getBoundingClientRect();

    tooltip.style.position = 'absolute';
    tooltip.style.left = rect.left + window.scrollX + 'px';
    tooltip.style.top = rect.bottom + window.scrollY + 5 + 'px';

    // 清除隱藏計時：確保提示窗顯示過程中不會被之前的倒數觸發關閉
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
}

// 隱藏 Tooltip
function hideTooltip() {
    currentTrigger = null;
    // 將不透明度降為 0 觸發 CSS 過渡動畫
    tooltip.style.opacity = '0';

    // 等待 CSS 過渡動畫 (需與 CSS 設定時間同步，這裡預設 200ms) 結束後再隱藏節點
    setTimeout(() => {
        if (tooltip.style.opacity === '0') {
            tooltip.style.display = 'none';
        }
    }, 200);
}

// 延遲隱藏（核心防閃爍機制）
function scheduleHide() {
    // 若已鎖定（常駐顯示），則不進行自動隱藏
    if (locked) return;

    // 啟動計時器，過一段時間後執行隱藏
    hideTimeout = setTimeout(() => {
        hideTooltip();
    }, HIDE_DELAY);
}

// Hover：進入 trigger 觸發顯示
document.body.addEventListener('mouseover', (e) => {
    const trigger = e.target.closest('.tooltip-trigger');
    // 若未點擊觸發器 或 處於鎖定狀態，則忽略
    if (!trigger || locked) return;

    // 清除任何排程中的隱藏，立即顯示
    clearTimeout(hideTimeout);
    showTooltip(trigger);
});

// Hover：離開 trigger 啟動緩衝隱藏
document.body.addEventListener('mouseout', (e) => {
    const trigger = e.target.closest('.tooltip-trigger');
    if (!trigger || locked) return;

    // 啟動緩衝隱藏排程
    scheduleHide();
});

// Tooltip 本體：滑鼠移入視窗內部時（取消隱藏排程，保持常駐）
tooltip.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
});

// Tooltip 本體：滑鼠移出視窗時（重新啟動隱藏排程）
tooltip.addEventListener('mouseleave', () => {
    scheduleHide();
});

// 點擊控制：處理「鎖定/解鎖」與「點擊外部關閉」
document.body.addEventListener('click', (e) => {
    const trigger = e.target.closest('.tooltip-trigger');

    // 情況 A：點擊了 trigger 觸發器 → 切換鎖定狀態
    if (trigger) {
        e.stopPropagation(); // 阻止冒泡，防止觸發下方全域點擊事件

        locked = !locked; // 切換鎖定開關

        if (locked) {
            showTooltip(trigger); // 鎖定時維持顯示
        } else {
            hideTooltip(); // 解鎖時關閉
        }
        return;
    }

    // 情況 B：處於鎖定狀態下，點擊了提示窗以外的區域 → 解鎖並關閉
    if (locked && !tooltip.contains(e.target)) {
        locked = false;
        hideTooltip();
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
    const container = document.getElementById('modal-content-placeholder');
    const dialog = document.getElementById('dlc-dialog');
    // 使用 trim() 確保準確判斷容器是否為空
    if (container.innerHTML.trim() === "") {
        loadDLCTable('modal-content-placeholder', () => {
            dialog.showModal();
            // 載入後重新綁定一次點擊事件（選擇性，若使用全域監聽則免）
        });
    } else {
        dialog.showModal();
    }
}

// 確保全域點擊表格行會變色（支援首頁與彈窗）
document.addEventListener('click', function(e) {
    // 只要點擊的是 tr (不管是地圖表格還是快捷鍵表格)
    const tr = e.target.closest('tr');
    // 確保這個 tr 是在 tbody 裡面（避開標題列 th）
    if (tr && tr.closest('tbody')) {
        // 移除「該表格」內所有行的選取狀態
        const allRows = tr.closest('tbody').querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('selected-row'));    
        // 幫目前點擊行加上顏色
        tr.classList.add('selected-row');
    }
});

// ========【搜尋優化】 設定 - 點擊搜尋結果外自動隱藏 ========
document.addEventListener('click', (e) => {
    const searchBox = document.querySelector('.search-box');
    const dropdown = document.getElementById('search-results');
    if (dropdown && !searchBox.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

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

// ======== 【隱形換行斷點】自動在模組檔名的底線（_）與點（.）後方加入 ========
document.addEventListener("DOMContentLoaded", () => {
    // 抓取所有詳細資訊欄位裡的超連結與純文字
    const infoLinks = document.querySelectorAll('.info-row a, .info-row span');
    
    infoLinks.forEach(link => {
        let text = link.innerHTML;
        
        // 1. 如果有底線，在底線 "_" 後面加斷點
        if (text.includes('_')) {
            text = text.replace(/_/g, '_<wbr>');
        }
        
        // 2. 聰明處理點 "." 的斷點
        if (text.includes('.')) {
            // 規則 A：如果點的後面是副檔名（例如 .package, .zip 等英數字直到結尾）
            // ➡️ 💡 密技：把斷點 <wbr> 加在點的「前面」，讓點帶著副檔名一起換行！
            text = text.replace(/\.(?=[a-z0-9]+$)/gi, '<wbr>.');
            
            // 規則 B：處理其他一般的點（像是網址中間的點），但排除掉「版本號」（點的前後都是數字）
            // ➡️ 在點的「後面」加斷點
            text = text.replace(/\.(?!\d)(?![a-z0-9]+$)/gi, '.<wbr>');
        }
        
        // 寫回原本的標籤裡
        link.innerHTML = text;
    });
});

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
