'use client'

import { isCorrect, type ChoiceQuestion } from '@lib/quiz/types'
import { AnswerOption, type OptionState } from './AnswerOption'
import { ContextBox } from './ContextBox'
import { FeedbackBanner } from './FeedbackBanner'
import { AiHelpButton } from './AiHelpButton'

type Props = {
  question: ChoiceQuestion
  chosen?: number
  accent: string
  onPick: (index: number) => void
}

function stateFor(question: ChoiceQuestion, optionIndex: number, chosen?: number): OptionState {
  if (chosen === undefined) return 'idle'
  const userOk = isCorrect(question, chosen)
  if (optionIndex === chosen) return userOk ? 'correct' : 'wrong'
  if (!userOk && isCorrect(question, optionIndex)) return 'reveal'
  return 'idle'
}

export function ChoiceQuestionCard({ question, chosen, accent, onPick }: Props) {
  const answered = chosen !== undefined
  const ok = answered && isCorrect(question, chosen)

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {question.context && <ContextBox text={question.context} />}
      <div className="flex items-start gap-3">
        <h2 className="flex-1 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">{question.q}</h2>
        <AiHelpButton question={question} accent={accent} />
      </div>
      {question.code && (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[12px] leading-relaxed text-slate-100">
{question.code}
        </pre>
      )}
      <ul className="mt-4 flex flex-col gap-2.5">
        {question.options.map((opt, i) => (
          <li key={i}>
            <AnswerOption
              index={i}
              text={opt}
              state={stateFor(question, i, chosen)}
              onPick={onPick}
              disabled={answered}
              accent={accent}
            />
          </li>
        ))}
      </ul>
      {answered && <FeedbackBanner question={question} ok={ok} />}
    </article>
  )
}
