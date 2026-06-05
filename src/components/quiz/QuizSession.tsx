'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Question, SubjectWithCount } from '@lib/quiz/types'
import { useQuizSession } from './useQuizSession'
import { StartScreen } from './StartScreen'
import { QuizRunner } from './QuizRunner'
import { ResultsScreen } from './ResultsScreen'
import { AttemptResultView } from './AttemptResultView'
import { getOrCreateClientId } from './clientId'
import { postQuizResult } from './postResult'
import { saveAttempt, type AttemptRecord } from './attempts'

type Props = {
  subject: SubjectWithCount
  questions: Question[]
  sessionKey?: string
  preserveOrder?: boolean
}

export function QuizSession({ subject, questions, sessionKey, preserveOrder }: Props) {
  const { session, hydrated, start, answer, goto, toggleFlag, finish, reset } = useQuizSession(subject.id, questions, sessionKey, preserveOrder)
  const router = useRouter()
  const reportedRef = useRef(false)
  const [review, setReview] = useState<AttemptRecord | null>(null)

  useEffect(() => {
    if (session?.finishedAt && !session.repaso && !reportedRef.current) {
      reportedRef.current = true
      saveAttempt(session)
      postQuizResult(subject, session, getOrCreateClientId())
    }
    if (!session?.finishedAt) reportedRef.current = false
  }, [session, subject])

  if (!hydrated) {
    return <div className="rounded-lg border border-[var(--mq-border)] bg-white p-6 text-sm text-[var(--mq-muted)] shadow-sm">Cargando…</div>
  }

  if (review) {
    return (
      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setReview(null)}
          className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-[var(--mq-link)] hover:underline"
        >← Volver a la configuración</button>
        <h2 className="text-xl font-bold text-[var(--mq-navy)]">Revisión de intento</h2>
        <AttemptResultView
          accent={subject.color}
          correct={review.correct}
          incorrect={review.incorrect}
          unanswered={review.unanswered}
          total={review.total}
          pct={review.pct}
          durationSeconds={review.durationSeconds}
          startedAt={review.finishedAt - review.durationSeconds * 1000}
          finishedAt={review.finishedAt}
          questions={review.questions}
          answers={review.answers}
        />
      </section>
    )
  }

  if (!session) {
    return (
      <StartScreen
        subject={subject}
        questions={questions}
        onStart={(limit, cuatrimestre, categories, repaso) => start({ limit, cuatrimestre, categories, repaso })}
        onReviewAttempt={setReview}
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
      repaso={session.repaso}
      onAnswer={answer}
      onGoto={goto}
      onToggleFlag={toggleFlag}
      onFinish={finish}
      onExit={reset}
    />
  )
}
