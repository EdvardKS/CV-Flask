'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Question, SubjectWithCount } from '@lib/quiz/types'
import { useQuizSession } from './useQuizSession'
import { StartScreen } from './StartScreen'
import { QuizRunner } from './QuizRunner'
import { ResultsScreen } from './ResultsScreen'
import { getOrCreateClientId } from './clientId'
import { postQuizResult } from './postResult'

export function QuizSession({ subject, questions }: { subject: SubjectWithCount; questions: Question[] }) {
  const { session, hydrated, start, answer, goto, finish, reset } = useQuizSession(subject.id, questions)
  const router = useRouter()
  const reportedRef = useRef(false)

  useEffect(() => {
    if (session?.finishedAt && !reportedRef.current) {
      reportedRef.current = true
      postQuizResult(subject, session, getOrCreateClientId())
    }
    if (!session?.finishedAt) reportedRef.current = false
  }, [session, subject])

  if (!hydrated) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Cargando…</div>
  }

  if (!session) {
    return (
      <StartScreen
        subject={subject}
        questions={questions}
        hasResume={false}
        onStart={(limit, cuatrimestre) => start({ limit, cuatrimestre })}
        onResume={() => { /* no-op */ }}
      />
    )
  }

  if (session.finishedAt) {
    return (
      <ResultsScreen
        session={session}
        accent={subject.color}
        onRetry={() => reset()}
        onPickAnother={() => router.push('/quiz')}
      />
    )
  }

  return (
    <QuizRunner
      session={session}
      accent={subject.color}
      onAnswer={answer}
      onGoto={goto}
      onFinish={finish}
    />
  )
}
