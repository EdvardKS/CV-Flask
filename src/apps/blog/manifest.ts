import type { AppManifest } from '@os/types'
import { ExternalAppStub } from '../_shared/ExternalAppStub'

const manifest: AppManifest = {
  id: 'blog',
  title: 'Blog',
  icon: 'book',
  category: 'cv',
  defaultSize: { width: 400, height: 200 },
  standaloneRoute: '/blog',
  description: 'Lo que pienso y cómo trabajo: machine learning, deep learning y agentes de IA',
  Component: ExternalAppStub
}

export default manifest
