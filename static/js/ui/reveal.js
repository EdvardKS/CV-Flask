let observer = null;

const HIDDEN = ['opacity-0', 'translate-y-3'];
const SHOWN = ['opacity-100', 'translate-y-0'];

export function prep(el) {
    el.classList.add('transition-all', 'duration-500', ...HIDDEN);
}

export function observeReveals(root) {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('[data-reveal]').forEach(reveal);
        return;
    }
    if (!observer) {
        observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    reveal(e.target);
                    observer.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });
    }
    (root || document).querySelectorAll('[data-reveal]:not([data-revealed])')
        .forEach(el => observer.observe(el));
}

function reveal(el) {
    el.classList.remove(...HIDDEN);
    el.classList.add(...SHOWN);
    el.setAttribute('data-revealed', '');
}
