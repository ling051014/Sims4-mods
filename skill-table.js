// 取得 HTML 中已存在的 tooltip 容器
const tooltip = document.getElementById('global-skill-tooltip');
const placeholder = document.getElementById('skill-table-placeholder');

// 載入技能表
fetch('skill-table.html')
    .then(res => res.text())
    .then(html => placeholder.innerHTML = html)
    .catch(error => {
            console.error('載入DLC對照表失敗:', error);
            skillPlaceholder.innerHTML = '<span style="color:red;">表格載入失敗，請稍後再試。</span>';
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
