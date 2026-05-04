'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { useQuizSession } from './hooks/useQuizSession'
import { isCorrect, primaryCorrect } from './schema'
import type { QuizSubject } from './subjects'

export function QuizRunner({ subject, onBack }: { subject: QuizSubject; onBack: () => void }) {
  const { session, loading, error, start, answer, goto, finish, reset } = useQuizSession(subject)
  const [limit, setLimit] = useState<number | undefined>(undefined)

  if (loading) return <p>Cargando preguntas…</p>
  if (error) return <p style={{ color: '#c00' }}>Error: {error}</p>

  if (!session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
        <button onClick={onBack} style={backBtn}>← Cambiar asignatura</button>
        <h2 style={{ margin: 0, color: subject.color }}>{subject.icon} {subject.name}</h2>
        <p style={{ margin: 0 }}>{subject.description}</p>
        <label style={{ fontSize: 13 }}>
          Nº de preguntas:{' '}
          <select value={limit ?? ''} onChange={e => setLimit(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 4 }}>
            <option value="">Todas</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <button
          onClick={() => start({ shuffle: true, limit })}
          style={{
            padding: '10px 20px',
            background: subject.color,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >Empezar test ▶</button>
      </div>
    )
  }

  if (session.finishedAt) {
    return <Results subject={subject} session={session} onRetry={() => reset()} onBack={onBack} />
  }

  const q = session.questions[session.currentIndex]
  const chosen = session.answers[session.currentIndex]
  const progress = `${session.currentIndex + 1} / ${session.questions.length}`
  const answered = Object.keys(session.answers).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={backBtn}>←</button>
        <strong style={{ color: subject.color }}>{subject.icon} {subject.name}</strong>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#555' }}>{progress} · Respondidas: {answered}</span>
      </div>
      <div style={{ height: 6, background: '#ddd', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${((session.currentIndex + 1) / session.questions.length) * 100}%`, height: '100%', background: subject.color }} />
      </div>

      <div style={{ border: '1px solid #ccc', padding: 14, background: '#fdfcf4', borderRadius: 4 }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: 14 }}>{q.q}</p>
        {q.code && (
          <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 10, borderRadius: 4, fontSize: 12, overflowX: 'auto' }}>
            {q.code}
          </pre>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {q.options.map((opt, i) => (
            <li key={i}>
              <button
                onClick={() => answer(i)}
                className={clsx('quiz-opt')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 10,
                  border: chosen === i ? `2px solid ${subject.color}` : '1px solid #bbb',
                  background: chosen === i ? `${subject.color}22` : '#fff',
                  cursor: 'pointer',
                  borderRadius: 4,
                  fontFamily: 'inherit',
                  fontSize: 13
                }}
              >
                <strong style={{ marginRight: 6 }}>{String.fromCharCode(65 + i)}.</strong>{opt}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 'auto', flexWrap: 'wrap' }}>
        <button onClick={() => goto(session.currentIndex - 1)} disabled={session.currentIndex === 0} style={navBtn}>← Anterior</button>
        <button onClick={() => goto(session.currentIndex + 1)} disabled={session.currentIndex >= session.questions.length - 1} style={navBtn}>Siguiente →</button>
        <span style={{ flex: 1 }} />
        <button onClick={finish} style={{ ...navBtn, background: subject.color, color: '#fff', borderColor: subject.color }}>Terminar</button>
      </div>
    </div>
  )
}

function Results({ subject, session, onRetry, onBack }: {
  subject: QuizSubject
  session: import('./hooks/useQuizSession').SessionState
  onRetry: () => void
  onBack: () => void
}) {
  const total = session.questions.length
  const summary = useMemo(() => {
    let correct = 0, incorrect = 0, unanswered = 0
    session.questions.forEach((q, i) => {
      const a = session.answers[i]
      if (a === undefined) unanswered++
      else if (isCorrect(q, a)) correct++
      else incorrect++
    })
    return { correct, incorrect, unanswered }
  }, [session])

  const pct = Math.round((summary.correct / total) * 100)
  const duration = Math.round((session.finishedAt! - session.startedAt) / 1000)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={onBack} style={backBtn}>← Cambiar asignatura</button>
      <h2 style={{ margin: 0, color: subject.color }}>Resultados — {subject.name}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        <Stat label="Puntuación" value={`${pct}%`} color={subject.color} />
        <Stat label="Aciertos" value={`${summary.correct}`} color="#2e7d32" />
        <Stat label="Fallos" value={`${summary.incorrect}`} color="#c62828" />
        <Stat label="Sin responder" value={`${summary.unanswered}`} color="#777" />
        <Stat label="Tiempo" value={`${Math.floor(duration/60)}:${String(duration%60).padStart(2,'0')}`} color="#555" />
      </div>
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginTop: 8 }}>Ver revisión detallada</summary>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {session.questions.map((q, i) => {
            const chosen = session.answers[i]
            const ok = chosen !== undefined && isCorrect(q, chosen)
            const wrong = chosen !== undefined && !ok
            return (
              <li key={i} style={{
                borderLeft: `4px solid ${ok ? '#2e7d32' : chosen === undefined ? '#777' : '#c62828'}`,
                padding: '6px 10px',
                background: '#fdfcf4'
              }}>
                <div style={{ fontSize: 12, color: '#555' }}>
                  {i + 1}. {ok ? '✅' : chosen === undefined ? '⏭️' : '❌'}
                </div>
                <div style={{ fontWeight: 'bold' }}>{q.q}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <strong>Correcta:</strong> {q.options[primaryCorrect(q)]}
                  {wrong && (
                    <><br /><strong>Tu respuesta:</strong> {q.options[chosen!]}</>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </details>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <button onClick={onRetry} style={{ ...navBtn, background: subject.color, color: '#fff', borderColor: subject.color }}>Reintentar</button>
        <button onClick={onBack} style={navBtn}>Otra asignatura</button>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: `1px solid ${color}`, padding: 10, borderRadius: 4, background: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#777' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold', color }}>{value}</div>
    </div>
  )
}

const backBtn: React.CSSProperties = {
  padding: '4px 8px', background: '#ece9d8', border: '1px solid #888', cursor: 'pointer', fontSize: 12, borderRadius: 3
}
const navBtn: React.CSSProperties = {
  padding: '8px 14px', background: '#ece9d8', border: '1px solid #888', cursor: 'pointer', borderRadius: 3
}
