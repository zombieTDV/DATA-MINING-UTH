/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // === Brand ===
        brand: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
          accent: '#3B82F6',
          'accent-light': '#60A5FA',
        },

        // === Surfaces (light) ===
        surface: {
          DEFAULT: '#FFFFFF',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },

        // === Surfaces (dark) ===
        'surface-dark': {
          DEFAULT: '#0F172A',
          50: '#1E293B',
          100: '#334155',
          200: '#475569',
        },

        // === Text ===
        text: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
          inverse: '#FFFFFF',
        },

        // === Borders ===
        border: {
          DEFAULT: '#E2E8F0',
          light: '#F1F5F9',
          dark: '#334155',
        },

        // === States ===
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
        },

        // === arXiv Categories ===
        'cat-ai': {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
        },
        'cat-lg': {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
        },
        'cat-cv': {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        'cat-cl': {
          DEFAULT: '#10B981',
          light: '#34D399',
        },
        'cat-ml': {
          DEFAULT: '#EC4899',
          light: '#F472B6',
        },
        'cat-other': {
          DEFAULT: '#6B7280',
          light: '#9CA3AF',
        },
      },

      // === Spacing scale (4px base) ===
      spacing: {
        xxs: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '20px',
        xl: '24px',
        xxl: '32px',
        xxxl: '40px',
        huge: '64px',
        '18': '72px',
        '88': '88px',
        '128': '128px',
      },

      // === Border radius ===
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
        full: '9999px',
      },

      // === Font sizes (matches Typography in src/theme/typography.ts) ===
      fontSize: {
        display: ['32px', { lineHeight: '40px', letterSpacing: '-0.5px', fontWeight: '700' }],
        h1: ['28px', { lineHeight: '36px', letterSpacing: '-0.3px', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', letterSpacing: '-0.2px', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        h4: ['18px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
        label: ['13px', { lineHeight: '18px', letterSpacing: '0.3px', fontWeight: '600' }],
        mono: ['14px', { lineHeight: '20px', fontFamily: 'Courier' }],
      },

      // === Font families ===
      fontFamily: {
        sans: ['System', 'sans-serif'],
        mono: ['Courier', 'monospace'],
        serif: ['Georgia', 'serif'],
      },

      // === Shadows ===
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft-md': '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 4px 8px 0 rgba(0, 0, 0, 0.12)',
        'soft-xl': '0 8px 16px 0 rgba(0, 0, 0, 0.15)',
        glow: '0 0 0 3px rgba(59, 130, 246, 0.25)',
      },
    },
  },
  plugins: [],
};
