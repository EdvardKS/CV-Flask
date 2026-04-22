'use client'

export function PadelApp() {
  const go = (target: 'errores' | 'resumen') => {
    window.open(`/padel-legacy/${target}.html`, '_blank', 'noopener')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620, margin: '0 auto', padding: '8px 4px' }}>
      <header style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 22, color: '#0a246a' }}>🏆 Padel Scout</h2>
        <p style={{ margin: '4px 0 0', color: '#555', fontSize: 13 }}>
          ¿A dónde quieres ir?
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <ChoiceCard
          icon="🎾"
          title="Recopilación de puntos"
          subtitle="Registra errores y aciertos set a set. CSV por jugador."
          color="#2e7d32"
          onClick={() => go('errores')}
        />
        <ChoiceCard
          icon="📊"
          title="Resumen"
          subtitle="Score, KPIs, perfil, métricas avanzadas del jugador."
          color="#1565c0"
          onClick={() => go('resumen')}
        />
      </div>

      <p style={{ fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' }}>
        Abre en una pestaña nueva el panel legacy conectado a la API original de scouting.
      </p>
    </div>
  )
}

function ChoiceCard({ icon, title, subtitle, color, onClick }: {
  icon: string
  title: string
  subtitle: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 16,
        border: `2px solid ${color}`,
        background: '#fff',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: 'inherit',
        transition: 'transform 0.1s, box-shadow 0.15s'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 14px ${color}33` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 30 }} aria-hidden>{icon}</span>
        <strong style={{ fontSize: 15, color }}>{title}</strong>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: '#444' }}>{subtitle}</p>
      <span style={{ marginTop: 'auto', fontSize: 11, color, fontWeight: 'bold' }}>Abrir ▶</span>
    </button>
  )
}
