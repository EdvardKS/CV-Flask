#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Construye las 12 preguntas MCQ del simulacro de Sistemas Digitales y las anexa a
public/data/quiz/sistemas-digitales.json (tras las 20 preguntas previas).

- Enunciados y opciones (a-d, en el orden de la figura) estan autorizados aqui;
  la figura embebida (campo image) es la fuente visual autoritativa.
- La explicacion (evidence) y la pista (hint) provienen del volcado del HTML real
  (scripts/_sdig_extract.json), depuradas.
- P8 tiene 2 imagenes (circuito + 4 capturas): se apilan en una sola q8.jpg.

Idempotente: regenera siempre las 12 al final, conservando las 20 base.
Requiere haber corrido antes scripts/extract_sdig_simulacro.py.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, 'public', 'data', 'quiz', 'sistemas-digitales.json')
EXTRACT = os.path.join(ROOT, 'scripts', '_sdig_extract.json')
ASSETS = os.path.join(ROOT, 'public', 'data', 'quiz', 'sistemas-digitales', 'assets')
IMG_BASE = '/data/quiz/sistemas-digitales/assets'
CATEGORY = 'simulacro-examen'

# enunciado + opciones (orden a,b,c,d de la figura) + correctIndex por pregunta
AUTHORED = {
    'q1': {
        'q': 'Observa la tabla de verdad de la figura. ¿Qué función booleana S(A,B,C) la representa?',
        'options': ['S = A·B + A·C + B·C', 'S = A⊕B⊕C', 'S = Ā·B̄ + Ā·C̄ + B̄·C̄', 'S = A + B + C'],
        'correctIndex': 0,
    },
    'q2': {
        'q': 'Una función de 3 variables tiene los minterms Σm(0,1,2,5). ¿Cuál es su forma canónica de maxterms (producto de sumas)?',
        'options': ['ΠM(3, 4, 6, 7)', 'ΠM(3, 4, 9, 16)', 'ΠM(2, 9, 36, 49)', 'Σm(0, 1, 2, 5)'],
        'correctIndex': 0,
    },
    'q3': {
        'q': 'Un chip de memoria RAM tiene una capacidad de 4 KB. ¿Cuántos bits de dirección interna necesita para seleccionar una celda dentro del chip?',
        'options': ['16 bits', '8 bits', '12 bits', '2 bits'],
        'correctIndex': 2,
    },
    'q4': {
        'q': 'Calcula el resultado de la división 30₁₆ ÷ 1000₂ y exprésalo correctamente. ¿Cuál es la opción válida?',
        'options': ['1010₂', '10₁₀', '6₈', '15₁₆'],
        'correctIndex': 2,
    },
    'q5': {
        'q': 'Con el decodificador de la figura (A→S3, B→S2, C→S1, D→S0) se quiere implementar F = A·B·C·D̄ + Ā·B̄·C̄·D + Ā·B·C·D̄. ¿Qué circuito la implementa?',
        'options': ['Circuito 1', 'Circuito 3', 'Circuito 4', 'Circuito 2'],
        'correctIndex': 3,
    },
    'q6': {
        'q': 'A partir del mapa de Karnaugh de la figura, obtén la expresión mínima como Producto de Sumas (POS).',
        'options': ['(A + D)·(Ā + D̄)', '(Ā + D̄)·(A + D)', '(A + D̄)·(Ā + D)', '(A·D̄) + (Ā·D)'],
        'correctIndex': 2,
    },
    'q7': {
        'q': 'Dada la función POS (A + D̄)·(Ā + D), ¿qué circuito de la figura la implementa correctamente?',
        'options': ['Circuito 1', 'Circuito 2', 'Circuito 4', 'Circuito 3'],
        'correctIndex': 3,
    },
    'q8': {
        'q': 'El contador con flip-flops T de la figura arranca en Q3Q2Q1 = 111 y realimenta T1 = Q3. ¿Qué captura del analizador lógico corresponde a su funcionamiento?',
        'options': ['Captura 2', 'Captura 4', 'Captura 1', 'Captura 3'],
        'correctIndex': 1,
    },
    'q9': {
        'q': 'Un sistema de memoria de 16 KB se construye con chips de 4 KB. ¿Cuántos bits de selección de chip (chip select) hacen falta?',
        'options': ['1 bit', '2 bits', '4 bits', '3 bits'],
        'correctIndex': 1,
    },
    'q10': {
        'q': 'A partir del mapa de Karnaugh de la figura, obtén la expresión mínima como Suma de Productos (SOP).',
        'options': ['A·D̄ + Ā·D', 'A·B + C·D', 'Ā·D + A·D̄', 'A·D + Ā·D̄'],
        'correctIndex': 3,
    },
    'q11': {
        'q': 'En un mapa de memoria de 4 chips de 4 KB ubicados consecutivamente desde 0x0000, ¿qué rango de direcciones ocupa el chip RAM2?',
        'options': ['0x0000 – 0x0FFF', '0x1000 – 0x1FFF', '0x2000 – 0x2FFF', '0x3000 – 0x3FFF'],
        'correctIndex': 2,
    },
    'q12': {
        'q': 'Dada la función SOP A·D + Ā·D̄, ¿qué circuito de la figura la implementa correctamente?',
        'options': ['Circuito 2', 'Circuito 1', 'Circuito 3', 'Circuito 4'],
        'correctIndex': 1,
    },
}


