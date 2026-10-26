import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#101218',
        panel: '#1a1d27',
        panel2: '#242837',
        line: '#34394b',
        muted: '#a9b0c5',
        purple: '#8978ff',
        green: '#62d7a1',
      },
    },
  },
  plugins: [],
}
export default config
