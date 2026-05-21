// ===================================================
// ========【技能對照表】 取得 HTML 容器 ========
// ===================================================
const tooltip = document.getElementById('global-skill-tooltip');
const placeholder = document.getElementById('skill-table-placeholder');

// ===================================================
// ========【技能提示窗】 狀態與變數紀錄 ========
// ===================================================
// 用於延遲隱藏（調整為 150ms 讓滑鼠在文字與彈窗間移動時更絲滑不閃爍）
let hideTimeout = null;
const HIDE_DELAY = 150; 

// 動畫過渡時間（需與 CSS transition 保持一致，方便未來統一修改）
const TRANSITION_TIME = 200; 

// 是否鎖定 tooltip 常駐
let locked = false;

// ===================================================
// ========【技能對照表】 載入外部 HTML 檔案 ========
// ===================================================
fetch('skill-table.html')
    
    // 印出 HTTP 狀態碼，方便確認檔案是否成功讀取
    .then(res => {
        console.log('HTTP 狀態碼:', res.status);
        return res.text();
    })

    // 成功抓取檔案後，將 HTML 內容塞入指定的浮空視窗區塊中
    .then(html => {
        console.log('✔ 技能表格初始化完成');
        placeholder.innerHTML = html;
        
        // 暫時隱形顯示以供計算，同步加入 opacity: 0 確保第一次淡入動畫順暢不突兀
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
        tooltip.style.display = 'block';

        requestAnimationFrame(() => {
            const tbodyTrs = tooltip.querySelectorAll('.skill-table tbody tr');
            
            if (tbodyTrs.length) {
                // 縱向掃描最大欄寬
                const maxWidths = Array.from(tbodyTrs)
                    .map(tr => Array.from(tr.children))
                    .reduce((acc, row) => {
                        row.forEach((td, i) => {
                            const w = td.getBoundingClientRect().width;
                            acc[i] = Math.max(acc[i] || 0, w);
                        });
                        return acc;
                    }, []);

                // 將最大寬度鎖死到表頭 th 上
                const ths = tooltip.querySelectorAll('.skill-table thead th');
                ths.forEach((th, i) => {
                    if (maxWidths[i]) {
                        th.style.width = maxWidths[i] + 'px';
                        th.style.minWidth = maxWidths[i] + 'px';
                    }
                });
            }

            // 計算鎖死完成，還原狀態（保留 opacity: 0 讓下次 show 完美觸發 transition）
            tooltip.style.display = 'none';
            tooltip.style.visibility = 'visible';
        });
    })
    
    // 發生錯誤時於主控台報錯並在畫面上顯示紅字提示
    .catch(error => {
        console.error('載入技能表格失敗:', error);
        placeholder.innerHTML = '<span style="color:red;">技能表格載入失敗，請稍後再試。</span>';
    });

// ===================================================
// ========【輔助函數】 唯一合一的顯示與定位功能 ========
// ===================================================
function showTooltip(trigger) {
    // 定位前閃現準備，確保抓到真實 offsetWidth/Height
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'block';

    // 取得文字位置範圍
    const rect = trigger.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    // 設定浮窗初始位置：預設右側，並加上滾動偏移
    let left = rect.right + 15 + window.scrollX;
    let top = rect.top + window.scrollY - 10;

    // 【優化邊界判定】若超出瀏覽器右邊界，改為左側顯示
    if (left + tooltipWidth > window.scrollX + window.innerWidth) {
        left = rect.left - tooltipWidth - 15;
    }
    
    // 【微調優化】如果視窗過長往下掉，確保頂部 top 絕對不會往上蓋住 trigger 文字
    if (top + tooltipHeight > window.scrollY + window.innerHeight) {
        top = window.scrollY + window.innerHeight - tooltipHeight - 10;
        // 核心防遮擋：至少保持在 trigger 下方安全距離，不與文字重疊
        top = Math.max(top, rect.bottom + window.scrollY + 5);
    }
    
    // 避免超出上方邊界
    if (top < window.scrollY) {
        top = window.scrollY + 10;
    }

    // 套用精準計算後的座標
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    // 完美淡入
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';

    // 若有正在等待的隱藏計時器則清除
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
}

function hideTooltip() {
    // 觸發 CSS opacity 過渡淡出
    tooltip.style.opacity = '0';
    
    // 延遲與 CSS transition 時間同步
    setTimeout(() => {
        // 安全防護：確認等待期間使用者沒有再次移入，才真正 display: none
        if (tooltip.style.opacity === '0') {
            tooltip.style.display = 'none';
        }
    }, TRANSITION_TIME);
}

// ===================================================
// ========【技能提示窗】 監聽觸發文字、滑鼠與點擊事件 ========
// ===================================================
document.querySelectorAll('.skill-tooltip-trigger').forEach(trigger => {

    // 滑鼠移入 trigger
    trigger.addEventListener('mouseenter', () => {
        if (locked) return;

        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        showTooltip(trigger);
    });

    // 滑鼠離開 trigger
    trigger.addEventListener('mouseleave', () => {
        if (locked) return;
        // 使用優化後的緩衝時間（150ms），防止滑鼠快速滑過時畫面瘋狂閃爍
        hideTimeout = setTimeout(() => {
            hideTooltip();
        }, HIDE_DELAY);
    });

    // 點擊 trigger 鎖定/解除鎖定 tooltip
    trigger.addEventListener('click', (e) => {
        e.stopPropagation(); 
        locked = !locked;    
        if (locked) {
            showTooltip(trigger); 
        } else {
            hideTooltip(); 
        }
    });
});

// ===================================================
// ========【技能提示窗】 提示窗本體顯示控制 ========
// ===================================================
// 滑鼠移入提示窗本身
tooltip.addEventListener('mouseenter', () => {
    // 移入本體時，立刻攔截並清除隱藏計時器，保持顯示
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    tooltip.style.display = 'block';
    tooltip.style.opacity = '1';
});

// 滑鼠移出提示窗本身
tooltip.addEventListener('mouseleave', () => {
    if (locked) return;
    // 移出本體同樣給予緩衝延遲，體驗更流暢
    hideTimeout = setTimeout(() => {
        hideTooltip();
    }, HIDE_DELAY);
});

// ===================================================
// ========【全域事件】 點擊外部自動關閉提示窗 ========
// ===================================================
document.addEventListener('click', (e) => {
    if (!locked) return;

    // 點擊在 tooltip 或 trigger 上時不關閉
    if (tooltip.contains(e.target) || e.target.classList.contains('skill-tooltip-trigger')) return;

    locked = false;
    hideTooltip();
});
