import type { AppManifest } from '@os/types'
import { QuizApp } from './QuizApp'

const manifest: AppManifest = {
  id: 'quiz',
  title: 'Quiz de asignaturas',
  icon: 'quiz',
  category: 'mini-project',
  defaultSize: { width: 880, height: 640 },
  minSize: { width: 480, height: 420 },
  singleton: true,
  deepLink: '/quiz',
  description: 'Exámenes tipo test de ECSO, SSOO, Inglés y más',
  Component: QuizApp
}

export default manifest
