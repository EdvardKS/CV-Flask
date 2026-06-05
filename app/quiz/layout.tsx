import type { ReactNode } from 'react'
import { UaxTopBar } from '@components/quiz/chrome/UaxTopBar'
import './quiz.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a2d5e'
}

export default function QuizLayout({ children }: { children: ReactNode }) {
  return (
    <div className="quiz-shell min-h-dvh w-full bg-[var(--mq-page)] text-[var(--mq-ink)] antialiased">
      <UaxTopBar />
      {children}
    </div>
  )
}
