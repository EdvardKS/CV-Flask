import type { AppManifest } from '@os/types'
import { createPageFrameApp } from '../_shared/PageFrameApp'

const manifest: AppManifest = {
  id: 'ficha',
  title: 'Ficha de proyecto',
  icon: 'folder',
  category: 'cv',
  defaultSize: { width: 900, height: 660 },
  minSize: { width: 360, height: 320 },
  singleton: true,
  hidden: true,
  description: 'Ficha de un proyecto',
  Component: createPageFrameApp('/projects', 'Ficha de proyecto')
}

export default manifest
