'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Portal Universitario', href: '/' },
  { label: 'Área personal', href: '/' },
  { label: 'Mis asignaturas', href: '/quiz' }
] as const

/**
 * Barra superior tipo aula virtual UAX, pero con la marca propia (Edvard K.).
 * Persistente en todas las páginas de /quiz para reproducir el "chrome" del Moodle.
 */
export function UaxTopBar() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--mq-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-3 sm:gap-6 sm:px-6">
        <Link href="/quiz" className="flex shrink-0 items-center gap-2" aria-label="Inicio de tests">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/photos/eks-logo.png"
            alt="Edvard K."
            className="h-8 w-auto sm:h-9"
            width={36}
            height={36}
          />
          <span className="hidden text-sm font-extrabold tracking-tight text-[var(--mq-navy)] sm:inline">
            Aula Virtual
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-5 text-sm font-semibold md:flex" aria-label="Principal">
          {NAV.map(item => {
            const active = item.href === '/quiz' && pathname.startsWith('/quiz')
            return (
              <Link
                key={item.label}
                href={item.href}
                className={active ? 'text-[var(--mq-navy)]' : 'text-[var(--mq-muted)] hover:text-[var(--mq-navy)]'}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative grid h-9 w-9 place-items-center rounded-full text-[var(--mq-muted)] transition hover:bg-slate-100"
          >
            <BellIcon />
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--mq-magenta)] px-1 text-[9px] font-bold leading-none text-white">
              6
            </span>
          </button>
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--mq-navy)] text-sm font-bold text-white"
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
