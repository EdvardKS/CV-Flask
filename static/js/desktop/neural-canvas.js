// Animated neural network background.
const NODE_COUNT = 56;
const LINK_DIST = 140;

export function startNeuralCanvas() {
    const canvas = document.getElementById('neural-bg');
    if (!canvas) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        canvas.style.opacity = '0.2';
        return;
    }
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, nodes = [];

    function resize() {
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function init() {
        resize();
        nodes = Array.from({ length: NODE_COUNT }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
            r: 1 + Math.random() * 1.5,
        }));
    }
    window.addEventListener('resize', init);
    init();

    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) frame(); });

    function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);
        for (const n of nodes) {
            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > w) n.vx *= -1;
            if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        ctx.lineWidth = 0.6;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < LINK_DIST * LINK_DIST) {
                    const a = 1 - Math.sqrt(d2) / LINK_DIST;
                    ctx.strokeStyle = `rgba(255,255,255,${a * 0.28})`;
                    ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
                }
            }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (const n of nodes) {
            ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
        }
        requestAnimationFrame(frame);
    }
    frame();
}
