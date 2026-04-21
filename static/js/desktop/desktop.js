import * as wm from './window-manager.js';

export function bindDesktop() {
    const host = document.getElementById('xp-windows');
    if (!host) return;

    host.querySelectorAll('[data-window-id]').forEach(el => {
        wm.register(el);
        bindWindowControls(el);
    });

    document.querySelectorAll('[data-desktop-icon]').forEach(btn => {
        btn.addEventListener('click', e => { e.preventDefault(); openFromButton(btn); });
        btn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFromButton(btn); }
        });
    });

    document.querySelectorAll('[data-start-link]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.dataset.window;
            if (wm.get(id)) { e.preventDefault(); openFromButton(a); }
        });
    });
}

function openFromButton(btn) {
    const id = btn.dataset.window;
    if (wm.get(id)) { wm.open(id, btn); return; }
    // Not registered on this page → navigate normally.
    const url = btn.dataset.url;
    if (url) window.location.href = url;
}

function bindWindowControls(el) {
    el.addEventListener('pointerdown', () => wm.focus(el.dataset.windowId));
    el.querySelectorAll('[data-win-action]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const id = el.dataset.windowId;
            const action = btn.dataset.winAction;
            if (action === 'close') wm.close(id);
            else if (action === 'minimize') wm.minimize(id);
            else if (action === 'maximize') wm.toggleMaximize(id);
        });
    });
}
