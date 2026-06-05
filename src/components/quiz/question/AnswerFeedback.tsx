import { primaryCorrect, type Question } from '@lib/quiz/types'

type Props = {
  question: Question
  /** true = acierto; en modo repaso se trata como informativo (neutro/verde). */
  ok: boolean
  repaso?: boolean
}

/**
 * Caja de feedback tipo Moodle, mostrada debajo del enunciado:
 * - "La respuesta correcta es: X"
 * - badge Correcta / Incorrecta + puntos del envío
 * - explicación (correcta/incorrecta) y "¿Por qué?" (evidencia)
 * Componente reutilizable para el modo test (feedback inmediato), el modo
 * repaso y la revisión de intentos.
 */
export function AnswerFeedback({ question, ok, repaso = false }: Props) {
  const explanation = ok || repaso ? question.explanationCorrect : question.explanationWrong
  const points = repaso ? null : ok ? '1,00/1,00' : '0,00/1,00'

  return (
    <div className="mt-2 rounded-b-lg border-x border-b border-[var(--mq-noteBorder,#f0d9a8)] bg-[var(--mq-noteBg,#fdf3e3)] px-4 py-3 text-[13px] leading-relaxed text-[var(--mq-noteInk,#7a5a1e)]">
      <p>
        La respuesta correcta es: <strong className="text-[var(--mq-ink)]">{primaryCorrect(question)}</strong>
      </p>

      {!repaso && (
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold ${
              ok ? 'bg-[#dff0d8] text-[#2f6b2f]' : 'bg-[#f2dede] text-[#a33a3a]'
            }`}
          >
            {ok ? 'Correcta' : 'Incorrecta'}
          </span>
          {points && <span className="text-[12px]">Puntos para este envío: {points}.</span>}
        </div>
      )}

      {explanation && (
        <p className="mt-2 text-[var(--mq-ink)]">
          <strong className="font-semibold">Explicación:</strong> {explanation}
        </p>
      )}
      {question.evidence && (
        <p className="mt-1.5 text-[var(--mq-ink)]">
          <strong className="font-semibold">¿Por qué?</strong> {question.evidence}
        </p>
      )}
    </div>
  )
}
