// Minimal XP-style window manager.
const registry = new Map();   // id -> { el, state, origin }
let zTop = 20;
const listeners = new Set();

export function emit(type, detail) {
    listeners.forEach(fn => fn({ type, detail }));
}
export function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function register(el) {
    const id = el.dataset.windowId;
    if (!id || registry.has(id)) return;
    const state = {
        id,
        title: el.dataset.windowTitle || id,
        icon: el.dataset.windowIcon || 'app',
        initial: el.dataset.initial || 'closed',
        minimized: false,
        maximized: false,
    };
    registry.set(id, { el, state });
    if (state.initial !== 'open') el.style.display = 'none';
    else center(el); focus(id);
}

function center(el) {
    const r = el.getBoundingClientRect();
    const x = Math.max(8, (window.innerWidth - r.width) / 2);
    const y = Math.max(8, (window.innerHeight - r.height - 80) / 3);
    el.style.transform = `translate(${x}px, ${y}px)`;
}

export function focus(id) {
    const w = registry.get(id); if (!w) return;
    zTop += 1;
    w.el.style.zIndex = zTop;
    emit('focused', { id });
}

export function open(id, origin) {
    const w = registry.get(id); if (!w) return;
    if (w.state.minimized) restore(id);
    w.el.style.display = '';
    if (!w.el.style.transform) center(w.el);
    if (origin) w.state.origin = origin;
    focus(id);
    emit('opened', { id });
}

export function close(id) {
    const w = registry.get(id); if (!w) return;
    w.el.style.display = 'none';
    w.state.minimized = false;
    w.state.maximized = false;
    if (w.state.origin && w.state.origin.focus) w.state.origin.focus();
    emit('closed', { id });
}

export function minimize(id) {
    const w = registry.get(id); if (!w) return;
    w.el.style.display = 'none';
    w.state.minimized = true;
    emit('minimized', { id });
}

export function restore(id) {
    const w = registry.get(id); if (!w) return;
    w.el.style.display = '';
    w.state.minimized = false;
    focus(id);
    emit('restored', { id });
}

export function toggleMaximize(id) {
    const w = registry.get(id); if (!w) return;
    const next = !w.state.maximized;
    w.state.maximized = next;
    w.el.classList.toggle('is-maximized', next);
    if (next) {
        w.el.dataset.prevTransform = w.el.style.transform;
        w.el.style.transform = 'translate(0,0)';
        w.el.style.width = '100vw';
        w.el.style.height = 'calc(100vh - 64px)';
    } else {
        w.el.style.transform = w.el.dataset.prevTransform || '';
        w.el.style.width = '';
        w.el.style.height = '';
    }
    focus(id);
}

export function list() { return [...registry.values()].map(w => w.state); }
export function get(id) { return registry.get(id); }
