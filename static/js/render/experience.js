import { escapeHtml } from '../lib/escape.js';
import { CARD, CARD_BODY, CARD_HEAD, CARD_LOGO, CARD_META, CARD_TITLE } from '../lib/classes.js';
import { openModal } from '../ui/modal.js';
import { prep } from '../ui/reveal.js';

export function renderExperience({ cv, lang }) {
    const list = document.getElementById('experience-list');
    if (!list || !cv.translations.workExperience) return;
    list.innerHTML = '';
    cv.translations.workExperience.entries.forEach(entry => {
        const card = document.createElement('article');
        card.className = `${CARD} cursor-pointer`;
        card.setAttribute('data-reveal', '');
        prep(card);
        card.innerHTML = `
            <div class="${CARD_HEAD}">
                <img class="${CARD_LOGO}" src="/static/data/${entry.img_name}"
                     alt="${escapeHtml(entry.company || '')}"
                     onerror="this.src='/static/data/default.png'">
                <div class="min-w-0">
                    <h3 class="${CARD_TITLE}">${escapeHtml(entry.position[lang] || '')}</h3>
                    <p class="${CARD_META}">${escapeHtml(entry.company || '')} · ${escapeHtml(entry.period || '')}</p>
                </div>
            </div>
            <p class="${CARD_META}">${escapeHtml(entry.location[lang] || '')}</p>
            <p class="${CARD_BODY} line-clamp-3">${escapeHtml(entry.responsibilities[lang] || '')}</p>`;
        card.addEventListener('click', () => openExperience(entry, lang));
        list.appendChild(card);
    });
}

function openExperience(entry, lang) {
    const body = `
        <div class="flex items-center gap-3 mb-3">
            <img class="w-14 h-14 rounded-xl border border-surface-border bg-surface-soft p-1 object-contain"
                 src="/static/data/${entry.img_name}" alt=""
                 onerror="this.src='/static/data/default.png'">
            <div>
                <div class="font-semibold text-ink">${escapeHtml(entry.company || '')}</div>
                <div class="text-xs text-ink-muted">
                    ${escapeHtml(entry.period || '')} · ${escapeHtml(entry.location[lang] || '')}
                </div>
            </div>
        </div>
        <p class="text-ink-soft text-sm leading-relaxed">
            ${escapeHtml(entry.responsibilities[lang] || '')}
        </p>`;
    openModal(entry.position[lang] || '', body);
}
