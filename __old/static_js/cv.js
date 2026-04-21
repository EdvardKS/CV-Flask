(function () {
    'use strict';

    const SUPPORTED = ['en', 'es', 'hy'];
    const STORAGE_LANG = 'cvLang';
    const STORAGE_DATA = 'cvDataV2';

    let cvData = null;
    let lang = (function () {
        const saved = localStorage.getItem(STORAGE_LANG);
        if (saved && SUPPORTED.includes(saved)) return saved;
        const browser = (navigator.language || 'en').slice(0, 2);
        return SUPPORTED.includes(browser) ? browser : 'en';
    })();

    // ---------- Data ----------
    async function loadData() {
        const cached = sessionStorage.getItem(STORAGE_DATA);
        if (cached) {
            try { cvData = JSON.parse(cached); return cvData; } catch (_) {}
        }
        const res = await fetch('/get_cv_data');
        cvData = await res.json();
        sessionStorage.setItem(STORAGE_DATA, JSON.stringify(cvData));
        return cvData;
    }

    function t(key) {
        if (!cvData || !cvData.translations[key]) return '';
        const node = cvData.translations[key];
        if (typeof node === 'string') return node;
        if (node[lang]) return node[lang];
        if (node.en) return node.en;
        return '';
    }

    // ---------- Renderers ----------
    function renderTranslations() {
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            const v = t(key);
            if (v) el.textContent = v;
        });
        const brand = document.getElementById('brand-name');
        if (brand) brand.textContent = t('name') || 'Edvard K.';
        const fy = document.getElementById('footer-year');
        if (fy) fy.textContent = new Date().getFullYear();
    }

    function renderHero() {
        const name = document.getElementById('cv-name');
        const role = document.getElementById('cv-role');
        if (name) name.textContent = t('name');
        if (role) role.textContent = t('title');
    }

    function renderSummary() {
        const el = document.getElementById('summary-content');
        if (!el || !cvData.translations.summary) return;
        el.innerHTML = (cvData.translations.summary[lang] || '').replace(/\n/g, '<br>');
    }

    function renderExperience() {
        const list = document.getElementById('experience-list');
        if (!list || !cvData.translations.workExperience) return;
        list.innerHTML = '';
        cvData.translations.workExperience.entries.forEach(entry => {
            const card = document.createElement('article');
            card.className = 'card reveal';
            card.innerHTML = `
                <div class="card-head">
                    <img class="card-logo" src="/static/data/${entry.img_name}" alt="${escapeHtml(entry.company || '')}" onerror="this.src='/static/data/default.png'">
                    <div>
                        <h3>${escapeHtml(entry.position[lang] || '')}</h3>
                        <p class="meta">${escapeHtml(entry.company || '')} · ${escapeHtml(entry.period || '')}</p>
                    </div>
                </div>
                <p class="meta">${escapeHtml(entry.location[lang] || '')}</p>
                <p>${escapeHtml(entry.responsibilities[lang] || '')}</p>
            `;
            card.addEventListener('click', () => openExperienceModal(entry));
            card.style.cursor = 'pointer';
            list.appendChild(card);
        });
        observeReveals(list);
    }

    function renderEducation() {
        const list = document.getElementById('education-list');
        if (!list || !cvData.translations.education) return;
        list.innerHTML = '';
        cvData.translations.education.entries.forEach(entry => {
            const card = document.createElement('article');
            card.className = 'card reveal';

            const isUrl = (() => { try { new URL(entry.certificate_pdf_link); return true; } catch (_) { return false; } })();
            const linkHref = isUrl ? entry.certificate_pdf_link : `/static/data/pdf/${entry.certificate_pdf_link}`;

            card.innerHTML = `
                <div class="card-head">
                    <img class="card-logo" src="/static/data/${entry.certificate_image}" alt="${escapeHtml(entry.institution)}"
                         onerror="this.onerror=null;this.src='/static/data/certs/${entry.certificate_image}';this.addEventListener('error',()=>this.src='/static/data/default.png',{once:true})">
                    <div>
                        <h3>${escapeHtml(entry.institution)}</h3>
                        <p class="meta">${escapeHtml(entry.period || '')}</p>
                    </div>
                </div>
                <p>${escapeHtml(entry.degree[lang] || '')}</p>
                <p class="meta">${escapeHtml(entry.location[lang] || '')}</p>
                ${entry.certificate_pdf_link ? `<p style="margin-top:10px"><a href="${escapeAttr(linkHref)}" target="_blank" rel="noopener">View certificate <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:.7em"></i></a></p>` : ''}
            `;
            list.appendChild(card);
        });
        observeReveals(list);
    }

    function renderSkills() {
        const list = document.getElementById('skills-list');
        if (!list || !cvData.translations.skills) return;
        list.innerHTML = '';
        const items = (cvData.translations.skills.list[lang] || '').split(',').map(s => s.trim()).filter(Boolean);
        items.forEach(s => {
            const span = document.createElement('span');
            span.className = 'tag reveal';
            span.textContent = s;
            list.appendChild(span);
        });
        observeReveals(list);
    }

    function renderProjects() {
        const list = document.getElementById('projects-list');
        if (!list || !cvData.translations.projects) return;
        list.innerHTML = '';
        cvData.translations.projects.entries.forEach(p => {
            const card = document.createElement('article');
            card.className = 'card reveal';
            card.innerHTML = `
                <div class="card-head">
                    <div class="card-logo" style="display:flex;align-items:center;justify-content:center;color:var(--accent-strong)"><i class="fa-solid fa-cube"></i></div>
                    <div>
                        <h3>${escapeHtml(p.name)}</h3>
                        ${p.url ? `<p class="meta"><a href="${escapeAttr(p.url)}">${escapeAttr(p.url)}</a></p>` : ''}
                    </div>
                </div>
                <p>${escapeHtml(p.description[lang] || '')}</p>
                <div class="tag-row">
                    ${(p.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            `;
            list.appendChild(card);
        });
        observeReveals(list);
    }

    function renderAll() {
        renderTranslations();
        renderHero();
        renderSummary();
        renderExperience();
        renderEducation();
        renderSkills();
        renderProjects();
    }

    // ---------- Modal ----------
    function openExperienceModal(entry) {
        let backdrop = document.getElementById('exp-modal-backdrop');
        let modal = document.getElementById('exp-modal');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'exp-modal-backdrop';
            backdrop.className = 'modal-backdrop-x';
            document.body.appendChild(backdrop);
        }
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'exp-modal';
            modal.className = 'modal-x';
            modal.innerHTML = `<div class="modal-card">
                <div class="modal-head"><h3 id="exp-modal-title"></h3>
                    <button class="modal-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="exp-modal-body"></div>
            </div>`;
            document.body.appendChild(modal);
            const close = () => closeExperienceModal();
            backdrop.addEventListener('click', close);
            modal.querySelector('.modal-close').addEventListener('click', close);
            document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        }
        modal.querySelector('#exp-modal-title').textContent = entry.position[lang] || '';
        modal.querySelector('#exp-modal-body').innerHTML = `
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
                <img src="/static/data/${entry.img_name}" alt="" style="width:56px;height:56px;border-radius:10px;border:1px solid var(--border);object-fit:contain;padding:4px;background:var(--bg-soft)" onerror="this.src='/static/data/default.png'">
                <div>
                    <div style="font-weight:600">${escapeHtml(entry.company || '')}</div>
                    <div class="meta">${escapeHtml(entry.period || '')} · ${escapeHtml(entry.location[lang] || '')}</div>
                </div>
            </div>
            <p>${escapeHtml(entry.responsibilities[lang] || '')}</p>
        `;
        backdrop.classList.add('open');
        modal.classList.add('open');
    }
    function closeExperienceModal() {
        const backdrop = document.getElementById('exp-modal-backdrop');
        const modal = document.getElementById('exp-modal');
        if (backdrop) backdrop.classList.remove('open');
        if (modal) modal.classList.remove('open');
    }

    // ---------- Contact ----------
    function bindContact() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());
            const btn = form.querySelector('button[type="submit"]');
            const original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span><span>Sending...</span>';
            try {
                const res = await fetch('/submit_contact', {
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

    function showToast(msg, kind) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.className = 'toast show' + (kind ? ' ' + kind : '');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => { el.className = 'toast'; }, 3200);
    }

    // ---------- Reveal observer ----------
    let revealObserver = null;
    function observeReveals(root) {
        if (!('IntersectionObserver' in window)) {
            (root || document).querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
            return;
        }
        if (!revealObserver) {
            revealObserver = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.classList.add('in');
                        revealObserver.unobserve(e.target);
                    }
                });
            }, { threshold: 0.1 });
        }
        (root || document).querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }

    // ---------- Helpers ----------
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function escapeAttr(s) { return escapeHtml(s); }

    // ---------- Init ----------
    function setupNav() {
        const sel = document.getElementById('language-selector');
        if (sel) {
            sel.value = lang;
            sel.addEventListener('change', e => {
                lang = e.target.value;
                localStorage.setItem(STORAGE_LANG, lang);
                renderAll();
            });
        }
        const toggle = document.getElementById('menu-toggle');
        const links = document.getElementById('nav-links');
        if (toggle && links) {
            toggle.addEventListener('click', () => links.classList.toggle('open'));
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        setupNav();
        bindContact();
        observeReveals();
        try {
            await loadData();
            renderAll();
            observeReveals();
        } catch (err) {
            console.error('Failed to load CV data', err);
            showToast('Failed to load data', 'error');
        }
    });
})();
