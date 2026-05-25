import 'server-only'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  redesAutoevalManifestSchema,
  redesConceptManifestSchema,
  redesTemarioManifestSchema,
  type Question,
  type RedesAutoevalManifest,
  type RedesConceptManifest,
  type RedesTemarioManifest,
  type SlideConceptDeck,
  type SubjectModeSummary,
  type TemarioQuiz
} from './types'

const redesDir = path.join(process.cwd(), 'public', 'data', 'quiz', 'redes')

function readJson<T>(filename: string, parse: (raw: unknown) => T): T {
  const file = path.join(redesDir, filename)
  const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown
  return parse(raw)
}

export function getRedesTemarioManifest(): RedesTemarioManifest {
  return readJson('temario.json', raw => redesTemarioManifestSchema.parse(raw))
}

export function getRedesConceptManifest(): RedesConceptManifest {
  return readJson('concepts.json', raw => redesConceptManifestSchema.parse(raw))
}

export function getRedesAutoevalManifest(): RedesAutoevalManifest {
  return readJson('autoevaluacion.json', raw => redesAutoevalManifestSchema.parse(raw))
}

export function getRedesAutoevalQuestions(topicIds: string[]): Question[] {
  const manifest = getRedesAutoevalManifest()
  if (topicIds.length === 0) return []
  const set = new Set(topicIds)
  return manifest.questions.filter(q => q.category && set.has(q.category))
}

export function getRedesTemarioQuestionsByTopics(topicIds: string[]): Question[] {
  const manifest = getRedesTemarioManifest()
  if (topicIds.length === 0) return []
  const set = new Set(topicIds)
  const out: Question[] = []
  for (const topic of manifest.topics) {
    if (!set.has(topic.id)) continue
    for (const quiz of topic.quizzes) out.push(...quiz.questions)
  }
  return out
}

export function getRedesModeSummary(): SubjectModeSummary {
  const temario = getRedesTemarioManifest()
  const concepts = getRedesConceptManifest()
  const autoeval = getRedesAutoevalManifest()
  const temarioQuizCount = temario.topics.reduce((sum, topic) => sum + topic.quizzes.length, 0)
  const temarioQuestionCount = temario.topics.reduce(
    (sum, topic) => sum + topic.quizzes.reduce((inner, quiz) => inner + quiz.questionCount, 0),
    0
  )
  return {
    autoevaluacionCount: autoeval.questions.length,
    temarioQuizCount,
    temarioQuestionCount,
    conceptTopicCount: concepts.topics.length
  }
}

export function getRedesQuizById(quizId: string): TemarioQuiz | null {
  const manifest = getRedesTemarioManifest()
  for (const topic of manifest.topics) {
    const quiz = topic.quizzes.find(item => item.id === quizId)
    if (quiz) return quiz
  }
  return null
}

export function getRedesConceptTopic(topicId: string): SlideConceptDeck | null {
  const manifest = getRedesConceptManifest()
  return manifest.topics.find(topic => topic.id === topicId) ?? null
}
