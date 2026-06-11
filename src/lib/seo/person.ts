export const SITE_URL = 'https://edvardks.com'

/**
 * JSON-LD Person para edvardks.com.
 * `sameAs` asocia GitHub/LinkedIn/Credly en el Knowledge Panel de Google.
 * `image` (file.jpg) habilita el retrato en image search / ficha.
 */
export const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_URL}/#edvard`,
  name: 'Edvard Khachatryan Sahakyan',
  alternateName: ['Edvard K.', 'EdvardKS'],
  url: SITE_URL,
  image: `${SITE_URL}/assets/photos/file.jpg`,
  jobTitle: 'Científico de datos (Data Scientist)',
  description:
    'Científico de datos en JNC Sistemas Informáticos SL e Ingeniero Informático en formación en la Universidad Alfonso X el Sabio (UAX). Experiencia en MLOps/LLMOps, Python, SQL y Docker.',
  knowsAbout: [
    'Data Science',
    'Machine Learning',
    'MLOps',
    'LLMOps',
    'Python',
    'SQL',
    'Docker',
    'Inteligencia Artificial'
  ],
  knowsLanguage: ['es', 'en', 'hy'],
  worksFor: { '@type': 'Organization', name: 'JNC Sistemas Informáticos SL' },
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Universidad Alfonso X el Sabio' },
    { '@type': 'Organization', name: 'Udacity' }
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Madrid',
    addressCountry: 'ES'
  },
  sameAs: [
    'https://github.com/EdvardKS',
    'https://www.linkedin.com/in/edvardks/',
    'https://www.credly.com/users/edvardks'
  ]
}
