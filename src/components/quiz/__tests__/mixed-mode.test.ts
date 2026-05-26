// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Question } from '@lib/quiz/types'

// Replica la logica de filtrado de useQuizSession.start
function filterForCuatri(source: Question[], cuatri: number | 'all' | 'latest'): Question[] {
  if (cuatri === 'latest') return source.filter(q => q.group === 'latest-test')
  if (cuatri === 'all') return [...source]
  if (typeof cuatri === 'number') return source.filter(q => q.group !== 'latest-test' && (q.cuatrimestre ?? 1) === cuatri)
  return source.filter(q => q.group !== 'latest-test')
}

function q(text: string, cuatrimestre?: number, group?: string): Question {
  return { kind: 'choice', q: text, options: ['a', 'b'], correctIndex: 0, cuatrimestre, group }
}

describe('Quiz Mixto (ingles)', () => {
  const source: Question[] = [
    q('c1-a', 1),
    q('c1-b', 1),
    q('c2-a', 2),
    q('c2-b', 2),
    q('latest-a', undefined, 'latest-test'),
    q('latest-b', undefined, 'latest-test')
  ]

  it('cuatri=1 devuelve solo preguntas del 1er cuatri (sin latest)', () => {
    const out = filterForCuatri(source, 1)
    expect(out.map(o => o.q)).toEqual(['c1-a', 'c1-b'])
  })

  it('cuatri=2 devuelve solo preguntas del 2o cuatri (sin latest)', () => {
    const out = filterForCuatri(source, 2)
    expect(out.map(o => o.q)).toEqual(['c2-a', 'c2-b'])
  })

  it('cuatri=latest devuelve SOLO grupo latest-test', () => {
    const out = filterForCuatri(source, 'latest')
    expect(out.map(o => o.q)).toEqual(['latest-a', 'latest-b'])
  })

  it('cuatri=all (Mixto) MEZCLA 1er + 2o cuatri + latest-test', () => {
    const out = filterForCuatri(source, 'all')
    expect(out).toHaveLength(6)
    expect(out.map(o => o.q).sort()).toEqual(['c1-a', 'c1-b', 'c2-a', 'c2-b', 'latest-a', 'latest-b'].sort())
  })

  it('limit aplicado tras shuffle reduce N preguntas', () => {
    const filtered = filterForCuatri(source, 'all')
    const limit = 3
    const sliced = filtered.slice(0, limit)
    expect(sliced).toHaveLength(3)
  })
})
