import type { ReactNode } from 'react'

export function QuizPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="quiz-shell min-h-dvh w-full bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 antialiased">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
        {children}
      </div>
    </main>
  )
}
