import { ensureQuizSeeded } from '@lib/quiz/boot'
import { listSubjects } from '@lib/quiz/repo'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { SubjectFilters } from '@components/quiz/SubjectFilters'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tests · Edvard K.',
  description: 'Exámenes tipo test de asignaturas universitarias.'
}

export default async function QuizHomePage() {
  await ensureQuizSeeded()
  const subjects = listSubjects()
  return (
    <QuizPageShell breadcrumb={[{ label: 'Mis asignaturas' }]}>
      <QuizHeader
        title="Mis asignaturas"
        subtitle="Selecciona una asignatura para hacer el test. Tu progreso se guarda automáticamente."
      />
      <SubjectFilters subjects={subjects} />
    </QuizPageShell>
  )
}
