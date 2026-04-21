document.addEventListener('DOMContentLoaded', () => {
    const background = document.getElementById('background-elements');
    const numberOfCircles = 52;
    const attractionDistance = 100; // Distancia en la que los círculos comenzarán a huir del ratón
    const sizes = ['circle-small', 'circle-medium', 'circle-large'];
    const circles = [];
    const waves = [];

    let lastMousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // Última posición del ratón

    // Crear un círculo
    function createCircle(sizeClass) {
        const circle = document.createElement('div');
        circle.classList.add('circle', sizeClass);
        circle.style.top = `${Math.random() * window.innerHeight}px`;
        circle.style.left = `${Math.random() * window.innerWidth}px`;
        background.appendChild(circle);

        // Almacenar datos de posición y velocidad para movimiento libre
        const circleData = {
            element: circle,
            velocityX: (Math.random() - 0.5) * 0.5,
            velocityY: (Math.random() - 0.5) * 0.5,
            isEscaping: false,
        };
        circles.push(circleData);
    }

    // Crear una onda circular
    function createWave(centerX, centerY) {
        const wave = document.createElement('div');
        wave.classList.add('wave');
        wave.style.top = `${centerY}px`;
        wave.style.left = `${centerX}px`;
        background.appendChild(wave);

        // Almacenar datos de la onda
        const waveData = {
            element: wave,
            centerX: centerX,
            centerY: centerY,
            radius: 0,
            opacity: 1,
            lifetime: 100 // Duración de la onda en frames
        };
        waves.push(waveData);
    }

    // Crear círculos iniciales
    for (let i = 0; i < numberOfCircles; i++) {
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        createCircle(randomSize);
    }

    // Actualizar la posición de los círculos en movimiento libre
    function updateCircles() {
        circles.forEach(circleData => {
            const { element, velocityX, velocityY } = circleData;

            // Mover los círculos
            let currentX = parseFloat(element.style.left);
            let currentY = parseFloat(element.style.top);
            currentX += velocityX;
            currentY += velocityY;

            // Rebotar si tocan los bordes
            if (currentX <= 0 || currentX >= window.innerWidth - element.offsetWidth) {
                circleData.velocityX *= -1;
            }
            if (currentY <= 0 || currentY >= window.innerHeight - element.offsetHeight) {
                circleData.velocityY *= -1;
            }

            // Actualizar la nueva posición
            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
        });
    }

    // Actualizar las ondas
    function updateWaves() {
        for (let i = waves.length - 1; i >= 0; i--) {
            const waveData = waves[i];
            const { element, radius, opacity, lifetime } = waveData;

            // Incrementar el radio para expandir la onda
            const newRadius = radius + 2;
            waveData.radius = newRadius;
            waveData.opacity -= 0.01; // Desvanecer la onda
            waveData.lifetime -= 1;

            // Actualizar el tamaño y la opacidad
            element.style.width = `${newRadius * 2}px`;
            element.style.height = `${newRadius * 2}px`;
            element.style.marginLeft = `${-newRadius}px`;
            element.style.marginTop = `${-newRadius}px`;
            element.style.opacity = waveData.opacity;

            // Remover la onda si su lifetime ha expirado
            if (waveData.lifetime <= 0 || waveData.opacity <= 0) {
                element.remove();
                waves.splice(i, 1);
            }
        }
    }

    // Detectar cercanía del ratón y hacer que los círculos huyan
    document.addEventListener('mousemove', (event) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        circles.forEach(circleData => {
            const circle = circleData.element;
            const circleX = circle.offsetLeft + circle.offsetWidth / 2;
            const circleY = circle.offsetTop + circle.offsetHeight / 2;

            const distance = Math.hypot(circleX - mouseX, circleY - mouseY);

            if (distance < attractionDistance) {
                // Si el círculo está dentro del rango de atracción, huye del ratón
                circleData.isEscaping = true;
                const escapeFactor = 0.05; // Velocidad de escape más moderada

                const translateX = (circleX - mouseX) * escapeFactor;
                const translateY = (circleY - mouseY) * escapeFactor;

                circleData.velocityX = translateX;
                circleData.velocityY = translateY;
            } else {
                circleData.isEscaping = false;
            }
        });

        // Actualizar la última posición del ratón
        lastMousePosition.x = mouseX;
        lastMousePosition.y = mouseY;
    });

    // Detectar clicks para crear una explosión en forma de onda
    document.addEventListener('click', (event) => {
        const explosionX = event.clientX;
        const explosionY = event.clientY;

        // Crear una nueva onda en el punto de explosión
        createWave(explosionX, explosionY);
    });

    // Animar el movimiento libre y las ondas
    function animate() {
        updateCircles();
        updateWaves();
        requestAnimationFrame(animate);
    }

    // Iniciar la animación
    animate();
});