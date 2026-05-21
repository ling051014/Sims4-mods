// ===================================================
// ========【技能對照表】 取得 HTML 容器 ========
// ===================================================
// 取得全域浮空提示窗本體
const tooltip = document.getElementById('global-skill-tooltip');
// 取得用來塞入外部 HTML 的容器
const placeholder = document.getElementById('skill-table-placeholder');

// ===================================================
// ========【技能提示窗】 狀態與變數紀錄 ========
// ===================================================
// 用於儲存延遲隱藏的計時器 ID
let hideTimeout = null;
// 滑鼠移出時的緩衝延遲時間 (單位: 毫秒)
const HIDE_DELAY = 150; 
// 必須與 CSS transition 動畫過渡時間完全同步 (單位: 毫秒)
const TRANSITION_TIME = 200; 
// 紀錄提示窗目前是否處於點擊後的「鎖定常駐」狀態
let locked = false;
// 紀錄當前正在觸發提示窗的 DOM 元素，供 window resize 重新定位使用
let currentTrigger = null;

// ===================================================
// ========【核心自適應】 重新計算並鎖定欄寬函式 ========
// ===================================================
// 當外部 HTML 載入更新、或表格內容有動態變更時，皆可獨立呼叫此函式刷新對齊
function recalculateColumnWidths() {
    // 暫時將提示窗設為 block 顯現但隱形，繞過 display:none 無法計算真實寬度的限制
    tooltip.style.visibility = 'hidden';
    // 設定透明度為 0，防範第一次淡入動畫閃爍
    tooltip.style.opacity = '0';
    // 臨時轉為區塊元素以利瀏覽器計算渲染樹
    tooltip.style.display = 'block';

    // 使用最高效能的 requestAnimationFrame，確保瀏覽器完全加載字體、CSS 內距後才執行計算
    requestAnimationFrame(() => {
        // 限定精準範圍：只撈取當前提示窗內的表格列
        const tbodyTrs = tooltip.querySelectorAll('.skill-table tbody tr');
        
        // 確保表格內確實有內容列存在才執行
        if (tbodyTrs.length) {
            
            // 執行你寫的完美對齊邏輯：縱向掃描整張表格，精準抓出每一欄所有 td 中的「最大絕對寬度」
            // 將 NodeList 轉為陣列形式
            const maxWidths = Array.from(tbodyTrs)
                // 撈出每一列底下的所有單元格 (td)
                .map(tr => Array.from(tr.children))
                // 開始使用減量演算法縱向比較寬度
                .reduce((acc, row) => {
                    // 遍歷當前列的每一個 td
                    row.forEach((td, i) => {
                        // 抓取精準到小數點的真實渲染寬度
                        const w = td.getBoundingClientRect().width;
                        // 比較並保存該欄目前為止最大的寬度數值
                        acc[i] = Math.max(acc[i] || 0, w);
                    });
                    // 回傳當前累積的寬度陣列結果
                    return acc;
                }, []);

            // 終點線：將計算出來的每一欄最大絕對寬度，強制鎖死回對應的表頭 th 上
            // 限定範圍：只抓取當前提示窗內的表頭
            const ths = tooltip.querySelectorAll('.skill-table thead th');
            // 遍歷每一個表頭單元格
            ths.forEach((th, i) => {
                // 若該欄有對應的計算最大寬度
                if (maxWidths[i]) {
                    // 強制鎖定寬度屬性
                    th.style.width = maxWidths[i] + 'px';
                    // 強制鎖定最小寬度，防止 tbody 捲動時表頭縮水
                    th.style.minWidth = maxWidths[i] + 'px';
                }
            });
        }

        // 欄寬寬度完全同步鎖死後，立刻將提示窗重設回預設的隱藏狀態
        // 隱藏區塊
        tooltip.style.display = 'none';
        // 還原視覺屬性，讓下次顯示能正常由事件接管
        tooltip.style.visibility = 'visible';
    });
}

