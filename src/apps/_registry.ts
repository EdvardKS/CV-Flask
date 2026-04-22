import type { AppManifest } from '@os/types'

import cvManifest from './cv/manifest'
import projectsManifest from './projects/manifest'
import contactManifest from './contact/manifest'
import quizManifest from './quiz/manifest'
import padelManifest from './padel/manifest'
import aboutManifest from './about/manifest'

export const APPS: AppManifest[] = [
  cvManifest,
  projectsManifest,
  quizManifest,
  padelManifest,
  contactManifest,
  aboutManifest
]

export const APPS_BY_ID: Record<string, AppManifest> = Object.fromEntries(
  APPS.map(a => [a.id, a])
)
