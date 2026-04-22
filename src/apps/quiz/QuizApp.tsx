'use client'

import { useState } from 'react'
import { SUBJECTS, type QuizSubject } from './subjects'
import { QuizRunner } from './QuizRunner'

export function QuizApp({ params }: { params?: Record<string, string | number | boolean> }) {
  const initial = typeof params?.subject === 'string'
    ? SUBJECTS.find(s => s.id === params.subject) ?? null
    : null
  const [subject, setSubject] = useState<QuizSubject | null>(initial)

  if (subject) {
    return <QuizRunner subject={subject} onBack={() => setSubject(null)} />
  }

  return (
    <div>
      <header style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Selecciona una asignatura</h2>
        <p style={{ margin: '4px 0 0', color: '#555', fontSize: 12 }}>
          Elige una asignatura para empezar el test. Tu progreso se guarda automáticamente.
        </p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {SUBJECTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSubject(s)}
            style={{
              textAlign: 'left',
              border: `2px solid ${s.color}`,
              background: '#fff',
              padding: 14,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontFamily: 'inherit',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }} aria-hidden>{s.icon}</span>
              <strong style={{ fontSize: 14, color: s.color }}>{s.name}</strong>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#444' }}>{s.description}</p>
            <span style={{ marginTop: 'auto', fontSize: 11, color: s.color, fontWeight: 'bold' }}>Entrar ▶</span>
          </button>
        ))}
      </div>
    </div>
  )
}
