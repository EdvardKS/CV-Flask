import type { AppManifest } from '@os/types'
import { createPageFrameApp } from '../_shared/PageFrameApp'

const manifest: AppManifest = {
  id: 'blog',
  title: 'Blog',
  icon: 'book',
  category: 'cv',
  defaultSize: { width: 920, height: 660 },
  minSize: { width: 360, height: 320 },
  singleton: true,
  description: 'Lo que pienso y cómo trabajo: machine learning, deep learning, big data y cloud',
  Component: createPageFrameApp('/blog', 'Blog')
}

export default manifest
