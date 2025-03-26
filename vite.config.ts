import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['recharts'], // Deduplicate recharts to avoid module resolution issues
  },
  optimizeDeps: {
    include: ['recharts'], // Include recharts in optimization for better compatibility
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true, // Handle mixed ES modules in CommonJS
      include: [/recharts/, /node_modules/] // Include these in transformation
    }
  },
  server: {
    fs: {
      strict: false // Less strict file serving
    }
  }
})
