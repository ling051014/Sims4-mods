// skill-table.js
const tooltip = document.createElement('div');
tooltip.id = 'global-skill-tooltip';
tooltip.className = 'skill-tooltip-window';
document.body.appendChild(tooltip);

const placeholder = document.createElement('div');
placeholder.className = 'tooltip-scroll-body';
placeholder.id = 'skill-table-placeholder';
tooltip.appendChild(placeholder);

// 載入技能表
fetch('skill-table.html')
    .then(res => res.text())
    .then(html => placeholder.innerHTML = html)
    .catch(err => placeholder.innerHTML = '<span style="color:red;">表格載入失敗</span>');

// 監聽觸發文字
document.querySelectorAll('.skill-tooltip-trigger').forEach(trigger => {
    trigger.addEventListener('mouseenter', (e) => {
        const rect = trigger.getBoundingClientRect();
        tooltip.style.left = `${rect.right + window.scrollX + 15}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 10}px`;
        tooltip.style.display = 'block';
    });
    trigger.addEventListener('mouseleave', () => tooltip.style.display = 'none');
});

tooltip.addEventListener('mouseenter', () => tooltip.style.display = 'block');
tooltip.addEventListener('mouseleave', () => tooltip.style.display = 'none');
