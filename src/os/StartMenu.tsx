'use client'

import { useRouter } from 'next/navigation'
import { APPS } from '@apps/_registry'
import { useWM } from './store'
import { iconGlyph } from './Window'
import type { AppCategory } from './types'

const GROUP_LABELS: Record<AppCategory, string> = {
  cv: 'Sobre mí',
  'mini-project': 'Mini-proyectos',
  tool: 'Herramientas',
  system: 'Sistema'
}

export function StartMenu({ onClose }: { onClose: () => void }) {
  const openApp = useWM(s => s.openApp)
  const router = useRouter()
  const closeAll = () => {
    const s = useWM.getState()
    s.windows.forEach(w => s.close(w.id))
  }

  const groups = (['cv', 'mini-project', 'tool', 'system'] as AppCategory[]).map(cat => ({
    cat,
    label: GROUP_LABELS[cat],
    apps: APPS.filter(a => a.category === cat)
  })).filter(g => g.apps.length > 0)

  return (
    <div className="xp-start-menu" onMouseDown={e => e.stopPropagation()}>
      <div className="xp-start-menu-header">Edvard K. — OS</div>
      <div className="xp-start-menu-items">
        {groups.map(group => (
          <div key={group.cat}>
            <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
              {group.label}
            </div>
            {group.apps.map(app => (
              <div
                key={app.id}
                className="xp-start-menu-item"
                onClick={() => {
                  if (app.externalUrl) window.open(app.externalUrl, '_blank', 'noopener,noreferrer')
                  else if (app.standaloneRoute) router.push(app.standaloneRoute)
                  else openApp(app)
                  onClose()
                }}
              >
                <span className="icon" aria-hidden>{iconGlyph(app.icon)}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{app.title}</span>
                  {app.description && (
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{app.description}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ borderTop: '1px solid #ddd', marginTop: 6 }}>
          <div
            className="xp-start-menu-item"
            onClick={() => { closeAll(); onClose() }}
          >
            <span className="icon" aria-hidden>⏻</span>
            <span>Cerrar todas las ventanas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
