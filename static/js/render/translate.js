import { bindData, t as translate } from '../data/i18n.js';

export function renderTranslations({ cv }) {
    bindData(cv);
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        const v = translate(key);
        if (v) el.textContent = v;
    });
    const brand = document.getElementById('brand-name');
    if (brand) brand.textContent = translate('name') || 'Edvard K.';
    const fy = document.getElementById('footer-year');
    if (fy) fy.textContent = new Date().getFullYear();
}

export function renderHero({ cv, lang }) {
    const name = document.getElementById('cv-name');
    const role = document.getElementById('cv-role');
    if (name && cv.translations.name) name.textContent = cv.translations.name[lang];
    if (role && cv.translations.title) role.textContent = cv.translations.title[lang];
}
