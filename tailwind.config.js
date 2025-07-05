/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          25: '#fcfcfd',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'premium': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'colored': '0 10px 25px -5px rgba(59, 130, 246, 0.25), 0 10px 10px -5px rgba(59, 130, 246, 0.1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1), 0 0 80px rgba(59, 130, 246, 0.05)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'slideInRight': 'slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slideInLeft': 'slideInLeft 0.6s ease-out',
        'slideInTop': 'slideInTop 0.6s ease-out',
        'slideInBottom': 'slideInBottom 0.6s ease-out',
        'zoomIn': 'zoomIn 0.5s ease-out',
        'flipIn': 'flipIn 0.8s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s infinite',
        'morphing': 'morphing 8s ease-in-out infinite',
        'aurora': 'aurora 15s ease infinite',
        'wave': 'wave 1.4s ease-in-out infinite both',
        'pulse-ring': 'pulse-ring 1s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'particle': 'particle 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInTop: {
          '0%': { opacity: '0', transform: 'translateY(-50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInBottom: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        flipIn: {
          '0%': { opacity: '0', transform: 'rotateY(-90deg)' },
          '100%': { opacity: '1', transform: 'rotateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        morphing: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        wave: {
          '0%, 80%, 100%': { transform: 'scaleY(0.4)' },
          '40%': { transform: 'scaleY(1)' },
        },
        'pulse-ring': {
          '0%': { 
            top: '50%', 
            left: '50%', 
            width: '0', 
            height: '0', 
            opacity: '1',
            transform: 'translate(-50%, -50%)'
          },
          '100%': { 
            top: '0', 
            left: '0', 
            width: '100%', 
            height: '100%', 
            opacity: '0',
            transform: 'translate(0, 0)'
          },
        },
        particle: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(360deg)', opacity: '0' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
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
    },
  },
  plugins: [],
  safelist: [
    // Spacing utilities
    'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-5', 'space-y-6', 'space-y-8',
    'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4', 'space-x-5', 'space-x-6', 'space-x-8',
    
    // Margin utilities
    'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8', 'mt-10', 'mt-12',
    'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8', 'mb-10', 'mb-12',
    'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-5', 'ml-6', 'ml-8', 'ml-10', 'ml-12',
    'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-8', 'mr-10', 'mr-12',
    
    // Padding utilities
    'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
    'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8', 'px-10', 'px-12',
    'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12',
    
    // Flexbox utilities
    'flex', 'flex-col', 'flex-row', 'flex-wrap', 'flex-nowrap',
    'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around',
    'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch',
    'flex-1', 'flex-auto', 'flex-initial', 'flex-none',
    
    // Grid utilities
    'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-6', 'grid-cols-12',
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8',
    
    // Width and height utilities
    'w-full', 'w-auto', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
    'h-full', 'h-auto', 'h-screen', 'h-64', 'h-32', 'h-16', 'h-8', 'h-4',
    
    // Text utilities
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
    'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    'text-left', 'text-center', 'text-right',
    
    // Color utilities
    'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'text-blue-500', 'text-blue-600', 'text-blue-700', 'text-blue-800',
    'text-green-500', 'text-green-600', 'text-green-700', 'text-green-800',
    'text-red-500', 'text-red-600', 'text-red-700', 'text-red-800',
    'text-white', 'text-black',
    
    'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-800', 'bg-gray-900',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
    'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600', 'bg-green-700',
    'bg-red-50', 'bg-red-100', 'bg-red-500', 'bg-red-600', 'bg-red-700',
    
    // Border utilities
    'border', 'border-2', 'border-t', 'border-b', 'border-l', 'border-r',
    'border-gray-200', 'border-gray-300', 'border-blue-500', 'border-green-500', 'border-red-500',
    'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
    
    // Shadow utilities
    'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
    
    // Position utilities
    'relative', 'absolute', 'fixed', 'sticky',
    'top-0', 'right-0', 'bottom-0', 'left-0',
    'inset-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
    
    // Display utilities
    'block', 'inline-block', 'inline', 'hidden',
    'table', 'table-cell', 'table-row',
    
    // Overflow utilities
    'overflow-hidden', 'overflow-auto', 'overflow-x-auto', 'overflow-y-auto',
    
    // Transition utilities
    'transition', 'transition-all', 'transition-colors', 'transition-transform',
    'duration-150', 'duration-200', 'duration-300', 'duration-500',
    'ease-in', 'ease-out', 'ease-in-out',
    
    // Transform utilities
    'transform', 'scale-95', 'scale-100', 'scale-105', 'scale-110',
    'rotate-0', 'rotate-45', 'rotate-90', 'rotate-180',
    'translate-x-0', 'translate-y-0', '-translate-y-1', '-translate-y-2',
    
    // Hover states
    'hover:bg-gray-50', 'hover:bg-gray-100', 'hover:bg-blue-50', 'hover:bg-blue-700',
    'hover:text-gray-700', 'hover:text-blue-700', 'hover:text-red-700',
    'hover:shadow-md', 'hover:shadow-lg', 'hover:scale-105', 'hover:-translate-y-1',
    
    // Focus states
    'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:ring-offset-2',
    'focus:border-blue-500', 'focus:border-transparent',
    
    // Responsive utilities
    'sm:block', 'sm:hidden', 'sm:flex', 'sm:grid',
    'md:block', 'md:hidden', 'md:flex', 'md:grid',
    'lg:block', 'lg:hidden', 'lg:flex', 'lg:grid',
    
    // Animation utilities
    'animate-spin', 'animate-pulse', 'animate-bounce',
    'animate-fadeIn', 'animate-fadeInUp', 'animate-slideInRight',
    'animate-float', 'animate-glow', 'animate-shimmer',
  ],
}
