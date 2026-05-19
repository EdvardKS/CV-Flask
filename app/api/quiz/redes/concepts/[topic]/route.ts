import { NextResponse } from 'next/server'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getRedesConceptTopic } from '@lib/quiz/redes'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params
  try {
    await ensureQuizSeeded()
    const deck = getRedesConceptTopic(topic)
    if (!deck) return NextResponse.json({ error: 'Unknown topic' }, { status: 404 })
    return NextResponse.json(deck)
  } catch (error) {
    console.error('[quiz/redes/concepts/[topic]]', error)
    return NextResponse.json({ error: 'Failed to load Redes concept topic' }, { status: 500 })
  }
}
