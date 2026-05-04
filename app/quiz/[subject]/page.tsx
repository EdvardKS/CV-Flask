import { notFound } from 'next/navigation'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject, listQuestions } from '@lib/quiz/repo'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizSession } from '@components/quiz/QuizSession'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  await ensureQuizSeeded()
  const meta = getSubject(subject)
  return { title: meta ? `${meta.name} · Tests` : 'Test no encontrado' }
}

export default async function SubjectQuizPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  await ensureQuizSeeded()
  const meta = getSubject(subject)
  if (!meta) notFound()
  const questions = listQuestions(subject)
  return (
    <QuizPageShell>
      <QuizHeader
        title={`${meta.icon}  ${meta.name}`}
        subtitle={meta.description}
        accent={meta.color}
        back={{ href: '/quiz', label: 'Asignaturas' }}
      />
      <QuizSession subject={meta} questions={questions} />
    </QuizPageShell>
  )
}
