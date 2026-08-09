import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor'
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@phosphor-icons')) return 'ui'
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs')) return 'charts'
          if (id.includes('node_modules/axios') || id.includes('node_modules/xlsx') || id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/leaflet')) return 'utils'
        },
      },
    },
    sourcemap: false,
    cssMinify: true,
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
