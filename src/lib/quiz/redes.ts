import 'server-only'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  redesConceptManifestSchema,
  redesTemarioManifestSchema,
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

export function getRedesModeSummary(): SubjectModeSummary {
  const temario = getRedesTemarioManifest()
  const concepts = getRedesConceptManifest()
  const temarioQuizCount = temario.topics.reduce((sum, topic) => sum + topic.quizzes.length, 0)
  const temarioQuestionCount = temario.topics.reduce(
    (sum, topic) => sum + topic.quizzes.reduce((inner, quiz) => inner + quiz.questionCount, 0),
    0
  )
  return {
    autoevaluacionCount: 0,
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
