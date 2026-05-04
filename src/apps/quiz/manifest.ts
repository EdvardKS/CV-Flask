import type { AppManifest } from '@os/types'
import { QuizApp } from './QuizApp'

const manifest: AppManifest = {
  id: 'quiz',
  title: 'Tests Universidad',
  icon: 'quiz',
  category: 'mini-project',
  defaultSize: { width: 880, height: 640 },
  minSize: { width: 480, height: 420 },
  singleton: true,
  deepLink: '/quiz',
  standaloneRoute: '/quiz',
  description: 'Exámenes tipo test (ECSO, SSOO, Inglés, …)',
  Component: QuizApp
}

export default manifest
