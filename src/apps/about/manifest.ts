import type { AppManifest } from '@os/types'
import { AboutApp } from './AboutApp'

const manifest: AppManifest = {
  id: 'about',
  title: 'Léeme',
  icon: 'info',
  category: 'system',
  defaultSize: { width: 560, height: 440 },
  singleton: true,
  description: 'Qué es esto y cómo funciona',
  Component: AboutApp
}

export default manifest
