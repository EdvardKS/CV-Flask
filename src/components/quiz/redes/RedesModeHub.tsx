import Link from 'next/link'
import type { SubjectModeSummary, SubjectWithCount } from '@lib/quiz/types'

type Props = {
  subject: SubjectWithCount
  summary: SubjectModeSummary
}

function cardClasses(disabled = false) {
  return [
    'group rounded-3xl border p-5 shadow-sm transition',
    disabled
      ? 'cursor-not-allowed border-slate-200 bg-slate-100/80 text-slate-400'
      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
  ].join(' ')
}

export function RedesModeHub({ subject, summary }: Props) {
  const accent = subject.color

  return (
    <section className="grid gap-3">
      <Link href="/quiz/redes/temario" className={cardClasses()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Modo 1</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Cuestionarios de temario</h2>
            <p className="mt-2 text-sm text-slate-500">
              Tests organizados por tema a partir de los cuestionarios encontrados en tus carpetas de Redes.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {summary.temarioQuizCount} tests
          </span>
        </div>
        <p className="mt-4 text-sm font-medium" style={{ color: accent }}>
          {summary.temarioQuestionCount} preguntas disponibles →
        </p>
      </Link>

      <div className={cardClasses(summary.autoevaluacionCount === 0)} aria-disabled={summary.autoevaluacionCount === 0}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Modo 2</p>
            <h2 className="mt-2 text-xl font-semibold">Tests de autoevaluación</h2>
            <p className="mt-2 text-sm">
              Reservado para cuando tengamos cuestionarios de autoevaluación oficiales de la asignatura.
            </p>
          </div>
          <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-semibold ring-1 ring-slate-200">
            {summary.autoevaluacionCount} disponibles
          </span>
        </div>
        <button
          type="button"
          disabled
          className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          Empezar cuando haya contenido
        </button>
      </div>

      <Link href="/quiz/redes/conceptos" className={cardClasses()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Modo 3</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Conceptos importantes por tema</h2>
            <p className="mt-2 text-sm text-slate-500">
              Navega por las páginas clave del temario, con resaltados y explicación de por qué te conviene estudiarlas.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {summary.conceptTopicCount} temas
          </span>
        </div>
        <p className="mt-4 text-sm font-medium" style={{ color: accent }}>
          Abrir guía de estudio →
        </p>
      </Link>
    </section>
  )
}
