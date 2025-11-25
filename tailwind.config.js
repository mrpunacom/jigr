/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // iPad-specific breakpoints for orientation-aware design
        'ipad-portrait': {'raw': '(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)'},
        'ipad-landscape': {'raw': '(min-width: 1024px) and (orientation: landscape)'},
        'ipad': {'raw': '(min-width: 768px) and (max-width: 1024px)'},
        // Legacy breakpoints remain unchanged
      },
      fontFamily: {
        // Standardized Typography System
        'lora': ['Lora', 'Georgia', 'Times New Roman', 'serif'],
        'source': ['Source Sans Pro', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'kirgina': ['Kirgina', 'serif'],
        
        // Legacy support (will be phased out)
        'sf-pro': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        'new-york': ['"New York"', '-apple-system-ui-serif', 'ui-serif', '"Times New Roman"', 'serif'],
      },
      fontSize: {
        // Typography scale based on specification
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      fontWeight: {
        'normal': '400',
        'semibold': '600',
        'bold': '700',
      }
    },
  },
  plugins: [
    require('@iconify/tailwind'),
  ],
}