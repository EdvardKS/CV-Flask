import { z } from 'zod'
import { buildCompactCV, buildSystemPrompt, streamOllamaChat, type Locale } from '@lib/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000)
  })).min(1).max(30),
  locale: z.enum(['es', 'en', 'hy']).default('es')
})

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  const locale = parsed.data.locale as Locale
  const cv = await buildCompactCV(locale)
  const system = buildSystemPrompt(cv, locale)
  const messages = [{ role: 'system' as const, content: system }, ...parsed.data.messages]

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const delta of streamOllamaChat(messages)) {
          controller.enqueue(encoder.encode(delta))
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        controller.enqueue(encoder.encode(`\n\n⚠ Error contactando con la IA: ${msg}`))
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
