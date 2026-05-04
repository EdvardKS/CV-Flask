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

export const questionSchema = z.object({
  q: z.string().min(1),
  options: z.array(z.string()).min(2).max(8),
  correctIndex: z.number().int().min(0),
  code: z.string().optional(),
  isVocab: z.boolean().optional(),
  category: z.string().optional()
})
export type Question = z.infer<typeof questionSchema>
export const questionsSchema = z.array(questionSchema)

export type SubjectWithCount = SubjectMeta & { questionCount: number }
