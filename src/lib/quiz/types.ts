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

export const questionSchema = z.object({
  q: z.string().min(1),
  options: z.array(z.string()).min(2).max(8),
  correctIndex: correctIndexSchema,
  code: z.string().optional(),
  isVocab: z.boolean().optional(),
  category: z.string().optional()
})
export type Question = z.infer<typeof questionSchema>
export const questionsSchema = z.array(questionSchema)

export function isCorrect(question: Pick<Question, 'correctIndex'>, picked: number): boolean {
  const c = question.correctIndex
  return Array.isArray(c) ? c.includes(picked) : c === picked
}

export function primaryCorrect(question: Pick<Question, 'correctIndex'>): number {
  return Array.isArray(question.correctIndex) ? question.correctIndex[0] : question.correctIndex
}

export type SubjectWithCount = SubjectMeta & { questionCount: number }
