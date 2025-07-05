import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  // Enable purge in production for optimal bundle size
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
    ],
    options: {
      safelist: [
        // Safelist dynamic classes that might be purged incorrectly
        'testimonial-card-base',
        'testimonial-card-default',
        'testimonial-card-compact',
        'testimonial-card-featured',
        'gradient-text',
        'animated-counter',
        'neumorphic-card',
        'neumorphic-card-dark',
      ],
    },
  },
  theme: {
    extend: {
      colors: {
        'forest-green': '#2E7D32',
        'sky-blue': '#00B0FF',
        'charcoal': '#1B1B1F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'counter-tick': 'counter-tick 0.3s ease-in-out',
      },
      keyframes: {
        'counter-tick': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.neumorphic-card': {
          background: 'linear-gradient(145deg, #f0f0f0, #cacaca)',
          borderRadius: '20px',
          boxShadow: '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.neumorphic-card-dark': {
          background: 'linear-gradient(145deg, #1e1e1e, #2a2a2a)',
          borderRadius: '20px',
          boxShadow: '20px 20px 60px #171717, -20px -20px 60px #333333',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.gradient-text': {
          background: 'linear-gradient(135deg, #2E7D32 0%, #00B0FF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '700',
        },
        '.animated-counter': {
          fontVariantNumeric: 'tabular-nums',
          transition: 'all 0.3s ease-in-out',
        },
        '.animated-counter:hover': {
          transform: 'scale(1.05)',
        },
        '.counter-digit': {
          display: 'inline-block',
          transition: 'transform 0.3s ease-in-out',
        },
        '.counter-digit.updating': {
          animation: 'counter-tick 0.3s ease-in-out',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}

export default config