def clean(text: str) -> str:
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def explanation(panel: str) -> str:
    # toma lo que sigue a "Por qué es la correcta"
    m = re.split(r'Por qué es la correcta', panel, maxsplit=1)
    body = m[1] if len(m) > 1 else panel
    return clean(body)


def hint_from_think(think: str) -> str:
    t = think.replace('💭', '').strip()
    t = re.sub(r'^Clave mental:\s*', '', t)
    t = re.sub(r'^(Regla universal|Atajo|Regla de oro|Truco|Método|Regla POS de memoria|Regla SOP de memoria|Relación con P3|Truco hex|Curiosidad|Cómo leer un oscilograma)\s*:?\s*', '', t)
    return clean(t)


def stack_q8():
    from PIL import Image
    a = Image.open(os.path.join(ASSETS, 'q8a.jpg')).convert('RGB')
    b = Image.open(os.path.join(ASSETS, 'q8b.jpg')).convert('RGB')
    w = max(a.width, b.width)
    gap = 12
    canvas = Image.new('RGB', (w, a.height + gap + b.height), 'white')
    canvas.paste(a, ((w - a.width) // 2, 0))
    canvas.paste(b, ((w - b.width) // 2, a.height + gap))
    canvas.save(os.path.join(ASSETS, 'q8.jpg'), quality=88)


def main():
    extract = {q['id']: q for q in json.load(open(EXTRACT, encoding='utf-8'))}
    bank = json.load(open(BANK, encoding='utf-8'))
    base = [q for q in bank if q.get('category') != CATEGORY]  # conserva las 20, descarta simulacro previo

    stack_q8()
    new = []
    for i in range(1, 13):
        qid = f'q{i}'
        a = AUTHORED[qid]
        ex = extract[qid]
        img = 'q8.jpg' if qid == 'q8' else ex['images'][0]
        new.append({
            'kind': 'choice',
            'cuatrimestre': 2,
            'category': CATEGORY,
            'q': a['q'],
            'options': a['options'],
            'correctIndex': a['correctIndex'],
            'image': f'{IMG_BASE}/{img}',
            'hint': hint_from_think(ex['think']),
            'evidence': explanation(ex['answer_panel']),
        })

    out = base + new
    with open(BANK, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
    print(f'banco: {len(base)} base + {len(new)} simulacro = {len(out)} preguntas')


if __name__ == '__main__':
    main()
