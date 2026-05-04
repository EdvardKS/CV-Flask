import { NextResponse } from 'next/server'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getSubject, listQuestions } from '@lib/quiz/repo'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  try {
    await ensureQuizSeeded()
    const meta = getSubject(subject)
    if (!meta) return NextResponse.json({ error: 'Unknown subject' }, { status: 404 })
    const questions = listQuestions(subject)
    return NextResponse.json(questions, {
      headers: { 'Cache-Control': 'private, max-age=60' }
    })
  } catch (e) {
    console.error('[quiz/[subject]]', e)
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }
}
