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
  }
}

export default config
