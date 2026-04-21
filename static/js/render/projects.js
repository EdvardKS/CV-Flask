import { escapeHtml, escapeAttr } from '../lib/escape.js';
import { CARD, CARD_BODY, CARD_HEAD, CARD_LOGO_ICON, CARD_META, CARD_TITLE, TAG } from '../lib/classes.js';
import { prep } from '../ui/reveal.js';

export function renderProjects({ cv, lang }) {
    const list = document.getElementById('projects-list');
    if (!list || !cv.translations.projects) return;
    list.innerHTML = '';
    cv.translations.projects.entries.forEach(p => {
        const card = document.createElement('article');
        card.className = CARD;
        card.setAttribute('data-reveal', '');
        prep(card);
        card.innerHTML = `
            <div class="${CARD_HEAD}">
                <div class="${CARD_LOGO_ICON}"><i class="fa-solid fa-cube"></i></div>
                <div class="min-w-0">
                    <h3 class="${CARD_TITLE}">${escapeHtml(p.name)}</h3>
                    ${p.url ? `<p class="${CARD_META}">
                        <a class="hover:text-accent-strong" href="${escapeAttr(p.url)}">${escapeAttr(p.url)}</a>
                    </p>` : ''}
                </div>
            </div>
            <p class="${CARD_BODY}">${escapeHtml(p.description[lang] || '')}</p>
            <div class="flex flex-wrap gap-1.5 mt-3">
                ${(p.tags || []).map(tag => `<span class="${TAG}">${escapeHtml(tag)}</span>`).join('')}
            </div>`;
        list.appendChild(card);
    });
}
