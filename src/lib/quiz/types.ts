import { z } from 'zod'

export const subjectMetaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'lowercase, dashes, digits only'),
  name: z.string().min(1),
  description: z.string().default(''),
  icon: z.string().default('📝'),
  color: z.string().default('#3a6ea5'),
  position: z.number().int().optional()
})
export type SubjectMeta = z.infer<typeof subjectMetaSchema>

export const correctIndexSchema = z.union([
  z.number().int().min(0),
  z.array(z.number().int().min(0)).min(1)
])
export type CorrectIndex = z.infer<typeof correctIndexSchema>

const acceptSchema = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)])

const baseFields = {
  q: z.string().min(1),
  context: z.string().optional(),
  code: z.string().optional(),
  category: z.string().optional(),
  cuatrimestre: z.number().int().min(1).max(2).optional(),
  isVocab: z.boolean().optional()
}

export const choiceQuestionSchema = z.object({
  ...baseFields,
  kind: z.literal('choice'),
  options: z.array(z.string()).min(2).max(8),
  correctIndex: correctIndexSchema
})

export const fillQuestionSchema = z.object({
  ...baseFields,
  kind: z.literal('fill'),
  accept: acceptSchema,
  hint: z.string().optional()
})

export const questionsSchema = z.array(z.preprocess(
  (raw) => (raw && typeof raw === 'object' && !('kind' in (raw as object)))
    ? { ...(raw as object), kind: 'choice' } : raw,
  z.discriminatedUnion('kind', [choiceQuestionSchema, fillQuestionSchema])
))

export type ChoiceQuestion = z.infer<typeof choiceQuestionSchema>
export type FillQuestion = z.infer<typeof fillQuestionSchema>
export type Question = ChoiceQuestion | FillQuestion
export type Answer = number | string

export type SubjectWithCount = SubjectMeta & {
  questionCount: number
  cuatrimestres: number[]
}

export function normalizeFill(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isCorrect(q: Question, picked: Answer): boolean {
  if (q.kind === 'choice' && typeof picked === 'number') {
    const c = q.correctIndex
    return Array.isArray(c) ? c.includes(picked) : c === picked
  }
  if (q.kind === 'fill' && typeof picked === 'string') {
    const accepts = Array.isArray(q.accept) ? q.accept : [q.accept]
    return accepts.some(a => normalizeFill(a) === normalizeFill(picked))
  }
  return false
}

export function primaryCorrect(q: Question): string {
  if (q.kind === 'fill') return Array.isArray(q.accept) ? q.accept[0] : q.accept
  const idx = Array.isArray(q.correctIndex) ? q.correctIndex[0] : q.correctIndex
  return q.options[idx]
}
