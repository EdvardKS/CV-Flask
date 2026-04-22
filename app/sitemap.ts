import type { MetadataRoute } from 'next'

const BASE = 'https://edvardks.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BASE}/`, lastModified: now, priority: 1 },
    { url: `${BASE}/cv`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/projects`, lastModified: now, priority: 0.8 },
    { url: `${BASE}/quiz`, lastModified: now, priority: 0.7 },
    { url: `${BASE}/quiz/estructura`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/quiz/sistemas-operativos`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/quiz/ssoo-avanzados`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/quiz/ingles`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/padel`, lastModified: now, priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, priority: 0.5 }
  ]
}
