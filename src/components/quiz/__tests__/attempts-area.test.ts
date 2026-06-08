// @vitest-environment jsdom
//
// TDD — agregación y paginación de intentos (specs/quiz-area-and-motion/tdd.md, ciclo 2).
// jsdom aporta un localStorage real con key()/length, necesario para loadAllAttempts.
import { afterEach, describe, expect, it } from 'vitest'
import { loadAllAttempts, paginate, type AttemptRecord } from '../attempts'

function rec(subjectId: string, finishedAt: number): AttemptRecord {
  return {
    id: `${subjectId}-${finishedAt}`, subjectId, finishedAt, durationSeconds: 60,
    correct: 5, incorrect: 1, unanswered: 0, total: 6, pct: 83,
    config: {}, questions: [], answers: {}
  }
}

afterEach(() => localStorage.clear())

describe('loadAllAttempts', () => {
  it('agrega intentos de varias asignaturas y ordena por fecha desc', () => {
    localStorage.setItem('quiz:attempts:v1:redes', JSON.stringify([rec('redes', 300), rec('redes', 100)]))
    localStorage.setItem('quiz:attempts:v1:sistemas-digitales', JSON.stringify([rec('sistemas-digitales', 200)]))
    localStorage.setItem('clave-ajena', JSON.stringify([{ pollo: true }]))

    const all = loadAllAttempts()
    expect(all.map(a => a.finishedAt)).toEqual([300, 200, 100])
    expect(all.map(a => a.subjectId)).toEqual(['redes', 'sistemas-digitales', 'redes'])
  })

  it('devuelve vacío sin intentos', () => {
    expect(loadAllAttempts()).toEqual([])
  })

  it('ignora claves corruptas sin romper', () => {
    localStorage.setItem('quiz:attempts:v1:x', '{no json')
    localStorage.setItem('quiz:attempts:v1:y', JSON.stringify([rec('y', 1)]))
    expect(loadAllAttempts().map(a => a.subjectId)).toEqual(['y'])
  })
})

describe('paginate', () => {
  const list = Array.from({ length: 20 }, (_, i) => i)

  it('corta la primera página de 15', () => {
    expect(paginate(list, 0, 15)).toEqual(list.slice(0, 15))
  })
  it('corta la segunda página con el resto', () => {
    expect(paginate(list, 1, 15)).toEqual(list.slice(15, 20))
  })
  it('clampa páginas fuera de rango', () => {
    expect(paginate(list, 99, 15)).toEqual(list.slice(15, 20))
    expect(paginate(list, -5, 15)).toEqual(list.slice(0, 15))
  })
  it('size<=0 devuelve vacío', () => {
    expect(paginate(list, 0, 0)).toEqual([])
  })
})
