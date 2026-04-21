import * as wm from './window-manager.js';

export function bindStartMenu() {
    const btn = document.getElementById('start-button');
    const menu = document.getElementById('start-menu');
    const shutdown = document.getElementById('shutdown-btn');
    if (!btn || !menu) return;

    btn.addEventListener('click', e => {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
    });
    document.addEventListener('click', e => {
        if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) menu.hidden = true;
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !menu.hidden) menu.hidden = true;
    });

    if (shutdown) {
        shutdown.addEventListener('click', () => {
            wm.list().forEach(s => wm.close(s.id));
            menu.hidden = true;
        });
    }
}
