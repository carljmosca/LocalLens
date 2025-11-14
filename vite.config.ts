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
    }
  }
})
