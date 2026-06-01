'use client'

import { useEffect, useState } from 'react'
import { isCorrect, type ChoiceQuestion } from '@lib/quiz/types'
import { AnswerOption, type OptionState } from './AnswerOption'
import { ContextBox } from './ContextBox'
import { FeedbackBanner } from './FeedbackBanner'
import { AiHelpButton } from './AiHelpButton'

type Props = {
  question: ChoiceQuestion
  chosen?: number
  accent: string
  repaso?: boolean
  onPick: (index: number) => void
}

function stateFor(question: ChoiceQuestion, optionIndex: number, chosen: number | undefined, repaso: boolean): OptionState {
  if (repaso) return isCorrect(question, optionIndex) ? 'correct' : 'idle'
  if (chosen === undefined) return 'idle'
  const userOk = isCorrect(question, chosen)
  if (optionIndex === chosen) return userOk ? 'correct' : 'wrong'
  if (!userOk && isCorrect(question, optionIndex)) return 'reveal'
  return 'idle'
}

export function ChoiceQuestionCard({ question, chosen, accent, repaso = false, onPick }: Props) {
  const answered = chosen !== undefined
  const revealed = answered || repaso
  const ok = answered && isCorrect(question, chosen)
  const [hintOpen, setHintOpen] = useState(false)

  useEffect(() => {
    setHintOpen(false)
  }, [question])

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
      {question.hint && repaso && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong className="font-semibold">Pista:</strong> {question.hint}
        </div>
      )}
      {question.hint && !repaso && !answered && (
        <div className="mt-3">
          {hintOpen ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <strong className="font-semibold">Pista:</strong> {question.hint}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setHintOpen(true)}
              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >💡 Mostrar pista</button>
          )}
        </div>
      )}
      <ul className="mt-4 flex flex-col gap-2.5">
        {question.options.map((opt, i) => (
          <li key={i}>
            <AnswerOption
              index={i}
              text={opt}
              state={stateFor(question, i, chosen, repaso)}
              onPick={repaso ? () => {} : onPick}
              disabled={answered || repaso}
              accent={accent}
            />
          </li>
        ))}
      </ul>
      {revealed && <FeedbackBanner question={question} ok={ok} repaso={repaso} />}
    </article>
  )
}
