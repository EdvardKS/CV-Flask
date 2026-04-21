import { focus } from './window-manager.js';

const DRAG_BREAKPOINT = 768;

export function enableDrag(windowEl) {
    const handle = windowEl.querySelector('[data-drag-handle]');
    if (!handle) return;
    const id = windowEl.dataset.windowId;
    let startX = 0, startY = 0, baseX = 0, baseY = 0, dragging = false;

    handle.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        if (window.innerWidth < DRAG_BREAKPOINT) return;
        if (e.target.closest('[data-win-action]')) return;
        focus(id);
        const m = /translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/.exec(windowEl.style.transform || '');
        baseX = m ? parseFloat(m[1]) : 0;
        baseY = m ? parseFloat(m[2]) : 0;
        startX = e.clientX; startY = e.clientY;
        dragging = true;
        handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', e => {
        if (!dragging) return;
        const nx = clamp(baseX + e.clientX - startX, 0, window.innerWidth - 120);
        const ny = clamp(baseY + e.clientY - startY, 0, window.innerHeight - 80);
        windowEl.style.transform = `translate(${nx}px, ${ny}px)`;
    });

    const stop = e => {
        if (!dragging) return;
        dragging = false;
        try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);

    const closeOnMiddle = e => {
        if (e.button !== 1) return;
        if (e.target.closest('[data-win-action]')) return;
        e.preventDefault();
        wm.close(id);
    };

    handle.addEventListener('auxclick', closeOnMiddle);
    handle.addEventListener('mousedown', closeOnMiddle);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
