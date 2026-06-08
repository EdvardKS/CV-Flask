import type { ReactNode } from 'react'
import { Breadcrumb, type Crumb } from './chrome/Breadcrumb'

type Props = {
  children: ReactNode
  breadcrumb?: Crumb[]
  /** Obsoleto: se mantiene por compatibilidad con llamadas antiguas. */
  wide?: boolean
}

export function QuizPageShell({ children, breadcrumb }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
      {children}
    </main>
  )
}
