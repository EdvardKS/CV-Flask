export type Skill = { name: string; level: number; hot?: boolean }

export type SkillCategory = {
  id: string
  name: string
  icon: string
  color: string
  overall: number
  narrative: string
  skills: Skill[]
}

/**
 * Categorías más buscadas por empresas hoy: GenAI, ML, Cloud/K8s, MLOps,
 * Data Engineering y Backend moderno.
 * Niveles 0-100 calibrados desde la experiencia declarada en CV +
 * actividad pública (GitHub + posts de LinkedIn sobre RAG, Qdrant,
 * LangGraph, Teriyaki/Coconut, etc.).
 * `hot: true` marca las tecnologías tendencia que pintamos en acento.
 */
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'genai',
    name: 'Generative AI & LLMs',
    icon: '✨',
    color: '#a855f7',
    overall: 92,
    narrative: 'RAG privado, LLMOps y stacks 100% locales.',
    skills: [
      { name: 'RAG (Retrieval-Augmented Generation)', level: 94, hot: true },
      { name: 'LangChain · LangGraph', level: 90, hot: true },
      { name: 'Ollama · modelos Open Source', level: 88, hot: true },
      { name: 'OpenAI API', level: 88 },
      { name: 'Qdrant · vector DBs', level: 82, hot: true },
      { name: 'Prompt engineering', level: 86 },
      { name: 'LLMOps', level: 80, hot: true },
      { name: 'Fine-tuning (LoRA, JSONL)', level: 72 }
    ]
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    icon: '📊',
    color: '#3b82f6',
    overall: 84,
    narrative: 'Supervisado, NLP, time series, visión.',
    skills: [
      { name: 'scikit-learn', level: 88 },
      { name: 'PyTorch', level: 78 },
      { name: 'TensorFlow / Keras', level: 74 },
      { name: 'Time series forecasting', level: 84 },
      { name: 'NLP · embeddings', level: 86, hot: true },
      { name: 'Computer vision (OCR, clasificación)', level: 78 },
      { name: 'Reinforcement Learning', level: 58 },
      { name: 'Feature engineering', level: 82 }
    ]
  },
  {
    id: 'cloud',
    name: 'Cloud & DevOps',
    icon: '☁️',
    color: '#0ea5e9',
    overall: 80,
    narrative: 'Contenedores, orquestación e infra.',
    skills: [
      { name: 'Docker · Compose', level: 94, hot: true },
      { name: 'Kubernetes (K8s)', level: 68, hot: true },
      { name: 'AWS (EC2, S3, IAM)', level: 76 },
      { name: 'CI/CD (GitHub Actions)', level: 78 },
      { name: 'Linux administration', level: 84 },
      { name: 'Nginx · reverse proxy', level: 82 },
      { name: 'Terraform (IaC)', level: 55 }
    ]
  },
  {
    id: 'mlops',
    name: 'MLOps & Private AI',
    icon: '🔐',
    color: '#ef4444',
    overall: 82,
    narrative: 'Trazabilidad, privacidad y producción.',
    skills: [
      { name: 'Private-first LLM stacks', level: 90, hot: true },
      { name: 'Vector stores (Qdrant, Chroma)', level: 82, hot: true },
      { name: 'Observability · tracing', level: 72 },
      { name: 'Model versioning', level: 74 },
      { name: 'Data pipelines con manifiestos', level: 80 },
      { name: 'Deduplicación (sha256)', level: 85 }
    ]
  },
  {
    id: 'data',
    name: 'Data Engineering',
    icon: '🗃️',
    color: '#22c55e',
    overall: 84,
    narrative: 'ETL, análisis y visualización.',
    skills: [
      { name: 'Python', level: 96, hot: true },
      { name: 'SQL (MySQL, PostgreSQL)', level: 88 },
      { name: 'Pandas · Polars', level: 90 },
      { name: 'ETL / data pipelines', level: 84 },
      { name: 'Microsoft Fabric', level: 70, hot: true },
      { name: 'Big Data · Spark', level: 66 },
      { name: 'Data visualization', level: 80 }
    ]
  },
  {
    id: 'backend',
    name: 'Backend & Web',
    icon: '⚙️',
    color: '#f59e0b',
    overall: 82,
    narrative: 'APIs, servicios y fullstack.',
    skills: [
      { name: 'Flask', level: 92 },
      { name: 'Django', level: 86 },
      { name: 'FastAPI', level: 84 },
      { name: 'Next.js · React', level: 82, hot: true },
      { name: 'TypeScript', level: 80 },
      { name: 'PHP · Laravel', level: 74 },
      { name: 'PrestaShop · WordPress', level: 72 }
    ]
  }
]
