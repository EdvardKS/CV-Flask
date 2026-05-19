import Link from 'next/link'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Estadística · Tests',
  description: 'Elige modo: test general o ejercicios guiados (FB6).'
}

export default async function EstadisticaHubPage() {
  await ensureQuizSeeded()
  const subject = getSubject('estadistica')
  if (!subject) throw new Error('Subject "estadistica" was not seeded correctly')
  const accent = subject.color

  return (
    <QuizPageShell>
      <QuizHeader
        title={`${subject.icon} ${subject.name}`}
        subtitle="Elige cómo estudiar: test general de teoría o ejercicio guiado paso a paso."
        back={{ href: '/quiz', label: 'Asignaturas' }}
        accent={accent}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/quiz/estadistica/test"
          prefetch
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>Modo</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Test general</h3>
          <p className="mt-1 text-sm text-slate-600">
            Cuestionario tipo test de teoría: {subject.questionCount} preguntas sobre contrastes, errores, potencia y nivel de significación.
          </p>
          <span className="mt-3 inline-flex text-sm font-medium" style={{ color: accent }}>
            Empezar →
          </span>
        </Link>

        <Link
          href="/quiz/estadistica/fb6"
          prefetch
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>Ejercicio guiado</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">FB6 — Servidores A y B</h3>
          <p className="mt-1 text-sm text-slate-600">
            Planteamiento práctico resuelto en 6 pasos: tipo de contraste, distribución del estadístico, cálculo, regiones críticas y decisión final.
          </p>
          <span className="mt-3 inline-flex text-sm font-medium" style={{ color: accent }}>
            Resolver paso a paso →
          </span>
        </Link>
      </div>
    </QuizPageShell>
  )
}
