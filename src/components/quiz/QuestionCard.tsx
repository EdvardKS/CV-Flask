import type { Question } from '@lib/quiz/types'
import { AnswerOption } from './AnswerOption'

type Props = {
  question: Question
  chosen?: number
  accent: string
  onPick: (index: number) => void
}

export function QuestionCard({ question, chosen, accent, onPick }: Props) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur sm:p-6">
      <h2 className="text-lg font-semibold leading-snug text-slate-50 sm:text-xl">{question.q}</h2>
      {question.code && (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950/80 p-3 font-mono text-[12px] leading-relaxed text-slate-200 ring-1 ring-slate-800">
{question.code}
        </pre>
      )}
      <ul className="mt-4 flex flex-col gap-2.5">
        {question.options.map((opt, i) => (
          <li key={i}>
            <AnswerOption
              index={i}
              text={opt}
              state={chosen === i ? 'chosen' : 'idle'}
              onPick={onPick}
              accent={accent}
            />
          </li>
        ))}
      </ul>
    </article>
  )
}
