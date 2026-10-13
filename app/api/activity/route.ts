import { NextResponse } from 'next/server'

const SOURCE_URL = process.env.ACTIVITY_SOURCE_URL ?? 'https://iaeks.com/api/public/activity'

export const revalidate = 900

type Activity = { since?: number; repositories?: number; days?: Array<[string, number, number, number]> }

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, { next: { revalidate }, signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = (await response.json()) as Activity
    return NextResponse.json({
      ok: true,
      since: data.since ?? 2022,
      repositories: data.repositories ?? 71,
      days: data.days ?? []
    })
  } catch {
    return NextResponse.json({ ok: false, since: 2022, repositories: 71, days: [] })
  }
}
