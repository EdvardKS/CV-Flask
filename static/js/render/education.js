import { escapeHtml, escapeAttr } from '../lib/escape.js';
import { CARD, CARD_BODY, CARD_HEAD, CARD_LOGO, CARD_META, CARD_TITLE } from '../lib/classes.js';
import { prep } from '../ui/reveal.js';

function isUrl(v) {
    try { new URL(v); return true; } catch (_) { return false; }
}

export function renderEducation({ cv, lang }) {
    const list = document.getElementById('education-list');
    if (!list || !cv.translations.education) return;
    list.innerHTML = '';
    cv.translations.education.entries.forEach(entry => {
        const card = document.createElement('article');
        card.className = CARD;
        card.setAttribute('data-reveal', '');
        prep(card);
        const link = isUrl(entry.certificate_pdf_link)
            ? entry.certificate_pdf_link
            : `/static/data/pdf/${entry.certificate_pdf_link}`;
        card.innerHTML = `
            <div class="${CARD_HEAD}">
                <img class="${CARD_LOGO}" src="/static/data/${entry.certificate_image}"
                     alt="${escapeHtml(entry.institution)}"
                     onerror="this.onerror=null;this.src='/static/data/certs/${entry.certificate_image}';this.addEventListener('error',()=>this.src='/static/data/default.png',{once:true})">
                <div class="min-w-0">
                    <h3 class="${CARD_TITLE}">${escapeHtml(entry.institution)}</h3>
                    <p class="${CARD_META}">${escapeHtml(entry.period || '')}</p>
                </div>
            </div>
            <p class="${CARD_BODY}">${escapeHtml(entry.degree[lang] || '')}</p>
            <p class="${CARD_META}">${escapeHtml(entry.location[lang] || '')}</p>
            ${entry.certificate_pdf_link ? `
                <p class="mt-3">
                    <a href="${escapeAttr(link)}" target="_blank" rel="noopener"
                       class="text-accent-strong hover:underline text-sm font-medium">
                        View certificate <i class="fa-solid fa-arrow-up-right-from-square text-[0.7em]"></i>
                    </a>
                </p>` : ''}`;
        list.appendChild(card);
    });
}
