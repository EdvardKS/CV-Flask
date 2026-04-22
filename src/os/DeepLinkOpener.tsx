'use client'

import { useEffect } from 'react'
import { APPS_BY_ID } from '@apps/_registry'
import { useWM } from './store'

export function DeepLinkOpener({ appId, params }: { appId: string; params?: Record<string, string> }) {
  const openApp = useWM(s => s.openApp)
  useEffect(() => {
    const manifest = APPS_BY_ID[appId]
    if (manifest) openApp(manifest, params)
  }, [appId, params, openApp])
  return null
}
