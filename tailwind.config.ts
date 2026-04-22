import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        xp: {
          blue: '#3A6EA5',
          blueDark: '#1941A5',
          blueLight: '#3C82E0',
          teal: '#008080',
          desktop: '#5A7EDA',
          taskbar: '#245EDC',
          taskbarStart: '#3C8A3C',
          window: '#ECE9D8',
          title: '#0A246A',
          titleEnd: '#A6CAF0'
        }
      },
      fontFamily: {
        xp: ['Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'monospace']
      },
      boxShadow: {
        'xp-window': '2px 2px 8px rgba(0,0,0,0.3)',
        'xp-icon': '1px 1px 0 rgba(0,0,0,0.5)'
      }
    }
  },
  plugins: []
}

export default config
