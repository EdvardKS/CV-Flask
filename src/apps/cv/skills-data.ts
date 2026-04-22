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
 * Skills calibrated from:
 * - LinkedIn headline: "Design and deployment of end-to-end AI architectures
 *   including NLP systems, RAG pipelines, and agentic AI models."
 * - Principales aptitudes (pinned en LinkedIn):
 *   Agentic AI Systems · Kubernetes + OpenShift + DockerCompose · GenAI + RAG + MLOps
 * - Aptitudes respaldadas por experiencia y cursos:
 *   LangChain, LangGraph, NLP, RAG, Consultoría, Kafka, Logstash, Elastic (ELK),
 *   Power BI, Microsoft Fabric, Scikit-learn, PyTorch, ResNet/CNN, DeepRacer
 *   (Reinforcement Learning), AWS Academy, Azure ML, Business Intelligence,
 *   AIOps, IA responsable, Big Data, ERP, Docker Swarm, PMBOK/PM, Team
 *   leadership, Data analyst, Data science…
 *
 * `hot: true` marca lo que las empresas están pidiendo HOY y en lo que hay
 * evidencia pública reciente (GitHub/LinkedIn) de Edvard.
 */
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'genai',
    name: 'Generative AI & Agentic',
    icon: '🤖',
    color: '#a855f7',
    overall: 93,
    narrative: 'Agentic AI, RAG, LLMOps y fine-tuning.',
    skills: [
      { name: 'Agentic AI Systems', level: 90, hot: true },
      { name: 'RAG (Retrieval-Augmented Generation)', level: 94, hot: true },
      { name: 'LangChain · LangGraph', level: 92, hot: true },
      { name: 'Ollama · modelos Open Source', level: 90, hot: true },
      { name: 'OpenAI API', level: 88 },
      { name: 'LLMOps (llama3, Comet)', level: 84, hot: true },
      { name: 'Qdrant · vector DBs', level: 85, hot: true },
      { name: 'Prompt engineering', level: 88 },
      { name: 'Fine-tuning (LoRA, JSONL)', level: 72 },
      { name: 'Herramientas de IA generativa', level: 90 }
    ]
  },
  {
    id: 'ml',
    name: 'Machine Learning & DL',
    icon: '🧠',
    color: '#3b82f6',
    overall: 84,
    narrative: 'Supervisado, no supervisado, DL y RL.',
    skills: [
      { name: 'scikit-learn', level: 88 },
      { name: 'Aprendizaje supervisado', level: 88 },
      { name: 'Aprendizaje no supervisado', level: 80 },
      { name: 'Redes neuronales profundas (DNN)', level: 80 },
      { name: 'Deep Learning Convolutional (ResNet/CNN)', level: 80 },
      { name: 'PyTorch', level: 78 },
      { name: 'TensorFlow / Keras', level: 74 },
      { name: 'NLP · embeddings', level: 90, hot: true },
      { name: 'Computer vision (OCR, clasificación)', level: 80 },
      { name: 'Time series forecasting', level: 84 },
      { name: 'Reinforcement Learning (AWS DeepRacer)', level: 70, hot: true },
      { name: 'Random Forest · pipelines', level: 82 },
      { name: 'Análisis de datos estadísticos (EDA)', level: 86 }
    ]
  },
  {
    id: 'cloud',
    name: 'Cloud · Kubernetes · DevOps',
    icon: '☁️',
    color: '#0ea5e9',
    overall: 83,
    narrative: 'K8s, OpenShift, AWS / Azure, containers.',
    skills: [
      { name: 'Docker · Docker Compose', level: 94, hot: true },
      { name: 'Docker Swarm', level: 80 },
      { name: 'Kubernetes', level: 74, hot: true },
      { name: 'OpenShift', level: 70, hot: true },
      { name: 'Containers (rootless, secure)', level: 85 },
      { name: 'AWS (EC2, S3, IAM, Academy)', level: 80 },
      { name: 'Azure (ML, identity)', level: 72, hot: true },
      { name: 'CI/CD (GitHub Actions)', level: 78 },
      { name: 'Linux administration', level: 86 },
      { name: 'Nginx · reverse proxy', level: 84 },
      { name: 'Terraform (IaC)', level: 55 }
    ]
  },
  {
    id: 'mlops',
    name: 'MLOps & Private AI',
    icon: '🔐',
    color: '#ef4444',
    overall: 84,
    narrative: 'Trazabilidad, privacidad, producción.',
    skills: [
      { name: 'Private-first LLM stacks', level: 92, hot: true },
      { name: 'Vector stores (Qdrant, Chroma)', level: 84, hot: true },
      { name: 'LLMOps con Comet · llama3', level: 80, hot: true },
      { name: 'AIOps (Operaciones de IA)', level: 78 },
      { name: 'IA responsable · privacy', level: 82 },
      { name: 'Observability · tracing', level: 74 },
      { name: 'Model versioning / registry', level: 76 },
      { name: 'Pipelines con manifiestos', level: 82 },
      { name: 'Deduplicación (sha256)', level: 85 }
    ]
  },
  {
    id: 'data',
    name: 'Data · Analytics · ELK',
    icon: '🗃️',
    color: '#22c55e',
    overall: 86,
    narrative: 'Python, SQL, ETL, streaming y BI.',
    skills: [
      { name: 'Python', level: 96, hot: true },
      { name: 'Pandas · Polars', level: 92 },
      { name: 'SQL (MySQL, PostgreSQL)', level: 88 },
      { name: 'ETL pipelines', level: 86 },
      { name: 'Apache Kafka · ZooKeeper', level: 80, hot: true },
      { name: 'Elastic Stack (ELK: Elasticsearch, Logstash, Kibana)', level: 82, hot: true },
      { name: 'Dashboards · Visualización', level: 82 },
      { name: 'Microsoft Fabric', level: 74, hot: true },
      { name: 'Microsoft Power BI', level: 76, hot: true },
      { name: 'Business Intelligence', level: 82 },
      { name: 'Análisis de Big Data', level: 76 },
      { name: 'Data science', level: 86 },
      { name: 'Data analyst', level: 86 }
    ]
  },
  {
    id: 'backend',
    name: 'Backend & Web',
    icon: '⚙️',
    color: '#f59e0b',
    overall: 82,
    narrative: 'APIs, microservicios, fullstack.',
    skills: [
      { name: 'Flask', level: 92 },
      { name: 'Django', level: 86 },
      { name: 'FastAPI', level: 84 },
      { name: 'Next.js · React · Vite', level: 84, hot: true },
      { name: 'TypeScript', level: 80 },
      { name: 'Express.js (Node)', level: 74 },
      { name: 'Web Services · REST APIs', level: 88 },
      { name: 'PHP · Laravel', level: 74 },
      { name: 'PrestaShop · WordPress', level: 72 },
      { name: 'ERP (integraciones)', level: 76 }
    ]
  },
  {
    id: 'leadership',
    name: 'Leadership & PM',
    icon: '🎯',
    color: '#ec4899',
    overall: 74,
    narrative: 'Gestión, liderazgo y consultoría.',
    skills: [
      { name: 'Project Management', level: 76 },
      { name: 'PMBOK · Planificación · Scheduling', level: 74 },
      { name: 'Risk Assessment & Mitigation', level: 72 },
      { name: 'Business Ethics', level: 78 },
      { name: 'Team leadership · Motivation', level: 78 },
      { name: 'Dirección de equipos', level: 76 },
      { name: 'Trabajo en equipo', level: 86 },
      { name: 'Consultoría', level: 82 },
      { name: 'Desarrollo personal · Autoestima', level: 78 }
    ]
  }
]
