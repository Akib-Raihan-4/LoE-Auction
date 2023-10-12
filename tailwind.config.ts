import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      textColor: {
        '3d': 'text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); background: linear-gradient(135deg, #17273e, #0c1529); background-clip: text; -webkit-background-clip: text; color: transparent;',
      },
    },
  },
  plugins: [],
}
export default config
