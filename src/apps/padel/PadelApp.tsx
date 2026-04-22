'use client'

import { useState } from 'react'

export function PadelApp() {
  const [jugador, setJugador] = useState('')
  const name = jugador.trim()
  const canEnter = name.length >= 2

  const go = (target: 'errores' | 'resumen') => {
    if (!canEnter) return
    const url = `/padel-legacy/${target}.html?jugador=${encodeURIComponent(name)}`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620, margin: '0 auto', padding: '8px 4px' }}>
      <header style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 22, color: '#0a246a' }}>🏆 Padel Scout</h2>
        <p style={{ margin: '4px 0 0', color: '#555', fontSize: 13 }}>
          Escribe tu nombre de jugador y elige a dónde quieres ir.
        </p>
      </header>

      <label style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        background: '#fdfcf4',
        border: '1px solid #c3bfa5',
        borderRadius: 6,
        padding: 12
      }}>
        <span style={{ fontSize: 12, fontWeight: 'bold' }}>Nombre del jugador</span>
        <input
          autoFocus
          value={jugador}
          onChange={e => setJugador(e.target.value)}
          placeholder="Ej. Edvard"
          onKeyDown={e => { if (e.key === 'Enter' && canEnter) go('errores') }}
          style={{
            padding: 8,
            border: '1px solid #888',
            fontSize: 14,
            fontFamily: 'inherit'
          }}
        />
        <span style={{ fontSize: 11, color: canEnter ? '#2e7d32' : '#888' }}>
          {canEnter ? `✔ ${name}` : 'Mínimo 2 caracteres para habilitar los botones.'}
        </span>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <ChoiceCard
          icon="🎾"
          title="Recopilación de puntos"
          subtitle="Registra errores y aciertos set a set. CSV por jugador."
          color="#2e7d32"
          disabled={!canEnter}
          onClick={() => go('errores')}
        />
        <ChoiceCard
          icon="📊"
          title="Resumen"
          subtitle="Score, KPIs, perfil, métricas avanzadas del jugador."
          color="#1565c0"
          disabled={!canEnter}
          onClick={() => go('resumen')}
        />
      </div>

      <p style={{ fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' }}>
        Abre en una pestaña nueva el panel legacy conectado a la API original de scouting.
      </p>
    </div>
  )
}

function ChoiceCard({ icon, title, subtitle, color, onClick, disabled }: {
  icon: string
  title: string
  subtitle: string
  color: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
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
        <span style={{ marginTop: 'auto', fontSize: 11, color, fontWeight: 'bold' }}>Abrir ▶</span>
      )}
    </button>
  )
}
