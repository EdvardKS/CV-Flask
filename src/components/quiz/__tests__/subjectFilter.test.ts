// @vitest-environment node
//
// TDD — filtros de asignaturas (ver specs/quiz-area-and-motion/tdd.md, ciclo 1).
import { describe, expect, it } from 'vitest'
import type { SubjectWithCount } from '@lib/quiz/types'
import { availableCursos, cursoLabel, filterSubjects } from '../subjectFilter'

function subj(partial: Partial<SubjectWithCount> & { id: string }): SubjectWithCount {
  return {
    id: partial.id,
    name: partial.name ?? partial.id,
    description: partial.description ?? '',
    icon: '📘',
    color: '#000',
    curso: partial.curso,
    cuatrimestre: partial.cuatrimestre,
    entryMode: 'standard',
    questionCount: partial.questionCount ?? 0,
    cuatrimestres: partial.cuatrimestres ?? []
  } as SubjectWithCount
}

const SUBJECTS: SubjectWithCount[] = [
  subj({ id: 'sd', name: 'Sistemas Digitales', description: 'Álgebra de Boole', curso: 1 }),
  subj({ id: 'redes', name: 'Redes', description: 'LAN y VLAN', curso: 2 }),
  subj({ id: 'est', name: 'Estadística', description: 'Contrastes de hipótesis', curso: 2 }),
  subj({ id: 'ia', name: 'Inteligencia Artificial', description: 'Machine Learning', curso: 3 }),
  subj({ id: 'gtec', name: 'Gestión de la Tecnología', description: 'Innovación', curso: 4 })
]

describe('availableCursos', () => {
  it('devuelve los cursos distintos, ordenados', () => {
    expect(availableCursos(SUBJECTS)).toEqual([1, 2, 3, 4])
  })
})

describe('cursoLabel', () => {
  it('mapea 1..4 a ordinales', () => {
    expect([1, 2, 3, 4].map(cursoLabel)).toEqual(['Primero', 'Segundo', 'Tercero', 'Cuarto'])
  })
})

describe('filterSubjects', () => {
  it('sin filtros devuelve todas', () => {
    expect(filterSubjects(SUBJECTS, '', null)).toHaveLength(5)
  })

  it('filtra por texto ignorando acentos', () => {
    const r = filterSubjects(SUBJECTS, 'estadistica', null)
    expect(r.map(s => s.id)).toEqual(['est'])
  })

  it('busca también en la descripción', () => {
    expect(filterSubjects(SUBJECTS, 'vlan', null).map(s => s.id)).toEqual(['redes'])
  })

  it('filtra por curso', () => {
    expect(filterSubjects(SUBJECTS, '', 2).map(s => s.id)).toEqual(['redes', 'est'])
  })

  it('combina texto y curso en AND', () => {
    expect(filterSubjects(SUBJECTS, 'redes', 2).map(s => s.id)).toEqual(['redes'])
    expect(filterSubjects(SUBJECTS, 'redes', 3)).toHaveLength(0)
  })
})
