import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import {
  getRedesAutoevalManifest,
  getRedesConceptManifest,
  getRedesModeSummary,
  getRedesTemarioManifest
} from '@lib/quiz/redes'
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
  const temario = getRedesTemarioManifest()
  const autoeval = getRedesAutoevalManifest()
  const concepts = getRedesConceptManifest()

  const temarioTopics = temario.topics.map(t => ({
    id: t.id,
    title: t.title,
    count: t.quizzes.reduce((sum, q) => sum + q.questionCount, 0)
  }))
  const autoevalTopics = autoeval.topics.map(t => ({ id: t.id, title: t.title, count: t.questionCount }))
  const conceptTopics = concepts.topics.map(t => ({ id: t.id, title: t.title, count: t.slides.length }))

  return (
    <QuizPageShell
      breadcrumb={[
        { label: 'Mis asignaturas', href: '/quiz' },
        { label: subject.name }
      ]}
    >
      <QuizHeader
        title={subject.name}
        icon={subject.icon}
        subtitle="Elige cómo quieres estudiar: cuestionarios de temario, autoevaluación o repaso guiado por conceptos."
        back={{ href: '/quiz', label: 'Mis asignaturas' }}
        accent={subject.color}
      />
      <RedesModeHub
        subject={subject}
        summary={summary}
        temarioTopics={temarioTopics}
        autoevalTopics={autoevalTopics}
        conceptTopics={conceptTopics}
      />
    </QuizPageShell>
  )
}
