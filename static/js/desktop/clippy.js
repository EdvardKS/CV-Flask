// Clippy-style AI assistant.
import * as wm from './window-manager.js';

const TIPS = {
    cv: 'Tip: puedes arrastrar las ventanas por la barra azul. Doble-click en un icono para abrir.',
    summary: 'Dato: el resumen está traducido a 3 idiomas. Usa el selector EN/ES/HY arriba.',
    projects: '¿Quieres ver Padel Scout en acción? Abre su icono en el escritorio.',
    experience: 'Double-click en una tarjeta de experiencia para ver los detalles completos.',
    skills: 'Instalando dependencias en tiempo real… espera a que termine el pipe install.',
    contact: 'Envíame un mensaje — recibo los correos directo al inbox.',
    padel: 'La API de padel es pública en /padel/api/resumen/. Prueba con un jugador.',
    default: 'Hola 👋 soy el asistente IA retro. Click en mí para sugerencias contextuales.',
};

export function bindClippy() {
    const avatar = document.getElementById('clippy-avatar');
    const bubble = document.getElementById('clippy-bubble');
    const text = bubble && bubble.querySelector('[data-clippy-text]');
    const ok = bubble && bubble.querySelector('[data-clippy-ok]');
    const dismiss = bubble && bubble.querySelector('[data-clippy-dismiss]');
    if (!avatar || !bubble || !text) return;

    let hidden = true;
    const show = key => {
        text.textContent = TIPS[key] || TIPS.default;
        bubble.classList.remove('hidden');
        hidden = false;
    };
    const hide = () => { bubble.classList.add('hidden'); hidden = true; };

    avatar.addEventListener('click', () => {
        const s = wm.list().find(w => {
            const el = wm.get(w.id).el;
            return el.style.display !== 'none';
        });
        hidden ? show(s ? s.id : 'default') : hide();
    });
    ok && ok.addEventListener('click', hide);
    dismiss && dismiss.addEventListener('click', hide);

    wm.on(({ type, detail }) => {
        if (type === 'opened') show(detail.id);
    });

    setTimeout(() => show('default'), 2500);
}
