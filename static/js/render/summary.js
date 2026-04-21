export function renderSummary({ cv, lang }) {
    const el = document.getElementById('summary-content');
    if (!el || !cv.translations.summary) return;
    const text = cv.translations.summary[lang] || '';
    el.innerHTML = text.replace(/\n/g, '<br>');
}
