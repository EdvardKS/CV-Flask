import 'server-only'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { QUIZ_DDL } from './schema.sql'
import { quizDbDir, quizDbPath } from './paths'

let _db: Database.Database | null = null

function migrateQuestionsTable(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(quiz_questions)").all() as { name: string }[]
  const has = (n: string) => cols.some(c => c.name === n)
  if (!has('kind'))         db.exec("ALTER TABLE quiz_questions ADD COLUMN kind TEXT NOT NULL DEFAULT 'choice'")
  if (!has('accept_json'))  db.exec("ALTER TABLE quiz_questions ADD COLUMN accept_json TEXT")
  if (!has('cuatrimestre')) db.exec("ALTER TABLE quiz_questions ADD COLUMN cuatrimestre INTEGER")
  if (!has('context'))      db.exec("ALTER TABLE quiz_questions ADD COLUMN context TEXT")
}

function migrateSubjectsTable(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(quiz_subjects)").all() as { name: string }[]
  if (!cols.some(c => c.name === 'curso')) {
    db.exec("ALTER TABLE quiz_subjects ADD COLUMN curso INTEGER")
  }
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
  if (_db) { _db.close(); _db = null }
}
