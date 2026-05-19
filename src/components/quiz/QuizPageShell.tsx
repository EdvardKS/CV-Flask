import type { ReactNode } from 'react'

export function QuizPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="quiz-shell min-h-dvh w-full text-slate-900 antialiased" style={{ background: 'radial-gradient(ellipse at 20% 10%, #1e3a8a 0%, #0b1530 50%, #050a1a 100%)' }}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
        {children}
      </div>
    </main>
  )
}
