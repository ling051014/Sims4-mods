// ========【關鍵字搜尋】 ========
function searchMods() {
    const input = document.getElementById('mod-search');
    const filter = input.value.toUpperCase();
    const dropdown = document.getElementById('search-results');
    const cards = document.querySelectorAll('.mod-card');

    dropdown.innerHTML = '';

    if (!filter) {
        dropdown.style.display = 'none';
        return;
    }

    let found = false;

    cards.forEach((card, index) => {
        const title = card.querySelector('.mod-header').innerText;
        const author = card.querySelector('.author').innerText;
        const fullText = card.innerText.toUpperCase();

        if (fullText.includes(filter)) {
            found = true;

            const item = document.createElement('div');
            item.className = 'search-item';

            const displayNum = (index + 1)
                .toString()
                .padStart(2, '0');

            item.innerHTML = `
                <strong>#${displayNum} ${title}</strong><br>
                <small>${author}</small>
            `;

            item.onclick = () => {
                card.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                dropdown.style.display = 'none';
                input.value = '';

                card.style.outline = "2px solid #55acee";

                setTimeout(() => {
                    card.style.outline = "none";
                }, 2000);
            };

            dropdown.appendChild(item);
        }
    });

    dropdown.style.display = found ? 'block' : 'none';
}

// ========【點擊外部關閉搜尋】 ========
document.addEventListener('click', (e) => {
    if (e.target.id !== 'mod-search') {
        document.getElementById('search-results').style.display = 'none';
    }
});

// ========【載入 DLC 對照表】 ========
function loadDLCTable(containerId, callback) {
    const container = document.getElementById(containerId);

    if (!container) return;

    fetch('dlc-table.html')
        .then(response => response.text())
        .then(data => {
            container.innerHTML = data;

            if (callback) callback();
        })
        .catch(err => {
            console.error('無法載入對照表:', err);
        });
}

// ========【開啟 DLC Dialog】 ========
function openDLCDialog() {
    const container = document.getElementById('modal-content-placeholder');
    const dialog = document.getElementById('dlc-dialog');

    if (container.innerHTML === "") {
        loadDLCTable(
            'modal-content-placeholder',
            () => dialog.showModal()
        );
    } else {
        dialog.showModal();
    }
}

// ========【卡片數量統計】 ========
function updateModCount() {
    const count = document.querySelectorAll('.mod-card').length;

    const countElement =
        document.getElementById('mod-count');

    if (countElement) {
        countElement.innerText = count;
    }
}

// ========【滾動動畫】 ========
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    },
    observerOptions
);

document.querySelectorAll('.mod-card')
    .forEach(card => {
        observer.observe(card);
    });

// ========【初始化】 ========
updateModCount();
