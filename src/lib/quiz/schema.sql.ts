export const QUIZ_DDL = `
CREATE TABLE IF NOT EXISTS quiz_subjects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  color       TEXT,
  position    INTEGER DEFAULT 0,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id    TEXT NOT NULL REFERENCES quiz_subjects(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  q             TEXT NOT NULL,
  options_json  TEXT NOT NULL,
  correct_json  TEXT NOT NULL,
  code          TEXT,
  is_vocab      INTEGER DEFAULT 0,
  category      TEXT
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id      TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  score_pct       INTEGER NOT NULL,
  correct         INTEGER NOT NULL,
  incorrect       INTEGER NOT NULL,
  unanswered      INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  finished_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_seed_state (
  subject_id   TEXT PRIMARY KEY,
  file_mtime   INTEGER NOT NULL,
  seeded_at    INTEGER NOT NULL,
  question_count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_subject ON quiz_questions(subject_id, position);
CREATE INDEX IF NOT EXISTS idx_quiz_results_client    ON quiz_results(client_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_subject   ON quiz_results(subject_id, finished_at DESC);
`
