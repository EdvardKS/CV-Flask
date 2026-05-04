'use client'

import type { Answer, Question } from '@lib/quiz/types'
import { ChoiceQuestionCard } from './ChoiceQuestionCard'
import { FillQuestionCard } from './FillQuestionCard'

type Props = {
  question: Question
  chosen?: Answer
  accent: string
  onPick: (value: Answer) => void
}

export function QuestionCard({ question, chosen, accent, onPick }: Props) {
  if (question.kind === 'fill') {
    return (
      <FillQuestionCard
        question={question}
        chosen={typeof chosen === 'string' ? chosen : undefined}
        accent={accent}
        onSubmit={onPick}
      />
    )
  }
  return (
    <ChoiceQuestionCard
      question={question}
      chosen={typeof chosen === 'number' ? chosen : undefined}
      accent={accent}
      onPick={onPick}
    />
  )
}
