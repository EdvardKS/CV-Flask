'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/build/pdf.mjs'
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type { SlideConceptDeck } from '@lib/quiz/types'
import { AiHelpButton } from '../AiHelpButton'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

type Props = {
  deck: SlideConceptDeck
  accent: string
}

export function PdfConceptViewer({ deck, accent }: Props) {
  const [index, setIndex] = useState(0)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const slide = deck.slides[index]

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    getDocument(deck.pdfUrl).promise
      .then(doc => {
        if (cancelled) {
          void doc.destroy()
          return
        }
        setPdf(doc)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [deck.pdfUrl])

  useEffect(() => {
    let cancelled = false
    async function render() {
      if (!pdf || !canvasRef.current) return
      const page = await pdf.getPage(slide.page)
      const viewport = page.getViewport({ scale: 1.3 })
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      const task = page.render({ canvasContext: context, viewport })
      await task.promise
      if (cancelled) task.cancel()
    }
    void render()
    return () => {
      cancelled = true
    }
  }, [pdf, slide.page])

  const canPrev = index > 0
  const canNext = index < deck.slides.length - 1
  const progress = useMemo(() => `${index + 1} / ${deck.slides.length}`, [index, deck.slides.length])

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Concepto</p>
          <h2 className="text-xl font-semibold text-slate-900">{slide.title}</h2>
          <p className="text-sm text-slate-500">Página {slide.page} del PDF · {progress}</p>
        </div>
        <AiHelpButton query={slide.searchText} accent={accent} />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {status === 'error' ? (
          <div className="p-6 text-sm text-rose-600">No se ha podido renderizar el PDF de este tema.</div>
        ) : (
          <div className="relative bg-slate-50 p-3 sm:p-5">
            {status === 'loading' && <div className="mb-3 text-sm text-slate-500">Cargando material...</div>}
            <div className="relative mx-auto w-full max-w-4xl">
              <canvas ref={canvasRef} className="h-auto w-full rounded-2xl border border-slate-200 bg-white" />
              <div className="pointer-events-none absolute inset-0">
                {slide.highlights.map(highlight => (
                  <div
                    key={`${slide.id}-${highlight.label}-${highlight.x}-${highlight.y}`}
                    className="absolute rounded-xl border-2 border-amber-500 bg-amber-300/15 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]"
                    style={{
                      left: `${highlight.x}%`,
                      top: `${highlight.y}%`,
                      width: `${highlight.w}%`,
                      height: `${highlight.h}%`
                    }}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Por qué importa</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">{slide.explanation}</p>
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900 ring-1 ring-amber-200">
          {slide.examRelevance}
        </p>
      </article>

      <nav className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <button
          type="button"
          onClick={() => canPrev && setIndex(index - 1)}
          disabled={!canPrev}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          ← Anterior
        </button>
        <div className="flex-1 text-center text-sm font-medium text-slate-500">{progress}</div>
        <button
          type="button"
          onClick={() => canNext && setIndex(index + 1)}
          disabled={!canNext}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          Siguiente →
        </button>
      </nav>
    </section>
  )
}
