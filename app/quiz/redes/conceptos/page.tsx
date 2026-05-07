import Link from 'next/link'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { getRedesConceptManifest } from '@lib/quiz/redes'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Redes · Conceptos importantes'
}

export default async function RedesConceptosPage() {
  await ensureQuizSeeded()
  const subject = getSubject('redes')
  if (!subject) throw new Error('Subject "redes" was not seeded correctly')
  const manifest = getRedesConceptManifest()

  return (
    <QuizPageShell>
      <QuizHeader
        title="Conceptos importantes por tema"
        subtitle="Abre un tema para estudiar las páginas clave con resaltados y criterio de examen."
        back={{ href: '/quiz/redes', label: 'Volver a Redes' }}
        accent={subject.color}
      />
      <section className="grid gap-3 sm:grid-cols-2">
        {manifest.topics.map(topic => (
          <Link
            key={topic.id}
            href={`/quiz/redes/conceptos/${topic.id}`}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tema {topic.topic}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{topic.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{topic.slides.length} páginas seleccionadas para estudiar.</p>
          </Link>
        ))}
      </section>
    </QuizPageShell>
  )
}
