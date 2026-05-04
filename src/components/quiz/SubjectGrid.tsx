import { SubjectCard } from './SubjectCard'
import type { SubjectWithCount } from '@lib/quiz/types'

export function SubjectGrid({ subjects }: { subjects: SubjectWithCount[] }) {
  if (subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
        <p className="mb-2 text-base font-semibold text-slate-200">No hay asignaturas todavía</p>
        <p>
          Añade un fichero <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">{'{id}.json'}</code>{' '}
          en <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">public/data/quiz/</code> y
          regístralo en <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">_subjects.json</code>.
        </p>
      </div>
    )
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {subjects.map(s => (
        <li key={s.id}>
          <SubjectCard subject={s} />
        </li>
      ))}
    </ul>
  )
}
