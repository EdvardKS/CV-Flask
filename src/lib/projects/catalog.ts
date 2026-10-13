import repos from '../../../public/data/github-projects.json'
import production from '../../../public/data/production-projects.json'

export type ProjectDiscipline = 'ml' | 'dl' | 'genai' | 'web' | 'infra'

export type ProjectShot = { src: string; caption: string }

export type ProjectEntry = {
  slug: string
  name: string
  icon: string
  discipline: ProjectDiscipline
  description: string
  tags: string[]
  repoUrl: string | null
  liveUrl: string | null
  image: string | null
  whatItIs: string | null
  goal: string | null
  stack: string[]
  shots: ProjectShot[]
  highlight: { title: string; body: string } | null
}

type RepoRecord = {
  id: string
  name: string
  icon: string
  url: string
  private?: boolean
  category?: string
  description: string
  tags: string[]
}

type ProductionRecord = {
  id: string
  name: string
  icon: string
  image: string
  url: string | null
  description: string
  tags: string[]
  detail?: {
    que_es: string
    objetivo: string
    stack?: string[]
    shots?: ProjectShot[]
    highlight?: { title: string; body: string }
  }
}

export const DISCIPLINES: Record<ProjectDiscipline, { title: string; blurb: string }> = {
  ml: {
    title: 'Machine learning y ciencia de datos',
    blurb: 'Datos reales, pipelines de scikit-learn y modelos que se leen por su matriz de confusión, no por su accuracy.'
  },
  dl: {
    title: 'Deep learning',
    blurb: 'Redes convolucionales, grafos y aprendizaje por refuerzo, entrenados de principio a fin.'
  },
  genai: {
    title: 'IA generativa y agentes',
    blurb: 'RAG, agentes y modelos de lenguaje corriendo en local y en producción.'
  },
  web: {
    title: 'Web y aplicaciones',
    blurb: 'Producto: lo que la gente usa cada día.'
  },
  infra: {
    title: 'Infraestructura',
    blurb: 'Lo que sostiene todo lo demás: servidor, despliegues, correo y modelos en local.'
  }
}

export const DISCIPLINE_ORDER: ProjectDiscipline[] = ['ml', 'dl', 'genai', 'web', 'infra']

function isDiscipline(value: string | undefined): value is ProjectDiscipline {
  return value === 'ml' || value === 'dl' || value === 'genai' || value === 'web'
}

function fromRepo(record: RepoRecord): ProjectEntry {
  const isGithub = record.url.startsWith('https://github.com/')
  return {
    slug: record.id,
    name: record.name,
    icon: record.icon,
    discipline: isDiscipline(record.category) ? record.category : 'web',
    description: record.description,
    tags: record.tags,
    repoUrl: isGithub && !record.private ? record.url : null,
    liveUrl: isGithub ? null : record.url,
    image: null,
    whatItIs: null,
    goal: null,
    stack: [],
    shots: [],
    highlight: null
  }
}

function fromProduction(record: ProductionRecord): ProjectEntry {
  return {
    slug: record.id,
    name: record.name,
    icon: record.icon,
    discipline: record.url ? 'web' : 'infra',
    description: record.description,
    tags: record.tags,
    repoUrl: null,
    liveUrl: record.url,
    image: record.image,
    whatItIs: record.detail?.que_es ?? null,
    goal: record.detail?.objetivo ?? null,
    stack: record.detail?.stack ?? [],
    shots: record.detail?.shots ?? [],
    highlight: record.detail?.highlight ?? null
  }
}

export const PROJECTS: ProjectEntry[] = [
  ...(repos as RepoRecord[]).map(fromRepo),
  ...(production as ProductionRecord[]).map(fromProduction)
]

export function getProject(slug: string): ProjectEntry | undefined {
  return PROJECTS.find(project => project.slug === slug)
}

export function projectsByDiscipline(discipline: ProjectDiscipline): ProjectEntry[] {
  return PROJECTS.filter(project => project.discipline === discipline)
}

export function projectPath(slug: string): string {
  return `/projects/${slug}`
}
