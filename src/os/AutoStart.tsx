'use client'

import { useEffect, useRef } from 'react'
import { APPS_BY_ID } from '@apps/_registry'
import { useWM } from './store'

// Open one app once on first mount (home entry) so every visitor sees it first.
// "Auto-abrir una vez": it opens on load but the visitor can close it and it
// won't reappear (singleton + a ref guard).
export function AutoStart({ appId }: { appId: string }) {
  const openApp = useWM(s => s.openApp)
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    const m = APPS_BY_ID[appId]
    if (m) openApp(m)
  }, [appId, openApp])
  return null
}
