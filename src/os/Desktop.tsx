'use client'

import { useEffect, useState } from 'react'
import { APPS } from '@apps/_registry'
import { DesktopIcon } from './DesktopIcon'
import { Window } from './Window'
import { Taskbar } from './Taskbar'
import { StartMenu } from './StartMenu'
import { useWM } from './store'

export function Desktop() {
  const [selected, setSelected] = useState<string | null>(null)
  const [startOpen, setStartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const windows = useWM(s => s.windows)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('.xp-icon') && !t.closest('.xp-window')) {
        setSelected(null)
      }
      if (!t.closest('.xp-start-menu') && !t.closest('.xp-start-button')) {
        setStartOpen(false)
      }
    }
    window.addEventListener('mousedown', onClickAway)
    return () => window.removeEventListener('mousedown', onClickAway)
  }, [])

  const sorted = [...APPS].sort((a, b) => {
    const order = ['cv', 'mini-project', 'tool', 'system']
    return order.indexOf(a.category) - order.indexOf(b.category)
  })

  return (
    <div className="xp-desktop">
      <div className="xp-desktop-area">
        <ul className="xp-icon-grid" role="list">
          {sorted.map(app => (
            <li key={app.id}>
              <DesktopIcon
                manifest={app}
                selected={selected === app.id}
                onSelect={() => setSelected(app.id)}
              />
            </li>
          ))}
        </ul>

        {mounted && windows.map(w => <Window key={w.id} win={w} />)}
      </div>

      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
      <Taskbar onStartToggle={() => setStartOpen(o => !o)} startOpen={startOpen} />
    </div>
  )
}
