'use client'

import { isCorrect, primaryCorrect, type Answer, type Question } from '@lib/quiz/types'

export type AttemptResultData = {
  accent: string
  correct: number
  incorrect: number
  unanswered: number
  total: number
  pct: number
  durationSeconds: number
  startedAt: number
  finishedAt: number
  questions: Question[]
  answers: Record<number, Answer>
}

function fmtDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s} segundos`
  return `${m} min ${s} s`
}

function comma2(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

/** Tabla resumen + revisión detallada con el aspecto del Moodle de UAX. */
export function AttemptResultView({
  accent, correct, incorrect, unanswered, total, pct, durationSeconds, startedAt, finishedAt, questions, answers
}: AttemptResultData) {
  const nota = total ? (correct / total) * 10 : 0

  const rows: [string, string][] = [
    ['Estado', 'Finalizado'],
    ['Comenzado', fmtDate(startedAt)],
    ['Completado', fmtDate(finishedAt)],
    ['Duración', fmtDuration(durationSeconds)],
    ['Puntos', `${comma2(correct)}/${comma2(total)}`],
    ['Calificación', `${comma2(nota)} de 10,00 (${pct}%)`]
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-[var(--mq-border)] bg-white shadow-sm">
        <table className="w-full text-[14px]">
          <tbody>
            {rows.map(([label, value], i) => (
              <tr key={label} className={i % 2 ? 'bg-slate-50/60' : ''}>
                <th scope="row" className="w-40 border-b border-[var(--mq-border)] px-4 py-2.5 text-right font-semibold text-[var(--mq-muted)]">{label}</th>
                <td className="border-b border-[var(--mq-border)] px-4 py-2.5 text-[var(--mq-ink)]">
                  {label === 'Calificación' ? <strong>{value}</strong> : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Aciertos" value={correct} color="#2f6b2f" />
        <Tile label="Fallos" value={incorrect} color="#a33a3a" />
        <Tile label="Sin responder" value={unanswered} color="#5b6b7b" />
        <Tile label="Nota" value={`${pct}%`} color={accent} />
      </div>

      <ul className="flex flex-col gap-2">
        {questions.map((q, i) => <ReviewRow key={i} q={q} chosen={answers[i]} index={i} />)}
      </ul>
    </div>
  )
}

function Tile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-[var(--mq-border)] bg-white p-3 text-center shadow-sm">
      <div className="text-[11px] uppercase tracking-wider text-[var(--mq-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color }}>{value}</div>
    </div>
  )
}

function ReviewRow({ q, chosen, index }: { q: Question; chosen?: Answer; index: number }) {
  const ok = chosen !== undefined && isCorrect(q, chosen)
  const tone = ok
    ? 'border-[#b7dfb9] bg-[#dff0d8]/50'
    : chosen === undefined
      ? 'border-[var(--mq-border)] bg-slate-50'
      : 'border-[#e4b9b9] bg-[#f2dede]/50'
  const yourAnswer = q.kind === 'fill'
    ? (chosen as string | undefined)
    : (typeof chosen === 'number' ? q.options[chosen] : undefined)
  return (
    <li className={`rounded-lg border p-3 text-[14px] ${tone}`}>
      <div className="text-[12px] text-[var(--mq-muted)]">
        {index + 1}. {ok ? '✅ Acierto' : chosen === undefined ? '⏭️ Sin responder' : '❌ Fallo'}
      </div>
      <div className="mt-1 font-semibold text-[var(--mq-ink)]">{q.q}</div>
      <div className="mt-1 text-[var(--mq-ink)]"><span className="text-[var(--mq-muted)]">Correcta:</span> {primaryCorrect(q)}</div>
      {chosen !== undefined && !ok && (
        <div className="text-[#a33a3a]"><span className="text-[var(--mq-muted)]">Tu respuesta:</span> {yourAnswer}</div>
      )}
    </li>
  )
}
