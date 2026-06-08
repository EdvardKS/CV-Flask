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

function fallbackCode(subject: SubjectWithCount): string {
  if (subject.code) return subject.code
  if (subject.icon) return subject.icon
  return subject.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}

function displayDescription(subject: SubjectWithCount): string {
  if (!subject.code) return subject.description
  return subject.description.replace(new RegExp(`^${subject.code}\\s*-\\s*`, 'i'), '')
}

export function SubjectCard({ subject }: { subject: SubjectWithCount }) {
  const accent = subject.color || '#3a6ea5'
  const cta = subject.entryMode === 'hub' ? 'Explorar →' : 'Empezar →'
  const code = fallbackCode(subject)
  const description = displayDescription(subject)
  const m = useMotionPreset()

  return (
    <MotionLink
      href={`/quiz/${subject.id}`}
      prefetch
      layout
      variants={m.item}
      whileHover={m.hover}
      whileTap={m.tap}
      className="group relative flex h-full min-h-[142px] flex-col gap-3 overflow-hidden rounded-md border border-[var(--mq-border)] bg-[var(--mq-surface)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[box-shadow,border-color,transform] hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
      aria-label={`${subject.entryMode === 'hub' ? 'Explorar' : 'Empezar test de'} ${subject.name}`}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} aria-hidden />
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 min-w-11 shrink-0 place-items-center rounded-md px-2 text-[13px] font-extrabold ring-1 transition-transform duration-300 group-hover:scale-[1.04]"
          style={{ background: `${accent}12`, color: accent, borderColor: `${accent}33` }}
          aria-hidden
        >
          {code}
        </span>
        <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-tight text-[var(--mq-navy)] group-hover:underline">
          {subject.name}
        </h3>
      </div>
      <p className="line-clamp-2 text-[13px] leading-snug text-[var(--mq-muted)]">{description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
        {subject.curso !== undefined && (
          <span className="rounded bg-[var(--mq-page)] px-2 py-0.5 font-semibold text-[var(--mq-muted)]">{subject.curso}º curso</span>
        )}
        <span className="rounded bg-[var(--mq-page)] px-2 py-0.5 font-semibold text-[var(--mq-muted)]">{cuatriLabel(subject.cuatrimestre)}</span>
        <span className="rounded bg-[var(--mq-page)] px-2 py-0.5 font-semibold text-[var(--mq-muted)]">{subject.questionCount} preguntas</span>
        <span className="ml-auto font-bold opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" style={{ color: accent }}>{cta}</span>
      </div>
    </MotionLink>
  )
}
