'use client'

import { useEffect, useState } from 'react'
import { clearAttempts, loadAttempts, type AttemptRecord } from './attempts'

type Props = {
  subjectId: string
  accent: string
  onReview: (attempt: AttemptRecord) => void
}

function fmtShort(ms: number): string {
  try {
    return new Date(ms).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

/** Lista de intentos finalizados (localStorage). Permite abrir cada uno en revisión. */
export function AttemptsPanel({ subjectId, accent, onReview }: Props) {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAttempts(loadAttempts(subjectId))
    setReady(true)
  }, [subjectId])

  if (!ready || attempts.length === 0) return null

  return (
    <div className="rounded-lg border border-[var(--mq-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold text-[var(--mq-navy)]">Intentos anteriores</h3>
        <button
          type="button"
          onClick={() => { clearAttempts(subjectId); setAttempts([]) }}
          className="text-[12px] font-semibold text-[var(--mq-link)] hover:underline"
        >Borrar historial</button>
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-[var(--mq-border)]">
        {attempts.map((a, i) => (
          <li key={a.id} className="flex items-center gap-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[12px] font-bold text-[var(--mq-muted)]">
              {attempts.length - i}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[var(--mq-ink)]">
                {a.correct}/{a.total} aciertos · <span style={{ color: accent }}>{a.pct}%</span>
              </p>
              <p className="text-[12px] text-[var(--mq-muted)]">{fmtShort(a.finishedAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => onReview(a)}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--mq-ink)] transition hover:bg-slate-50"
            >Revisar →</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
