import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { quizSeedDir } from '@lib/quiz/paths'
import { questionsSchema, type Question, type SubjectWithCount } from '@lib/quiz/types'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizSession } from '@components/quiz/QuizSession'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Estadística · FB6 — Servidores A y B' }

function loadFb6Questions(): Question[] {
  const file = path.join(quizSeedDir(), 'estadistica-fb6.json')
  const raw = JSON.parse(readFileSync(file, 'utf8'))
  return questionsSchema.parse(raw)
}

export default async function EstadisticaFb6Page() {
  await ensureQuizSeeded()
  const parent = getSubject('estadistica')
  if (!parent) throw new Error('Subject "estadistica" was not seeded correctly')
  const questions = loadFb6Questions()
  const subject: SubjectWithCount = {
    ...parent,
    id: 'estadistica-fb6',
    name: 'FB6 — Servidores A y B',
    description: 'Ejercicio guiado paso a paso (6 preguntas).',
    questionCount: questions.length,
    cuatrimestres: [2]
  }
  return (
    <QuizPageShell>
      <QuizHeader
        title={`${parent.icon} ${subject.name}`}
        subtitle="Contraste de diferencias de medias — resuelto en 6 pasos."
        accent={parent.color}
        back={{ href: '/quiz/estadistica', label: 'Estadística' }}
      />
      <QuizSession subject={subject} questions={questions} sessionKey="estadistica-fb6" preserveOrder />
    </QuizPageShell>
  )
}
