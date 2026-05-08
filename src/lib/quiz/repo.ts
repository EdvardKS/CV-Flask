import 'server-only'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { getQuizDb } from './db'
import { quizSeedDir } from './paths'
import { questionsSchema, subjectMetaSchema, type Question, type SubjectMeta, type SubjectWithCount } from './types'

type SubjectRow = SubjectMeta & {
  question_count: number
  cuatrimestres_csv: string | null
  curso: number | null
  entry_mode: 'standard' | 'hub' | null
}

type QuestionRow = {
  q: string
  kind: string
  options_json: string
  correct_json: string
  accept_json: string | null
  cuatrimestre: number | null
  context: string | null
  code: string | null
  is_vocab: number
  category: string | null
}

type LegacyExamQuestion = {
  id: number
  pregunta: string
  respuestas: Array<{ letra: string; texto: string }>
  correcta: string
}

function readSubjectMetasFromSeed(): SubjectMeta[] {
  try {
    const file = path.join(quizSeedDir(), '_subjects.json')
    const raw = JSON.parse(readFileSync(file, 'utf8'))
    if (!Array.isArray(raw)) return []
    return raw.map((subject, index) => subjectMetaSchema.parse({
      ...(subject as SubjectMeta),
      position: (subject as SubjectMeta).position ?? index
    }))
  } catch {
    return []
  }
}

function readQuestionsFromSeed(subjectId: string): Question[] {
  try {
    const file = path.join(quizSeedDir(), `${subjectId}.json`)
    const raw = JSON.parse(readFileSync(file, 'utf8'))
    return questionsSchema.parse(raw)
  } catch {
    return []
  }
}

function readEnglishLatestTest(): Question[] {
  try {
    const file = path.join(process.cwd(), 'temp', 'english', 'testexam.json')
    const raw = JSON.parse(readFileSync(file, 'utf8')) as LegacyExamQuestion[]
    return raw.map(item => {
      const options = item.respuestas.map(answer => answer.texto)
      const correctIndex = item.respuestas.findIndex(answer => answer.letra.toLowerCase() === item.correcta.toLowerCase())
      return {
        kind: 'choice' as const,
        q: item.pregunta,
        options,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        group: 'latest-test'
      }
    })
  } catch {
    return []
  }
}

function parseCuatris(csv: string | null): number[] {
  if (!csv) return []
  return Array.from(new Set(csv.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n)))).sort()
}

function inferCuatris(questions: Question[]): number[] {
  return Array.from(new Set(questions.map(q => q.cuatrimestre ?? 1))).sort((a, b) => a - b)
}

export function listSubjects(): SubjectWithCount[] {
  const db = getQuizDb()
  const rows = db.prepare(`
    SELECT s.id, s.name, s.description, s.icon, s.color, s.position, s.curso, s.entry_mode,
           (SELECT COUNT(*) FROM quiz_questions q WHERE q.subject_id=s.id) AS question_count,
           (SELECT GROUP_CONCAT(DISTINCT IFNULL(cuatrimestre, 1))
              FROM quiz_questions q WHERE q.subject_id=s.id) AS cuatrimestres_csv
    FROM quiz_subjects s
    ORDER BY s.curso ASC, s.position ASC, s.name ASC
  `).all() as SubjectRow[]

  if (rows.length === 0) {
    return readSubjectMetasFromSeed().map(subject => {
      const questions = readQuestionsFromSeed(subject.id)
      return {
        ...subject,
        entryMode: subject.entryMode ?? 'standard',
        questionCount: questions.length,
        cuatrimestres: inferCuatris(questions)
      }
    })
  }

  return rows.map(row => {
    const fallbackQuestions = row.question_count === 0 ? readQuestionsFromSeed(row.id) : null
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      icon: row.icon ?? 'ðŸ“',
      color: row.color ?? '#3a6ea5',
      position: row.position ?? 0,
      curso: row.curso ?? undefined,
      entryMode: row.entry_mode ?? 'standard',
      questionCount: row.question_count || fallbackQuestions?.length || 0,
      cuatrimestres: row.cuatrimestres_csv ? parseCuatris(row.cuatrimestres_csv) : inferCuatris(fallbackQuestions ?? [])
    }
  })
}

export function getSubject(id: string): SubjectWithCount | null {
  return listSubjects().find(subject => subject.id === id) ?? null
}

function rowToQuestion(row: QuestionRow): Question {
  const base = {
    q: row.q,
    cuatrimestre: row.cuatrimestre ?? undefined,
    context: row.context ?? undefined,
    code: row.code ?? undefined,
    isVocab: !!row.is_vocab,
    category: row.category ?? undefined
  }
  if (row.kind === 'fill') {
    return { ...base, kind: 'fill', accept: JSON.parse(row.accept_json ?? '""') }
  }
  return {
    ...base,
    kind: 'choice',
    options: JSON.parse(row.options_json) as string[],
    correctIndex: JSON.parse(row.correct_json)
  }
}

export function listQuestions(subjectId: string): Question[] {
  const db = getQuizDb()
  const rows = db.prepare(`SELECT q, kind, options_json, correct_json, accept_json,
      cuatrimestre, context, code, is_vocab, category
    FROM quiz_questions WHERE subject_id=? ORDER BY position ASC`).all(subjectId) as QuestionRow[]
  const baseQuestions = rows.length === 0 ? readQuestionsFromSeed(subjectId) : rows.map(rowToQuestion)
  if (subjectId !== 'ingles') return baseQuestions
  return [...baseQuestions, ...readEnglishLatestTest()]
}

export type SaveResultInput = {
  subjectId: string
  clientId: string
  correct: number
  incorrect: number
  unanswered: number
  total: number
  durationSeconds: number
}

export function saveResult(input: SaveResultInput): number {
  const db = getQuizDb()
  const pct = input.total ? Math.round((input.correct / input.total) * 100) : 0
  const r = db.prepare(`INSERT INTO quiz_results
    (subject_id,client_id,score_pct,correct,incorrect,unanswered,total,duration_seconds,finished_at)
    VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(
      input.subjectId,
      input.clientId,
      pct,
      input.correct,
      input.incorrect,
      input.unanswered,
      input.total,
      input.durationSeconds,
      Date.now()
    )
  return Number(r.lastInsertRowid)
}

export function recentResults(clientId: string, limit = 10) {
  const db = getQuizDb()
  return db.prepare(`SELECT subject_id AS subjectId, score_pct AS scorePct, correct, total,
    duration_seconds AS durationSeconds, finished_at AS finishedAt
    FROM quiz_results WHERE client_id=? ORDER BY finished_at DESC LIMIT ?`)
    .all(clientId, limit) as Array<{
      subjectId: string
      scorePct: number
      correct: number
      total: number
      durationSeconds: number
      finishedAt: number
    }>
}
