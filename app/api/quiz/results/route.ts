import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { recentResults, saveResult } from '@lib/quiz/repo'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  subjectId: z.string().regex(/^[a-z0-9-]+$/).max(64),
  clientId: z.string().min(1).max(128),
  correct: z.number().int().min(0),
  incorrect: z.number().int().min(0),
  unanswered: z.number().int().min(0),
  total: z.number().int().min(1),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 12)
})

export async function POST(req: Request) {
  try {
    await ensureQuizSeeded()
    const json = await req.json()
    const input = bodySchema.parse(json)
    const id = saveResult(input)
    return NextResponse.json({ id })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid body', issues: e.issues }, { status: 400 })
    }
    console.error('[quiz/results POST]', e)
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    await ensureQuizSeeded()
    const url = new URL(req.url)
    const clientId = url.searchParams.get('clientId') ?? ''
    if (!clientId) return NextResponse.json({ results: [] })
    return NextResponse.json({ results: recentResults(clientId, 20) })
  } catch (e) {
    console.error('[quiz/results GET]', e)
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 })
  }
}
