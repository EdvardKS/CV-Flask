import { notFound } from 'next/navigation'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { getRedesQuizById } from '@lib/quiz/redes'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizSession } from '@components/quiz/QuizSession'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params
  const quiz = getRedesQuizById(quizId)
  return { title: quiz ? `${quiz.title} · Redes` : 'Cuestionario no encontrado' }
}

export default async function RedesTemarioQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  await ensureQuizSeeded()
  const { quizId } = await params
  const subject = getSubject('redes')
  const quiz = getRedesQuizById(quizId)
  if (!subject || !quiz) notFound()

  return (
    <QuizPageShell
      wide
      breadcrumb={[
        { label: 'Mis asignaturas', href: '/quiz' },
        { label: 'Redes', href: '/quiz/redes' },
        { label: 'Temario', href: '/quiz/redes/temario' },
        { label: quiz.title }
      ]}
    >
      <QuizHeader
        title={quiz.title}
        subtitle={`Tema ${quiz.topic} · ${quiz.questionCount} preguntas`}
        back={{ href: '/quiz/redes/temario', label: 'Cuestionarios de temario' }}
        accent={subject.color}
      />
      <QuizSession subject={subject} questions={quiz.questions} sessionKey={`redes-temario:${quiz.id}`} />
    </QuizPageShell>
  )
}
