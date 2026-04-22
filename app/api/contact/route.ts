import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactEmail } from '@lib/email'

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  message: z.string().min(10).max(4000)
})

const buckets = new Map<string, { count: number; reset: number }>()
function rateLimit(ip: string, limit = 5, windowMs = 60_000) {
  const now = Date.now()
  const b = buckets.get(ip)
  if (!b || now > b.reset) {
    buckets.set(ip, { count: 1, reset: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count += 1
  return true
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'anonymous'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try later.' }, { status: 429 })
  }
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }
  try {
    await sendContactEmail(parsed.data)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[contact]', e)
    return NextResponse.json({ error: 'Send failure' }, { status: 500 })
  }
}