// ===================================================
// ========【技能對照表】 載入外部 HTML 檔案 ========
// ===================================================
// 開始異步抓取外部的技能表格 HTML 檔案
fetch('skill-table.html')
    
    // 階段一：接收回應，印出 HTTP 狀態碼以便開發除錯
    .then(res => {
        // 於主控台印出狀態碼 (例如：200 成功、404 找不到)
        console.log('HTTP 狀態碼:', res.status);
        // 將回應轉換為純文字 HTML 格式
        return res.text();
    })

    // 階段二：成功抓取檔案後，將 HTML 內容插入網頁，並呼叫鎖定欄寬函式
    .then(html => {
        // 於主控台顯示成功訊息
        console.log('✔ 技能表格初始化完成');
        // 將外部 HTML 表格正式塞入網頁容器中
        placeholder.innerHTML = html;
        // 呼叫封裝好的欄寬計算函式，進行初次同步對齊
        recalculateColumnWidths();
    })
    
    // 階段三：發生非預期錯誤時 (例如檔案路徑打錯)，進行安全防禦回退
    .catch(error => {
        // 於主控台回報精準的錯誤原因
        console.error('載入技能表格失敗:', error);
        // 於畫面上回饋紅字提示給使用者
        placeholder.innerHTML = '<span style="color:red;">技能表格載入失敗，請稍後再試。</span>';
    });

// ===================================================
// ========【輔助函數】 唯一合一的顯示與定位功能 ========
// ===================================================
function showTooltip(trigger) {
    // 紀錄當前被觸發的 trigger 元素，供視窗縮放時重新計算座標
    currentTrigger = trigger;
    // 在計算實際位置前先設為隱形
    tooltip.style.visibility = 'hidden';
    // 解除 display: none，確保 offsetWidth/Height 抓到的是真實尺寸
    tooltip.style.display = 'block';

    // 取得觸發文字 (trigger) 在目前可視視窗中的絕對座標
    const rect = trigger.getBoundingClientRect();
    // 取得提示窗由 JS 撐開後的真實總寬度
    const tooltipWidth = tooltip.offsetWidth;
    // 取得提示窗由 JS 撐開後的真實總高度
    const tooltipHeight = tooltip.offsetHeight;

    // 預設初始橫向位置：觸發文字右側，並補上滾動條偏移量
    let left = rect.right + 15 + window.scrollX;
    // 預設初始縱向位置：觸發文字頂部對齊，稍微往上飄 10px
    let top = rect.top + window.scrollY - 10;

    // 【橫向邊界防禦】若右側空間不足以容納提示窗，自動翻轉改到觸發文字的左側顯示
    if (left + tooltipWidth > window.scrollX + window.innerWidth) {
        // 改至左側顯示，並保留 15px 的安全美觀間距
        left = rect.left - tooltipWidth - 15;
    }
    
    // 【縱向邊界防禦一】優先防止提示窗底部沉出瀏覽器視窗下緣
    if (top + tooltipHeight > window.scrollY + window.innerHeight) {
        // 強制將高度往上推，維持在視窗底部上方 10px
        top = window.scrollY + window.innerHeight - tooltipHeight - 10;
    }
    
    // 【縱向邊界防禦二】若高提示窗被迫上推，啟用核心防遮擋機制，確保絕對不會蓋住觸發文字本身
    // 強制設定頂部最小值，至少保持在文字下方 5px 的安全距離
    top = Math.max(top, rect.bottom + window.scrollY + 5);
    
    // 【縱向邊界防禦三】終極防禦，確保提示窗頂部絕對不會衝出網頁的最頂端邊界
    // 若頂部超出網頁邊界，強制鎖死在距離頂端 10px 處
    top = Math.max(top, window.scrollY + 10);

    // 正式套用精準計算後的左邊距座標
    tooltip.style.left = `${left}px`;
    // 正式套用精準計算後的頂邊距座標
    tooltip.style.top = `${top}px`;
    
    // 解除隱形狀態
    tooltip.style.visibility = 'visible';
    // 賦予不透明度，完美觸發 CSS opacity 的淡入過渡動畫
    tooltip.style.opacity = '1';

    // 檢查是否有正在等待倒數的隱藏計時器
    if (hideTimeout) {
        // 立刻清除該計時器，防止提示窗在顯示期間突兀消失
        clearTimeout(hideTimeout);
        // 清空計時器變數
        hideTimeout = null;
    }
}

