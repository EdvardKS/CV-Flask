// @vitest-environment jsdom
//
// TDD — área personal (specs/quiz-area-and-motion/tdd.md, ciclo 3).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PersonalArea, type AreaSubject } from '../PersonalArea'
import type { AttemptRecord } from '../attempts'

const SUBJECTS: AreaSubject[] = [
  { id: 'redes', name: 'Redes', icon: '🌐', color: '#0f766e' },
  { id: 'sd', name: 'Sistemas Digitales', icon: '🔢', color: '#ea580c' }
]

function rec(subjectId: string, finishedAt: number): AttemptRecord {
  return {
    id: `${subjectId}-${finishedAt}`, subjectId, finishedAt, durationSeconds: 90,
    correct: 4, incorrect: 2, unanswered: 0, total: 6, pct: 67,
    config: {}, questions: [], answers: {}
  }
}

function seed(n: number) {
  const redes = Array.from({ length: Math.ceil(n / 2) }, (_, i) => rec('redes', 1000 + i))
  const sd = Array.from({ length: Math.floor(n / 2) }, (_, i) => rec('sd', 2000 + i))
  localStorage.setItem('quiz:attempts:v1:redes', JSON.stringify(redes))
  localStorage.setItem('quiz:attempts:v1:sd', JSON.stringify(sd))
}

afterEach(() => { cleanup(); localStorage.clear() })

describe('PersonalArea', () => {
  it('muestra estado vacío sin intentos', () => {
    render(<PersonalArea subjects={SUBJECTS} />)
    expect(screen.getByText(/Aún no has hecho ningún test/i)).toBeTruthy()
  })

  it('lista 15 por página y permite paginar', () => {
    seed(16)
    render(<PersonalArea subjects={SUBJECTS} />)
    expect(screen.getAllByRole('button', { name: /revisar/i })).toHaveLength(15)
    expect(screen.getByText(/Página 1 de 2/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /siguientes/i }))
    expect(screen.getAllByRole('button', { name: /revisar/i })).toHaveLength(1)
    expect(screen.getByText(/Página 2 de 2/i)).toBeTruthy()
  })

  it('abre la revisión de un intento', () => {
    seed(2)
    render(<PersonalArea subjects={SUBJECTS} />)
    fireEvent.click(screen.getAllByRole('button', { name: /revisar/i })[0])
    expect(screen.getByText(/Volver al área personal/i)).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Revisión/i })).toBeTruthy()
  })
})
