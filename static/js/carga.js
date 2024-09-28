document.addEventListener("DOMContentLoaded", function () {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');

    // Simula una carga (puedes reemplazar esto con tu lógica de carga real)
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        mainContent.style.display = 'block';
    }, 3000); // Retarda la desaparición de la pantalla de carga 8 segundos
});