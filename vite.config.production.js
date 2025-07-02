import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Production optimization configuration for AWS deployment
export default defineConfig({
  plugins: [
    react({
      // Optimize React for production
      babel: {
        plugins: [
          // Remove console.log in production
          ['transform-remove-console', { exclude: ['error', 'warn'] }]
        ]
      }
    }),
    tailwindcss()
  ],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // Build optimizations
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging (disable for smaller builds)
    sourcemap: false,
    
    // Minification
    minify: 'terser',
    
    // Terser options for aggressive minification
    terserOptions: {
      compress: {
        // Remove console.log
        drop_console: true,
        drop_debugger: true,
        // Remove unused code
        dead_code: true,
        // Optimize conditionals
        conditionals: true,
        // Optimize comparisons
        comparisons: true,
        // Optimize sequences
        sequences: true,
        // Optimize properties
        properties: true,
        // Remove unused variables
        unused: true
      },
      mangle: {
        // Mangle variable names for smaller size
        toplevel: true,
        safari10: true
      },
      format: {
        // Remove comments
        comments: false
      }
    },
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        // Manual chunk splitting
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          // UI components chunk
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            'lucide-react',
            'framer-motion'
          ],
          // Firebase chunk
          firebase: [
            'firebase/app',
            'firebase/firestore',
            'firebase/auth'
          ],
          // Charts and data visualization
          charts: [
            'recharts',
            'd3-scale',
            'd3-shape'
          ]
        },
        
        // Asset naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const name = path.basename(facadeModuleId, path.extname(facadeModuleId))
            return `js/${name}-[hash].js`
          }
          return 'js/[name]-[hash].js'
        },
        
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`
          }
          
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`
          }
          
          return `assets/[name]-[hash].${ext}`
        },
        
        entryFileNames: 'js/[name]-[hash].js'
      },
      
      // External dependencies (if using CDN)
      external: [
        // Uncomment to use CDN versions
        // 'react',
        // 'react-dom'
      ]
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Asset size limit
    assetsInlineLimit: 4096,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Report compressed size
    reportCompressedSize: true,
    
    // Write bundle to disk
    write: true,
    
    // Empty output directory before build
    emptyOutDir: true
  },
  
  // CSS optimizations
  css: {
    // PostCSS configuration
    postcss: {
      plugins: [
        // Autoprefixer for browser compatibility
        require('autoprefixer'),
        // CSS nano for minification
        require('cssnano')({
          preset: ['default', {
            // Optimize CSS
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            colormin: true,
            minifySelectors: true,
            minifyParams: true,
            minifyFontValues: true
          }]
        })
      ]
    }
  },
  
  // Server configuration for production preview
  preview: {
    port: 4173,
    host: true,
    strictPort: true
  },
  
  // Define global constants
  define: {
    // Remove development-only code
    __DEV__: false,
    // Build timestamp
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    // Version from package.json
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  
  // Optimization for AWS deployment
  optimizeDeps: {
    // Include dependencies that should be pre-bundled
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/firestore'
    ],
    
    // Exclude dependencies from pre-bundling
    exclude: [
      // Large libraries that are better loaded separately
    ]
  },
  
  // Asset processing
  assetsInclude: [
    // Include additional asset types
    '**/*.webp',
    '**/*.avif'
  ],
  
  // Environment variables
  envPrefix: ['VITE_', 'REACT_APP_'],
  
  // Base URL for assets (useful for CDN)
  base: '/',
  
  // Public directory
  publicDir: 'public',
  
  // Clear screen on rebuild
  clearScreen: false,
  
  // Log level
  logLevel: 'info'
})
