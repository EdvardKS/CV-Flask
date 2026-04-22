import type { AppManifest } from '@os/types'
import { CvApp } from './CvApp'

const manifest: AppManifest = {
  id: 'cv',
  title: 'Mi CV',
  icon: 'cv',
  category: 'cv',
  defaultSize: { width: 1040, height: 720 },
  minSize: { width: 520, height: 400 },
  singleton: true,
  deepLink: '/cv',
  description: 'Currículum completo: resumen, experiencia, educación y habilidades',
  Component: CvApp
}

export default manifest
