import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    optimizePackageImports: ['framer-motion', 'zustand']
  },
  async rewrites() {
    return [
      { source: '/padel-legacy/errores', destination: '/padel-legacy/errores.html' },
      { source: '/padel-legacy/resumen', destination: '/padel-legacy/resumen.html' }
    ]
  },
  async redirects() {
    return [
      {
        // URL heredada de la versión Flask, indexada en Google y ahora 404.
        // Redirige a la credencial verificada de Udacity.
        source: '/pdf/Udacity_Nanodegree.pdf',
        destination:
          'https://www.udacity.com/certificate/e/abae816e-2dce-11ef-ab44-a3d071e8ff9a',
        permanent: true
      }
    ]
  }
}

export default config
