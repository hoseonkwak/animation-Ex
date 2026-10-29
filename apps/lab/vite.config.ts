import { cloudflare } from '@cloudflare/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    cloudflare({
      ...(process.env.KWAK_E2E_STATE_DIR
        ? { persistState: { path: process.env.KWAK_E2E_STATE_DIR } }
        : {}),
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
