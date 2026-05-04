'use client'

import { useEffect } from 'react'

type Status = 'idle' | 'streaming' | 'done' | 'error'

type Props = {
  text: string
  status: Status
  accent: string
  onClose: () => void
  onRetry: () => void
}

export function AiExplainPanel({ text, status, accent, onClose, onRetry }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ayuda de IA"
      className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/30 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: accent }}>🤖</span>
            Ayuda IA
            {status === 'streaming' && <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
          </span>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">✕</button>
        </header>
        <div className="max-h-[55vh] overflow-y-auto px-4 py-4 text-[15px] leading-relaxed text-slate-800">
          {text || (status === 'streaming' ? <span className="text-slate-400">Pensando…</span> : <span className="text-slate-400">Sin respuesta.</span>)}
          {status === 'streaming' && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-slate-700 align-middle" aria-hidden />}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
          {status !== 'streaming' && (
            <button onClick={onRetry} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Reintentar</button>
          )}
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-white shadow-sm" style={{ background: accent }}>Cerrar</button>
        </footer>
      </div>
    </div>
  )
}
