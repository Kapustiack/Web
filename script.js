document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const titleElement = document.getElementById('title');

    if (titleElement && !reduceMotion) {
        const text = titleElement.textContent;
        titleElement.textContent = '';

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.opacity = '0';
            span.style.transform = 'translateY(12px)';
            span.style.transition = `opacity 420ms ease ${index * 35}ms, transform 420ms ease ${index * 35}ms`;
            titleElement.appendChild(span);

            requestAnimationFrame(() => {
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            });
        });
    }

    document.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#');
        const opensNewTab = link.target === '_blank';

        if (!isExternal && !opensNewTab && !reduceMotion) {
            link.addEventListener('click', (event) => {
                if (link.href === window.location.href) return;

                event.preventDefault();
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = href;
                }, 140);
            });
        }
    });

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
        }

        return fallbackCopyText(text);
    }

    function fallbackCopyText(text) {
        return new Promise((resolve, reject) => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.setAttribute('readonly', '');
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                const didCopy = document.execCommand('copy');
                textArea.remove();
                didCopy ? resolve() : reject(new Error('Copy failed'));
            } catch (error) {
                textArea.remove();
                reject(error);
            }
        });
    }

    document.querySelectorAll('.copy-btn').forEach((copyBtn) => {
        copyBtn.addEventListener('click', () => {
            const copyTargetId = copyBtn.dataset.copyTarget;
            const copyTarget = copyTargetId ? document.getElementById(copyTargetId) : null;
            const text = copyBtn.dataset.copyText || (copyTarget ? copyTarget.innerText : '');
            if (!text) return;

            const originalText = copyBtn.innerText;
            copyText(text).then(() => {
                copyBtn.innerText = 'Copied';
                copyBtn.style.color = '#24c68a';
                setTimeout(() => {
                    copyBtn.innerText = originalText;
                    copyBtn.style.color = '';
                }, 1400);
            }).catch(() => {
                copyBtn.innerText = 'Failed';
                copyBtn.style.color = '#ef4444';
                setTimeout(() => {
                    copyBtn.innerText = originalText;
                    copyBtn.style.color = '';
                }, 1400);
            });
        });
    });
});
