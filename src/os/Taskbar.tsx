'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useWM } from './store'
import { iconGlyph } from './Window'
import { useLocale } from '@lib/i18n/config'
import type { Locale } from './types'

export function Taskbar({ onStartToggle, startOpen }: { onStartToggle: () => void; startOpen: boolean }) {
  const windows = useWM(s => s.windows)
  const focusedId = useWM(s => s.focusedId)
  const focus = useWM(s => s.focus)
  const minimize = useWM(s => s.minimize)
  const restore = useWM(s => s.restore)

  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const clickItem = (id: string, minimized: boolean) => {
    if (minimized) { restore(id); focus(id); return }
    if (focusedId === id) { minimize(id); return }
    focus(id)
  }

  const time = now ? now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'

  return (
    <div className="xp-taskbar">
      <button
        className={clsx('xp-start-button', startOpen && 'active')}
        onClick={(e) => { e.stopPropagation(); onStartToggle() }}
      >
        <span aria-hidden>⊞</span>
        <span>start</span>
      </button>
      <div className="xp-taskbar-items">
        {windows.map(w => (
          <button
            key={w.id}
            className={clsx('xp-taskbar-item', focusedId === w.id && !w.minimized && 'active')}
            onClick={() => clickItem(w.id, w.minimized)}
            title={w.title}
          >
            <span aria-hidden>{iconGlyph(w.icon)}</span>
            <span>{w.title}</span>
          </button>
        ))}
      </div>
      <LocaleSelector />
      <div className="xp-taskbar-tray">
        <span>{time}</span>
      </div>
    </div>
  )
}

function LocaleSelector() {
  const locale = useLocale(s => s.locale)
  const setLocale = useLocale(s => s.setLocale)
  const flags: Record<Locale, string> = { es: '🇪🇸', en: '🇬🇧', hy: '🇦🇲' }
  return (
    <select
      value={locale}
      onChange={e => setLocale(e.target.value as Locale)}
      style={{
        background: 'linear-gradient(180deg, #1d8dce, #0d6ab0)',
        color: '#fff',
        border: 'none',
        padding: '4px 6px',
        borderRadius: 3,
        fontSize: 11,
        cursor: 'pointer'
      }}
      title="Idioma"
    >
      <option value="es">{flags.es} ES</option>
      <option value="en">{flags.en} EN</option>
      <option value="hy">{flags.hy} HY</option>
    </select>
  )
}
