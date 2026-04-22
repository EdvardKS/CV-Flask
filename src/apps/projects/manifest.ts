import type { AppManifest } from '@os/types'
import { ProjectsApp } from './ProjectsApp'

const manifest: AppManifest = {
  id: 'projects',
  title: 'Proyectos',
  icon: 'folder',
  category: 'cv',
  defaultSize: { width: 960, height: 680 },
  singleton: true,
  deepLink: '/projects',
  description: 'Lista de proyectos personales y profesionales',
  Component: ProjectsApp
}

export default manifest
