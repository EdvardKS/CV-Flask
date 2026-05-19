import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject, listQuestions } from '@lib/quiz/repo'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizSession } from '@components/quiz/QuizSession'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Estadística · Test general' }

export default async function EstadisticaTestPage() {
  await ensureQuizSeeded()
  const subject = getSubject('estadistica')
  if (!subject) throw new Error('Subject "estadistica" was not seeded correctly')
  const questions = listQuestions('estadistica')
  return (
    <QuizPageShell>
      <QuizHeader
        title={`${subject.icon} ${subject.name} · Test general`}
        subtitle="Cuestionario tipo test de teoría."
        accent={subject.color}
        back={{ href: '/quiz/estadistica', label: 'Estadística' }}
      />
      <QuizSession subject={subject} questions={questions} sessionKey="estadistica-test" />
    </QuizPageShell>
  )
}
