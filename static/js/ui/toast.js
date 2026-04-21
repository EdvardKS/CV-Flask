let timer = null;

export function showToast(message, kind) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('!bg-emerald-600', '!bg-rose-600');
    if (kind === 'success') el.classList.add('!bg-emerald-600');
    if (kind === 'error') el.classList.add('!bg-rose-600');
    el.classList.remove('opacity-0', 'translate-y-5');
    el.classList.add('opacity-100', 'translate-y-0');
    clearTimeout(timer);
    timer = setTimeout(hide, 3200);
}

function hide() {
    const el = document.getElementById('toast');
    if (!el) return;
    el.classList.remove('opacity-100', 'translate-y-0');
    el.classList.add('opacity-0', 'translate-y-5');
}
