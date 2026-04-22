'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useWM } from './store'
import { iconGlyph } from './Window'
import { useLocale } from '@lib/i18n/config'
import { useUI } from './uiStore'
import { APPS_BY_ID } from '@apps/_registry'
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
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const clickItem = (id: string, minimized: boolean) => {
    if (minimized) { restore(id); focus(id); return }
    if (focusedId === id) { minimize(id); return }
    focus(id)
  }

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

      <SystemTray now={now} />
    </div>
  )
}

/** Windows 11-style system tray: hidden icons chevron + icons + clock stacked. */
function SystemTray({ now }: { now: Date | null }) {
  const trayExpanded = useUI(s => s.trayExpanded)
  const toggleTray = useUI(s => s.toggleTray)
  const toggleNotifications = useUI(s => s.toggleNotifications)
  const openApp = useWM(s => s.openApp)

  const openAI = () => {
    const m = APPS_BY_ID.ai
    if (m) openApp(m)
  }

  const time = now
    ? new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now)
    : '--:--'
  const date = now
    ? new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(now)
    : '--/--/----'

  const chevronRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!trayExpanded) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popoverRef.current?.contains(t)) return
      if (chevronRef.current?.contains(t)) return
      toggleTray()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [trayExpanded, toggleTray])

  return (
    <div className="xp-tray">
      <button
        ref={chevronRef}
        className="xp-tray-chevron"
        onClick={toggleTray}
        aria-label={trayExpanded ? 'Ocultar iconos' : 'Mostrar iconos ocultos'}
        title={trayExpanded ? 'Ocultar' : 'Mostrar iconos ocultos'}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d={trayExpanded ? 'M1 6l4-3 4 3' : 'M1 4l4 3 4-3'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {trayExpanded && (
        <div ref={popoverRef} className="xp-tray-hidden xp-tray-popover" role="dialog" aria-label="Iconos ocultos">
          <TrayIcon title="Docker">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="#2496ed"><path d="M22 9.5l-1.4-.3c-.5-2.3-3.2-3.2-3.3-3.3l-.4-.2-.3.4a4 4 0 00-.5 3c-.5.4-1.4.5-1.9.5H2.4c-.2 0-.4.2-.4.4 0 1.4 0 5.8 4 8a9 9 0 007.8 4c5.9 0 9.9-3.4 11.5-9.1.5 0 1.7-.5 2.4-2v-.1l-.3-.3H22zM4 9h2v2H4V9zm3 0h2v2H7V9zm3 0h2v2h-2V9zm3 0h2v2h-2V9zM7 6h2v2H7V6zm3 0h2v2h-2V6zm3 0h2v2h-2V6zm0-3h2v2h-2V3z"/></svg>
          </TrayIcon>
          <TrayIcon title="Windows Update">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </TrayIcon>
          <TrayIcon title="Bluetooth">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="6 18 18 6 11 6 11 18 6 14 18 14"/>
            </svg>
          </TrayIcon>
          <TrayIcon title="Batería — 87%">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="1" y="7" width="18" height="10" rx="2"/>
              <line x1="23" y1="11" x2="23" y2="13"/>
              <rect x="3" y="9" width="13" height="6" fill="#22c55e" stroke="none"/>
            </svg>
          </TrayIcon>
          <TrayIcon title="Micrófono">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </TrayIcon>
          <TrayIcon title="OneDrive">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M17.58 11a5 5 0 00-10-.58A4 4 0 005 18h12a3.5 3.5 0 00.58-7z"/>
            </svg>
          </TrayIcon>
          <TrayIcon title="Ubicación">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </TrayIcon>
          <TrayIcon title="Antivirus">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </TrayIcon>
          <TrayIcon title="Power">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          </TrayIcon>
        </div>
      )}

      <LocaleFlag />

      <button
        className="xp-tray-icon is-accent xp-tray-ai"
        onClick={openAI}
        title="Chat IA sobre Edvard"
        aria-label="Abrir Chat IA"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
          <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/>
        </svg>
        <span className="xp-tray-ai-label">AI</span>
      </button>

      <TrayIcon title="Notificaciones" onClick={toggleNotifications}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </TrayIcon>

      <button className="xp-tray-clock" onClick={toggleNotifications} title="Madrid · click para ver notificaciones">
        <span className="xp-tray-time">{time}</span>
        <span className="xp-tray-date">{date}</span>
      </button>
    </div>
  )
}

function TrayIcon({ title, onClick, accent, hideBelow, children }: {
  title: string
  onClick?: () => void
  accent?: boolean
  /** Hide this icon when viewport width < hideBelow (px). */
  hideBelow?: number
  children: React.ReactNode
}) {
  const hiddenClass = hideBelow ? `xp-tray-hide-below-${hideBelow}` : ''
  return (
    <button
      className={clsx('xp-tray-icon', accent && 'is-accent', hiddenClass)}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  )
}

function LocaleFlag() {
  const locale = useLocale(s => s.locale)
  const setLocale = useLocale(s => s.setLocale)
  const flags: Record<Locale, string> = { es: '🇪🇸', en: '🇬🇧', hy: '🇦🇲' }
  const order: Locale[] = ['es', 'en', 'hy']
  const next = () => setLocale(order[(order.indexOf(locale) + 1) % order.length])
  return (
    <button className="xp-tray-icon xp-tray-lang" onClick={next} title={`Idioma: ${locale.toUpperCase()}`}>
      <span aria-hidden style={{ fontSize: 13 }}>{flags[locale]}</span>
    </button>
  )
}
