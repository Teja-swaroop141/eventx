import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:80',
      '/socket.io': {
        target: 'http://localhost:80',
        ws: true
      }
    }
  },
  build: {
    outDir: '../dashboard',
    emptyOutDir: true
  }
})
