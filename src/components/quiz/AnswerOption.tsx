'use client'

import clsx from 'clsx'

export type OptionState = 'idle' | 'chosen' | 'correct' | 'wrong' | 'reveal'

type Props = {
  index: number
  text: string
  state: OptionState
  onPick: (index: number) => void
  disabled?: boolean
  accent: string
}

/** Opción tipo Moodle: radio + letra + texto, con realce de estado al revelar. */
export function AnswerOption({ index, text, state, onPick, disabled, accent }: Props) {
  const letter = String.fromCharCode(97 + index) // a, b, c…
  const revealed = state === 'correct' || state === 'wrong' || state === 'reveal'
  const selected = state === 'chosen' || state === 'correct' || state === 'wrong'

  return (
    <button
      type="button"
      onClick={() => onPick(index)}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        'group flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-[15px] leading-snug transition',
        'disabled:cursor-default',
        state === 'idle' && 'border-transparent bg-white/70 hover:border-[var(--mq-qbodyBorder)] hover:bg-white',
        state === 'chosen' && 'bg-white',
        state === 'correct' && 'border-[#b7dfb9] bg-[#dff0d8]',
        state === 'wrong' && 'border-[#e4b9b9] bg-[#f2dede]',
        state === 'reveal' && 'border-[#b7dfb9] bg-[#dff0d8]/70'
      )}
      style={state === 'chosen' ? { borderColor: accent, boxShadow: `inset 0 0 0 1px ${accent}` } : undefined}
    >
      <span
        aria-hidden
        className={clsx(
          'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition',
          state === 'idle' && 'border-slate-400',
          state === 'correct' && 'border-[#2f6b2f] bg-[#2f6b2f]',
          state === 'wrong' && 'border-[#a33a3a] bg-[#a33a3a]',
          state === 'reveal' && 'border-[#2f6b2f]'
        )}
        style={state === 'chosen' ? { borderColor: accent, background: accent } : undefined}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        {state === 'reveal' && <span className="h-2 w-2 rounded-full bg-[#2f6b2f]" />}
      </span>

      <span className="font-semibold text-[var(--mq-muted)]">{letter}.</span>
      <span className="flex-1 whitespace-pre-wrap break-words text-[var(--mq-ink)]">{text}</span>

      {revealed && (state === 'correct' || state === 'reveal') && (
        <span aria-hidden className="text-[#2f6b2f]">✓</span>
      )}
      {state === 'wrong' && <span aria-hidden className="text-[#a33a3a]">✕</span>}
    </button>
  )
}
