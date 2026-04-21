// Fake live metrics updater for the bottom ticker.
const JITTER = {
    tokens: () => 900 + Math.floor(Math.random() * 700) + '',
    throughput: () => (200 + Math.random() * 200).toFixed(0) + ' MB/s',
    accuracy: () => (90 + Math.random() * 8).toFixed(1) + '%',
    gpu: () => (65 + Math.random() * 20).toFixed(0) + '°C',
    latency: () => (25 + Math.random() * 40).toFixed(0) + 'ms',
    loss: () => (Math.random() * 0.2).toFixed(4),
    qps: () => (3 + Math.random() * 3).toFixed(1) + 'k',
};

export function startTicker() {
    const track = document.getElementById('xp-ticker-track');
    if (!track) return;
    setInterval(() => {
        track.querySelectorAll('[data-metric]').forEach(el => {
            const key = el.dataset.metric;
            const b = el.querySelector('b');
            if (b && JITTER[key]) b.textContent = JITTER[key]();
        });
    }, 1500);
}
