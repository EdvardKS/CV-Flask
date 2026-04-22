'use client'

import { useEffect, useState } from 'react'
import { usePadel } from './store'
import { SetCounter } from './components/SetCounter'
import { Dashboard } from './components/Dashboard'

type View = 'chooser' | 'counter' | 'dashboard'

export function PadelApp() {
  const matches = usePadel(s => s.matches)
  const currentId = usePadel(s => s.currentId)
  const newMatch = usePadel(s => s.newMatch)
  const selectMatch = usePadel(s => s.selectMatch)
  const deleteMatch = usePadel(s => s.deleteMatch)

  const [view, setView] = useState<View>('chooser')
  const [playerName, setPlayerName] = useState('')

  const current = matches.find(m => m.id === currentId) ?? null

  useEffect(() => {
    if (view === 'chooser') return
    if (!current && matches[0]) selectMatch(matches[0].id)
  }, [view, current, matches, selectMatch])

  const enter = (target: 'counter' | 'dashboard') => {
    if (!current) {
      const name = playerName.trim() || 'Yo'
      const id = newMatch(name)
      selectMatch(id)
      setPlayerName('')
    }
    setView(target)
  }

  if (view === 'chooser') return (
    <Chooser
      matches={matches}
      playerName={playerName}
      onPlayerName={setPlayerName}
      onPick={enter}
      onSelect={(id) => selectMatch(id)}
      currentId={currentId}
      onDelete={deleteMatch}
    />
  )

  if (!current) {
    return (
      <div style={{ padding: 24 }}>
        <p>No hay partidos. Vuelve al menú para crear uno.</p>
        <button onClick={() => setView('chooser')} style={backBtn}>← Volver al menú</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', minHeight: 0 }}>
      <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <button onClick={() => setView('chooser')} style={backBtn}>← Menú</button>
        <strong style={{ marginLeft: 8 }}>
          {current.player} · {new Date(current.createdAt).toLocaleDateString()} · {current.sets.length} set(s)
        </strong>
        <span style={{ flex: 1 }} />
        <button
          onClick={() => setView(view === 'counter' ? 'dashboard' : 'counter')}
          style={{ ...tab, background: '#0a246a', color: '#fff', borderColor: '#0a246a' }}
        >
          Ir a {view === 'counter' ? '📊 Resumen' : '🎾 Recopilación'}
        </button>
      </nav>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {view === 'counter' && <SetCounter match={current} />}
        {view === 'dashboard' && <Dashboard match={current} />}
      </div>
    </div>
  )
}

function Chooser({ matches, playerName, onPlayerName, onPick, onSelect, currentId, onDelete }: {
  matches: ReturnType<typeof usePadel.getState>['matches']
  playerName: string
  onPlayerName: (v: string) => void
  onPick: (target: 'counter' | 'dashboard') => void
  onSelect: (id: string) => void
  currentId: string | null
  onDelete: (id: string) => void
}) {
  const hasMatches = matches.length > 0

  return (
    <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 22, color: '#0a246a' }}>🏆 Padel Scout</h2>
        <p style={{ margin: '4px 0 0', color: '#555', fontSize: 13 }}>
          ¿A dónde quieres ir?
        </p>
      </header>

      {!hasMatches && (
        <div style={{
          border: '1px dashed #c3bfa5',
          background: '#fdfcf4',
          padding: 12,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13
        }}>
          <span>Jugador:</span>
          <input
            value={playerName}
            onChange={e => onPlayerName(e.target.value)}
            placeholder="Tu nombre"
            style={{ flex: 1, padding: 6, border: '1px solid #888', fontSize: 13 }}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <ChoiceCard
          icon="🎾"
          title="Recopilación de puntos"
          subtitle="Registra errores y aciertos set a set."
          color="#2e7d32"
          onClick={() => onPick('counter')}
        />
        <ChoiceCard
          icon="📊"
          title="Resumen"
          subtitle="Score, nivel, top aciertos/errores y desglose por set."
          color="#1565c0"
          onClick={() => onPick('dashboard')}
          disabled={!hasMatches}
          disabledHint="Crea un partido primero (entra a Recopilación)."
        />
      </div>

      {hasMatches && (
        <section>
          <strong style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
            Partidos guardados
          </strong>
          <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {matches.map(m => (
              <li key={m.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  onClick={() => onSelect(m.id)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: 8,
                    background: currentId === m.id ? '#0a246a' : '#fff',
                    color: currentId === m.id ? '#fff' : '#000',
                    border: '1px solid #888',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  <strong>{m.player}</strong> · {new Date(m.createdAt).toLocaleDateString()} · {m.sets.length} set(s)
                </button>
                <button
                  onClick={() => { if (confirm(`¿Eliminar partido de ${m.player}?`)) onDelete(m.id) }}
                  title="Eliminar"
                  style={{ padding: '4px 8px', border: '1px solid #888', background: '#ece9d8', cursor: 'pointer', fontSize: 12 }}
                >✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ChoiceCard({ icon, title, subtitle, color, onClick, disabled, disabledHint }: {
  icon: string
  title: string
  subtitle: string
  color: string
  onClick: () => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      style={{
        textAlign: 'left',
        padding: 16,
        border: `2px solid ${disabled ? '#bbb' : color}`,
        background: disabled ? '#f4f4f4' : '#fff',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: 'inherit',
        opacity: disabled ? 0.55 : 1,
        transition: 'transform 0.1s, box-shadow 0.15s'
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 14px ${color}33` } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 30 }} aria-hidden>{icon}</span>
        <strong style={{ fontSize: 15, color: disabled ? '#666' : color }}>{title}</strong>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: '#444' }}>{subtitle}</p>
      {!disabled && (
        <span style={{ marginTop: 'auto', fontSize: 11, color, fontWeight: 'bold' }}>Entrar ▶</span>
      )}
      {disabled && disabledHint && (
        <span style={{ marginTop: 'auto', fontSize: 11, color: '#888' }}>{disabledHint}</span>
      )}
    </button>
  )
}

const backBtn: React.CSSProperties = {
  padding: '4px 10px', background: '#ece9d8', border: '1px solid #888', cursor: 'pointer', fontSize: 12, borderRadius: 3
}
const tab: React.CSSProperties = {
  padding: '6px 12px', border: '1px solid #888', cursor: 'pointer', fontSize: 12, borderRadius: 3
}
