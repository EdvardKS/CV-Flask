import Link from 'next/link'
import type { SubjectWithCount } from '@lib/quiz/types'

export function SubjectCard({ subject }: { subject: SubjectWithCount }) {
  const accent = subject.color || '#3a6ea5'
  return (
    <Link
      href={`/quiz/${subject.id}`}
      prefetch
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform duration-150 will-change-transform hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
      aria-label={`Empezar test de ${subject.name}`}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accent }}
        aria-hidden
      />
      <span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl"
        style={{ background: `${accent}1A`, color: accent }}
        aria-hidden
      >
        {subject.icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-semibold text-slate-900">{subject.name}</span>
        <span className="line-clamp-2 text-sm leading-snug text-slate-500">{subject.description}</span>
        <span className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
            {subject.questionCount} preguntas
          </span>
          <span className="font-medium opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" style={{ color: accent }} aria-hidden>
            Empezar →
          </span>
        </span>
      </span>
    </Link>
  )
}
