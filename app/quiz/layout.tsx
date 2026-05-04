import type { ReactNode } from 'react'
import './quiz.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a'
}

export default function QuizLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
