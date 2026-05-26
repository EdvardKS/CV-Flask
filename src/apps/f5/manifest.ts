import type { AppManifest } from '@os/types'

function NoopApp() { return null }

const manifest: AppManifest = {
  id: 'f5',
  title: 'F5',
  icon: 'refresh',
  category: 'system',
  defaultSize: { width: 100, height: 100 },
  singleton: true,
  description: 'Refrescar la pantalla',
  customAction: 'reload',
  Component: NoopApp
}

export default manifest
