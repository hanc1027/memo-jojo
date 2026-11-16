import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/memos': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // 將前端輸出至 server/public 資料夾，docker build 時一並處理
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
})
