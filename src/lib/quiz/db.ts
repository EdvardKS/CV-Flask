import 'server-only'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { QUIZ_DDL } from './schema.sql'
import { quizDbDir, quizDbPath } from './paths'

let _db: Database.Database | null = null

export function getQuizDb(): Database.Database {
  if (_db) return _db
  mkdirSync(quizDbDir(), { recursive: true })
  const db = new Database(quizDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(QUIZ_DDL)
  _db = db
  return db
}

export function closeQuizDb(): void {
  if (_db) { _db.close(); _db = null }
}
