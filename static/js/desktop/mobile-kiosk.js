// Below `md`, windows go fullscreen and drag is disabled.
const MQ = matchMedia('(max-width: 767px)');

export function bindMobileKiosk() {
    apply(MQ.matches);
    MQ.addEventListener('change', e => apply(e.matches));
}

function apply(isMobile) {
    document.querySelectorAll('[data-window-id]').forEach(el => {
        if (isMobile) {
            el.classList.add('is-kiosk');
            el.style.transform = 'translate(0, 0)';
            el.style.width = '100vw';
            el.style.height = 'calc(100vh - 100px)';
        } else {
            el.classList.remove('is-kiosk');
            el.style.width = '';
            el.style.height = '';
        }
    });
}
