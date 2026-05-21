// ===================================================
// ========【技能對照表】 取得 HTML 容器 ========
// ===================================================
const tooltip = document.getElementById('global-skill-tooltip');
const placeholder = document.getElementById('skill-table-placeholder');

// ===================================================
// ========【技能提示窗】 狀態與變數紀錄 ========
// ===================================================
// 用於延遲隱藏
let hideTimeout = null;
// 是否鎖定 tooltip 常駐
let locked = false;

// ===================================================
// ========【技能對照表】 載入外部 HTML 檔案 ========
// ===================================================
fetch('skill-table.html')
    
    // 印出 HTTP 狀態碼，方便確認檔案是否成功讀取 (例如：200 成功、404 找不到)
    .then(res => {
        console.log('HTTP 狀態碼:', res.status); // 印出 HTTP 狀態碼
        return res.text();
    })

    // 成功抓取檔案後，將 HTML 內容塞入指定的浮空視窗區塊中
    .then(html => {
        console.log('✔ 技能表格初始化完成'); // 顯示初始化成功訊息
        placeholder.innerHTML = html; // 插入 HTML 內容到容器
        
        // 先暫時顯示 tooltip 但隱形，確保瀏覽器能正確準備渲染樹
        tooltip.style.visibility = 'hidden';
        tooltip.style.display = 'block';

        // 確保瀏覽器已將字體、CSS Padding 渲染完成，抓到的寬度才百分之百精準
        requestAnimationFrame(() => {
            const tbodyTrs = tooltip.querySelectorAll('.skill-table tbody tr');
            
            if (tbodyTrs.length) {
                // 縱向掃描最大寬度（你寫的完美 reduce 邏輯）
                const maxWidths = Array.from(tbodyTrs)
                    .map(tr => Array.from(tr.children))
                    .reduce((acc, row) => {
                        row.forEach((td, i) => {
                            const w = td.getBoundingClientRect().width;
                            acc[i] = Math.max(acc[i] || 0, w);
                        });
                        return acc;
                    }, []);

                // 表頭同步限定：精準鎖定並鎖死 th 寬度
                const ths = tooltip.querySelectorAll('.skill-table thead th');
                ths.forEach((th, i) => {
                    if (maxWidths[i]) {
                        th.style.width = maxWidths[i] + 'px';
                        th.style.minWidth = maxWidths[i] + 'px';
                    }
                });
            }

            // 計算完全鎖死後，立刻歸位隱藏，等待觸發
            tooltip.style.display = 'none';
            tooltip.style.visibility = 'visible';
        });
    })
    
    // 發生錯誤時（如檔案路徑錯誤），於主控台報錯並在畫面上顯示紅字提示
    .catch(error => {
        console.error('載入技能表格失敗:', error); // 於主控台報錯
        placeholder.innerHTML = '<span style="color:red;">技能表格載入失敗，請稍後再試。</span>'; // 顯示紅字提示
    });

// ===================================================
// ========【輔助函數】 唯一合一的顯示與定位功能 ========
// ===================================================
function showTooltip(trigger) {
    // 關鍵優化：在計算定位前，先讓 tooltip 閃現，確保 offsetWidth/Height 抓到的是真實尺寸（非 0）
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'block';

    // 取得文字位置範圍
    const rect = trigger.getBoundingClientRect();
    
    // 取得 tooltip 的實際寬度與高度（此時絕對精準）
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    // 設定浮窗初始位置：右側，並加上滾動偏移
    let left = rect.right + 15 + window.scrollX;
    let top = rect.top + window.scrollY - 10;

    // 若超出瀏覽器右邊界，改為左側顯示
    if (left + tooltipWidth > window.scrollX + window.innerWidth) {
        left = rect.left - tooltipWidth - 15;
    }
    // 避免超出下方邊界
    if (top + tooltipHeight > window.scrollY + window.innerHeight) {
        top = window.scrollY + window.innerHeight - tooltipHeight - 10;
    }
    // 避免超出上方邊界
    if (top < window.scrollY) {
        top = window.scrollY + 10;
    }

    // 套用計算後的左邊距與頂邊距
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    // 解除隱形，完美顯現出來 (opacity 過渡)
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';

    // 若有正在等待的隱藏計時器則清除
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
}

function hideTooltip() {
    // 統一由 JS 先控制 opacity 達到淡出視覺
    tooltip.style.opacity = '0';
    
    // 與 CSS 過渡時間一致後關閉顯示（200ms）
    setTimeout(() => {
        // 確保在等待的這 200ms 內，使用者沒有重新移入，才真正關閉 display
        if (tooltip.style.opacity === '0') {
            tooltip.style.display = 'none';
        }
    }, 200);
}

// ===================================================
// ========【技能提示窗】 監聽觸發文字、滑鼠與點擊事件 ========
// ===================================================
document.querySelectorAll('.skill-tooltip-trigger').forEach(trigger => {

    // 滑鼠移入 trigger
    trigger.addEventListener('mouseenter', () => {
        // 若已鎖定常駐，滑鼠進入不影響
        if (locked) return;

        showTooltip(trigger); // 呼叫唯一定義的顯示與定位核心
    });

    // 滑鼠離開 trigger
    trigger.addEventListener('mouseleave', () => {
        // 若鎖定則不自動隱藏
        if (locked) return;
        // 延遲隱藏，提供滑鼠有緩衝時間可以移入小視窗本體
        hideTimeout = setTimeout(() => {
            hideTooltip();
        }, 50);
    });

    // 點擊 trigger 鎖定/解除鎖定 tooltip
    trigger.addEventListener('click', (e) => {
        e.stopPropagation(); // 避免冒泡到 document click
        locked = !locked;    // 切換鎖定狀態
        if (locked) {
            showTooltip(trigger); // 鎖定常駐時，同樣確保走正確的定位與閃現流程
        } else {
            hideTooltip(); // 解除鎖定並隱藏
        }
    });
});

// ===================================================
// ========【技能提示窗】 提示窗本體顯示控制 ========
// ===================================================
// 滑鼠移入提示窗本身
tooltip.addEventListener('mouseenter', () => {
    // 若有隱藏計時器則清除，避免消失
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    // 保持提示窗顯示狀態
    tooltip.style.display = 'block';
    tooltip.style.opacity = '1';
});

// 滑鼠移出提示窗本身
tooltip.addEventListener('mouseleave', () => {
    // 鎖定常駐時離開 tooltip 不隱藏
    if (locked) return;
    // 隱藏浮窗 (淡出)
    hideTimeout = setTimeout(() => {
        hideTooltip();
    }, 50);
});

// ===================================================
// ========【全域事件】 點擊外部自動關閉提示窗 ========
// ===================================================
document.addEventListener('click', (e) => {
    // 未鎖定不需處理
    if (!locked) return;

    // 點擊在 tooltip 或 trigger 上時不關閉
    if (tooltip.contains(e.target) || e.target.classList.contains('skill-tooltip-trigger')) return;

    // 解除鎖定並隱藏
    locked = false;
    hideTooltip();
});
