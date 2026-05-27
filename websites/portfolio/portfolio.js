document.addEventListener('DOMContentLoaded', () => {
    const rulesBtn = document.getElementById('rulesBtn');
    const rulesModal = document.getElementById('rulesModal');
    const rulesClose = document.getElementById('rulesClose');

    if (!rulesBtn || !rulesModal || !rulesClose) return;

    const openRules = () => {
        rulesModal.classList.add('open');
        rulesModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeRules = () => {
        rulesModal.classList.remove('open');
        rulesModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    rulesBtn.addEventListener('click', openRules);
    rulesClose.addEventListener('click', closeRules);
    rulesModal.addEventListener('click', (event) => {
        if (event.target === rulesModal) closeRules();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && rulesModal.classList.contains('open')) {
            closeRules();
        }
    });
});
