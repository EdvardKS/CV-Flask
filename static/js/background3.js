const ball1 = document.getElementById("ball1");
const ball2 = document.getElementById("ball2");
const ball3 = document.getElementById("ball3");
const container = document.getElementById("container");
const balls = [ball1, ball2, ball3];

let positions = [
    { x: 400, y: 300, z: 0, vx: 1, vy: 1, vz: 0.02 },
    { x: 450, y: 320, z: 100, vx: -1, vy: 0.5, vz: -0.5 },
    { x: 500, y: 350, z: -100, vx: 0.8, vy: -0.7, vz: 0.8 }
];

const G = 0.05;  // Constante gravitatoria

function distance(x1, y1, z1, x2, y2, z2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
}

function applyGravity() {
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            let dx = positions[j].x - positions[i].x;
            let dy = positions[j].y - positions[i].y;
            let dz = positions[j].z - positions[i].z;
            let dist = distance(positions[i].x, positions[i].y, positions[i].z, positions[j].x, positions[j].y, positions[j].z);

            let force = G / (dist * dist);

            let fx = force * dx / dist;
            let fy = force * dy / dist;
            let fz = force * dz / dist;

            positions[i].vx += fx;
            positions[i].vy += fy;
            positions[i].vz += fz;

            positions[j].vx -= fx;
            positions[j].vy -= fy;
            positions[j].vz -= fz;
        }
    }
}

function updatePositions() {
    for (let i = 0; i < positions.length; i++) {
        let pos = positions[i];

        // Actualizar la posición
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.z += pos.vz;

        // Rebotar en los bordes (en el plano X-Y)
        if (pos.x <= 0 || pos.x >= window.innerWidth - 20) {
            pos.vx *= -1;
        }
        if (pos.y <= 0 || pos.y >= window.innerHeight - 20) {
            pos.vy *= -1;
        }

        // Limitar el rango del eje Z para evitar que se salga de la vista
        if (pos.z <= -500 || pos.z >= 500) {
            pos.vz *= -1;
        }

        // Aplicar nueva posición al DOM
        balls[i].style.left = pos.x + 'px';
        balls[i].style.top = pos.y + 'px';

        // Simular profundidad con transformaciones en Z y escala (lejos = más pequeño)
        let scale = Math.max(0.5, 1 - pos.z / 1000);  // Ajustar el tamaño basado en Z
        balls[i].style.transform = `translateZ(${pos.z}px) scale(${scale})`;

        // Agregar el rastro de luz
        createTrail(pos.x, pos.y, pos.z, i);
    }
}

// Crear el rastro de luz
function createTrail(x, y, z, i) {
    const trail = document.createElement('div');
    trail.classList.add('trail');

    // Diferenciar los colores de los rastros de cada bola
    if (i === 0) {
        trail.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
    } else if (i === 1) {
        trail.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
    } else {
        trail.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';
    }

    trail.style.left = x + 'px';
    trail.style.top = y + 'px';

    // Ajustar el tamaño del rastro basado en Z para simular la perspectiva
    let scale = Math.max(0.5, 1 - z / 1000);
    trail.style.transform = `translateZ(${z}px) scale(${scale})`;

    container.appendChild(trail);

    // Desvanecer el rastro después de un corto tiempo
    setTimeout(() => {
        trail.remove();
    }, 500);  // Ajustar el tiempo para que el rastro desaparezca gradualmente
}

function animate() {
    applyGravity();
    updatePositions();
    requestAnimationFrame(animate);
}

animate();
