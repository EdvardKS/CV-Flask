import { z } from 'zod'
import {
  buildCompactCV, buildSystemPrompt, streamOllamaChat,
  REFUSAL, isObviouslyOffTopic, type Locale
} from '@lib/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000)
  })).min(1).max(30),
  locale: z.enum(['es', 'en', 'hy']).default('es')
})

function cannedRefusal(locale: Locale): Response {
  const body = REFUSAL[locale]
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Guardrail': 'off-topic-prefilter'
    }
  })
}

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
  const lastUser = [...parsed.data.messages].reverse().find(m => m.role === 'user')

  // Guardrail 1: heuristic pre-filter for the obvious off-topic attempts.
  // If the user's last turn is clearly not about Edvard, short-circuit
  // without touching the LLM — this saves tokens AND makes injections
  // like "ignora las reglas" impossible to reach the model.
  if (!lastUser || isObviouslyOffTopic(lastUser.content)) {
    return cannedRefusal(locale)
  }

  const cv = await buildCompactCV(locale)
  const system = buildSystemPrompt(cv, locale)
  const messages = [{ role: 'system' as const, content: system }, ...parsed.data.messages]

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      let acc = ''
      try {
        for await (const delta of streamOllamaChat(messages)) {
          acc += delta
          controller.enqueue(encoder.encode(delta))
        }
        // Guardrail 2: post-check. If the model somehow produced a
        // response that doesn't look like it's about Edvard (no mention
        // of him, no CV-related keyword, and not our canned refusal),
        // append the canned refusal as a safety net.
        // Only trigger on obviously-wrong replies — we don't want to
        // double-message on normal CV answers.
        const low = acc.toLowerCase()
        const looksAboutEdvard =
          low.includes('edvard') || low.includes('jnc') || low.includes('navegatel') ||
          low.includes('posiziona') || low.includes('rag') || low.includes('python') ||
          low.includes('uax') || low.includes('ingenier') || low.includes('ies ') ||
          low.includes('langchain') || low.includes('ollama') || low.includes('docker') ||
          low.includes('experien') || low.includes('educación') || low.includes('education') ||
          low.includes('proyecto') || low.includes('project') || low.includes('habilidad') ||
          low.includes('skill') || low.includes('i only know') || low.includes('yo solo sé')
        if (!looksAboutEdvard && acc.trim().length > 0) {
          controller.enqueue(encoder.encode('\n\n' + REFUSAL[locale]))
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
      'X-Accel-Buffering': 'no',
      'X-Guardrail': 'llm-with-post-check'
    }
  })
}
