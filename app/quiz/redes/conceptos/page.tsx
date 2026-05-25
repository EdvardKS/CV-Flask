import Link from 'next/link'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject } from '@lib/quiz/repo'
import { getRedesConceptManifest } from '@lib/quiz/redes'
import { QuizHeader } from '@components/quiz/QuizHeader'
import { QuizPageShell } from '@components/quiz/QuizPageShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Redes · Conceptos importantes'
}

function parseTemas(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  const value = Array.isArray(raw) ? raw.join(',') : raw
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export default async function RedesConceptosPage({
  searchParams
}: {
  searchParams: Promise<{ temas?: string | string[] }>
}) {
  await ensureQuizSeeded()
  const subject = getSubject('redes')
  if (!subject) throw new Error('Subject "redes" was not seeded correctly')
  const manifest = getRedesConceptManifest()
  const { temas } = await searchParams
  const selected = parseTemas(temas)
  const filterSet = new Set(selected)
  const visible = filterSet.size > 0
    ? manifest.topics.filter(t => filterSet.has(t.id))
    : manifest.topics

  return (
    <QuizPageShell>
      <QuizHeader
        title="Conceptos importantes por tema"
        subtitle={
          filterSet.size > 0
            ? `Mostrando ${visible.length} de ${manifest.topics.length} temas seleccionados.`
            : 'Abre un tema para estudiar las páginas clave con resaltados y criterio de examen.'
        }
        back={{ href: '/quiz/redes', label: 'Volver a Redes' }}
        accent={subject.color}
      />
      {filterSet.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          <span>Filtro activo por temas.</span>
          <Link href="/quiz/redes/conceptos" className="font-semibold underline" style={{ color: subject.color }}>
            Quitar filtro
          </Link>
        </div>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2">
        {visible.map(topic => (
          <Link
            key={topic.id}
            href={`/quiz/redes/conceptos/${topic.id}`}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tema {topic.topic}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{topic.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{topic.slides.length} páginas seleccionadas para estudiar.</p>
          </Link>
        ))}
      </section>
    </QuizPageShell>
  )
}
