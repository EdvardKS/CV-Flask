'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { SubjectWithCount } from '@lib/quiz/types'
import { useMotionPreset } from './motion/presets'

const MotionLink = motion(Link)

function cuatriLabel(c?: number): string {
  if (c === 1) return '1er cuatri'
  if (c === 2) return '2º cuatri'
  return 'Anual'
}

export function SubjectCard({ subject }: { subject: SubjectWithCount }) {
  const accent = subject.color || '#3a6ea5'
  const cta = subject.entryMode === 'hub' ? 'Explorar →' : 'Empezar →'
  const m = useMotionPreset()

  return (
    <MotionLink
      href={`/quiz/${subject.id}`}
      prefetch
      layout
      variants={m.item}
      whileHover={m.hover}
      whileTap={m.tap}
      className="group relative flex h-full flex-col gap-2 overflow-hidden rounded-lg border border-[var(--mq-border)] bg-white p-4 shadow-sm transition-[box-shadow,border-color] hover:border-slate-300 hover:shadow-md"
      aria-label={`${subject.entryMode === 'hub' ? 'Explorar' : 'Empezar test de'} ${subject.name}`}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} aria-hidden />
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-2xl ring-1 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${accent}14`, color: accent, borderColor: `${accent}33` }}
          aria-hidden
        >
          {subject.icon}
        </span>
        <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-tight text-[var(--mq-navy)] group-hover:underline">
          {subject.name}
        </h3>
      </div>
      <p className="line-clamp-2 text-[13px] leading-snug text-[var(--mq-muted)]">{subject.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
        {subject.curso !== undefined && (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-[var(--mq-muted)]">{subject.curso}º curso</span>
        )}
        <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-[var(--mq-muted)]">{cuatriLabel(subject.cuatrimestre)}</span>
        <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-[var(--mq-muted)]">{subject.questionCount} preguntas</span>
        <span className="ml-auto font-bold opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" style={{ color: accent }}>{cta}</span>
      </div>
    </MotionLink>
  )
}
