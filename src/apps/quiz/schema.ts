import { z } from 'zod'

export const questionSchema = z.object({
  q: z.string(),
  options: z.array(z.string()).min(2).max(8),
  correctIndex: z.union([
    z.number().int().min(0),
    z.array(z.number().int().min(0)).min(1)
  ]),
  code: z.string().optional(),
  isVocab: z.boolean().optional(),
  category: z.string().optional()
})

export const questionsSchema = z.array(questionSchema)
export type Question = z.infer<typeof questionSchema>

export function isCorrect(q: Pick<Question, 'correctIndex'>, picked: number): boolean {
  const c = q.correctIndex
  return Array.isArray(c) ? c.includes(picked) : c === picked
}

export function primaryCorrect(q: Pick<Question, 'correctIndex'>): number {
  return Array.isArray(q.correctIndex) ? q.correctIndex[0] : q.correctIndex
}

export function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6d2b79f5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function shuffled<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice()
  const rng = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
