import { NextResponse } from 'next/server'
import { ensureQuizSeeded } from '@lib/quiz/boot'
import { listSubjects } from '@lib/quiz/repo'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureQuizSeeded()
    return NextResponse.json({ subjects: listSubjects() })
  } catch (e) {
    console.error('[quiz/subjects]', e)
    return NextResponse.json({ error: 'Failed to load subjects' }, { status: 500 })
  }
}
