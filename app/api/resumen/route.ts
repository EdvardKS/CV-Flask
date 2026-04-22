import { NextResponse } from 'next/server'
import { runPadelCli } from '@lib/padel/runPython'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const jugador = url.searchParams.get('jugador') ?? ''
  const idPartido = url.searchParams.get('id_partido') ?? 'all'
  const numeroSet = url.searchParams.get('numero_set') ?? 'all'
  const r = await runPadelCli('resumen', {
    argv: ['--jugador', jugador, '--id-partido', idPartido, '--numero-set', numeroSet]
  })
  return NextResponse.json(r.body, { status: r.status })
}
