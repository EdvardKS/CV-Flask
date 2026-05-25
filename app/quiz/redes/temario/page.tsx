import Link from 'next/link'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { getRedesTemarioManifest, getRedesTemarioQuestionsByTopics } from '@lib/quiz/redes'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'
import { QuizSession } from '@components/quiz/QuizSession'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Redes · Cuestionarios de temario'
}

function parseTemas(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  const value = Array.isArray(raw) ? raw.join(',') : raw
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export default async function RedesTemarioPage({
  searchParams
}: {
  searchParams: Promise<{ temas?: string | string[] }>
}) {
  await ensureQuizSeeded()
  const subject = getSubject('redes')
  if (!subject) throw new Error('Subject "redes" was not seeded correctly')
  const manifest = getRedesTemarioManifest()

  const { temas } = await searchParams
  const selected = parseTemas(temas)
  const validIds = new Set(manifest.topics.map(t => t.id))
  const filtered = selected.filter(id => validIds.has(id))

  if (filtered.length > 0) {
    const questions = getRedesTemarioQuestionsByTopics(filtered)
    const selectedTitles = manifest.topics
      .filter(t => filtered.includes(t.id))
      .map(t => t.title)
      .join(' · ')
    const sessionKey = `redes-temario-mix:${filtered.slice().sort().join('+')}`
    return (
      <QuizPageShell>
        <QuizHeader
          title="Cuestionarios de temario · mezcla"
          subtitle={`${questions.length} preguntas · ${selectedTitles}`}
          back={{ href: '/quiz/redes', label: 'Volver a Redes' }}
          accent={subject.color}
        />
        <QuizSession subject={subject} questions={questions} sessionKey={sessionKey} />
      </QuizPageShell>
    )
  }

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
                {topic.supportMaterials.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Material de apoyo: {topic.supportMaterials.length} fuentes teóricas y de clase.
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {topic.quizzes.reduce((sum, quiz) => sum + quiz.questionCount, 0)} preguntas
              </span>
            </div>
            {topic.supportMaterials.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {topic.supportMaterials.map(material => (
                  <span
                    key={material.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    {material.title}
                  </span>
                ))}
              </div>
            ) : null}
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
                        <p className="text-sm text-slate-500">
                          {quiz.sourceFile}
                          {quiz.sourceType ? ` · ${quiz.sourceType}` : ''}
                        </p>
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
