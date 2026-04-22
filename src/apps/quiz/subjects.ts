export type QuizSubject = {
  id: string
  name: string
  description: string
  icon: string
  file: string
  color: string
}

export const SUBJECTS: QuizSubject[] = [
  {
    id: 'estructura',
    name: 'Estructura de Computadores',
    description: 'ECSO — arquitectura, MIPS, memoria, periféricos.',
    icon: '🧮',
    file: '/data/quiz/estructura.json',
    color: '#3a6ea5'
  },
  {
    id: 'sistemas-operativos',
    name: 'Administración de SSOO',
    description: 'Gestión de procesos, memoria, planificación, E/S.',
    icon: '⚙️',
    file: '/data/quiz/sistemas-operativos.json',
    color: '#2e7d32'
  },
  {
    id: 'ssoo-avanzados',
    name: 'SSOO Avanzados',
    description: 'Hyper-threading, MIMD, hebras, sincronización.',
    icon: '🧠',
    file: '/data/quiz/ssoo-avanzados.json',
    color: '#6a1b9a'
  },
  {
    id: 'ingles',
    name: 'Inglés B2',
    description: 'Gramática, condicionales, vocabulario, phrasal verbs.',
    icon: '🇬🇧',
    file: '/data/quiz/ingles.json',
    color: '#c62828'
  }
]
