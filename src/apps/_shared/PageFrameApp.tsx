'use client'

import type { WindowState } from '@os/types'

export function createPageFrameApp(defaultPath: string, label: string) {
  return function PageFrameApp({ params }: { params?: WindowState['params'] }) {
    const path = typeof params?.path === 'string' && params.path.startsWith('/') ? params.path : defaultPath
    return <iframe key={path} className="page-frame" src={path} title={label} loading="lazy" />
  }
}
