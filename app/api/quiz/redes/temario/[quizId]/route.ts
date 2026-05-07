import { NextResponse } from 'next/server'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getRedesQuizById } from '@lib/quiz/redes'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params
  try {
    await ensureQuizSeeded()
    const quiz = getRedesQuizById(quizId)
    if (!quiz) return NextResponse.json({ error: 'Unknown quiz' }, { status: 404 })
    return NextResponse.json(quiz)
  } catch (error) {
    console.error('[quiz/redes/temario/[quizId]]', error)
    return NextResponse.json({ error: 'Failed to load Redes quiz' }, { status: 500 })
  }
}
