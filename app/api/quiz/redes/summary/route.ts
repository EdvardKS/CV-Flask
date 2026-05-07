import { NextResponse } from 'next/server'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getRedesModeSummary } from '@lib/quiz/redes'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureQuizSeeded()
    return NextResponse.json(getRedesModeSummary())
  } catch (error) {
    console.error('[quiz/redes/summary]', error)
    return NextResponse.json({ error: 'Failed to load Redes summary' }, { status: 500 })
  }
}
