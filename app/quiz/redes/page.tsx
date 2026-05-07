import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { getRedesModeSummary } from '@lib/quiz/redes'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { RedesModeHub } from '@components/quiz/redes/RedesModeHub'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Redes · Tests',
  description: 'Redes con modos de cuestionarios, autoevaluación y conceptos importantes.'
}

export default async function RedesHubPage() {
  await ensureQuizSeeded()
  const subject = getSubject('redes')
  if (!subject) throw new Error('Subject "redes" was not seeded correctly')
  const summary = getRedesModeSummary()

  return (
    <QuizPageShell>
      <QuizHeader
        title={`${subject.icon} ${subject.name}`}
        subtitle="Elige cómo quieres estudiar: cuestionarios de temario, autoevaluación o repaso guiado por conceptos."
        back={{ href: '/quiz', label: 'Asignaturas' }}
        accent={subject.color}
      />
      <RedesModeHub subject={subject} summary={summary} />
    </QuizPageShell>
  )
}
