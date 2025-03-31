import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Ensure proper asset paths in production
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure proper chunking
        manualChunks: undefined
      }
    }
  }
})
