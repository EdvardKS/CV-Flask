import {
  ERROR_FIELDS, SUCCESS_FIELDS,
  ERROR_WEIGHTS, SUCCESS_WEIGHTS,
  type ErrorField, type SuccessField, type SetRow
} from './constants'

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp

export type Totals = Partial<Record<ErrorField | SuccessField, number>>

export type ScoreData = {
  score: number
  puntos_acierto: number
  puntos_error: number
  impacto_neto: number
  nivel: 'Alto rendimiento' | 'Competitivo' | 'Inestable' | 'En desarrollo'
}

export function calculateErrorTotal(row: SetRow): number {
  return ERROR_FIELDS.reduce((s, f) => s + (row[f] ?? 0), 0)
}

export function calculateSuccessTotal(row: SetRow): number {
  return SUCCESS_FIELDS.reduce((s, f) => s + (row[f] ?? 0), 0)
}

export function calculateBalanceTotal(errors: number, successes: number): number {
  return successes - errors
}

export function calculateScoreData(errorTotals: Totals, successTotals: Totals): ScoreData {
  const aciertos = round(SUCCESS_FIELDS.reduce((s, f) => s + (successTotals[f] ?? 0) * SUCCESS_WEIGHTS[f], 0))
  const errores = round(ERROR_FIELDS.reduce((s, f) => s + (errorTotals[f] ?? 0) * ERROR_WEIGHTS[f], 0))
  const denom = Math.max(1, aciertos + errores)
  const score = clamp(round(100 * aciertos / denom, 1), 0, 100)
  return {
    score,
    puntos_acierto: aciertos,
    puntos_error: errores,
    impacto_neto: round(aciertos - errores),
    nivel: level(score)
  }
}

export function calculateAreaScore(
  positive: readonly SuccessField[],
  negative: readonly ErrorField[],
  successTotals: Totals,
  errorTotals: Totals
) {
  const aciertos = round(positive.reduce((s, f) => s + (successTotals[f] ?? 0) * SUCCESS_WEIGHTS[f], 0))
  const errores = round(negative.reduce((s, f) => s + (errorTotals[f] ?? 0) * ERROR_WEIGHTS[f], 0))
  return {
    score: clamp(round(100 * aciertos / Math.max(1, aciertos + errores), 1), 0, 100),
    aciertos: positive.reduce((s, f) => s + (successTotals[f] ?? 0), 0),
    errores: negative.reduce((s, f) => s + (errorTotals[f] ?? 0), 0),
    impacto: round(aciertos - errores)
  }
}

function level(score: number): ScoreData['nivel'] {
  if (score >= 80) return 'Alto rendimiento'
  if (score >= 65) return 'Competitivo'
  if (score >= 50) return 'Inestable'
  return 'En desarrollo'
}

export function aggregateSets(sets: SetRow[]): { errors: Totals; successes: Totals } {
  const errors: Totals = {}
  const successes: Totals = {}
  for (const f of ERROR_FIELDS) errors[f] = sets.reduce((s, r) => s + (r[f] ?? 0), 0)
  for (const f of SUCCESS_FIELDS) successes[f] = sets.reduce((s, r) => s + (r[f] ?? 0), 0)
  return { errors, successes }
}
