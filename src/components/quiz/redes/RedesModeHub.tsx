import Link from 'next/link'
import type { SubjectModeSummary, SubjectWithCount } from '@lib/quiz/types'
import { TopicMultiSelect, type TopicOption } from './TopicMultiSelect'

type Props = {
  subject: SubjectWithCount
  summary: SubjectModeSummary
  temarioTopics: TopicOption[]
  autoevalTopics: TopicOption[]
  conceptTopics: TopicOption[]
}

function cardClasses(disabled = false) {
  return [
    'group rounded-3xl border p-5 shadow-sm transition',
    disabled
      ? 'border-slate-200 bg-slate-100/80 text-slate-400'
      : 'border-slate-200 bg-white'
  ].join(' ')
}

export function RedesModeHub({ subject, summary, temarioTopics, autoevalTopics, conceptTopics }: Props) {
  const accent = subject.color

  return (
    <section className="grid gap-3">
      <div className={cardClasses()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Modo 1</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Cuestionarios de temario</h2>
            <p className="mt-2 text-sm text-slate-500">
              Mezcla todas las preguntas de los temas que selecciones, extraídas de los cuestionarios de tus carpetas de Redes.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {summary.temarioQuizCount} tests
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          O abre el listado clásico:{' '}
          <Link href="/quiz/redes/temario" className="font-semibold underline" style={{ color: accent }}>
            ver cuestionarios individuales →
          </Link>
        </p>
        <TopicMultiSelect
          topics={temarioTopics}
          accent={accent}
          storageKey="redes-temario-topics"
          destination="/quiz/redes/temario"
          ctaLabel="Empezar mezcla"
          countLabel="preguntas"
        />
      </div>

      <div className={cardClasses(summary.autoevaluacionCount === 0)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Modo 2</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Tests de autoevaluación</h2>
            <p className="mt-2 text-sm text-slate-500">
              Banco de preguntas oficiales por UD. Selecciona las UDs que quieras y mezcla todas sus preguntas con pista y explicación.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {summary.autoevaluacionCount} preguntas
          </span>
        </div>
        <TopicMultiSelect
          topics={autoevalTopics}
          accent={accent}
          storageKey="redes-autoeval-topics"
          destination="/quiz/redes/autoevaluacion"
          ctaLabel="Empezar autoevaluación"
          countLabel="preguntas"
          emptyHint="Aún no hay banco de autoevaluación cargado."
        />
      </div>

      <div className={cardClasses()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Modo 3</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Conceptos importantes por tema</h2>
            <p className="mt-2 text-sm text-slate-500">
              Páginas clave del temario con resaltados. Filtra qué temas quieres ver en el listado.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {summary.conceptTopicCount} temas
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          O abre el listado completo:{' '}
          <Link href="/quiz/redes/conceptos" className="font-semibold underline" style={{ color: accent }}>
            ver todos los temas →
          </Link>
        </p>
        <TopicMultiSelect
          topics={conceptTopics}
          accent={accent}
          storageKey="redes-conceptos-topics"
          destination="/quiz/redes/conceptos"
          ctaLabel="Ver guía filtrada"
          countLabel="páginas"
        />
      </div>
    </section>
  )
}
