import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  base: process.env.GITHUB_PAGES ? '/LocalLens/' : '/',
  optimizeDeps: {
    exclude: ['@huggingface/transformers']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    // Ensure assets are properly referenced
    assetsDir: 'assets',
    // Generate source maps for debugging
    sourcemap: false,
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'transformers': ['@huggingface/transformers']
        }
      }
    },
    // Ensure service worker and manifest are copied
    copyPublicDir: true
  },
  // PWA configuration
  define: {
    // Enable PWA features in production
    __PWA_ENABLED__: JSON.stringify(process.env.NODE_ENV === 'production'),
    // Pass build info to runtime
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})
