import { primaryCorrect, type Question } from '@lib/quiz/types'

export function FeedbackBanner({ question, ok, repaso = false }: { question: Question; ok: boolean; repaso?: boolean }) {
  const tailored = repaso ? question.explanationCorrect : ok ? question.explanationCorrect : question.explanationWrong
  const positive = ok || repaso
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-3 flex items-start gap-2 rounded-2xl border p-3 text-sm ${
        positive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-rose-200 bg-rose-50 text-rose-900'
      }`}
    >
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`}>
        {positive ? '✓' : '✕'}
      </span>
      <span className="flex-1">
        {repaso ? (
          <>Respuesta correcta: <strong>{primaryCorrect(question)}</strong>.</>
        ) : (
          <>
            <strong className="font-semibold">{ok ? '¡Correcto!' : 'Respuesta incorrecta.'}</strong>{' '}
            {!ok && (
              <>La respuesta correcta es <strong>{primaryCorrect(question)}</strong>.</>
            )}
          </>
        )}
        {tailored && (
          <span className="mt-2 block text-[13px] leading-relaxed opacity-90">
            <strong className="font-semibold">Explicación:</strong> {tailored}
          </span>
        )}
        {question.evidence && (
          <span className="mt-2 block text-[13px] leading-relaxed opacity-90">
            <strong className="font-semibold">¿Por qué?</strong> {question.evidence}
          </span>
        )}
      </span>
    </div>
  )
}
