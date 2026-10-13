import { NextResponse } from 'next/server'

const SOURCE_URL = process.env.ACTIVITY_SOURCE_URL ?? 'https://iaeks.com/api/public/portfolio'
const REPOSITORY_COUNT = 71

export const revalidate = 3600

type Portfolio = { total?: Array<[string, number]> }

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, { next: { revalidate }, signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = (await response.json()) as Portfolio
    return NextResponse.json({ ok: true, repositories: REPOSITORY_COUNT, days: data.total ?? [] })
  } catch {
    return NextResponse.json({ ok: false, repositories: REPOSITORY_COUNT, days: [] })
  }
}
