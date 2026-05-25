import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['electron-squirrel-startup', 'node-llama-cpp'],
      output: {
        format: 'es',
        entryFileNames: 'main.mjs',
        chunkFileNames: 'main-[name]-[hash].mjs',
      },
    },
  },
})
