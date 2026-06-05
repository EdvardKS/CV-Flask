import Link from 'next/link'

type Props = {
  title?: string
  subtitle?: string
  back?: { href: string; label: string }
  /** Color de acento de la asignatura (icono/realce). */
  accent?: string
  /** Emoji/icono de la asignatura, mostrado en chip magenta tipo Moodle. */
  icon?: string
}

export function QuizHeader({ title = 'Tests', subtitle, back, accent, icon }: Props) {
  return (
    <header className="flex flex-col gap-2">
      {back && (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-[var(--mq-link)] hover:underline"
        >
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex items-center gap-3">
        {icon && (
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-2xl ring-1"
            style={{ background: `${accent ?? '#e6007e'}14`, color: accent ?? '#e6007e', borderColor: `${accent ?? '#e6007e'}33` }}
          >
            {icon}
          </span>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--mq-navy)] sm:text-[28px]">
          {title}
        </h1>
      </div>
      {subtitle && <p className="text-sm text-[var(--mq-muted)]">{subtitle}</p>}
    </header>
  )
}
