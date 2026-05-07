import Link from 'next/link'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { getRedesTemarioManifest } from '@lib/quiz/redes'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Redes · Cuestionarios de temario'
}

export default async function RedesTemarioPage() {
  await ensureQuizSeeded()
  const subject = getSubject('redes')
  if (!subject) throw new Error('Subject "redes" was not seeded correctly')
  const manifest = getRedesTemarioManifest()

  return (
    <QuizPageShell>
      <QuizHeader
        title="Cuestionarios de temario"
        subtitle="Tests agrupados por tema a partir del material encontrado en temp/REDES."
        back={{ href: '/quiz/redes', label: 'Volver a Redes' }}
        accent={subject.color}
      />
      <section className="grid gap-4">
        {manifest.topics.map(topic => (
          <article key={topic.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{topic.title}</h2>
                <p className="text-sm text-slate-500">
                  {topic.quizzes.length > 0
                    ? `${topic.quizzes.length} cuestionarios cargados`
                    : 'Todavía no hay cuestionarios de temario para este tema.'}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {topic.quizzes.reduce((sum, quiz) => sum + quiz.questionCount, 0)} preguntas
              </span>
            </div>
            {topic.quizzes.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {topic.quizzes.map(quiz => (
                  <Link
                    key={quiz.id}
                    href={`/quiz/redes/temario/${quiz.id}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
                        <p className="text-sm text-slate-500">{quiz.sourceFile}</p>
                      </div>
                      <span className="text-sm font-medium" style={{ color: subject.color }}>
                        {quiz.questionCount} preguntas →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </QuizPageShell>
  )
}
