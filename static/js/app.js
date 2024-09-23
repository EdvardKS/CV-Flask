let cvData;
let currentLanguage = 'en';

async function fetchCVData() {
    // Check if data is in localStorage
    if (localStorage.getItem('cvData')) {
        cvData = JSON.parse(localStorage.getItem('cvData'));
        updateContent();
    } else {
        try {
            const response = await fetch('/get_cv_data');
            cvData = await response.json();
            // Store in localStorage
            localStorage.setItem('cvData', JSON.stringify(cvData));
            updateContent();
        } catch (error) {
            console.error('Error fetching CV data:', error);
        }
    }
}

function updateContent() {
    document.getElementById('nav-name').textContent = cvData.translations.name[currentLanguage];
    document.getElementById('photo-name').textContent = cvData.translations.name[currentLanguage];
    document.getElementById('photo-title').textContent = cvData.translations.title[currentLanguage];

    // Update summary-content with line breaks
    const summaryElement = document.getElementById('summary-content');
    const summaryText = cvData.translations.summary[currentLanguage].replace(/\n/g, '<br>');
    summaryElement.innerHTML = summaryText;

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
    threshold: 0.1
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


// Funcion que coloca la información sobre mi educación
function updateEducation() {
    const educationList = document.getElementById('education-list');
    educationList.innerHTML = ''; // Limpiar contenido anterior

    const carouselInner = document.getElementById('carousel-inner');
    carouselInner.innerHTML = ''; // Limpiar contenido del carrusel

    cvData.translations.education.entries.forEach((entry, index) => {
        // Crear un elemento para el carrusel
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;

        // Ruta de la imagen basada en el nombre del certificado
        const imagePath = `./static/data/certs/${entry.certificado}.jpg`;
        const image = new Image();

        // Comprobar si la imagen existe
        image.src = imagePath;
        image.onerror = () => {
            image.src = './static/data/default.png'; // Imagen por defecto si no existe
        };
        
        image.className = 'd-block w-1/2 mx-auto';
        image.alt = `${entry.degree[currentLanguage]} from ${entry.institution}`;

        // Añadir imagen al carrusel
        carouselItem.appendChild(image);
        
        // Crear un contenedor para la información educativa
        const infoContainer = document.createElement('div');
        infoContainer.className = 'text-center mt-4';

        const institution = document.createElement('h3');
        institution.className = 'text-xl font-semibold mb-2';
        institution.textContent = entry.institution;

        const degree = document.createElement('p');
        degree.className = 'text-lg text-blue-600';
        degree.textContent = entry.degree[currentLanguage];

        const period = document.createElement('p');
        period.className = 'text-sm text-gray-500';
        period.textContent = `Period: ${entry.period}`;

        const location = document.createElement('p');
        location.className = 'text-sm text-gray-500';
        location.textContent = `Location: ${entry.location[currentLanguage]}`;

        // Añadir información al contenedor
        infoContainer.appendChild(institution);
        infoContainer.appendChild(degree);
        infoContainer.appendChild(period);
        infoContainer.appendChild(location);

        // Añadir contenedor de información al carrusel
        carouselItem.appendChild(infoContainer);
        carouselInner.appendChild(carouselItem);
    });
}

// Funcion que coloca las cards de Experience
function updateExperience() {
    const imagenes = ["./static/data/bs.jpeg", "./static/data/psz.png"];

    const defaultImage = "./static/data/default.png";
    const experienceList = document.getElementById('experience-list');
    experienceList.innerHTML = ''; // Limpiar el contenido previo

    cvData.translations.workExperience.entries.forEach(entry => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-4';

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card mb-4';

        const img = document.createElement('img');
        img.className = 'card-img-top rounded-3xl w-1/2 mx-auto mt-2';
        img.alt = entry.position[currentLanguage]; // Alternativa descriptiva

        // Determinar la fuente de la imagen
        let imageUrl;

        if (entry.company === "Business Solutions d.o.o.") {
            imageUrl = imagenes[0];
        } else if (entry.company === "Posiziona Tecnologías de la información, S.L.") {
            imageUrl = imagenes[1];
        } else {
            imageUrl = defaultImage; // Imagen por defecto
        }

        // Comprobar si la imagen existe
        checkImageExists(imageUrl).then(exists => {
            img.src = exists ? imageUrl : defaultImage;
        });

        const cardBodyDiv = document.createElement('div');
        cardBodyDiv.className = 'card-body';

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title text-center fs-4 my-3';
        cardTitle.textContent = entry.position[currentLanguage];

        const companyName = document.createElement('h6');
        companyName.className = 'card-subtitle my-2 text-muted text-center my-1';
        companyName.textContent = entry.company; // Nombre de la empresa

        const cardText = document.createElement('p');
        cardText.className = 'card-text';
        cardText.textContent = entry.responsibilities[currentLanguage];

        const dateDiv = document.createElement('div');
        dateDiv.className = 'experience-date mt-2 color-azulito fs-5 text-center';
        dateDiv.textContent = ` ${entry.period}`; // Suponiendo que period está en tu entrada

        // Agregar los elementos a la tarjeta
        cardBodyDiv.appendChild(cardTitle);
        cardBodyDiv.appendChild(companyName); // Agregar nombre de la empresa
        cardBodyDiv.appendChild(cardText);
        cardBodyDiv.appendChild(dateDiv);
        cardDiv.appendChild(img);
        cardDiv.appendChild(cardBodyDiv);
        colDiv.appendChild(cardDiv);

        // Agregar la tarjeta a la lista de experiencias
        experienceList.appendChild(colDiv);
    });
}

// Función para comprobar si la imagen existe
function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
    });
}

// Función que muestra mis habilidades
function updateSkills() {
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';
    const skills = cvData.translations.skills.list[currentLanguage].split(', ');

    skills.forEach(skill => {
        const skillCard = document.createElement('div');
        skillCard.className = 'col-md-4 mb-4'; // Ajusta según el diseño deseado
        skillCard.innerHTML = `
            <div class="card h-100 shadow-sm border-light rounded" style="border-left: 5px solid rgba(59,130,246,var(--tw-text-opacity));">
                <div class="card-body d-flex flex-column justify-content-center align-items-center text-center">
                    <i class="fas fa-tools fa-2x mb-3" style="color: rgba(59,130,246,var(--tw-text-opacity));"></i>
                    <h5 class="card-title" style="color: rgba(59,130,246,var(--tw-text-opacity));">${skill}</h5>
                    <p class="card-text">Descripción breve sobre la habilidad.</p>
                </div>
                <div class="card-footer text-muted text-center">
                    <small style="color: rgba(59,130,246,var(--tw-text-opacity));">Nivel: Intermedio</small>
                </div>
            </div>
        `;
        skillsList.appendChild(skillCard);
    });
}


// Recoge toda la información de la ruta que flask ha servido mi información
fetchCVData();
