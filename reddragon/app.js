const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

const toolSelect = document.getElementById('tool');
const input = document.getElementById('input');
const statusText = document.getElementById('status');
const sendButton = document.getElementById('send');
const clearButton = document.getElementById('clear');
const chips = document.querySelectorAll('.tool-chip');

const placeholders = {
    ip: '1.1.1.1',
    dns: 'example.com',
    whois: 'example.com',
    headers: 'https://example.com',
    ssl: 'example.com',
    hash: 'text to hash',
    encode: 'text to encode',
    decode: 'base64 or url encoded text',
    url: 'https://example.com/path'
};

function setStatus(text) {
    statusText.textContent = text;
}

function setTool(tool, placeholder) {
    toolSelect.value = tool;
    input.placeholder = placeholder || placeholders[tool] || 'Enter value';
    chips.forEach((chip) => chip.classList.toggle('active', chip.dataset.tool === tool));
}

function sendToolRequest() {
    const tool = toolSelect.value;
    const value = input.value.trim();

    if (!value) {
        setStatus('Enter a value first.');
        if (tg) tg.HapticFeedback.notificationOccurred('error');
        return;
    }

    const payload = {
        source: 'reddragon',
        tool,
        input: value.slice(0, 1200)
    };

    if (!tg) {
        setStatus('Open this page from Telegram to run tools.');
        return;
    }

    tg.HapticFeedback.impactOccurred('light');
    tg.sendData(JSON.stringify(payload));
    setStatus('Sent to bot. Check Telegram chat.');
}

if (tg) {
    tg.ready();
    tg.expand();
    tg.MainButton.setText('Run Tool');
    tg.MainButton.onClick(sendToolRequest);
    tg.MainButton.show();
}

toolSelect.addEventListener('change', () => setTool(toolSelect.value));

chips.forEach((chip) => {
    chip.addEventListener('click', () => {
        setTool(chip.dataset.tool, chip.dataset.placeholder);
        input.focus();
    });
});

sendButton.addEventListener('click', sendToolRequest);

clearButton.addEventListener('click', () => {
    input.value = '';
    setStatus('Ready.');
    input.focus();
});

setTool(toolSelect.value);
