import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

const SHARED_ALIAS = path.resolve('src/shared')

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': SHARED_ALIAS,
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        '@shared': SHARED_ALIAS,
      },
    },
    build: {
      lib: {
        entry: 'src/preload/index.ts',
        formats: ['cjs'],
      },
      rollupOptions: {
        output: {
          entryFileNames: 'index.cjs',
        },
      },
    },
  },
  renderer: {
    root: '.',
    resolve: {
      alias: {
        '@shared': SHARED_ALIAS,
        '@': path.resolve('src/renderer'),
      },
    },
    plugins: [
      tailwindcss(),
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
    ],
    build: {
      rollupOptions: {
        input: path.resolve('index.html'),
      },
    },
  },
})
