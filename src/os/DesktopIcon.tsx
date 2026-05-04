'use client'

import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { useWM } from './store'
import { iconGlyph } from './Window'
import type { AppManifest } from './types'

export function DesktopIcon({ manifest, selected, onSelect }: {
  manifest: AppManifest
  selected: boolean
  onSelect: () => void
}) {
  const openApp = useWM(s => s.openApp)
  const router = useRouter()

  const open = () => {
    if (manifest.externalUrl) {
      window.open(manifest.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (manifest.standaloneRoute) {
      router.push(manifest.standaloneRoute)
      return
    }
    openApp(manifest)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx('xp-icon', selected && 'selected')}
      onClick={onSelect}
      onDoubleClick={open}
      onKeyDown={onKeyDown}
      aria-label={`Abrir ${manifest.title}`}
    >
      <span className="xp-icon-image" aria-hidden>
        {iconGlyph(manifest.icon)}
        <span className="xp-icon-shortcut" aria-hidden>↪</span>
      </span>
      <span className="xp-icon-label">{manifest.title}</span>
    </div>
  )
}
