import { ensureQuizSeeded } from '@lib/quiz/boot'
import { listSubjects } from '@lib/quiz/repo'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { SubjectGrid } from '@components/quiz/SubjectGrid'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tests · Edvard K.',
  description: 'Exámenes tipo test de asignaturas universitarias.'
}

export default async function QuizHomePage() {
  await ensureQuizSeeded()
  const subjects = listSubjects()
  return (
    <QuizPageShell>
      <QuizHeader
        title="Tests"
        subtitle="Selecciona una asignatura. Tu progreso se guarda automáticamente."
      />
      <SubjectGrid subjects={subjects} />
    </QuizPageShell>
  )
}
