import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/** Migas de pan tipo Moodle: ASIGNATURA > Pruebas de conocimiento > Test. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null
  return (
    <nav aria-label="Ruta" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold">
      {items.map((c, i) => {
        const last = i === items.length - 1
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-2">
            {c.href && !last ? (
              <Link href={c.href} className="text-[var(--mq-link)] hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className={last ? 'text-[var(--mq-muted)]' : 'text-[var(--mq-link)]'}>{c.label}</span>
            )}
            {!last && <span aria-hidden className="text-slate-300">›</span>}
          </span>
        )
      })}
    </nav>
  )
}
