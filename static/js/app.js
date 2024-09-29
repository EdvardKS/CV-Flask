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

// Dark mode toggle functionality
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;
const modalDialog22 = document.querySelector('.modal-content');

function setDarkMode(isDark) {
    if (isDark) {
        body.classList.add('dark');
        modalDialog22.classList.add('dark2');
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.checked = true;
    } else {
        body.classList.remove('dark');
        modalDialog22.classList.remove('dark2');
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.checked = false;
    }
}

// Check for user's preference
if (localStorage.getItem('darkMode') === 'enabled') {
    setDarkMode(true);
} else {
    setDarkMode(false);
}

darkModeToggle.addEventListener('change', () => {
    setDarkMode(darkModeToggle.checked);
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

// Mantiene colorido la seccion activa
function updateActiveNavItem(sectionId) {
    navItems.forEach(item => {
        item.classList.remove('text-blue-500');
        if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('text-blue-500');
        }
    });
}

// Función que coloca la información sobre mi educación
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
        const imagePath = `/static/data/certs/${entry.certificate_image}`;
        const image = new Image();

        // Comprobar si la imagen existe
        image.src = imagePath;
        image.onerror = () => {
            image.src = '/static/data/default.png'; // Imagen por defecto si no existe
        };

        image.className = 'mx-auto rounded d-block w-90 h-64 object-fit-contain';
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

        // Comprobar si es una URL o un PDF local
        const isUrl = (path) => {
            try {
                new URL(path);
                return true;
            } catch (e) {
                return false;
            }
        };

        const pdfPath = `./static/data/pdf/${entry.certificate_pdf_link}`;
        const certificateLink = entry.certificate_pdf_link;

        if (isUrl(certificateLink)) {
            // Si es una URL, crea un enlace que lleve a la URL
            const urlLink = document.createElement('a');
            urlLink.href = certificateLink;
            urlLink.textContent = 'View Certificate';
            urlLink.className = 'text-blue-600 underline mt-2 block';
            urlLink.target = '_blank'; // Abre en una nueva pestaña
            infoContainer.appendChild(urlLink);
        } else {
            // Si es un PDF local, verifica si existe el archivo y permite descargarlo
            fetch(pdfPath, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        const pdfLink = document.createElement('a');
                        pdfLink.href = pdfPath;
                        pdfLink.textContent = 'View Certificate';
                        pdfLink.className = 'text-blue-600 underline mt-2 block';
                        pdfLink.download = entry.certificate_pdf_link; // Opción para descargar
                        infoContainer.appendChild(pdfLink);
                    }
                })
                .catch(error => {
                    console.error('Error checking PDF:', error);
                });
        }


        // Añadir contenedor de información al carrusel
        carouselItem.appendChild(infoContainer);
        carouselInner.appendChild(carouselItem);
    });
}