function hideTooltip() {
    // 當提示窗完全隱藏時，清空當前 trigger 紀錄
    currentTrigger = null;
    // 觸發 CSS 中的 opacity 屬性，進入淡出動畫階段
    tooltip.style.opacity = '0';
    
    // 開啟延遲定時器，等待淡出動畫執行完畢
    setTimeout(() => {
        // 安全二次防護：確認在等待期間使用者沒有重新移入
        if (tooltip.style.opacity === '0') {
            // 確認完全淡出後，才正式關閉 display 隱藏節點
            tooltip.style.display = 'none';
        }
    }, TRANSITION_TIME);
}

// ===================================================
// ========【核心效能優化】事件委派 - 全網頁事件監聽 ========
// ===================================================

// 監聽全網頁的滑鼠移入事件 (不論頁面上有多少密技文字，都只佔用這一個記憶體監聽器)
document.body.addEventListener('mouseover', (e) => {
    // 檢查滑鼠移入的目標是否為觸發文字 (或其內部子元素)
    const trigger = e.target.closest('.skill-tooltip-trigger');
    // 如果不是觸發文字，或者提示窗目前處於點擊鎖定常駐狀態，則直接攔截不處理
    if (!trigger || locked) return;

    // 移入新觸發文字時，若有前一個準備隱藏的計時器正在倒數
    if (hideTimeout) {
        // 立刻攔截並清除
        clearTimeout(hideTimeout);
        // 清空變數
        hideTimeout = null;
    }
    // 呼叫唯一的顯示與定位核心函式
    showTooltip(trigger);
});

// 監聽全網頁的滑鼠移出事件
document.body.addEventListener('mouseout', (e) => {
    // 檢查滑鼠移出的目標是否為觸發文字
    const trigger = e.target.closest('.skill-tooltip-trigger');
    // 如果不是觸發文字，或者目前處於點擊鎖定常駐狀態，則直接攔截不處理
    if (!trigger || locked) return;

    // 開啟緩衝倒數計時器
    hideTimeout = setTimeout(() => {
        // 緩衝時間到期後，執行唯一的隱藏核心函式
        hideTooltip();
    }, HIDE_DELAY);
});

// 監聽全網頁的點擊事件 (負責處理：點擊鎖定、點擊空白處自動關閉)
document.body.addEventListener('click', (e) => {
    // 檢查點擊目標是否為觸發文字
    const trigger = e.target.closest('.skill-tooltip-trigger');
    
    // 情況 A：使用者點擊了某個觸發文字
    if (trigger) {
        // 立刻阻止事件向上冒泡，防止觸發下方的「點擊空白處關閉」邏輯
        e.stopPropagation();
        // 切換鎖定狀態 (true 變 false，false 變 true)
        locked = !locked;
        // 若切換為鎖定狀態
        if (locked) {
            // 呼叫顯示函式，確保此時走一遍正確的閃現定位流程
            showTooltip(trigger);
        // 若切換為解除鎖定
        } else {
            // 呼叫隱藏核心，讓提示窗淡出
            hideTooltip();
        }
        return;
    }

    // 情況 B：目前提示窗處於鎖定常駐狀態，且使用者點擊了網頁的其他任意空白處 (排除提示窗本體內部)
    if (locked && !tooltip.contains(e.target)) {
        // 強制解除鎖定常駐狀態
        locked = false;
        // 【成功捕捉臭蟲】補上漏掉的隱藏函式，讓提示窗在點擊空白處時能真正淡出關閉
        hideTooltip();
    }
});

