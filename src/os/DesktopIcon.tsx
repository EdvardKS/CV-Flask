'use client'

import { useRef, useState } from 'react'
import clsx from 'clsx'
import { useWM } from './store'
import { iconGlyph } from './Window'
import type { AppManifest } from './types'

export function DesktopIcon({ manifest, selected, onSelect }: {
  manifest: AppManifest
  selected: boolean
  onSelect: () => void
}) {
  const openApp = useWM(s => s.openApp)
  const lastClick = useRef(0)

  const onClick = (e: React.MouseEvent) => {
    onSelect()
    const now = Date.now()
    if (now - lastClick.current < 350) {
      openApp(manifest)
      lastClick.current = 0
    } else {
      lastClick.current = now
    }
  }

  const onDoubleClick = () => {
    openApp(manifest)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openApp(manifest)
    }
  }

  return (
    <button
      type="button"
      className={clsx('xp-icon', selected && 'selected')}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      aria-label={`Abrir ${manifest.title}`}
    >
      <span className="xp-icon-image" aria-hidden>{iconGlyph(manifest.icon)}</span>
      <span>{manifest.title}</span>
    </button>
  )
}
