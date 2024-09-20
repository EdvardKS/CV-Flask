let cvData;
let currentLanguage = 'en';

async function fetchCVData() {
    const response = await fetch('/get_cv_data');
    cvData = await response.json();
    updateContent();
}

function updateContent() {
    document.getElementById('nav-name').textContent = cvData.translations.name[currentLanguage];
    document.getElementById('photo-name').textContent = cvData.translations.name[currentLanguage];
    document.getElementById('photo-title').textContent = cvData.translations.title[currentLanguage];
    document.getElementById('summary-content').textContent = cvData.translations.summary[currentLanguage];
    
    updateEducation();
    updateExperience();
    updateSkills();
    updateTranslations();
}

function updateEducation() {
    const educationList = document.getElementById('education-list');
    educationList.innerHTML = '';
    cvData.translations.education.entries.forEach(entry => {
        const educationItem = document.createElement('div');
        educationItem.className = 'mb-4';
        educationItem.innerHTML = `
            <h3 class="font-bold">${entry.institution}</h3>
            <p>${entry.period}</p>
            <p>${entry.degree[currentLanguage]}</p>
            <p>${entry.location[currentLanguage]}</p>
        `;
        educationList.appendChild(educationItem);
    });
}

function updateExperience() {
    const experienceList = document.getElementById('experience-list');
    experienceList.innerHTML = '';
    cvData.translations.workExperience.entries.forEach(entry => {
        const experienceItem = document.createElement('div');
        experienceItem.className = 'mb-4';
        experienceItem.innerHTML = `
            <h3 class="font-bold">${entry.position[currentLanguage]}</h3>
            <p>${entry.company}</p>
            <p>${entry.period}</p>
            <p>${entry.location[currentLanguage]}</p>
            <p>${entry.responsibilities[currentLanguage]}</p>
        `;
        experienceList.appendChild(experienceItem);
    });
}

function updateSkills() {
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';
    const skills = cvData.translations.skills.list[currentLanguage].split(', ');
    skills.forEach(skill => {
        const skillItem = document.createElement('li');
        skillItem.textContent = skill;
        skillsList.appendChild(skillItem);
    });
}

function updateTranslations() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (cvData.translations[key] && cvData.translations[key][currentLanguage]) {
            element.textContent = cvData.translations[key][currentLanguage];
        }
    });
}

document.getElementById('language-selector').addEventListener('change', (event) => {
    currentLanguage = event.target.value;
    updateContent();
});

document.getElementById('contact-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/submit_contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        alert(result.message);
        if (result.status === 'success') {
            event.target.reset();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while sending your message. Please try again later.');
    }
});

// Dark mode toggle functionality
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

function setDarkMode(isDark) {
    if (isDark) {
        body.classList.add('dark');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        body.classList.remove('dark');
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Check for user's preference
if (localStorage.getItem('darkMode') === 'enabled') {
    setDarkMode(true);
}

darkModeToggle.addEventListener('click', () => {
    setDarkMode(!body.classList.contains('dark'));
});

// Add smooth scrolling functionality
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        targetElement.scrollIntoView({ behavior: 'smooth' });
    });
});

// Intersection Observer for section transitions
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('nav ul li a');

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            updateActiveNavItem(entry.target.id);
        } else {
            entry.target.classList.remove('active');
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

function updateActiveNavItem(sectionId) {
    navItems.forEach(item => {
        item.classList.remove('text-blue-500');
        if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('text-blue-500');
        }
    });
}

fetchCVData();
