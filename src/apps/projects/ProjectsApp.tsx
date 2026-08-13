'use client'

import { useState } from 'react'
import { ProjectsGrid, type ProdProject } from './ProjectsGrid'
import { ProjectDetail } from './ProjectDetail'

export function ProjectsApp() {
  const [detalle, setDetalle] = useState<ProdProject | null>(null)

  if (detalle) return <ProjectDetail p={detalle} onBack={() => setDetalle(null)} />

  return (
    <div>
      <header style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #d0d7de' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>📂 Proyectos</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
          Apps en producción con ficha, capturas y diagrama de flujo — y los repos en GitHub.
        </p>
      </header>
      <ProjectsGrid onOpenDetail={setDetalle} />
    </div>
  )
}
