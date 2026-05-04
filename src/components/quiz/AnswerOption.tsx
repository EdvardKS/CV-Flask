'use client'

import clsx from 'clsx'

type Props = {
  index: number
  text: string
  state: 'idle' | 'chosen' | 'correct' | 'wrong'
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
        'group flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left text-[15px] leading-snug transition active:scale-[0.99] sm:p-4',
        'min-h-[56px] disabled:opacity-90 disabled:active:scale-100',
        state === 'idle' && 'border-slate-700 bg-slate-900/60 text-slate-100 hover:border-slate-500 hover:bg-slate-800/80',
        state === 'chosen' && 'text-slate-50',
        state === 'correct' && 'border-emerald-500 bg-emerald-500/15 text-emerald-50',
        state === 'wrong' && 'border-rose-500 bg-rose-500/15 text-rose-50'
      )}
      style={state === 'chosen' ? { borderColor: accent, background: `${accent}26` } : undefined}
    >
      <span
        className={clsx(
          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold',
          state === 'idle' && 'bg-slate-800 text-slate-300 group-hover:bg-slate-700',
          state === 'correct' && 'bg-emerald-500 text-slate-950',
          state === 'wrong' && 'bg-rose-500 text-slate-50'
        )}
        style={state === 'chosen' ? { background: accent, color: '#020617' } : undefined}
        aria-hidden
      >{letter}</span>
      <span className="flex-1 whitespace-pre-wrap break-words">{text}</span>
    </button>
  )
}
