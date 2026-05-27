import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve('src/shared'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        format: 'cjs',
        entryFileNames: 'preload.cjs',
        chunkFileNames: 'preload-[name]-[hash].cjs',
      },
    },
  },
})
