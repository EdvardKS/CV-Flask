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
          className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:text-slate-900 hover:ring-slate-300"
        >
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <h1
        className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
        style={accent ? { color: accent } : undefined}
      >
        {title}
      </h1>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </header>
  )
}
