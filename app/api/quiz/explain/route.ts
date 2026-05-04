import { z } from 'zod'
import { streamExplain } from '@lib/quiz/tutor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  subjectName: z.string().min(1).max(120),
  question: z.string().min(1).max(2000),
  options: z.array(z.string().max(800)).min(2).max(8),
  picked: z.number().int().min(0).max(7).nullable(),
  correctIndex: z.union([
    z.number().int().min(0),
    z.array(z.number().int().min(0)).min(1)
  ]),
  code: z.string().max(4000).optional()
})

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation', details: parsed.error.flatten() }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder()
      try {
        for await (const delta of streamExplain(parsed.data)) {
          controller.enqueue(enc.encode(delta))
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        controller.enqueue(enc.encode(`\n\n⚠ Error contactando con la IA: ${msg}`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no'
    }
  })
}
