import { Desktop } from '@os/Desktop'
import { DeepLinkOpener } from '@os/DeepLinkOpener'
import { DISCIPLINES, DISCIPLINE_ORDER, projectPath, projectsByDiscipline } from '@lib/projects/catalog'

export const metadata = {
  title: 'Proyectos — Edvard K.',
  description:
    'Proyectos de Edvard Khachatryan Sahakyan: soluciones de IA/MLOps, data science y desarrollo web. Repos en GitHub (EdvardKS) y casos prácticos.'
}

export default function Page() {
  return (
    <>
      <div className="sr-only">
        <h1>Proyectos de Edvard Khachatryan Sahakyan</h1>
        {DISCIPLINE_ORDER.map(discipline => (
          <nav key={discipline} aria-label={DISCIPLINES[discipline].title}>
            <h2>{DISCIPLINES[discipline].title}</h2>
            <p>{DISCIPLINES[discipline].blurb}</p>
            {projectsByDiscipline(discipline).map(project => (
              <a key={project.slug} href={projectPath(project.slug)}>
                {project.name}: {project.description}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <Desktop />
      <DeepLinkOpener appId="projects" />
    </>
  )
}
