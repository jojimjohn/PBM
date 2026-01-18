/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ==========================================
      // FONTS - Premium design system
      // ==========================================
      fontFamily: {
        display: ['Outfit', 'Inter', '-apple-system', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },

      // ==========================================
      // COLORS - Premium dark/light scheme
      // ==========================================
      colors: {
        // Primary brand colors
        primary: '#0F172A',
        accent: '#2563EB',
        'background-light': '#F1F5F9',
        'background-dark': '#020617',

        // Sidebar gradient colors
        sidebar: {
          from: '#020617',
          to: '#0F172A',
        },

        // Stat card types
        stat: {
          collections: {
            bg: '#ecfeff',
            text: '#0891b2',
            border: '#06b6d4',
          },
          orders: {
            bg: '#f5f3ff',
            text: '#7c3aed',
            border: '#8b5cf6',
          },
          invoices: {
            bg: '#ecfdf5',
            text: '#059669',
            border: '#10b981',
          },
          alerts: {
            bg: '#fef2f2',
            text: '#dc2626',
            border: '#ef4444',
          },
          contracts: {
            bg: '#fffbeb',
            text: '#d97706',
            border: '#f59e0b',
          },
          inventory: {
            bg: '#ecfdf5',
            text: '#059669',
            border: '#10b981',
          },
          'petty-cash': {
            bg: '#f5f3ff',
            text: '#7c3aed',
            border: '#8b5cf6',
          },
          wastage: {
            bg: '#fef2f2',
            text: '#dc2626',
            border: '#ef4444',
          },
          sales: {
            bg: '#ecfeff',
            text: '#0891b2',
            border: '#06b6d4',
          },
          banking: {
            bg: '#eff6ff',
            text: '#2563eb',
            border: '#3b82f6',
          },
        },

        // Status colors
        status: {
          success: { bg: '#ecfdf5', text: '#059669', border: '#10b981' },
          warning: { bg: '#fffbeb', text: '#d97706', border: '#f59e0b' },
          error: { bg: '#fef2f2', text: '#dc2626', border: '#ef4444' },
          info: { bg: '#eff6ff', text: '#2563eb', border: '#3b82f6' },
          neutral: { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' },
        },

        // Surface colors
        surface: {
          DEFAULT: '#ffffff',
          hover: '#f8fafc',
          active: '#f1f5f9',
          muted: '#f1f5f9',
        },

        // Border colors
        'border-default': '#e2e8f0',
        'border-subtle': '#f1f5f9',
        'border-emphasis': '#cbd5e1',
      },

      // ==========================================
      // BORDER RADIUS - SHARP CORNERS (0px)
      // Premium design uses square edges
      // ==========================================
      borderRadius: {
        'none': '0px',
        'sm': '0px',
        DEFAULT: '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
        'full': '9999px', // Keep for avatars/badges only
      },

      // ==========================================
      // BOX SHADOWS - Premium shadows
      // ==========================================
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.06)',
        'md': '0 2px 6px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'xl': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'premium': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'glass': '0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },

      // ==========================================
      // SPACING - 4px grid system
      // ==========================================
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },

      // ==========================================
      // LETTER SPACING - Premium typography
      // ==========================================
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        'premium': '0.15em',
        'ultra': '0.2em',
        'mega': '0.3em',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
