import { NextResponse } from 'next/server'
import { getFeed } from '@lib/news'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const force = url.searchParams.get('refresh') === '1'
  const feed = await getFeed({ force })
  return NextResponse.json(feed, {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=1800'
    }
  })
}
