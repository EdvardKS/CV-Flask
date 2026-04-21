import { SKILL_TAG } from '../lib/classes.js';
import { prep } from '../ui/reveal.js';

export function renderSkills({ cv, lang }) {
    const list = document.getElementById('skills-list');
    if (!list || !cv.translations.skills) return;
    list.innerHTML = '';
    const items = (cv.translations.skills.list[lang] || '')
        .split(',').map(s => s.trim()).filter(Boolean);
    items.forEach(skill => {
        const span = document.createElement('span');
        span.className = SKILL_TAG;
        span.setAttribute('data-reveal', '');
        prep(span);
        span.textContent = skill;
        list.appendChild(span);
    });
}
