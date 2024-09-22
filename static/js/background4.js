document.addEventListener('DOMContentLoaded', () => {
    const background = document.getElementById('background-elements');
    const numberOfCircles = 15;

    // Crear círculos de diferentes tamaños
    const sizes = ['circle-small', 'circle-medium', 'circle-large'];

    // Función para crear un círculo
    function createCircle(sizeClass) {
        const circle = document.createElement('div');
        circle.classList.add('circle', sizeClass);
        circle.style.top = `${Math.random() * window.innerHeight}px`;
        circle.style.left = `${Math.random() * window.innerWidth}px`;
        background.appendChild(circle);
        return circle;
    }

    // Crear los círculos
    const circles = [];
    for (let i = 0; i < numberOfCircles; i++) {
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        circles.push(createCircle(randomSize));
    }

    // Función para mover los círculos basándose en la posición del ratón
    document.addEventListener('mousemove', (event) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        circles.forEach((circle, index) => {
            const factor = (index + 1) * 0.05; // Factor para hacer que los círculos se muevan de manera diferente
            const translateX = (mouseX - window.innerWidth / 2) * factor;
            const translateY = (mouseY - window.innerHeight / 2) * factor;

            circle.style.transform = `translate(${translateX}px, ${translateY}px)`;
        });
    });
});
