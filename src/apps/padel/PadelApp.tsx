'use client'

import { useState } from 'react'
import { usePadel } from './store'
import { SetCounter } from './components/SetCounter'
import { Dashboard } from './components/Dashboard'

export function PadelApp() {
  const matches = usePadel(s => s.matches)
  const currentId = usePadel(s => s.currentId)
  const newMatch = usePadel(s => s.newMatch)
  const selectMatch = usePadel(s => s.selectMatch)
  const deleteMatch = usePadel(s => s.deleteMatch)

  const [playerName, setPlayerName] = useState('')
  const [view, setView] = useState<'counter' | 'dashboard'>('counter')

  const current = matches.find(m => m.id === currentId) ?? null

  const createMatch = () => {
    const id = newMatch(playerName || 'Yo')
    setPlayerName('')
    selectMatch(id)
  }

  return (
    <div style={{ display: 'flex', gap: 10, height: '100%', minHeight: 0 }}>
      <aside style={{
        width: 220,
        borderRight: '1px solid #c3bfa5',
        paddingRight: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflowY: 'auto'
      }}>
        <strong>Partidos</strong>
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Jugador"
            style={{ flex: 1, padding: 4, border: '1px solid #888', fontSize: 12 }}
          />
          <button onClick={createMatch} style={{ padding: '4px 8px' }}>+ Nuevo</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {matches.length === 0 && <li style={{ color: '#888', fontSize: 12 }}>Sin partidos. Crea uno nuevo.</li>}
          {matches.map(m => (
            <li key={m.id}>
              <button
                onClick={() => selectMatch(m.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 6,
                  background: currentId === m.id ? '#0a246a' : '#ece9d8',
                  color: currentId === m.id ? '#fff' : '#000',
                  border: '1px solid #888',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                <strong>{m.player}</strong>
                <br />
                <span style={{ fontSize: 10, opacity: 0.7 }}>
                  {new Date(m.createdAt).toLocaleDateString()} · {m.sets.length} set(s)
                </span>
              </button>
              {currentId === m.id && (
                <button
                  onClick={() => { if (confirm('¿Eliminar partido?')) deleteMatch(m.id) }}
                  style={{ fontSize: 10, color: '#c00', marginTop: 2, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      </aside>

      <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!current ? (
          <div style={{ padding: 24, color: '#555', textAlign: 'center' }}>
            <h3 style={{ margin: 0 }}>🏆 Padel Scout</h3>
            <p>Crea un nuevo partido en la barra lateral para empezar a contar errores y aciertos.</p>
          </div>
        ) : (
          <>
            <nav style={{ display: 'flex', gap: 2 }}>
              {(['counter', 'dashboard'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 12px',
                    background: view === v ? '#0a246a' : '#ece9d8',
                    color: view === v ? '#fff' : '#000',
                    border: '1px solid #888',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  {v === 'counter' ? '🎾 Contador' : '📊 Análisis'}
                </button>
              ))}
            </nav>
            {view === 'counter' && <SetCounter match={current} />}
            {view === 'dashboard' && <Dashboard match={current} />}
          </>
        )}
      </section>
    </div>
  )
}