// Funcion que coloca las cards de Experience
function updateExperience() {
    const estilos = ["-15", "5", "25"];
    let i = 0;
    const experienceList = document.getElementById('experience-list');
    experienceList.innerHTML = ''; // Limpiar el contenido previo

    cvData.translations.workExperience.entries.forEach(entry => {
        const containerExpr = document.createElement('div');
        containerExpr.className = 'containerExpr';
        containerExpr.style.cursor = 'pointer'; // Cambiar el cursor para indicar que es clickeable

        const cardExpr = document.createElement('div');
        cardExpr.className = 'glassExpr text-center';
        cardExpr.setAttribute('data-text', `${entry.position[currentLanguage]}`);
        cardExpr.style.setProperty('--r', estilos[i]);

        // Crear el elemento <img> para el SVG
        const imgElement = document.createElement('img');
        imgElement.src = `/static/data/${entry.img_name}`; 
        imgElement.alt = entry.company[currentLanguage]; // Texto alternativo para accesibilidad
        imgElement.style.height = "5em"; // Establecer la altura deseada
        imgElement.style.width = "auto"; // Mantener la relación de aspecto
        imgElement.className = 'mb-5 rounded img-fluid';

        // Agregar el <img> a la tarjeta
        cardExpr.appendChild(imgElement);

        // Agregar la tarjeta al contenedor
        containerExpr.appendChild(cardExpr);
        // Agregar el contenedor a la lista de experiencias
        experienceList.appendChild(containerExpr);

        // Agregar evento de clic para abrir el modal
        containerExpr.addEventListener('click', () => {
            // Actualizar el contenido del modal
            const modalTitle = document.getElementById('myModalLabel');
            const modalBodyText = document.getElementById('modalBodyText');
            const modalFooterText = document.getElementById('modalFooterText');

            // Limpiar el contenido previo
            modalBodyText.innerHTML = ""; 

            // Título del modal
            modalTitle.textContent = entry.position[currentLanguage]; 

            // Crear el contenido HTML para el modal
            const company = entry.company;
            const period = entry.period ? entry.period : '-';
            const location = entry.location[currentLanguage];
            const responsibilities = entry.responsibilities[currentLanguage];

            // Crear el elemento de imagen para el modal
            const modalImg = document.createElement('img');
            modalImg.src = `/static/data/${entry.img_name}`; // Usar el mismo nombre de imagen
            modalImg.alt = entry.position[currentLanguage];
            modalImg.style.width = '7em'; // Ajustar al ancho del modal
            modalImg.style.height = 'auto'; // Mantener la relación de aspecto
            modalImg.className = 'mb-3 rounded '; // Margen inferior

            // Crear un contenedor para el modal que imite la tarjeta
            const modalCard = document.createElement('div');
            modalCard.className = 'text-center d-flex justify-content-center align-items-center flex-column';
            modalCard.style.position = 'relative';
            modalCard.style.width = 'auto'; // Ajusta el ancho según sea necesario
            modalCard.style.height = 'auto'; // Permitir que la altura se ajuste automáticamente
            modalCard.style.margin = '0 auto'; // Centrar la tarjeta

            // Agregar contenido al cuerpo del modal
            modalCard.innerHTML = `
                <h2 class="text-grey-500 fs-3">${company}</h2><br>
                ${period}<br>
                 ${location}<br><br>
            `;

            const modalFooter = document.createElement('div');
            modalFooter.className = 'text-justify';
            modalFooter.innerHTML = `${responsibilities}`;
            
            // Agregar la imagen a la tarjeta del modal
            modalCard.prepend(modalImg);

            // Limpiar el cuerpo anterior y añadir la nueva tarjeta
            modalBodyText.innerHTML = '';  
            modalBodyText.appendChild(modalCard); 
            
            modalFooterText.innerHTML = ''; 
            modalFooterText.appendChild(modalFooter); 

            // Mostrar el modal
            const myModal = new bootstrap.Modal(document.getElementById('myModal'));
            myModal.show();

            // Eliminar el backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.style.position = "absolute"; // Cambia la posición a absoluta
                backdrop.style.zIndex = "-1"; // Establece z-index detrás de todo
                backdrop.remove();
            }

        });

        i++; // Incrementar el índice para el siguiente estilo
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
    const skillsList = document.getElementById('body_skills');
    skillsList.innerHTML = '';
    const skills = cvData.translations.skills.list[currentLanguage].split(', ');
    
    skills.forEach((skill, index) => {
        // Crear el elemento <pre>
        const preElement = document.createElement('pre');
        preElement.className = 'pre';
        

        // Determinamos si es el último elemento
        const isLastElement = index === skills.length - 1;

        if (isLastElement){
            preElement.innerHTML = `
                <code>-&nbsp;</code>
                <code>pip&nbsp;</code>
                <code class="install_p">install&nbsp;</code>
                <code class="cmd" data-cmd="${skill.replace(/\s+/g, '-')}"></code>
            `;
        }else{
            preElement.innerHTML = `
                <code>-&nbsp;</code>
                <code>pip&nbsp;</code>
                <code class="install_p">install&nbsp;</code>
                <code class="cmd2" data-cmd="${skill.replace(/\s+/g, '-')}"></code>
            `;
        }

        
        skillsList.appendChild(preElement);
        
    });
}




// Función para ver el mensaje de resultado al enviar mail de contacto
document.getElementById('contact-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const submitButton = event.target.querySelector('button[type="submit"]');
    updateButtonState(submitButton, 'sending');
    try {
        const response = await fetch('/submit_contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.status === 'success') {
            updateButtonState(submitButton, 'success');
            event.target.reset();
        } else {
            updateButtonState(submitButton, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        updateButtonState(submitButton, 'error');
    }
});

function updateButtonState(button, state) {
    button.classList.add('btn-transition'); // Ensure the transition class is added
    switch(state) {
        case 'sending':
            button.textContent = 'Sending...';
            button.classList.remove('bg-green-500', 'bg-red-500');
            button.classList.add('bg-blue-500');
            button.disabled = true;
            break;
        case 'success':
            button.textContent = 'Message Sent!';
            button.classList.remove('bg-blue-500', 'bg-red-500');
            button.classList.add('bg-green-500');
            button.disabled = false;
            resetButtonAfterTimeout(button);
            break;
        case 'error':
            button.textContent = 'Error, try later...';
            button.classList.remove('bg-blue-500', 'bg-green-500');
            button.classList.add('bg-red-500');
            button.disabled = false;
            resetButtonAfterTimeout(button);
            break;
        case 'reset':
            button.textContent = 'Send Message';
            button.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500');
            button.classList.add('bg-blue-500');
            button.disabled = false;
            break;
    }
}

function resetButtonAfterTimeout(button) {
    setTimeout(() => {
        updateButtonState(button, 'reset');
    }, 10000); // Reset button after 10 seconds
}

// Recoge toda la información de la ruta que flask ha servido mi información
fetchCVData();


document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
        const navbar = document.getElementById('navbarNav');
        if (navbar.classList.contains('show')) {
            new bootstrap.Collapse(navbar).toggle();
        }
    });
});
