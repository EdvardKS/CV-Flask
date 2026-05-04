import 'server-only'
import { getQuizDb } from './db'
import type { Question, SubjectMeta, SubjectWithCount } from './types'

type SubjectRow = SubjectMeta & { question_count?: number }

export function listSubjects(): SubjectWithCount[] {
  const db = getQuizDb()
  const rows = db.prepare(`
    SELECT s.id, s.name, s.description, s.icon, s.color, s.position,
           (SELECT COUNT(*) FROM quiz_questions q WHERE q.subject_id=s.id) AS question_count
    FROM quiz_subjects s
    ORDER BY s.position ASC, s.name ASC
  `).all() as (SubjectRow & { question_count: number })[]
  return rows.map(r => ({
    id: r.id, name: r.name, description: r.description ?? '',
    icon: r.icon ?? '📝', color: r.color ?? '#3a6ea5',
    position: r.position ?? 0, questionCount: r.question_count
  }))
}

export function getSubject(id: string): SubjectWithCount | null {
  const all = listSubjects()
  return all.find(s => s.id === id) ?? null
}

type QuestionRow = {
  q: string; options_json: string; correct_json: string;
  code: string | null; is_vocab: number; category: string | null
}

export function listQuestions(subjectId: string): Question[] {
  const db = getQuizDb()
  const rows = db.prepare(`SELECT q, options_json, correct_json, code, is_vocab, category
    FROM quiz_questions WHERE subject_id=? ORDER BY position ASC`).all(subjectId) as QuestionRow[]
  return rows.map(r => ({
    q: r.q,
    options: JSON.parse(r.options_json) as string[],
    correctIndex: JSON.parse(r.correct_json),
    code: r.code ?? undefined,
    isVocab: !!r.is_vocab,
    category: r.category ?? undefined
  }))
}

export type SaveResultInput = {
  subjectId: string; clientId: string; correct: number
  incorrect: number; unanswered: number; total: number; durationSeconds: number
}

export function saveResult(input: SaveResultInput): number {
  const db = getQuizDb()
  const pct = input.total ? Math.round((input.correct / input.total) * 100) : 0
  const r = db.prepare(`INSERT INTO quiz_results
    (subject_id,client_id,score_pct,correct,incorrect,unanswered,total,duration_seconds,finished_at)
    VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(input.subjectId, input.clientId, pct, input.correct, input.incorrect,
         input.unanswered, input.total, input.durationSeconds, Date.now())
  return Number(r.lastInsertRowid)
}

export function recentResults(clientId: string, limit = 10) {
  const db = getQuizDb()
  return db.prepare(`SELECT subject_id AS subjectId, score_pct AS scorePct, correct, total,
    duration_seconds AS durationSeconds, finished_at AS finishedAt
    FROM quiz_results WHERE client_id=? ORDER BY finished_at DESC LIMIT ?`)
    .all(clientId, limit) as Array<{
      subjectId: string; scorePct: number; correct: number; total: number
      durationSeconds: number; finishedAt: number
    }>
}
