import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use relative base so dist can be previewed directly
  base: "./",
  server: {
    port: 5173,
    open: true,
  },
}))
