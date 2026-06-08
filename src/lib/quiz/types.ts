import { z } from 'zod'

export const subjectMaterialSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  icon: z.string().min(1).optional()
})
export type SubjectMaterial = z.infer<typeof subjectMaterialSchema>

export const subjectMetaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'lowercase, dashes, digits only'),
  name: z.string().min(1),
  description: z.string().default(''),
  icon: z.string().default('📝'),
  color: z.string().default('#3a6ea5'),
  position: z.number().int().optional(),
  curso: z.number().int().min(1).max(6).optional(),
  cuatrimestre: z.number().int().min(1).max(2).optional(),
  entryMode: z.enum(['standard', 'hub']).optional().default('standard'),
  materials: z.array(subjectMaterialSchema).optional()
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
  group: z.string().optional(),
  image: z.string().min(1).optional(),
  cuatrimestre: z.number().int().min(1).max(2).optional(),
  isVocab: z.boolean().optional(),
  sourceFile: z.string().min(1).optional(),
  sourceType: z.string().min(1).optional(),
  sourcePage: z.number().int().min(1).optional(),
  sourceSlide: z.number().int().min(1).optional(),
  evidence: z.string().min(1).optional(),
  hint: z.string().min(1).optional(),
  explanationCorrect: z.string().min(1).optional(),
  explanationWrong: z.string().min(1).optional()
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
  raw => (raw && typeof raw === 'object' && !('kind' in (raw as object)))
    ? { ...(raw as object), kind: 'choice' } : raw,
  z.discriminatedUnion('kind', [choiceQuestionSchema, fillQuestionSchema])
))

export type ChoiceQuestion = z.infer<typeof choiceQuestionSchema>
export type FillQuestion = z.infer<typeof fillQuestionSchema>
export type Question = ChoiceQuestion | FillQuestion
export type Answer = number | string

export const temarioSupportMaterialSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceFile: z.string().min(1),
  sourceType: z.string().min(1),
  questionCount: z.number().int().min(0).default(0)
})
export type TemarioSupportMaterial = z.infer<typeof temarioSupportMaterialSchema>

export type SubjectWithCount = SubjectMeta & {
  questionCount: number
  cuatrimestres: number[]
}

export const temarioQuizSchema = z.object({
  id: z.string().min(1),
  topic: z.number().int().min(1),
  title: z.string().min(1),
  sourceFile: z.string().min(1),
  sourceType: z.string().min(1).optional(),
  questionCount: z.number().int().min(0),
  questions: questionsSchema
})
export type TemarioQuiz = z.infer<typeof temarioQuizSchema>

export const temarioTopicSchema = z.object({
  id: z.string().min(1),
  topic: z.number().int().min(1),
  title: z.string().min(1),
  supportMaterials: z.array(temarioSupportMaterialSchema).optional().default([]),
  quizzes: z.array(temarioQuizSchema)
})
export type TemarioTopic = z.infer<typeof temarioTopicSchema>

export const redesTemarioManifestSchema = z.object({
  subjectId: z.literal('redes'),
  topics: z.array(temarioTopicSchema)
})
export type RedesTemarioManifest = z.infer<typeof redesTemarioManifestSchema>

export const slideConceptHighlightSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0).max(100),
  h: z.number().min(0).max(100),
  label: z.string().min(1)
})
export type SlideConceptHighlight = z.infer<typeof slideConceptHighlightSchema>

export const slideConceptEntrySchema = z.object({
  id: z.string().min(1),
  page: z.number().int().min(1),
  title: z.string().min(1),
  highlights: z.array(slideConceptHighlightSchema).min(1),
  explanation: z.string().min(1),
  examRelevance: z.string().min(1),
  searchText: z.string().min(1)
})
export type SlideConceptEntry = z.infer<typeof slideConceptEntrySchema>

export const slideConceptDeckSchema = z.object({
  id: z.string().min(1),
  topic: z.number().int().min(1),
  title: z.string().min(1),
  pdfUrl: z.string().min(1),
  pageCount: z.number().int().min(1),
  slides: z.array(slideConceptEntrySchema).min(1)
})
export type SlideConceptDeck = z.infer<typeof slideConceptDeckSchema>

export const redesConceptManifestSchema = z.object({
  subjectId: z.literal('redes'),
  topics: z.array(slideConceptDeckSchema)
})
export type RedesConceptManifest = z.infer<typeof redesConceptManifestSchema>

export const redesAutoevalTopicSchema = z.object({
  id: z.string().min(1),
  topic: z.number().int().min(1),
  title: z.string().min(1),
  questionCount: z.number().int().min(0)
})
export type RedesAutoevalTopic = z.infer<typeof redesAutoevalTopicSchema>

export const redesAutoevalManifestSchema = z.object({
  subjectId: z.literal('redes'),
  topics: z.array(redesAutoevalTopicSchema),
  questions: questionsSchema
})
export type RedesAutoevalManifest = z.infer<typeof redesAutoevalManifestSchema>

export type SubjectModeSummary = {
  autoevaluacionCount: number
  temarioQuizCount: number
  temarioQuestionCount: number
  conceptTopicCount: number
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
