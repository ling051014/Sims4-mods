// 取得 HTML 中已存在的 tooltip 容器
const tooltip = document.getElementById('global-skill-tooltip');
const placeholder = document.getElementById('skill-table-placeholder');

// 載入技能表格（獨立 HTML）
fetch('skill-table.html')
    .then(res => res.text())
    .then(html => placeholder.innerHTML = html)
    .catch(error => {
            console.error('載入DLC對照表失敗:', error);
            skillPlaceholder.innerHTML = '<span style="color:red;">表格載入失敗，請稍後再試。</span>';
        });

// 顯示 / 隱藏浮窗
function showTooltip(trigger) {
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.right + 15 + window.scrollX;
    let top = rect.top + window.scrollY - 10;

    // 如果浮窗超出右邊界，改到左邊
    if (left + tooltipRect.width > window.scrollX + window.innerWidth) {
        left = rect.left - tooltipRect.width - 15 + window.scrollX;
    }
    // 如果浮窗超出底部，向上調整
    if (top + tooltipRect.height > window.scrollY + window.innerHeight) {
        top = window.scrollY + window.innerHeight - tooltipRect.height - 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = 'block';
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

// 監聽所有觸發文字
document.querySelectorAll('.skill-tooltip-trigger').forEach(trigger => {
    trigger.addEventListener('mouseenter', () => showTooltip(trigger));
    trigger.addEventListener('mouseleave', () => {
        // 延遲隱藏，防止滑鼠移到 tooltip 本身就消失
        setTimeout(() => {
            if (!tooltip.matches(':hover')) hideTooltip();
        }, 50);
    });
});

// 讓滑鼠移入 tooltip 時保持顯示
tooltip.addEventListener('mouseenter', () => tooltip.style.display = 'block');
tooltip.addEventListener('mouseleave', () => hideTooltip());
