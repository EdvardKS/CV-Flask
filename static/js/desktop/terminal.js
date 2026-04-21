// Typewriter terminal for Skills — prints `pip install <skill>` + fake progress bars.
export async function startTerminal() {
    const out = document.getElementById('skills-term-out');
    const source = document.querySelector('ul[data-skills]');
    if (!out || !source) return;

    const skills = [...source.querySelectorAll('li')]
        .map(li => (li.textContent || '').trim())
        .filter(Boolean);

    out.textContent = '';
    await type(out, 'Microsoft Windows XP [Version 5.1.2600]\n');
    await type(out, '(C) Copyright 1985-2001 Microsoft Corp. Stack by Edvard.\n\n');

    for (const skill of skills) {
        await type(out, `C:\\> pip install ${skill}\n`, 14);
        await type(out, `Collecting ${skill}...\n`, 4);
        out.textContent += '  ' + bar() + ` 100%  ${skill}-ok\n`;
        out.textContent += `Successfully installed ${skill}\n\n`;
        await sleep(140);
    }
    await type(out, 'C:\\> echo done.\n');
    await type(out, 'done.\n');
}

function bar() {
    return '[' + '#'.repeat(28) + ']';
}

function type(el, text, delay = 8) {
    return new Promise(resolve => {
        let i = 0;
        const step = () => {
            el.textContent += text[i++];
            if (i < text.length) setTimeout(step, delay);
            else resolve();
        };
        step();
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
