document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.copy-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            const targetId = button.dataset.copyTarget;
            const text = button.dataset.copyText || (targetId ? document.getElementById(targetId)?.innerText : '');
            if (!text) return;

            const original = button.textContent;

            const writeText = async () => {
                if (navigator.clipboard && window.isSecureContext) {
                    return navigator.clipboard.writeText(text);
                }

                const area = document.createElement('textarea');
                area.value = text;
                area.readOnly = true;
                area.style.position = 'fixed';
                area.style.left = '-9999px';
                document.body.appendChild(area);
                area.select();
                document.execCommand('copy');
                area.remove();
            };

            try {
                await writeText();
                button.textContent = 'Copied';
                button.disabled = true;
                setTimeout(() => {
                    button.textContent = original;
                    button.disabled = false;
                }, 1300);
            } catch {
                button.textContent = 'Failed';
                setTimeout(() => {
                    button.textContent = original;
                }, 1300);
            }
        });
    });
});
