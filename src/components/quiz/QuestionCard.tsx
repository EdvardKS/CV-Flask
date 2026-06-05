'use client'

import { isCorrect, type Answer, type Question } from '@lib/quiz/types'
import { ChoiceQuestionCard } from './ChoiceQuestionCard'
import { FillQuestionCard } from './FillQuestionCard'
import { QuestionFrame, type QuestionStatus } from './question/QuestionFrame'

type Props = {
  question: Question
  number: number
  chosen?: Answer
  accent: string
  repaso?: boolean
  flagged: boolean
  onToggleFlag: () => void
  onPick: (value: Answer) => void
}

function statusFor(question: Question, chosen: Answer | undefined, repaso: boolean): QuestionStatus {
  if (repaso) return 'review'
  if (chosen === undefined) return 'unanswered'
  return isCorrect(question, chosen) ? 'correct' : 'incorrect'
}

export function QuestionCard({ question, number, chosen, accent, repaso, flagged, onToggleFlag, onPick }: Props) {
  return (
    <QuestionFrame
      number={number}
      status={statusFor(question, chosen, repaso ?? false)}
      flagged={flagged}
      onToggleFlag={onToggleFlag}
    >
      {question.kind === 'fill' ? (
        <FillQuestionCard
          question={question}
          chosen={typeof chosen === 'string' ? chosen : undefined}
          accent={accent}
          repaso={repaso}
          onSubmit={onPick}
        />
      ) : (
        <ChoiceQuestionCard
          question={question}
          chosen={typeof chosen === 'number' ? chosen : undefined}
          accent={accent}
          repaso={repaso}
          onPick={onPick}
        />
      )}
    </QuestionFrame>
  )
}
