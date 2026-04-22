'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { questionsSchema, shuffled, type Question } from '../schema'
import type { QuizSubject } from '../subjects'

export type SessionState = {
  subjectId: string
  seed: number
  questions: Question[]
  answers: Record<number, number>  // index -> chosen option
  currentIndex: number
  finishedAt: number | null
  startedAt: number
}

const VERSION = 1
const storageKey = (subjectId: string) => `os:quiz:v${VERSION}:${subjectId}`

function loadSession(subjectId: string): SessionState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(subjectId))
    return raw ? (JSON.parse(raw) as SessionState) : null
  } catch { return null }
}

function saveSession(state: SessionState) {
  try { localStorage.setItem(storageKey(state.subjectId), JSON.stringify(state)) } catch {}
}

function clearSession(subjectId: string) {
  try { localStorage.removeItem(storageKey(subjectId)) } catch {}
}

export function useQuizSession(subject: QuizSubject | null) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const persistRef = useRef<SessionState | null>(null)

  useEffect(() => {
    if (!subject) { setSession(null); return }
    const existing = loadSession(subject.id)
    if (existing && existing.questions.length > 0 && !existing.finishedAt) {
      setSession(existing)
      persistRef.current = existing
    } else {
      setSession(null)
    }
  }, [subject])

  const start = useCallback(async (opts: { shuffle: boolean; limit?: number } = { shuffle: true }) => {
    if (!subject) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(subject.file)
      const json = await res.json()
      const parsed = questionsSchema.parse(json)
      const seed = Date.now() & 0xffffffff
      let qs = opts.shuffle ? shuffled(parsed, seed) : parsed
      if (opts.limit) qs = qs.slice(0, opts.limit)
      const state: SessionState = {
        subjectId: subject.id,
        seed,
        questions: qs,
        answers: {},
        currentIndex: 0,
        finishedAt: null,
        startedAt: Date.now()
      }
      setSession(state)
      persistRef.current = state
      saveSession(state)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [subject])

  const answer = useCallback((optionIndex: number) => {
    setSession(prev => {
      if (!prev) return prev
      const next = { ...prev, answers: { ...prev.answers, [prev.currentIndex]: optionIndex } }
      saveSession(next)
      return next
    })
  }, [])

  const goto = useCallback((index: number) => {
    setSession(prev => {
      if (!prev) return prev
      const idx = Math.max(0, Math.min(prev.questions.length - 1, index))
      const next = { ...prev, currentIndex: idx }
      saveSession(next)
      return next
    })
  }, [])

  const finish = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev
      const next = { ...prev, finishedAt: Date.now() }
      saveSession(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    if (!subject) return
    clearSession(subject.id)
    setSession(null)
  }, [subject])

  return { session, loading, error, start, answer, goto, finish, reset }
}
