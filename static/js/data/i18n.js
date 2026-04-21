const SUPPORTED = ['en', 'es', 'hy'];
const STORAGE_LANG = 'cvLang';

let _lang = pickInitial();
let _data = null;
let _onChange = () => {};

function pickInitial() {
    const saved = localStorage.getItem(STORAGE_LANG);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const browser = (navigator.language || 'en').slice(0, 2);
    return SUPPORTED.includes(browser) ? browser : 'en';
}

export function currentLang() { return _lang; }

export function setLang(value) {
    if (!SUPPORTED.includes(value)) return;
    _lang = value;
    localStorage.setItem(STORAGE_LANG, value);
    _onChange();
}

export function bindData(cv) { _data = cv; }

export function t(key) {
    if (!_data || !_data.translations || !_data.translations[key]) return '';
    const node = _data.translations[key];
    if (typeof node === 'string') return node;
    return node[_lang] || node.en || '';
}

export function initI18n(onChange) {
    _onChange = onChange;
    const sel = document.getElementById('language-selector');
    if (sel) {
        sel.value = _lang;
        sel.addEventListener('change', e => setLang(e.target.value));
    }
}
