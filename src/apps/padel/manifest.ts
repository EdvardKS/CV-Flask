import type { AppManifest } from '@os/types'
import { PadelApp } from './PadelApp'

const manifest: AppManifest = {
  id: 'padel',
  title: 'Padel Scout',
  icon: 'trophy',
  category: 'mini-project',
  defaultSize: { width: 1120, height: 760 },
  minSize: { width: 600, height: 500 },
  singleton: true,
  deepLink: '/padel',
  description: 'Dashboard de errores, aciertos y score por set',
  Component: PadelApp
}

export default manifest
