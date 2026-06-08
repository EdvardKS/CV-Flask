#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrae de simulacro_examen.html:
  - las imagenes (JPEG) embebidas en base64 -> public/data/quiz/sistemas-digitales/assets/
  - un volcado de texto por pregunta -> scripts/_sdig_extract.json
para construir las 12 preguntas MCQ del banco sistemas-digitales.json.

Uso: python scripts/extract_sdig_simulacro.py
Salida UTF-8. Idempotente (reescribe assets y el volcado).
"""
import base64
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'simulacro_examen.html')
ASSETS = os.path.join(ROOT, 'public', 'data', 'quiz', 'sistemas-digitales', 'assets')
DUMP = os.path.join(ROOT, 'scripts', '_sdig_extract.json')


def strip_tags(html: str) -> str:
    html = re.sub(r'<br\s*/?>', '\n', html)
    html = re.sub(r'</(p|li|div|tr|h\d)>', '\n', html)
    html = re.sub(r'<[^>]+>', ' ', html)
    html = (html.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
                .replace('&nbsp;', ' ').replace('&middot;', '·').replace('&quot;', '"'))
    html = re.sub(r'[ \t]+', ' ', html)
    html = re.sub(r'\n\s*\n+', '\n', html)
    return html.strip()


def main():
    os.makedirs(ASSETS, exist_ok=True)
    html = open(SRC, encoding='utf-8').read()
    blocks = re.split(r'<div class="qcard"', html)[1:]
    out = []
    for block in blocks:
        mid = re.search(r'id="(q\d+)"', block)
        if not mid:
            continue
        qid = mid.group(1)
        topic = re.search(r'qtopic">([^<]*)', block)
        num = re.search(r'qnum">([^<]*)', block)
        aval = re.search(r'class="aval">([^<]*)', block)
        # imagenes del bloque
        imgs = re.findall(r'src="data:image/[^;]+;base64,([^"]+)"', block)
        img_files = []
        for i, b64 in enumerate(imgs):
            suffix = '' if len(imgs) == 1 else chr(ord('a') + i)
            fname = f'{qid}{suffix}.jpg'
            with open(os.path.join(ASSETS, fname), 'wb') as fh:
                fh.write(base64.b64decode(b64))
            img_files.append(fname)
        # texto: contexto teorico, pasos, clave mental y panel de respuesta
        teoria = re.search(r'class="teoria">(.*?)</div>', block, re.S)
        steps = re.search(r'class="steps-box">(.*?)</div>\s*<div class="reveal-zone"', block, re.S)
        think = re.search(r'class="think">(.*?)</div>', block, re.S)
        panel = re.search(r'class="answer-panel">(.*?)</div>\s*</div>\s*</div>', block, re.S)
        out.append({
            'id': qid,
            'num': strip_tags(num.group(1)) if num else '',
            'topic': strip_tags(topic.group(1)) if topic else '',
            'correct_label': strip_tags(aval.group(1)) if aval else '',
            'images': img_files,
            'teoria': strip_tags(teoria.group(1)) if teoria else '',
            'steps': strip_tags(steps.group(1)) if steps else '',
            'think': strip_tags(think.group(1)) if think else '',
            'answer_panel': strip_tags(panel.group(1)) if panel else '',
        })
    with open(DUMP, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
    print(f'extraidas {sum(len(q["images"]) for q in out)} imagenes en {ASSETS}')
    print(f'volcado {len(out)} preguntas en {DUMP}')


if __name__ == '__main__':
    main()
