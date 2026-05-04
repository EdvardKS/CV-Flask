import Link from 'next/link'

type Props = {
  title?: string
  subtitle?: string
  back?: { href: string; label: string }
  accent?: string
}

export function QuizHeader({ title = 'Tests', subtitle, back, accent }: Props) {
  return (
    <header className="flex flex-col gap-2">
      {back && (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700 transition hover:text-slate-100 hover:ring-slate-500"
        >
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <h1
          className="text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={accent ? { color: accent } : undefined}
        >
          {title}
        </h1>
        <Link
          href="/"
          className="text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300"
        >
          ← EdvardKS PC
        </Link>
      </div>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </header>
  )
}
