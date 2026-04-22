import type { AppManifest } from '@os/types'
import { ExternalAppStub } from '../_shared/ExternalAppStub'

const manifest: AppManifest = {
  id: 'github',
  title: 'GitHub',
  icon: 'github',
  category: 'tool',
  defaultSize: { width: 400, height: 200 },
  externalUrl: 'https://github.com/EdvardKS',
  description: 'Mi perfil de GitHub',
  Component: ExternalAppStub
}

export default manifest
