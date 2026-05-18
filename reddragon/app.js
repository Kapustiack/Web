const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

const toolSelect = document.getElementById('tool');
const input = document.getElementById('input');
const statusText = document.getElementById('status');
const resultText = document.getElementById('result');
const sendButton = document.getElementById('send');
const clearButton = document.getElementById('clear');
const chips = document.querySelectorAll('.tool-chip');

const placeholders = {
    ip: '1.1.1.1 or example.com',
    dns: 'example.com',
    whois: 'example.com',
    headers: 'https://example.com',
    ssl: 'example.com',
    subdomains: 'example.com',
    hash: 'text to hash',
    encode: 'text to encode',
    decode: 'base64 or url encoded text',
    url: 'https://example.com/path'
};

function setStatus(text) {
    statusText.textContent = text;
}

function setResult(title, lines) {
    const body = Array.isArray(lines) ? lines.filter(Boolean).join('\n') : String(lines || '');
    resultText.textContent = `${title}\n${'-'.repeat(Math.min(48, title.length))}\n${body}`;
}

function setTool(tool, placeholder) {
    toolSelect.value = tool;
    input.placeholder = placeholder || placeholders[tool] || 'Enter value';
    chips.forEach((chip) => chip.classList.toggle('active', chip.dataset.tool === tool));
}

