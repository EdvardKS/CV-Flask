'use client'

import { ProjectsGrid } from './ProjectsGrid'

export function ProjectsApp() {
  return (
    <div>
      <header style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #d0d7de' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>📂 Proyectos</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
          Mini-proyectos abiertos y repos en GitHub — repos privados marcados con candado.
        </p>
      </header>
      <ProjectsGrid />
    </div>
  )
}
