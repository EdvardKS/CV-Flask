import { ensureQuizSeeded } from '@lib/quiz/boot'
import { listSubjects } from '@lib/quiz/repo'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { PersonalArea, type AreaSubject } from '@components/quiz/PersonalArea'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Área personal · Tests',
  description: 'Tus tests realizados y su revisión.'
}

export default async function PersonalAreaPage() {
  await ensureQuizSeeded()
  const subjects: AreaSubject[] = listSubjects().map(s => ({ id: s.id, name: s.name, icon: s.icon, color: s.color }))
  return (
    <QuizPageShell breadcrumb={[{ label: 'Área personal' }]}>
      <QuizHeader
        title="Área personal"
        subtitle="Tus tests realizados en este navegador. Pulsa «Revisar» para verlos pregunta a pregunta."
      />
      <PersonalArea subjects={subjects} />
    </QuizPageShell>
  )
}
