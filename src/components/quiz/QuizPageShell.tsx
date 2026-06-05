import type { ReactNode } from 'react'
import { Breadcrumb, type Crumb } from './chrome/Breadcrumb'

type Props = {
  children: ReactNode
  breadcrumb?: Crumb[]
  /** Examen usa ancho extra para alojar el panel de navegación lateral. */
  wide?: boolean
}

export function QuizPageShell({ children, breadcrumb, wide }: Props) {
  return (
    <main className={`mx-auto flex w-full flex-col gap-4 px-3 pb-24 pt-4 sm:px-6 sm:pt-6 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
      {children}
    </main>
  )
}
