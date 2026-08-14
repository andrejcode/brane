import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve('src/shared'),
    },
  },
  build: {
    lib: {
      entry: 'src/main/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'better-sqlite3',
        'electron-squirrel-startup',
        'node-llama-cpp',
      ],
      output: {
        format: 'es',
        entryFileNames: 'main.mjs',
        chunkFileNames: 'main-[name]-[hash].mjs',
      },
    },
  },
})
