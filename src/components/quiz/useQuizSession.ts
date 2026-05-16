'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Answer, Question } from '@lib/quiz/types'
import { shuffled } from './shuffle'

export type SessionState = {
  subjectId: string
  seed: number
  questions: Question[]
  answers: Record<number, Answer>
  currentIndex: number
  startedAt: number
  finishedAt: number | null
  cuatrimestre?: number | 'all' | 'latest'
}

const VERSION = 4
const key = (id: string) => `quiz:v${VERSION}:${id}`

function load(storageId: string): SessionState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key(storageId))
    return raw ? JSON.parse(raw) as SessionState : null
  } catch {
    return null
  }
}

function save(storageId: string, state: SessionState) {
  try {
    localStorage.setItem(key(storageId), JSON.stringify(state))
  } catch {}
}

function clear(storageId: string) {
  try {
    localStorage.removeItem(key(storageId))
  } catch {}
}

export type StartOpts = { limit?: number; cuatrimestre?: number | 'all' | 'latest' }

export function useQuizSession(subjectId: string, source: Question[], sessionKey = subjectId, preserveOrder = false) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const existing = load(sessionKey)
    if (existing && existing.questions.length > 0 && !existing.finishedAt) setSession(existing)
    else setSession(null)
    setHydrated(true)
  }, [sessionKey])

  const start = useCallback((opts: StartOpts = {}) => {
    const seed = (Date.now() & 0xffffffff) >>> 0
    const filtered = opts.cuatrimestre === 'latest'
      ? source.filter(q => q.group === 'latest-test')
      : !opts.cuatrimestre || opts.cuatrimestre === 'all'
        ? source.filter(q => q.group !== 'latest-test')
        : source.filter(q => q.group !== 'latest-test' && (q.cuatrimestre ?? 1) === opts.cuatrimestre)
    let qs = preserveOrder ? [...filtered] : shuffled(filtered, seed)
    if (opts.limit && opts.limit < qs.length) qs = qs.slice(0, opts.limit)
    const next: SessionState = {
      subjectId,
      seed,
      questions: qs,
      answers: {},
      currentIndex: 0,
      startedAt: Date.now(),
      finishedAt: null,
      cuatrimestre: opts.cuatrimestre
    }
    setSession(next)
    save(sessionKey, next)
  }, [sessionKey, source, subjectId, preserveOrder])

  const update = useCallback((fn: (prev: SessionState) => SessionState) => {
    setSession(prev => {
      if (!prev) return prev
      const next = fn(prev)
      save(sessionKey, next)
      return next
    })
  }, [sessionKey])

  const answer = useCallback(
    (value: Answer) => update(prev => ({ ...prev, answers: { ...prev.answers, [prev.currentIndex]: value } })),
    [update]
  )
  const goto = useCallback(
    (idx: number) => update(prev => ({ ...prev, currentIndex: Math.max(0, Math.min(prev.questions.length - 1, idx)) })),
    [update]
  )
  const finish = useCallback(() => update(prev => ({ ...prev, finishedAt: Date.now() })), [update])
  const reset = useCallback(() => {
    clear(sessionKey)
    setSession(null)
  }, [sessionKey])

  return { session, hydrated, start, answer, goto, finish, reset }
}
