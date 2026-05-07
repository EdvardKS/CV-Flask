import { NextResponse } from 'next/server'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getRedesConceptManifest } from '@lib/quiz/redes'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureQuizSeeded()
    return NextResponse.json(getRedesConceptManifest())
  } catch (error) {
    console.error('[quiz/redes/concepts]', error)
    return NextResponse.json({ error: 'Failed to load Redes concepts' }, { status: 500 })
  }
}
