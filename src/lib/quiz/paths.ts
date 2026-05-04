import path from 'node:path'

export function quizDbPath(): string {
  return process.env.QUIZ_DB_PATH || path.join(process.cwd(), 'data', 'quiz', 'quiz.db')
}

export function quizSeedDir(): string {
  return process.env.QUIZ_SEED_DIR || path.join(process.cwd(), 'public', 'data', 'quiz')
}

export function quizDbDir(): string {
  return path.dirname(quizDbPath())
}
