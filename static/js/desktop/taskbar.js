import * as wm from './window-manager.js';

export function bindTaskbar() {
    const tray = document.getElementById('taskbar-tray');
    const clock = document.getElementById('xp-clock');
    if (clock) {
        const tick = () => {
            const d = new Date();
            clock.textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        };
        tick();
        setInterval(tick, 30 * 1000);
    }
    if (!tray) return;

    wm.on(({ type }) => {
        if (['opened', 'closed', 'minimized', 'restored', 'focused'].includes(type)) render(tray);
    });
    render(tray);
}

function render(tray) {
    tray.innerHTML = '';
    wm.list().forEach(state => {
        const w = wm.get(state.id);
        if (!w) return;
        const visible = w.el.style.display !== 'none';
        if (!visible && !state.minimized) return;  // Don't show closed windows
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
            'px-2 py-0.5 max-w-[160px] truncate text-left text-[11px] text-white ' +
            'bg-gradient-to-b from-[#3c82e0] to-[#1941a5] ' +
            'shadow-[inset_1px_1px_0_rgba(255,255,255,0.4),inset_-1px_-1px_0_rgba(0,0,0,0.3)] ' +
            (state.minimized ? 'opacity-70' : '');
        btn.textContent = state.title;
        btn.addEventListener('click', () => {
            if (state.minimized || w.el.style.display === 'none') wm.restore(state.id);
            else wm.minimize(state.id);
        });
        tray.appendChild(btn);
    });
}
