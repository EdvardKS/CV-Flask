document.addEventListener('DOMContentLoaded', () => {
    const background = document.getElementById('background-elements');
    const numberOfCircles = 52;
    const attractionDistance = 300; // Distancia en la que los círculos comenzarán a seguir al ratón
    const releaseDistance = 300; // Distancia para que los círculos vuelvan a ser libres

    const sizes = ['circle-small', 'circle-medium', 'circle-large'];
    const circles = [];

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
            velocityX: (Math.random() - 0.5) * 1,
            velocityY: (Math.random() - 0.5) * 1,
            isFollowingMouse: false,
            lastMouseDirectionX: 0, // Dirección del ratón en el eje X
            lastMouseDirectionY: 0  // Dirección del ratón en el eje Y
        };
        circles.push(circleData);
    }

    // Crear círculos
    for (let i = 0; i < numberOfCircles; i++) {
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        createCircle(randomSize);
    }

    // Actualizar la posición de los círculos en movimiento libre
    function updateCircles() {
        circles.forEach(circleData => {
            const { element, velocityX, velocityY, isFollowingMouse } = circleData;

            // Solo mover libremente si no están siguiendo el ratón
            if (!isFollowingMouse) {
                let currentX = parseFloat(element.style.left);
                let currentY = parseFloat(element.style.top);

                // Movimiento libre
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
            }
        });
    }

    // Detectar cercanía del ratón y hacer que los círculos lo sigan
    document.addEventListener('mousemove', (event) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const mouseDirectionX = mouseX - lastMousePosition.x;
        const mouseDirectionY = mouseY - lastMousePosition.y;

        circles.forEach(circleData => {
            const circle = circleData.element;
            const circleX = circle.offsetLeft + circle.offsetWidth / 2;
            const circleY = circle.offsetTop + circle.offsetHeight / 2;

            const distance = Math.hypot(circleX - mouseX, circleY - mouseY);

            if (distance < attractionDistance) {
                // Si el círculo está dentro del rango de atracción, sigue al ratón
                circleData.isFollowingMouse = true;
                const followFactor = 0.05; // Velocidad de seguimiento
                const translateX = (mouseX - circleX) * followFactor;
                const translateY = (mouseY - circleY) * followFactor;
                circle.style.transform = `translate(${translateX}px, ${translateY}px)`;

                // Almacenar la dirección del ratón para usarla después
                circleData.lastMouseDirectionX = mouseDirectionX;
                circleData.lastMouseDirectionY = mouseDirectionY;
            } else if (distance > releaseDistance && circleData.isFollowingMouse) {
                // Si el ratón se aleja, sigue la dirección del último movimiento del ratón
                circleData.isFollowingMouse = false;

                // Asignar la dirección del ratón como nueva velocidad
                const speedMultiplier = 0.01;
                circleData.velocityX = circleData.lastMouseDirectionX * speedMultiplier;
                circleData.velocityY = circleData.lastMouseDirectionY * speedMultiplier;

                // Resetear el transform para que vuelvan a su movimiento libre
                circle.style.transform = '';
            }
        });

        // Actualizar la última posición del ratón
        lastMousePosition.x = mouseX;
        lastMousePosition.y = mouseY;
    });

    // Animar el movimiento libre
    function animate() {
        updateCircles();
        requestAnimationFrame(animate);
    }

    // Iniciar la animación
    animate();
});
