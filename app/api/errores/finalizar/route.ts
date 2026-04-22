import { NextResponse } from 'next/server'
import { runPadelCli } from '@lib/padel/runPython'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.text()
  const r = await runPadelCli('finalizar', { stdin: body })
  return NextResponse.json(r.body, { status: r.status })
}
