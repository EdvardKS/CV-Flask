import { describe, it, expect } from 'vitest'
import { calculateScoreData, calculateErrorTotal, calculateSuccessTotal, aggregateSets } from '../scoring'
import { emptySetRow } from '../constants'

describe('padel scoring', () => {
  it('returns 0 score for empty row', () => {
    const s = calculateScoreData({}, {})
    expect(s.score).toBe(0)
    expect(s.nivel).toBe('En desarrollo')
  })

  it('returns 100 for only successes', () => {
    const s = calculateScoreData({}, { Winner_Derecha: 10 })
    expect(s.score).toBe(100)
    expect(s.nivel).toBe('Alto rendimiento')
  })

  it('scales level by score', () => {
    // 10 Doble_Falta (w=2.5) = 25 err pts, 10 Winner_Derecha (w=3) = 30 ok pts
    // score = 100 * 30 / 55 ≈ 54.5 → 'Inestable' (50-64)
    const s = calculateScoreData({ Doble_Falta: 10 }, { Winner_Derecha: 10 })
    expect(s.nivel).toBe('Inestable')
    expect(s.score).toBeCloseTo(54.5, 1)
  })

  it('aggregates multiple sets correctly', () => {
    const r = emptySetRow()
    r.Winner_Derecha = 3
    r.Doble_Falta = 2
    const r2 = emptySetRow()
    r2.Winner_Derecha = 4
    const { errors, successes } = aggregateSets([r, r2])
    expect(successes.Winner_Derecha).toBe(7)
    expect(errors.Doble_Falta).toBe(2)
  })

  it('calculates totals from a row', () => {
    const r = emptySetRow()
    r.Winner_Derecha = 5
    r.Winner_Reves = 3
    r.Doble_Falta = 2
    expect(calculateSuccessTotal(r)).toBe(8)
    expect(calculateErrorTotal(r)).toBe(2)
  })
})
