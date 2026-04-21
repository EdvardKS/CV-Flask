(function () {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
        return;
    }

    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function (error) {
            console.warn('No se pudo registrar el service worker de PWA.', error);
        });
    });
})();
