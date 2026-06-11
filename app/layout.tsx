import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://edvardks.com'),
  title: {
    default: 'Edvard Khachatryan Sahakyan — Científico de datos | Portfolio',
    template: '%s · Edvard Khachatryan Sahakyan'
  },
  description:
    'Edvard Khachatryan Sahakyan, Científico de datos (Data Scientist) en JNC Sistemas Informáticos e Ingeniero Informático en formación en la Universidad Alfonso X el Sabio (UAX), Madrid (España). Portfolio interactivo estilo Windows XP: CV, proyectos de IA/MLOps, certificaciones y quizzes.',
  keywords: [
    'Edvard Khachatryan Sahakyan',
    'Edvard Khachatryan',
    'EdvardKS',
    'Científico de datos',
    'Data Scientist',
    'Ingeniero Informático',
    'Universidad Alfonso X el Sabio',
    'UAX',
    'MLOps',
    'LLMOps',
    'Python',
    'SQL',
    'Docker',
    'Inteligencia Artificial',
    'Madrid',
    'España'
  ],
  authors: [{ name: 'Edvard Khachatryan Sahakyan', url: 'https://edvardks.com' }],
  creator: 'Edvard Khachatryan Sahakyan',
  publisher: 'Edvard Khachatryan Sahakyan',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    url: 'https://edvardks.com',
    siteName: 'Edvard Khachatryan Sahakyan — Portfolio',
    title: 'Edvard Khachatryan Sahakyan — Científico de datos',
    description:
      'Científico de datos (Data Scientist) e Ingeniero Informático en formación (UAX), Madrid (España). CV, proyectos de IA/MLOps y portfolio interactivo estilo Windows XP.',
    locale: 'es_ES',
    alternateLocale: ['en_US', 'hy_AM']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edvard Khachatryan Sahakyan — Científico de datos',
    description:
      'Científico de datos e Ingeniero Informático en formación (UAX). Portfolio estilo Windows XP.',
    creator: '@edvardks',
    site: '@edvardks'
  },
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.webmanifest',
  verification: { google: 'kFbj5Q2wIECy_Zt63Z9WnHIOi-DbfezJ82_epIMjVeM' }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#245edc'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
