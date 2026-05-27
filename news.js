document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newsForm');
    const headerInput = document.getElementById('newsHeader');
    const textInput = document.getElementById('newsText');
    const list = document.getElementById('newsList');

    function readItemsFromHash() {
        const raw = location.hash.startsWith('#news=') ? location.hash.slice(6) : '';
        if (!raw) return [];

        try {
            return JSON.parse(decodeURIComponent(raw));
        } catch {
            return [];
        }
    }

    function writeItemsToHash(items) {
        const encoded = encodeURIComponent(JSON.stringify(items));
        history.replaceState(null, '', `${location.pathname}#news=${encoded}`);
    }

    function render() {
        const items = readItemsFromHash();
        list.innerHTML = '';

        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'news-empty';
            empty.textContent = 'No news yet. Post the first update above.';
            list.appendChild(empty);
            return;
        }

        items.forEach((item) => {
            const article = document.createElement('article');
            article.className = 'news-item';

            const title = document.createElement('h3');
            title.textContent = item.header;

            const body = document.createElement('p');
            body.textContent = item.text;

            const time = document.createElement('time');
            const date = new Date(item.createdAt);
            time.dateTime = item.createdAt;
            time.textContent = Number.isNaN(date.getTime()) ? '' : date.toLocaleString();

            article.append(title, body, time);
            list.appendChild(article);
        });
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const header = headerInput.value.trim();
        const text = textInput.value.trim();
        if (!header || !text) return;

        const items = readItemsFromHash();
        items.unshift({
            id: String(Date.now()),
            header,
            text,
            createdAt: new Date().toISOString(),
        });

        writeItemsToHash(items);
        form.reset();
        render();
        headerInput.focus();
    });

    window.addEventListener('hashchange', render);
    render();
});
