// 取得 HTML 中已存在的 tooltip 容器
const tooltip = document.getElementById('global-skill-tooltip');
const placeholder = document.getElementById('skill-table-placeholder');

// 載入技能表
fetch('skill-table.html')
    
    // 印出 HTTP 狀態碼，方便確認檔案是否成功讀取 (例如：200 成功、404 找不到)
    .then(res => {
        console.log('HTTP 狀態碼:', res.status); // 印出 HTTP 狀態碼
        return res.text();
    })

    // 成功抓取檔案後，將 HTML 內容塞入指定的浮空視窗區塊中
    .then(html => {
        console.log('成功載入 skill-table.html');
        placeholder.innerHTML = html;
    })
    
    // 發生錯誤時（如檔案路徑錯誤），於主控台報錯並在畫面上顯示紅字提示
    .catch(error => {
            console.error('載入 skill-table.html 失敗:', error);
            skillPlaceholder.innerHTML = '<span style="color:red;">技能表載入失敗，請稍後再試。</span>';
        });

// 監聽觸發文字
document.querySelectorAll('.skill-tooltip-trigger').forEach(trigger => {
    trigger.addEventListener('mouseenter', (e) => {
        const rect = trigger.getBoundingClientRect();

        // 設定浮窗位置：右側，並避免超出 viewport
        let left = rect.right + 15 + window.scrollX;
        let top = rect.top + window.scrollY - 10;

        // 讓 tooltip 不超出右邊界
        const tooltipWidth = tooltip.offsetWidth;
        if (left + tooltipWidth > window.scrollX + window.innerWidth) {
            left = rect.left - tooltipWidth - 15; // 反向顯示
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.display = 'block';
    });

    trigger.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
});

// 滑鼠移到 tooltip 上時保持顯示
tooltip.addEventListener('mouseenter', () => tooltip.style.display = 'block');
tooltip.addEventListener('mouseleave', () => tooltip.style.display = 'none');
