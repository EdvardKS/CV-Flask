import { NextResponse } from 'next/server'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { getRedesTemarioManifest } from '@lib/quiz/redes'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureQuizSeeded()
    return NextResponse.json(getRedesTemarioManifest())
  } catch (error) {
    console.error('[quiz/redes/temario]', error)
    return NextResponse.json({ error: 'Failed to load Redes temario' }, { status: 500 })
  }
}
