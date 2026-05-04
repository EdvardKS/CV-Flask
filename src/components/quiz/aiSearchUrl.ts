/**
 * Build a Google AI Mode (udm=50) search URL for a quiz question.
 * Mirrors the format Google AI Mode expects: "<pregunta> A <opt0>. B <opt1>. ..."
 */
export function buildAiSearchUrl(question: string, options: string[]): string {
  const labelled = options
    .map((o, i) => `${String.fromCharCode(65 + i)} ${o.trim().replace(/\.+$/, '')}.`)
    .join(' ')
  const q = `${question.trim()} ${labelled}`.trim()
  const params = new URLSearchParams({ q, udm: '50' })
  return `https://www.google.com/search?${params.toString()}`
}
