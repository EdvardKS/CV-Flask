import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const ALLOWED = ['estructura', 'sistemas-operativos', 'ssoo-avanzados', 'ingles']

export async function GET(_req: Request, { params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  if (!ALLOWED.includes(subject)) {
    return NextResponse.json({ error: 'Unknown subject' }, { status: 404 })
  }
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'quiz', `${subject}.json`)
    const raw = await fs.readFile(file, 'utf8')
    return new NextResponse(raw, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (e) {
    console.error('[quiz api]', e)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
