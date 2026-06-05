'use client'

import { useEffect, useState } from 'react'
import { isCorrect, type ChoiceQuestion } from '@lib/quiz/types'
import { AnswerOption, type OptionState } from './AnswerOption'
import { QuestionBody } from './question/QuestionBody'
import { AnswerFeedback } from './question/AnswerFeedback'

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

  useEffect(() => { setHintOpen(false) }, [question])

  return (
    <>
      <QuestionBody question={question} accent={accent} prompt={question.q}>
        {question.hint && repaso && (
          <div className="mb-3 rounded-md border border-[var(--mq-noteBorder)] bg-[var(--mq-noteBg)] px-3 py-2 text-[13px] text-[var(--mq-noteInk)]">
            <strong className="font-semibold">Pista:</strong> {question.hint}
          </div>
        )}
        {question.hint && !repaso && !answered && (
          <div className="mb-3">
            {hintOpen ? (
              <div className="rounded-md border border-[var(--mq-noteBorder)] bg-[var(--mq-noteBg)] px-3 py-2 text-[13px] text-[var(--mq-noteInk)]">
                <strong className="font-semibold">Pista:</strong> {question.hint}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setHintOpen(true)}
                className="rounded border border-[var(--mq-noteBorder)] bg-[var(--mq-noteBg)] px-2.5 py-1 text-[12px] font-semibold text-[var(--mq-noteInk)] hover:brightness-95"
              >💡 Mostrar pista</button>
            )}
          </div>
        )}
        <ul className="flex flex-col gap-1.5">
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
      </QuestionBody>
      {revealed && <AnswerFeedback question={question} ok={ok} repaso={repaso} />}
    </>
  )
}
