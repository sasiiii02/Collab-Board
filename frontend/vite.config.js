import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,        // 🔥 IMPORTANT for Docker
    port: 5173,
    watch: {
      usePolling: true // 🔥 IMPORTANT for Windows + Docker
    }
  }
})