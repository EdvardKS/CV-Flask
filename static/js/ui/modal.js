import { escapeHtml } from '../lib/escape.js';

let backdrop, modal;

function ensureModal() {
    if (modal) return;
    backdrop = document.createElement('div');
    backdrop.className =
        'fixed inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 ' +
        'pointer-events-none transition-opacity duration-200 z-40';
    modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl border border-surface-border shadow-hover
                    max-w-lg w-full p-6 max-h-[86vh] overflow-auto
                    pointer-events-auto opacity-0 translate-y-2 scale-95
                    transition-all duration-200" data-card>
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-lg text-ink" data-title></h3>
                <button class="w-8 h-8 rounded-lg text-ink-soft hover:bg-surface-soft inline-flex items-center justify-center"
                        data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div data-body></div>
        </div>`;
    document.body.append(backdrop, modal);
    const close = () => closeModal();
    backdrop.addEventListener('click', close);
    modal.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

export function openModal(title, bodyHtml) {
    ensureModal();
    modal.querySelector('[data-title]').textContent = title;
    modal.querySelector('[data-body]').innerHTML = bodyHtml;
    backdrop.classList.replace('opacity-0', 'opacity-100');
    backdrop.classList.replace('pointer-events-none', 'pointer-events-auto');
    const card = modal.querySelector('[data-card]');
    requestAnimationFrame(() => {
        card.classList.remove('opacity-0', 'translate-y-2', 'scale-95');
        card.classList.add('opacity-100', 'translate-y-0', 'scale-100');
    });
}

export function closeModal() {
    if (!modal) return;
    backdrop.classList.replace('opacity-100', 'opacity-0');
    backdrop.classList.replace('pointer-events-auto', 'pointer-events-none');
    const card = modal.querySelector('[data-card]');
    card.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
    card.classList.add('opacity-0', 'translate-y-2', 'scale-95');
}

export function safe(s) { return escapeHtml(s); }
