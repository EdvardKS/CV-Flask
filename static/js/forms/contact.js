import { showToast } from '../ui/toast.js';

export function bindContact() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const endpoint = form.dataset.endpoint || '/contact/submit/';

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const btn = form.querySelector('button[type="submit"]');
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span><span>Sending...</span>';
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (result.status === 'success') {
                showToast('Message sent', 'success');
                form.reset();
            } else {
                showToast(result.message || 'Error sending', 'error');
            }
        } catch (_) {
            showToast('Network error', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    });
}
