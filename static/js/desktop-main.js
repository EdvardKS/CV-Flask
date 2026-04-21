import { bindDesktop } from './desktop/desktop.js';
import { enableDrag } from './desktop/draggable.js';
import { bindTaskbar } from './desktop/taskbar.js';
import { bindStartMenu } from './desktop/start-menu.js';
import { bindClippy } from './desktop/clippy.js';
import { bindMobileKiosk } from './desktop/mobile-kiosk.js';
import { startNeuralCanvas } from './desktop/neural-canvas.js';
import { startTicker } from './desktop/ticker.js';
import { startTerminal } from './desktop/terminal.js';

document.addEventListener('DOMContentLoaded', () => {
    bindDesktop();
    document.querySelectorAll('[data-window-id]').forEach(enableDrag);
    bindTaskbar();
    bindStartMenu();
    bindClippy();
    bindMobileKiosk();
    startNeuralCanvas();
    startTicker();
    if (document.getElementById('skills-term-out')) startTerminal();
});
