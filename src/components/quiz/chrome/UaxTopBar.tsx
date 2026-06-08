'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Portal Universitario', href: '/' },
  { label: 'Área personal', href: '/quiz/area-personal' },
  { label: 'Mis asignaturas', href: '/quiz' },
  { label: 'Conoce IAEKS.com', href: 'https://iaeks.com', external: true }
] as const

/**
 * Barra superior tipo aula virtual UAX, pero con la marca propia (Edvard K.).
 * Persistente en todas las páginas de /quiz para reproducir el "chrome" del Moodle.
 */
export function UaxTopBar() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--mq-border)] bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="flex h-[52px] w-full items-center gap-3 px-3 sm:gap-5 sm:px-6 lg:px-8">
        <Link href="/quiz" className="flex shrink-0 items-center gap-2" aria-label="Inicio de tests">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/photos/eks-logo.png"
            alt="Edvard K."
            className="h-8 w-auto"
            width={36}
            height={36}
          />
          <span className="hidden text-sm font-extrabold text-[var(--mq-navy)] sm:inline">
            Aula Virtual
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 text-sm font-semibold md:flex" aria-label="Principal">
          {NAV.map(item => {
            if ('external' in item && item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-[var(--mq-link)] transition-colors hover:bg-[var(--mq-page)] hover:text-[var(--mq-navy)]"
                >
                  {item.label}<span aria-hidden className="text-[11px]">↗</span>
                </a>
              )
            }
            const active = item.href === '/quiz'
              ? pathname === '/quiz' || pathname.startsWith('/quiz/') && !pathname.startsWith('/quiz/area-personal')
              : item.href !== '/' && pathname.startsWith(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={active
                  ? 'rounded-md bg-[var(--mq-page)] px-3 py-2 text-[var(--mq-navy)]'
                  : 'rounded-md px-3 py-2 text-[var(--mq-muted)] transition-colors hover:bg-[var(--mq-page)] hover:text-[var(--mq-navy)]'}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative grid h-9 w-9 place-items-center rounded-full border border-[var(--mq-border)] bg-white text-[var(--mq-muted)] transition hover:bg-[var(--mq-page)] hover:text-[var(--mq-navy)]"
          >
            <BellIcon />
            <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#c2416b] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
              6
            </span>
          </button>
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--mq-navy)] text-sm font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
          >
            EK
          </span>
        </div>
      </div>
    </header>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
