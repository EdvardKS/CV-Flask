import type { AppManifest } from '@os/types'
import { ExternalAppStub } from '../_shared/ExternalAppStub'

const manifest: AppManifest = {
  id: 'linkedin',
  title: 'LinkedIn',
  icon: 'linkedin',
  category: 'tool',
  defaultSize: { width: 400, height: 200 },
  externalUrl: 'https://www.linkedin.com/in/edvardks/',
  description: 'Mi perfil de LinkedIn',
  Component: ExternalAppStub
}

export default manifest
