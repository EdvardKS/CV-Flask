import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocShell } from '@components/site/DocShell'
import { DISCIPLINES, PROJECTS, getProject, projectPath, projectsByDiscipline } from '@lib/projects/catalog'

const BASE = 'https://edvardks.com'

type Params = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return PROJECTS.map(project => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) return { title: 'Proyecto no encontrado', robots: { index: false } }
  const discipline = DISCIPLINES[project.discipline].title
  const title = `${project.name} — ${discipline}`
  return {
    title,
    description: project.description,
    keywords: [...project.tags, discipline, 'Edvard Khachatryan Sahakyan'],
    alternates: { canonical: projectPath(project.slug) },
    openGraph: {
      type: 'article',
      url: `${BASE}${projectPath(project.slug)}`,
      title,
      description: project.description,
      images: project.image ? [{ url: project.image }] : undefined
    }
  }
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) notFound()

  const discipline = DISCIPLINES[project.discipline]
  const siblings = projectsByDiscipline(project.discipline).filter(other => other.slug !== project.slug)
  const url = `${BASE}${projectPath(project.slug)}`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': project.repoUrl ? 'SoftwareSourceCode' : 'CreativeWork',
      name: project.name,
      description: project.description,
      url,
      keywords: project.tags.join(', '),
      inLanguage: 'es-ES',
      author: { '@type': 'Person', name: 'Edvard Khachatryan Sahakyan', url: BASE },
      ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
      ...(project.liveUrl ? { sameAs: [project.liveUrl] } : {}),
      ...(project.image ? { image: `${BASE}${project.image}` } : {})
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Proyectos', item: `${BASE}/projects` },
        { '@type': 'ListItem', position: 3, name: project.name, item: url }
      ]
    }
  ]

  return (
    <DocShell>
      <nav className="doc-crumbs" aria-label="Ruta">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <Link href="/projects">Proyectos</Link>
        <span>/</span>
        <span>{project.name}</span>
      </nav>

      <article className="doc-article">
        <p className="doc-eyebrow">{discipline.title}</p>
        <h1>
          <span aria-hidden>{project.icon}</span> {project.name}
        </h1>
        <p className="doc-lead">{project.description}</p>

        <ul className="doc-tags">
          {project.tags.map(tag => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        <div className="doc-actions">
          {project.repoUrl && (
            <a className="doc-btn primary" href={project.repoUrl} target="_blank" rel="noopener">
              Ver el código en GitHub
            </a>
          )}
          {project.liveUrl && (
            <a className="doc-btn primary" href={project.liveUrl} target="_blank" rel="noopener">
              Verlo en producción
            </a>
          )}
          <Link className="doc-btn" href="/projects">
            Abrir en el escritorio
          </Link>
        </div>

        {project.image && (
          <img className="doc-cover" src={project.image} alt={`Captura de ${project.name}`} width={1280} height={800} />
        )}

        {project.whatItIs && (
          <section>
            <h2>Qué es</h2>
            <p>{project.whatItIs}</p>
          </section>
        )}

        {project.goal && (
          <section>
            <h2>Objetivo</h2>
            <p>{project.goal}</p>
          </section>
        )}

        {project.highlight && (
          <section className="doc-highlight">
            <h2>{project.highlight.title}</h2>
            <p>{project.highlight.body}</p>
          </section>
        )}

        {project.stack.length > 0 && (
          <section>
            <h2>Stack</h2>
            <ul className="doc-tags">
              {project.stack.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {project.shots.length > 1 && (
          <section>
            <h2>Capturas</h2>
            <div className="doc-shots">
              {project.shots.slice(1).map(shot => (
                <figure key={shot.src}>
                  <img src={shot.src} alt={shot.caption} loading="lazy" width={1280} height={800} />
                  <figcaption>{shot.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2>Dónde encaja</h2>
          <p>{discipline.blurb}</p>
        </section>
      </article>

      {siblings.length > 0 && (
        <section className="doc-related">
          <h2>Más proyectos de {discipline.title.toLowerCase()}</h2>
          <ul>
            {siblings.map(other => (
              <li key={other.slug}>
                <Link href={projectPath(other.slug)}>
                  <strong>
                    <span aria-hidden>{other.icon}</span> {other.name}
                  </strong>
                  <span>{other.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {jsonLd.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
    </DocShell>
  )
}
