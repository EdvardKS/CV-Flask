import { primaryCorrect, type Question } from '@lib/quiz/types'

export function FeedbackBanner({ question, ok }: { question: Question; ok: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-3 flex items-start gap-2 rounded-2xl border p-3 text-sm ${
        ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-rose-200 bg-rose-50 text-rose-900'
      }`}
    >
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>
        {ok ? '✓' : '✕'}
      </span>
      <span className="flex-1">
        <strong className="font-semibold">{ok ? '¡Correcto!' : 'Respuesta incorrecta.'}</strong>{' '}
        {!ok && (
          <>La respuesta correcta es <strong>{primaryCorrect(question)}</strong>.</>
        )}
      </span>
    </div>
  )
}
