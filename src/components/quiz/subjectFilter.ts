import type { SubjectWithCount } from '@lib/quiz/types'

/** Quita diacríticos y pasa a minúsculas para búsquedas tolerantes. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/** Cursos distintos presentes en las asignaturas, ordenados ascendentemente. */
export function availableCursos(subjects: SubjectWithCount[]): number[] {
  const set = new Set<number>()
  for (const s of subjects) if (typeof s.curso === 'number') set.add(s.curso)
  return Array.from(set).sort((a, b) => a - b)
}

const CURSO_NAMES: Record<number, string> = { 1: 'Primero', 2: 'Segundo', 3: 'Tercero', 4: 'Cuarto' }

/** Etiqueta ordinal de un curso (1→Primero…). Fallback a «Nº curso». */
export function cursoLabel(n: number): string {
  return CURSO_NAMES[n] ?? `${n}º curso`
}

/**
 * Filtra por texto (nombre+descripción, sin acentos) y por curso. Ambos
 * criterios se combinan en AND. `query` vacío o `curso` null = sin ese filtro.
 */
export function filterSubjects(
  subjects: SubjectWithCount[],
  query: string,
  curso: number | null
): SubjectWithCount[] {
  const q = normalize(query.trim())
  return subjects.filter(s => {
    if (curso !== null && s.curso !== curso) return false
    if (q && !normalize(`${s.name} ${s.description}`).includes(q)) return false
    return true
  })
}
