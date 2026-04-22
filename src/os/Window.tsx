'use client'

import { useCallback, useMemo } from 'react'
import clsx from 'clsx'
import { useWM } from './store'
import { useDraggable } from './useDraggable'
import { useResizable } from './useResizable'
import { APPS_BY_ID } from '@apps/_registry'
import type { WindowState } from './types'

export function Window({ win }: { win: WindowState }) {
  const focused = useWM(s => s.focusedId === win.id)
  const focus = useWM(s => s.focus)
  const close = useWM(s => s.close)
  const minimize = useWM(s => s.minimize)
  const toggleMaximize = useWM(s => s.toggleMaximize)

  const { handleRef, previewRef, onPointerDown } = useDraggable(win)
  const { onPointerDown: onResize } = useResizable(win)

  const manifest = APPS_BY_ID[win.appId]
  const Body = manifest?.Component

  const onFocus = useCallback(() => focus(win.id), [focus, win.id])

  const style = useMemo<React.CSSProperties>(() => ({
    left: win.x,
    top: win.y,
    width: win.width,
    height: win.height,
    zIndex: win.zIndex,
    display: win.minimized ? 'none' : 'flex'
  }), [win.x, win.y, win.width, win.height, win.zIndex, win.minimized])

  return (
    <>
      <section
        className={clsx('xp-window', focused && 'is-focused')}
        style={style}
        onPointerDown={onFocus}
        role="dialog"
        aria-label={win.title}
      >
        <div
          ref={handleRef}
          className="xp-title-bar"
          onPointerDown={onPointerDown}
          onDoubleClick={() => toggleMaximize(win.id)}
        >
          <div className="xp-title-bar-text">
            <span aria-hidden>{iconGlyph(win.icon)}</span>
            <span>{win.title}</span>
          </div>
          <div className="xp-title-controls" data-no-drag>
            <button className="xp-title-btn" onClick={() => minimize(win.id)} aria-label="Minimize">_</button>
            <button className="xp-title-btn" onClick={() => toggleMaximize(win.id)} aria-label="Maximize">
              {win.maximized ? '❐' : '□'}
            </button>
            <button className="xp-title-btn close" onClick={() => close(win.id)} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="xp-window-body" data-no-drag>
          {Body ? <Body params={win.params} /> : <p>App <code>{win.appId}</code> no encontrada.</p>}
        </div>

        {!win.maximized && (
          <>
            <div className="xp-resize-handle xp-resize-n"  onPointerDown={onResize('n')} />
            <div className="xp-resize-handle xp-resize-s"  onPointerDown={onResize('s')} />
            <div className="xp-resize-handle xp-resize-e"  onPointerDown={onResize('e')} />
            <div className="xp-resize-handle xp-resize-w"  onPointerDown={onResize('w')} />
            <div className="xp-resize-handle xp-resize-ne" onPointerDown={onResize('ne')} />
            <div className="xp-resize-handle xp-resize-nw" onPointerDown={onResize('nw')} />
            <div className="xp-resize-handle xp-resize-se" onPointerDown={onResize('se')} />
            <div className="xp-resize-handle xp-resize-sw" onPointerDown={onResize('sw')} />
          </>
        )}
      </section>
      <div ref={previewRef} className="xp-snap-preview" style={{ display: 'none' }} />
    </>
  )
}

function iconGlyph(name: string): React.ReactNode {
  if (name === 'linkedin') return <LinkedInGlyph />
  if (name === 'github') return <GitHubGlyph />
  const map: Record<string, string> = {
    cv: '📄', folder: '📁', terminal: '🖥️', briefcase: '💼', book: '📚',
    user: '👤', mail: '✉️', trophy: '🏆', quiz: '❓', app: '🪟',
    info: 'ℹ️', code: '💻'
  }
  return map[name] ?? '🪟'
}

function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 34 34" width="1em" height="1em" style={{ display: 'inline-block', verticalAlign: 'middle' }} aria-hidden focusable="false">
      <rect width="34" height="34" rx="6" fill="#0a66c2" />
      <path fill="#fff" d="M11.2 13.6H7.8V26h3.4V13.6zm-1.7-5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM26 20c0-3-1.6-4.6-3.8-4.6-1.7 0-2.5 0.9-2.9 1.6h-0.1v-1.4h-3.3V26h3.4v-5.5c0-1.4 0.3-2.8 2-2.8 1.7 0 1.7 1.6 1.7 2.9V26H26V20z" />
    </svg>
  )
}

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 34 34" width="1em" height="1em" style={{ display: 'inline-block', verticalAlign: 'middle' }} aria-hidden focusable="false">
      <rect width="34" height="34" rx="6" fill="#24292e" />
      <path fill="#fff" d="M17 7.5c-5.2 0-9.5 4.2-9.5 9.5 0 4.2 2.7 7.8 6.5 9 0.5 0.1 0.6-0.2 0.6-0.4v-1.5c-2.6 0.6-3.2-1.3-3.2-1.3-0.4-1.1-1.1-1.4-1.1-1.4-0.9-0.6 0.1-0.6 0.1-0.6 1 0.1 1.5 1 1.5 1 0.9 1.6 2.4 1.1 3 0.9 0.1-0.7 0.4-1.1 0.6-1.4-2.1-0.2-4.3-1-4.3-4.6 0-1 0.4-1.9 1-2.5-0.1-0.2-0.4-1.2 0.1-2.5 0 0 0.8-0.3 2.7 1 0.8-0.2 1.6-0.3 2.5-0.3s1.7 0.1 2.5 0.3c1.9-1.3 2.7-1 2.7-1 0.5 1.3 0.2 2.3 0.1 2.5 0.6 0.7 1 1.5 1 2.5 0 3.6-2.2 4.4-4.3 4.6 0.3 0.3 0.6 0.9 0.6 1.8v2.7c0 0.3 0.2 0.6 0.6 0.4 3.8-1.3 6.5-4.9 6.5-9C26.5 11.7 22.2 7.5 17 7.5z" />
    </svg>
  )
}

export { iconGlyph }
