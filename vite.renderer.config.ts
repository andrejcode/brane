import path from 'node:path'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve('src/shared'),
      '@': path.resolve('src/renderer'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
})
