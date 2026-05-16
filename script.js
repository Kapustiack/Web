document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('title');
    const orbs = document.querySelectorAll('.orb');

    if (titleElement) {
        const text = titleElement.textContent;
        titleElement.textContent = '';
        const spans = text.split('').map(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            titleElement.appendChild(span);
            return span;
        });

        spans.forEach((span) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.max(window.innerWidth, window.innerHeight) * 1.5;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            span.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 720 - 360}deg)`;
            span.style.opacity = '0';
        });

        setTimeout(() => {
            spans.forEach((span, index) => {
                setTimeout(() => {
                    span.style.transition = 'transform 2s cubic-bezier(0.19, 1, 0.22, 1), opacity 2s ease-out';
                    span.style.transform = 'translate(0, 0) rotate(0deg)';
                    span.style.opacity = '1';
                }, index * 80);
            });
        }, 100);

    }

    if (orbs.length > 0) {
        orbs.forEach((orb, i) => {
            orb.animate([
                { transform: 'translate(0, 0)' },
                { transform: `translate(${Math.sin(i) * 30}px, ${Math.cos(i) * 30}px)` },
                { transform: 'translate(0, 0)' }
            ], {
                duration: 10000 + i * 2000,
                iterations: Infinity,
                easing: 'linear'
            });
        });

        window.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            orbs.forEach((orb, i) => {
                const speed = (i + 1) * 20;
                const xOffset = (x - 0.5) * speed;
                const yOffset = (y - 0.5) * speed;
                orb.style.marginLeft = `${xOffset}px`;
                orb.style.marginTop = `${yOffset}px`;
            });
        });
    }

    document.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#');
        const opensNewTab = link.target === '_blank';

        if (!isExternal && !opensNewTab) {
            link.addEventListener('click', (e) => {
                if (link.href === window.location.href) return;

                e.preventDefault();
                document.body.classList.add('page-leaving');
                setTimeout(() => { window.location.href = href; }, 300);
            });
        }
    });

    document.querySelectorAll('.nav-discord').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'https://discord.gg/VfEZWQSSGd';
        });
    });

    const cards = document.querySelectorAll('.expandable-card');
    const copyBtn = document.getElementById('copy-btn');
    const codeText = document.getElementById('script-code');

    if (cards.length > 0) {
        cards.forEach((card) => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button, a')) card.classList.toggle('expanded');
            });
        });
    }

    if (copyBtn && codeText) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(codeText.innerText).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = 'Copied!';
                copyBtn.style.color = '#10b981';
                setTimeout(() => {
                    copyBtn.innerText = originalText;
                    copyBtn.style.color = '';
                }, 2000);
            });
        });
    }

    window.addEventListener('click', (e) => {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 800);
    });

    const statusText = document.getElementById('status-text');
    if (statusText) {
        const statuses = [
            'System Initializing...',
            'Secure Connection Established',
            'Bypassing Firewall...',
            'Accessing Mainframe...',
            'Kapustiack Online',
            'Data Encryption Active',
            'Waiting for Input...'
        ];
        let statusIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentStatus = statuses[statusIndex];
            if (isDeleting) {
                statusText.textContent = currentStatus.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50;
            } else {
                statusText.textContent = currentStatus.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100;
            }

            if (!isDeleting && charIndex === currentStatus.length) {
                isDeleting = true;
                typeSpeed = 2000;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                statusIndex = (statusIndex + 1) % statuses.length;
                typeSpeed = 500;
            }
            setTimeout(type, typeSpeed);
        }
        type();
    }
});
