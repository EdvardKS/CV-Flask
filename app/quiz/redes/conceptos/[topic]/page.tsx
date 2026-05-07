import { notFound } from 'next/navigation'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { getRedesConceptTopic } from '@lib/quiz/redes'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { PdfConceptViewer } from '@components/quiz/redes/PdfConceptViewer'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params
  const deck = getRedesConceptTopic(topic)
  return { title: deck ? `${deck.title} · Redes` : 'Tema no encontrado' }
}

export default async function RedesConceptTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  await ensureQuizSeeded()
  const { topic } = await params
  const subject = getSubject('redes')
  const deck = getRedesConceptTopic(topic)
  if (!subject || !deck) notFound()

  return (
    <QuizPageShell>
      <QuizHeader
        title={deck.title}
        subtitle="Páginas del temario resaltadas con criterio de estudio y foco de examen."
        back={{ href: '/quiz/redes/conceptos', label: 'Todos los temas' }}
        accent={subject.color}
      />
      <PdfConceptViewer deck={deck} accent={subject.color} />
    </QuizPageShell>
  )
}
