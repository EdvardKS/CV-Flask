'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Question } from '@lib/quiz/types'
import { shuffled } from './shuffle'

export type SessionState = {
  subjectId: string
  seed: number
  questions: Question[]
  answers: Record<number, number>
  currentIndex: number
  startedAt: number
  finishedAt: number | null
}

const VERSION = 2
const key = (id: string) => `quiz:v${VERSION}:${id}`

function load(id: string): SessionState | null {
  if (typeof localStorage === 'undefined') return null
  try { const raw = localStorage.getItem(key(id)); return raw ? JSON.parse(raw) as SessionState : null }
  catch { return null }
}
function save(s: SessionState) { try { localStorage.setItem(key(s.subjectId), JSON.stringify(s)) } catch {} }
function clear(id: string) { try { localStorage.removeItem(key(id)) } catch {} }

export function useQuizSession(subjectId: string, source: Question[]) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const existing = load(subjectId)
    if (existing && existing.questions.length > 0 && !existing.finishedAt) setSession(existing)
    setHydrated(true)
  }, [subjectId])

  const start = useCallback((opts: { limit?: number } = {}) => {
    const seed = (Date.now() & 0xffffffff) >>> 0
    let qs = shuffled(source, seed)
    if (opts.limit && opts.limit < qs.length) qs = qs.slice(0, opts.limit)
    const next: SessionState = {
      subjectId, seed, questions: qs, answers: {}, currentIndex: 0,
      startedAt: Date.now(), finishedAt: null
    }
    setSession(next); save(next)
  }, [subjectId, source])

  const update = useCallback((fn: (prev: SessionState) => SessionState) => {
    setSession(prev => { if (!prev) return prev; const n = fn(prev); save(n); return n })
  }, [])

  const answer = useCallback((opt: number) => update(p => ({ ...p, answers: { ...p.answers, [p.currentIndex]: opt } })), [update])
  const goto = useCallback((idx: number) => update(p => ({ ...p, currentIndex: Math.max(0, Math.min(p.questions.length - 1, idx)) })), [update])
  const finish = useCallback(() => update(p => ({ ...p, finishedAt: Date.now() })), [update])
  const reset = useCallback(() => { clear(subjectId); setSession(null) }, [subjectId])

  return { session, hydrated, start, answer, goto, finish, reset }
}
