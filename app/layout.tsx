import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Edvard K. — OS Portfolio',
  description: 'Portfolio interactivo estilo Windows XP: CV, proyectos, quizzes de sistemas operativos y Padel Scout.',
  metadataBase: new URL('https://edvardks.com'),
  openGraph: {
    title: 'Edvard K. — OS Portfolio',
    description: 'Portfolio interactivo estilo Windows XP.',
    type: 'website'
  },
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.webmanifest'
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
