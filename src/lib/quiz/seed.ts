import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type Database from 'better-sqlite3'
import { quizSeedDir } from './paths'
import { getQuizDb } from './db'
import { questionsSchema, subjectMetaSchema, type SubjectMeta } from './types'

async function readSubjectMetas(): Promise<SubjectMeta[]> {
  const file = path.join(quizSeedDir(), '_subjects.json')
  const raw = await fs.readFile(file, 'utf8')
  const arr = JSON.parse(raw)
  return arr.map((m: unknown, i: number) => ({ ...subjectMetaSchema.parse(m), position: (m as SubjectMeta).position ?? i }))
}

async function fileMtime(p: string): Promise<number> {
  try { return Math.floor((await fs.stat(p)).mtimeMs) } catch { return 0 }
}

function upsertSubject(db: Database.Database, m: SubjectMeta) {
  db.prepare(`INSERT INTO quiz_subjects(id,name,description,icon,color,position,updated_at)
              VALUES(@id,@name,@description,@icon,@color,@position,@updated_at)
              ON CONFLICT(id) DO UPDATE SET
                name=excluded.name, description=excluded.description,
                icon=excluded.icon, color=excluded.color,
                position=excluded.position, updated_at=excluded.updated_at`)
    .run({ ...m, position: m.position ?? 0, updated_at: Date.now() })
}

async function ingestSubject(db: Database.Database, m: SubjectMeta) {
  const file = path.join(quizSeedDir(), `${m.id}.json`)
  const mtime = await fileMtime(file)
  if (!mtime) return
  const state = db.prepare('SELECT file_mtime FROM quiz_seed_state WHERE subject_id=?').get(m.id) as { file_mtime: number } | undefined
  if (state && state.file_mtime === mtime) return
  const raw = await fs.readFile(file, 'utf8')
  const questions = questionsSchema.parse(JSON.parse(raw))
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM quiz_questions WHERE subject_id=?').run(m.id)
    const ins = db.prepare(`INSERT INTO quiz_questions
      (subject_id,position,q,options_json,correct_json,code,is_vocab,category)
      VALUES(?,?,?,?,?,?,?,?)`)
    questions.forEach((q, i) => ins.run(m.id, i, q.q, JSON.stringify(q.options), JSON.stringify(q.correctIndex), q.code ?? null, q.isVocab ? 1 : 0, q.category ?? null))
    db.prepare(`INSERT INTO quiz_seed_state(subject_id,file_mtime,seeded_at,question_count)
                VALUES(?,?,?,?)
                ON CONFLICT(subject_id) DO UPDATE SET file_mtime=excluded.file_mtime,
                  seeded_at=excluded.seeded_at, question_count=excluded.question_count`)
      .run(m.id, mtime, Date.now(), questions.length)
  })
  tx()
}

export async function seedQuizDb(): Promise<{ subjects: number; ingested: string[] }> {
  const db = getQuizDb()
  const metas = await readSubjectMetas()
  const ingested: string[] = []
  for (const m of metas) {
    upsertSubject(db, m)
    const before = (db.prepare('SELECT file_mtime FROM quiz_seed_state WHERE subject_id=?').get(m.id) as { file_mtime: number } | undefined)?.file_mtime ?? 0
    await ingestSubject(db, m)
    const after = (db.prepare('SELECT file_mtime FROM quiz_seed_state WHERE subject_id=?').get(m.id) as { file_mtime: number } | undefined)?.file_mtime ?? 0
    if (after !== before) ingested.push(m.id)
  }
  return { subjects: metas.length, ingested }
}
