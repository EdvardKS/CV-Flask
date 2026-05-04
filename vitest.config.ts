import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['__old_django/**', 'node_modules/**']
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, './src/lib/_test/server-only-stub.ts'),
      '@': path.resolve(__dirname, './src'),
      '@os': path.resolve(__dirname, './src/os'),
      '@apps': path.resolve(__dirname, './src/apps'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@components': path.resolve(__dirname, './src/components')
    }
  }
})