// ===================================================
// ========【技能提示窗】 提示窗本體滑鼠移入控制 ========
// ===================================================

// 當滑鼠從觸發文字移入「提示窗小視窗本身」時
tooltip.addEventListener('mouseenter', () => {
    // 立刻檢查是否有滑鼠離開觸發文字時留下的隱藏計時器
    if (hideTimeout) {
        // 成功攔截！立刻清除該計時器，防止小視窗在滑鼠移入後突然消失
        clearTimeout(hideTimeout);
        // 清空變數
        hideTimeout = null;
    }
    // 強制維持提示窗的區塊顯示狀態
    tooltip.style.display = 'block';
    // 強制維持不透明度為 1 狀態
    tooltip.style.opacity = '1';
});

// 當滑鼠從「提示窗小視窗本身」離開時
tooltip.addEventListener('mouseleave', () => {
    // 如果提示窗已經被點擊鎖定常駐，滑鼠移出不進行任何隱藏處理
    if (locked) return;
    
    // 若未鎖定，開啟滑鼠移出緩衝計時器
    hideTimeout = setTimeout(() => {
        // 緩衝時間到期後，執行隱藏淡出流程
        hideTooltip();
    }, HIDE_DELAY);
});

// ===================================================
// ========【響應式優化】通用定位與手機適配邏輯 ========
// ===================================================
function showTooltip(trigger) {
    currentTrigger = trigger; // 紀錄是哪一個觸發器，供螢幕旋轉時使用
    
    // 強制將顯示狀態開啟，並設定為可見，這對手機版渲染至關重要
    tooltip.style.display = 'block'; 
    tooltip.style.visibility = 'visible'; 
    tooltip.style.opacity = '1'; 

    // 判斷是否為窄螢幕（手機環境），768px 為常見斷點
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // 【手機版邏輯】
        // 使用 fixed 定位，讓彈窗脫離網頁流，直接浮在螢幕最上層
        tooltip.style.position = 'fixed';
        // 將彈窗強制移動到螢幕正中央
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        // 使用 transform 將定位中心點修正為彈窗中心
        tooltip.style.transform = 'translate(-50%, -50%)';
        // 限制寬度為螢幕的 85%，防止彈窗過寬撐爆手機螢幕
        tooltip.style.width = '85vw';
        // 自動高度，並限制最大高度，確保超出時可滾動
        tooltip.style.height = 'auto';
        tooltip.style.maxHeight = '80vh';
    } else {
        // 【電腦版邏輯】
        // 使用 absolute 跟隨滑鼠點擊位置
        tooltip.style.position = 'absolute';
        // 取得觸發器的位置資訊
        const rect = trigger.getBoundingClientRect();
        // 計算彈窗位置，使其顯示在觸發文字的下方，並保留 5px 間距
        tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        // 電腦版恢復預設的 transform 設定，避免影響絕對定位
        tooltip.style.transform = 'none';
        tooltip.style.width = 'auto'; // 恢復寬度自適應
    }

    // 若有等待關閉的計時器，則清除它，避免顯示時被自動關閉
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
}

// ===================================================
// ========【除錯】事件委派 - 防止冒泡衝突 ========
// ===================================================
document.body.addEventListener('click', (e) => {
    const trigger = e.target.closest('.skill-tooltip-trigger');
    
    if (trigger) {
        e.stopPropagation(); // 阻止冒泡
        
        // 點擊觸發：如果已經顯示且是同一個，則關閉；否則顯示
        if (currentTrigger === trigger && tooltip.style.display === 'block') {
            locked = false;
            hideTooltip();
        } else {
            locked = true;
            currentTrigger = trigger;
            showTooltip(trigger);
        }
        return;
    }

    // 點擊空白處：只有鎖定狀態下才關閉
    if (locked) {
        locked = false;
        hideTooltip();
    }
});
