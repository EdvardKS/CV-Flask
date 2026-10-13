import Link from 'next/link'
import type { ReactNode } from 'react'

const NAV = [
  { href: '/', label: 'Escritorio' },
  { href: '/projects', label: 'Proyectos' },
  { href: '/blog', label: 'Blog' },
  { href: '/cv', label: 'CV' },
  { href: '/contact', label: 'Contacto' }
]

const FOOTER = [
  { href: 'https://iaeks.com', label: 'iaeks.com · consultoría de IA' },
  { href: 'https://iaeks.com/casos', label: 'Casos en producción' },
  { href: 'https://iaeks.com/bots-telegram-ia', label: 'Bots de Telegram con IA' },
  { href: 'https://iaeks.com/blog', label: 'Blog de IA aplicada' },
  { href: 'https://github.com/EdvardKS', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/edvardks/', label: 'LinkedIn' }
]

export function DocShell({ children }: { children: ReactNode }) {
  return (
    <div className="doc-page">
      <header className="doc-top">
        <Link href="/" className="doc-brand">
          EdvardKS <span>PC</span>
        </Link>
        <nav aria-label="Secciones">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="doc-main">{children}</main>
      <footer className="doc-foot">
        <p>Edvard Khachatryan Sahakyan · Ingeniero de inteligencia artificial y científico de datos</p>
        <nav aria-label="Enlaces">
          {FOOTER.map(item => (
            <a key={item.href} href={item.href} rel="me noopener" target="_blank">
              {item.label}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  )
}
