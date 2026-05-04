// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildAiSearchUrl } from '../aiSearchUrl'

describe('buildAiSearchUrl', () => {
  it('uses Google AI Mode (udm=50)', () => {
    const url = buildAiSearchUrl('Q?', ['a', 'b'])
    expect(url.startsWith('https://www.google.com/search?')).toBe(true)
    expect(url).toContain('udm=50')
  })

  it('labels options A, B, C, D … with trailing period', () => {
    const url = buildAiSearchUrl('Un compilador traduce:', [
      'Código máquina a ensamblador',
      'Código fuente de alto nivel a código máquina',
      'Código máquina a código fuente',
      'Texto a voz'
    ])
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('q')).toBe(
      'Un compilador traduce: A Código máquina a ensamblador. B Código fuente de alto nivel a código máquina. C Código máquina a código fuente. D Texto a voz.'
    )
  })

  it('does not double up trailing dots', () => {
    const url = buildAiSearchUrl('Q?', ['Sí.', 'No..', 'Quizá'])
    const q = new URLSearchParams(url.split('?')[1]).get('q')
    expect(q).toBe('Q? A Sí. B No. C Quizá.')
  })

  it('URL-encodes specials (colon as %3A, spaces as +)', () => {
    const url = buildAiSearchUrl('Foo: bar', ['x'])
    expect(url).toContain('Foo%3A+bar')
  })
})
