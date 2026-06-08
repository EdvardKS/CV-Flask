'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AttemptResultView } from './AttemptResultView'
import { loadAllAttempts, paginate, type AttemptRecord } from './attempts'
import { useMotionPreset } from './motion/presets'

export type AreaSubject = { id: string; name: string; icon: string; color: string }

const PAGE_SIZE = 15

function fmtDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export function PersonalArea({ subjects }: { subjects: AreaSubject[] }) {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState(0)
  const [review, setReview] = useState<AttemptRecord | null>(null)
  const m = useMotionPreset()

  const byId = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects])

  useEffect(() => {
    setAttempts(loadAllAttempts())
    setReady(true)
  }, [])

  const totalPages = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageItems = paginate(attempts, safePage, PAGE_SIZE)

  if (review) {
    const subj = byId.get(review.subjectId)
    return (
      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setReview(null)}
          className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-[var(--mq-link)] hover:underline"
        >← Volver al área personal</button>
        <h2 className="text-xl font-bold text-[var(--mq-navy)]">
          Revisión · {subj?.name ?? review.subjectId}
        </h2>
        <AttemptResultView
          accent={subj?.color ?? '#3a6ea5'}
          correct={review.correct}
          incorrect={review.incorrect}
          unanswered={review.unanswered}
          total={review.total}
          pct={review.pct}
          durationSeconds={review.durationSeconds}
          startedAt={review.finishedAt - review.durationSeconds * 1000}
          finishedAt={review.finishedAt}
          questions={review.questions}
          answers={review.answers}
        />
      </section>
    )
  }

  if (!ready) {
    return <div className="rounded-lg border border-[var(--mq-border)] bg-white p-6 text-sm text-[var(--mq-muted)] shadow-sm">Cargando…</div>
  }

  if (attempts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={m.spring}
        className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center"
      >
        <p className="text-base font-semibold text-[var(--mq-ink)]">Aún no has hecho ningún test</p>
        <p className="mt-1 text-sm text-[var(--mq-muted)]">
          Cuando termines un test aparecerá aquí para que puedas revisarlo. Tu historial se guarda en este navegador.
        </p>
        <a href="/quiz" className="mt-4 inline-block rounded-md bg-[var(--mq-navy)] px-4 py-2 text-[14px] font-bold text-white shadow-sm transition hover:brightness-110">
          Ir a mis asignaturas
        </a>
      </motion.div>
    )
  }

  return (
    <motion.section initial="hidden" animate="show" variants={m.section} className="flex flex-col gap-4">
      <motion.p variants={m.item} className="text-sm text-[var(--mq-muted)]">
        {attempts.length} {attempts.length === 1 ? 'intento realizado' : 'intentos realizados'} · más reciente primero.
      </motion.p>

      <motion.ul
        key={safePage}
        variants={m.container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-2.5"
      >
        {pageItems.map(a => {
          const subj = byId.get(a.subjectId)
          const accent = subj?.color ?? '#3a6ea5'
          return (
            <motion.li
              key={a.id}
              variants={m.item}
              whileHover={m.hover}
              className="flex items-center gap-3 rounded-lg border border-[var(--mq-border)] bg-white p-3.5 shadow-sm"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-2xl ring-1"
                style={{ background: `${accent}14`, color: accent, borderColor: `${accent}33` }}
                aria-hidden
              >{subj?.icon ?? '📝'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[var(--mq-navy)]">{subj?.name ?? a.subjectId}</p>
                <p className="text-[12px] text-[var(--mq-muted)]">
                  {a.correct}/{a.total} aciertos · <span className="font-semibold" style={{ color: accent }}>{a.pct}%</span> · {fmtDate(a.finishedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReview(a)}
                className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--mq-ink)] transition hover:bg-slate-50"
              >Revisar →</button>
            </motion.li>
          )
        })}
      </motion.ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--mq-ink)] transition hover:bg-slate-50 disabled:opacity-40"
          >← Anteriores</button>
          <span className="text-[13px] font-semibold text-[var(--mq-muted)] tabular-nums">Página {safePage + 1} de {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--mq-ink)] transition hover:bg-slate-50 disabled:opacity-40"
          >Siguientes →</button>
        </div>
      )}
    </motion.section>
  )
}
