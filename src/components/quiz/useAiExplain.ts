'use client'

import { useCallback, useRef, useState } from 'react'
import type { Question } from '@lib/quiz/types'

type Status = 'idle' | 'streaming' | 'done' | 'error'

export function useAiExplain(subjectName: string) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const abortRef = useRef<AbortController | null>(null)

  const ask = useCallback(async (question: Question, picked?: number) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setText(''); setStatus('streaming')
    try {
      const res = await fetch('/api/quiz/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName,
          question: question.q,
          options: question.options,
          picked: picked ?? null,
          correctIndex: question.correctIndex,
          code: question.code
        }),
        signal: ac.signal
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        setText(prev => prev + decoder.decode(value, { stream: true }))
      }
      setStatus('done')
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setStatus('error')
      setText(t => t + `\n⚠ ${(e as Error).message}`)
    }
  }, [subjectName])

  const stop = useCallback(() => { abortRef.current?.abort(); setStatus('idle') }, [])
  const reset = useCallback(() => { abortRef.current?.abort(); setText(''); setStatus('idle') }, [])

  return { text, status, ask, stop, reset }
}
