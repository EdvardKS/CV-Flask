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

function iconGlyph(name: string): string {
  const map: Record<string, string> = {
    cv: '📄', folder: '📁', terminal: '🖥️', briefcase: '💼', book: '📚',
    user: '👤', mail: '✉️', trophy: '🏆', quiz: '❓', app: '🪟',
    info: 'ℹ️', code: '💻'
  }
  return map[name] ?? '🪟'
}

export { iconGlyph }
