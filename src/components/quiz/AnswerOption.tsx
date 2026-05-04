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

export function AnswerOption({ index, text, state, onPick, disabled, accent }: Props) {
  const letter = String.fromCharCode(65 + index)
  return (
    <button
      type="button"
      onClick={() => onPick(index)}
      disabled={disabled}
      aria-pressed={state !== 'idle'}
      className={clsx(
        'group flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left text-[15px] leading-snug shadow-sm transition active:scale-[0.99] sm:p-4',
        'min-h-[56px] disabled:cursor-default disabled:active:scale-100',
        state === 'idle' && 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
        state === 'chosen' && 'text-slate-900',
        state === 'correct' && 'border-emerald-300 bg-emerald-50 text-emerald-900',
        state === 'wrong' && 'border-rose-300 bg-rose-50 text-rose-900',
        state === 'reveal' && 'border-emerald-300 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-200'
      )}
      style={state === 'chosen' ? { borderColor: accent, background: `${accent}10` } : undefined}
    >
      <span
        className={clsx(
          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ring-1',
          state === 'idle' && 'bg-slate-100 text-slate-700 ring-slate-200 group-hover:bg-slate-200',
          state === 'correct' && 'bg-emerald-500 text-white ring-emerald-500',
          state === 'wrong' && 'bg-rose-500 text-white ring-rose-500',
          state === 'reveal' && 'bg-emerald-500 text-white ring-emerald-500'
        )}
        style={state === 'chosen' ? { background: accent, color: '#fff', boxShadow: `0 0 0 1px ${accent}` } : undefined}
        aria-hidden
      >{state === 'correct' || state === 'reveal' ? '✓' : state === 'wrong' ? '✕' : letter}</span>
      <span className="flex-1 whitespace-pre-wrap break-words">{text}</span>
    </button>
  )
}
