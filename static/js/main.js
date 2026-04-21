import { loadCvData } from './data/loader.js';
import { initI18n, currentLang, setLang, t } from './data/i18n.js';
import { setupNav } from './ui/nav.js';
import { observeReveals } from './ui/reveal.js';
import { renderTranslations, renderHero } from './render/translate.js';
import { renderSummary } from './render/summary.js';
import { renderExperience } from './render/experience.js';
import { renderEducation } from './render/education.js';
import { renderSkills } from './render/skills.js';
import { renderProjects } from './render/projects.js';
import { bindContact } from './forms/contact.js';
import { showToast } from './ui/toast.js';

let cv = null;

function renderAll() {
    if (!cv) return;
    const ctx = { cv, lang: currentLang(), t };
    renderTranslations(ctx);
    renderHero(ctx);
    renderSummary(ctx);
    renderExperience(ctx);
    renderEducation(ctx);
    renderSkills(ctx);
    renderProjects(ctx);
    observeReveals();
}

document.addEventListener('DOMContentLoaded', async () => {
    initI18n(renderAll);
    setupNav();
    bindContact();
    observeReveals();
    try {
        cv = await loadCvData();
        renderAll();
    } catch (err) {
        console.error('Failed to load CV data', err);
        showToast('Failed to load data', 'error');
    }
});
