export function setupNav() {
    const toggle = document.getElementById('menu-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
        links.classList.toggle('hidden');
        links.classList.toggle('flex');
    });
}