function clean(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function domainFrom(value) {
    const token = clean(value);
    const url = token.includes('://') ? new URL(token) : new URL(`https://${token}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
}

function ensureUrl(value) {
    const token = clean(value);
    return token.includes('://') ? token : `https://${token}`;
}

function formatDate(value) {
    if (!value) return 'unknown';
    return String(value).slice(0, 10);
}

function formatNumber(value) {
    if (value === undefined || value === null || value === '') return 'unknown';
    return String(value);
}

async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function runIp(value) {
    const host = domainFrom(value);
    const data = await fetchJson(`https://ipwho.is/${encodeURIComponent(host)}`);
    if (!data.success) throw new Error(data.message || 'lookup failed');
    return [
        `IP: ${data.ip}`,
        `Type: ${data.type || 'unknown'}`,
        `Location: ${[data.city, data.region, data.country].filter(Boolean).join(', ') || 'unknown'}`,
        `ISP: ${data.connection && data.connection.isp ? data.connection.isp : 'unknown'}`,
        `Org: ${data.connection && data.connection.org ? data.connection.org : 'unknown'}`,
        `ASN: ${data.connection && data.connection.asn ? data.connection.asn : 'unknown'}`,
        `Timezone: ${data.timezone && data.timezone.id ? data.timezone.id : 'unknown'}`
    ];
}

async function runDns(value) {
    const host = domainFrom(value);
    const types = ['A', 'AAAA', 'MX', 'NS', 'TXT'];
    const blocks = await Promise.all(types.map(async (type) => {
        try {
            const data = await fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${type}`);
            const answers = (data.Answer || []).map((item) => String(item.data).replace(/^"|"$/g, '')).slice(0, 6);
            return answers.length ? `${type}: ${answers.join('; ')}` : '';
        } catch {
            return '';
        }
    }));
    const result = [`Host: ${host}`, ...blocks.filter(Boolean)];
    return result.length > 1 ? result : [`Host: ${host}`, 'No public DNS records found.'];
}

async function runWhois(value) {
    const host = domainFrom(value);
    const root = host.split('.').slice(-2).join('.');
    const data = await fetchJson(`https://rdap.org/domain/${encodeURIComponent(root)}`);
    const events = Array.isArray(data.events)
        ? data.events.slice(0, 6).map((event) => `${event.eventAction}: ${formatDate(event.eventDate)}`)
        : [];
    const nameservers = Array.isArray(data.nameservers)
        ? data.nameservers.map((item) => item.ldhName).filter(Boolean).slice(0, 5)
        : [];
    return [
        `Domain: ${data.ldhName || root}`,
        `Status: ${Array.isArray(data.status) ? data.status.slice(0, 4).join(', ') : 'unknown'}`,
        ...events,
        nameservers.length ? `Nameservers: ${nameservers.join(', ')}` : ''
    ];
}

async function runSubdomains(value) {
    const host = domainFrom(value);
    const crtUrl = `https://crt.sh/?q=%25.${encodeURIComponent(host)}&output=json`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(crtUrl)}`;
    const response = await fetch(proxyUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const names = new Set();
    for (const item of Array.isArray(data) ? data : []) {
        String(item.name_value || '').split('\n').forEach((name) => {
            const cleaned = name.trim().toLowerCase().replace(/^\*\./, '').replace(/\.$/, '');
            if (cleaned.endsWith(host)) names.add(cleaned);
        });
    }
    const list = Array.from(names).sort();
    return [`Domain: ${host}`, `Found: ${list.length}`, ...list.slice(0, 40).map((name) => `- ${name}`), list.length > 40 ? `...and ${list.length - 40} more` : ''];
}

async function runHeaders(value) {
    const url = ensureUrl(value);
    const parsed = new URL(url);
    return [
        `URL: ${url}`,
        `Host: ${parsed.hostname}`,
        'Browser note: websites block raw cross-site header reads.',
        'Use this as a quick URL inspection, or run the bot-side headers tool if you need exact response headers.',
        ...runUrl(value)
    ];
}

async function runSsl(value) {
    const host = domainFrom(value);
    return [
        `Host: ${host}`,
        'Browser note: Mini Apps cannot read TLS certificates directly.',
        'The site can verify that HTTPS loads, but certificate issuer/expiry needs bot-side or server-side checking.',
        `HTTPS URL: https://${host}`
    ];
}

async function digestHex(algorithm, text) {
    const bytes = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest(algorithm, bytes);
    return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function runHash(value) {
    return [
        `SHA-256: ${await digestHex('SHA-256', value)}`,
        `SHA-1: ${await digestHex('SHA-1', value)}`
    ];
}

function runEncode(value) {
    return [
        `Base64: ${btoa(unescape(encodeURIComponent(value)))}`,
        `URL: ${encodeURIComponent(value)}`
    ];
}

function runDecode(value) {
    const lines = [];
    try {
        lines.push(`Base64: ${decodeURIComponent(escape(atob(value)))}`);
    } catch {
        lines.push('Base64: not valid');
    }
    const decodedUrl = decodeURIComponent(value);
    if (decodedUrl !== value) lines.push(`URL: ${decodedUrl}`);
    return lines;
}

function runUrl(value) {
    const url = ensureUrl(value);
    const parsed = new URL(url);
    const flags = [];
    if (parsed.protocol !== 'https:') flags.push('not https');
    if (parsed.username || parsed.password) flags.push('contains credentials');
    if (/(login|verify|gift|free|nitro|airdrop|wallet)/i.test(url)) flags.push('suspicious words');
    return [
        `Scheme: ${parsed.protocol.replace(':', '')}`,
        `Host: ${parsed.hostname}`,
        `Path: ${parsed.pathname || '/'}`,
        `Query: ${parsed.search ? 'yes' : 'no'}`,
        `Flags: ${flags.length ? flags.join(', ') : 'none'}`
    ];
}

async function runToolRequest() {
    const tool = toolSelect.value;
    const value = input.value.trim();

    if (!value) {
        setStatus('Missing input');
        setResult('RedDragon', 'Enter a value first.');
        if (tg) tg.HapticFeedback.notificationOccurred('error');
        return;
    }

    setStatus('Running');
    setResult('RedDragon', 'Working...');
    if (tg) tg.HapticFeedback.impactOccurred('light');

    try {
        const runners = {
            ip: runIp,
            dns: runDns,
            whois: runWhois,
            headers: runHeaders,
            ssl: runSsl,
            subdomains: runSubdomains,
            hash: runHash,
            encode: async (text) => runEncode(text),
            decode: async (text) => runDecode(text),
            url: async (text) => runUrl(text)
        };
        const title = `RedDragon | ${toolSelect.options[toolSelect.selectedIndex].text}`;
        const lines = await runners[tool](value);
        setStatus('Complete');
        setResult(title, lines);
        if (tg) tg.HapticFeedback.notificationOccurred('success');
    } catch (error) {
        setStatus('Failed');
        setResult('RedDragon | Error', error.message || String(error));
        if (tg) tg.HapticFeedback.notificationOccurred('error');
    }
}

if (tg) {
    tg.ready();
    tg.expand();
    tg.MainButton.setText('Run Tool');
    tg.MainButton.onClick(runToolRequest);
    tg.MainButton.show();
}

toolSelect.addEventListener('change', () => setTool(toolSelect.value));

chips.forEach((chip) => {
    chip.addEventListener('click', () => {
        setTool(chip.dataset.tool, chip.dataset.placeholder);
        input.focus();
    });
});

sendButton.addEventListener('click', runToolRequest);

clearButton.addEventListener('click', () => {
    input.value = '';
    setStatus('Ready');
    setResult('RedDragon', 'Select a tool and run it.');
    input.focus();
});

setTool(toolSelect.value);
