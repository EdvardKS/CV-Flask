import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type Database from 'better-sqlite3'
import { quizSeedDir } from './paths'
import { getQuizDb } from './db'
import { questionsSchema, subjectMetaSchema, type Question, type SubjectMeta } from './types'

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

function insertQuestion(db: Database.Database, subjectId: string, q: Question, pos: number) {
  const isChoice = q.kind === 'choice'
  db.prepare(`INSERT INTO quiz_questions
    (subject_id,position,q,kind,options_json,correct_json,accept_json,cuatrimestre,context,code,is_vocab,category)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      subjectId, pos, q.q, q.kind,
      isChoice ? JSON.stringify(q.options) : '[]',
      isChoice ? JSON.stringify(q.correctIndex) : 'null',
      isChoice ? null : JSON.stringify(q.accept),
      q.cuatrimestre ?? null,
      q.context ?? null,
      q.code ?? null,
      q.isVocab ? 1 : 0,
      q.category ?? null
    )
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
    questions.forEach((q, i) => insertQuestion(db, m.id, q, i))
    db.prepare(`INSERT INTO quiz_seed_state(subject_id,file_mtime,seeded_at,question_count)
                VALUES(?,?,?,?)
                ON CONFLICT(subject_id) DO UPDATE SET file_mtime=excluded.file_mtime,
                  seeded_at=excluded.seeded_at, question_count=excluded.question_count`)
      .run(m.id, mtime, Date.now(), questions.length)
  })
  tx()
}

export async function seedQuizDb(): Promise<{ subjects: number; ingested: string[]; errors: { id: string; message: string }[] }> {
  const db = getQuizDb()
  let metas: SubjectMeta[]
  try { metas = await readSubjectMetas() }
  catch (e) {
    console.error('[quiz seed] _subjects.json invalid:', e)
    return { subjects: 0, ingested: [], errors: [{ id: '_subjects.json', message: (e as Error).message }] }
  }
  const ingested: string[] = []
  const errors: { id: string; message: string }[] = []
  for (const m of metas) {
    try {
      upsertSubject(db, m)
      const before = (db.prepare('SELECT file_mtime FROM quiz_seed_state WHERE subject_id=?').get(m.id) as { file_mtime: number } | undefined)?.file_mtime ?? 0
      await ingestSubject(db, m)
      const after = (db.prepare('SELECT file_mtime FROM quiz_seed_state WHERE subject_id=?').get(m.id) as { file_mtime: number } | undefined)?.file_mtime ?? 0
      if (after !== before) ingested.push(m.id)
    } catch (e) {
      console.error(`[quiz seed] subject "${m.id}" failed:`, e)
      errors.push({ id: m.id, message: (e as Error).message })
    }
  }
  return { subjects: metas.length, ingested, errors }
}
