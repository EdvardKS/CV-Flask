'use client'

import { useMemo, useState } from 'react'
import type { SubjectWithCount } from '@lib/quiz/types'
import { FilterRow, type FilterValue } from './FilterRow'
import { SubjectGrid } from './SubjectGrid'

export function SubjectFilters({ subjects }: { subjects: SubjectWithCount[] }) {
  const [curso, setCurso] = useState<FilterValue>('all')
  const [cuatri, setCuatri] = useState<FilterValue>('all')

  const cursos = useMemo(
    () => Array.from(new Set(subjects.map(s => s.curso).filter((c): c is number => c !== undefined))).sort(),
    [subjects]
  )
  const cuatris = useMemo(
    () => Array.from(new Set(subjects.flatMap(s => s.cuatrimestres))).sort(),
    [subjects]
  )

  const filtered = useMemo(() => subjects.filter(s => {
    if (curso !== 'all' && s.curso !== curso) return false
    if (cuatri !== 'all' && !s.cuatrimestres.includes(cuatri)) return false
    return true
  }), [subjects, curso, cuatri])

  if (subjects.length === 0) return <SubjectGrid subjects={[]} />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur">
        <FilterRow label="Curso" current={curso} values={cursos} onChange={setCurso} format={c => `${c}º`} />
        <FilterRow label="Cuatri" current={cuatri} values={cuatris} onChange={setCuatri} format={c => `${c}º`} />
        <p className="text-[11px] text-slate-400">
          Mostrando <strong className="text-slate-700">{filtered.length}</strong> de {subjects.length} asignaturas
        </p>
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Sin asignaturas para esta combinación de filtros.
        </p>
      ) : (
        <SubjectGrid subjects={filtered} />
      )}
    </div>
  )
}
