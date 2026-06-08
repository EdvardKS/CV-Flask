import 'server-only'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { QUIZ_DDL } from './schema.sql'
import { quizDbDir, quizDbPath } from './paths'

let _db: Database.Database | null = null

function migrateQuestionsTable(db: Database.Database) {
  const cols = db.prepare('PRAGMA table_info(quiz_questions)').all() as { name: string }[]
  const has = (name: string) => cols.some(col => col.name === name)
  if (!has('kind')) db.exec("ALTER TABLE quiz_questions ADD COLUMN kind TEXT NOT NULL DEFAULT 'choice'")
  if (!has('accept_json')) db.exec('ALTER TABLE quiz_questions ADD COLUMN accept_json TEXT')
  if (!has('cuatrimestre')) db.exec('ALTER TABLE quiz_questions ADD COLUMN cuatrimestre INTEGER')
  if (!has('context')) db.exec('ALTER TABLE quiz_questions ADD COLUMN context TEXT')
  if (!has('evidence')) db.exec('ALTER TABLE quiz_questions ADD COLUMN evidence TEXT')
  if (!has('hint')) db.exec('ALTER TABLE quiz_questions ADD COLUMN hint TEXT')
  if (!has('explanation_correct')) db.exec('ALTER TABLE quiz_questions ADD COLUMN explanation_correct TEXT')
  if (!has('explanation_wrong')) db.exec('ALTER TABLE quiz_questions ADD COLUMN explanation_wrong TEXT')
  if (!has('group_name')) db.exec('ALTER TABLE quiz_questions ADD COLUMN group_name TEXT')
  if (!has('image')) db.exec('ALTER TABLE quiz_questions ADD COLUMN image TEXT')
}

function migrateSubjectsTable(db: Database.Database) {
  const cols = db.prepare('PRAGMA table_info(quiz_subjects)').all() as { name: string }[]
  const has = (name: string) => cols.some(col => col.name === name)
  if (!has('code')) db.exec('ALTER TABLE quiz_subjects ADD COLUMN code TEXT')
  if (!has('curso')) db.exec('ALTER TABLE quiz_subjects ADD COLUMN curso INTEGER')
  if (!has('cuatrimestre')) db.exec('ALTER TABLE quiz_subjects ADD COLUMN cuatrimestre INTEGER')
  if (!has('entry_mode')) db.exec("ALTER TABLE quiz_subjects ADD COLUMN entry_mode TEXT NOT NULL DEFAULT 'standard'")
  if (!has('materials_json')) db.exec('ALTER TABLE quiz_subjects ADD COLUMN materials_json TEXT')
}

export function getQuizDb(): Database.Database {
  if (_db) return _db
  mkdirSync(quizDbDir(), { recursive: true })
  const db = new Database(quizDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(QUIZ_DDL)
  migrateQuestionsTable(db)
  migrateSubjectsTable(db)
  _db = db
  return db
}

export function closeQuizDb(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}
