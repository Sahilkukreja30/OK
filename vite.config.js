import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import devApiPlugin from './scripts/devApiPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApiPlugin()],
})
