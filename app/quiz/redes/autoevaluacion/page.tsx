import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { getRedesAutoevalManifest, getRedesAutoevalQuestions } from '@lib/quiz/redes'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizSession } from '@components/quiz/QuizSession'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Redes · Autoevaluación'
}

function parseTemas(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  const value = Array.isArray(raw) ? raw.join(',') : raw
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export default async function RedesAutoevaluacionPage({
  searchParams
}: {
  searchParams: Promise<{ temas?: string | string[] }>
}) {
  await ensureQuizSeeded()
  const subject = getSubject('redes')
  if (!subject) notFound()

  const { temas } = await searchParams
  const selected = parseTemas(temas)
  const manifest = getRedesAutoevalManifest()
  const validIds = new Set(manifest.topics.map(t => t.id))
  const filtered = selected.filter(id => validIds.has(id))

  if (filtered.length === 0) {
    return (
      <QuizPageShell>
        <QuizHeader
          title="Autoevaluación"
          subtitle="Selecciona temas en la pantalla anterior."
          back={{ href: '/quiz/redes', label: 'Volver a Redes' }}
          accent={subject.color}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No has seleccionado ningún tema.{' '}
          <Link href="/quiz/redes" className="font-semibold underline" style={{ color: subject.color }}>
            Volver y elegir temas.
          </Link>
        </div>
      </QuizPageShell>
    )
  }

  const questions = getRedesAutoevalQuestions(filtered)
  const selectedTitles = manifest.topics
    .filter(t => filtered.includes(t.id))
    .map(t => t.title)
    .join(' · ')
  const sessionKey = `redes-autoeval:${filtered.slice().sort().join('+')}`

  return (
    <QuizPageShell>
      <QuizHeader
        title="Autoevaluación"
        subtitle={`${questions.length} preguntas · ${selectedTitles}`}
        back={{ href: '/quiz/redes', label: 'Volver a Redes' }}
        accent={subject.color}
      />
      <QuizSession subject={subject} questions={questions} sessionKey={sessionKey} />
    </QuizPageShell>
  )
}
