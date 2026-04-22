import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'cv_data.json')
    const raw = await fs.readFile(file, 'utf8')
    return new NextResponse(raw, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    })
  } catch (e) {
    console.error('[cv api]', e)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
