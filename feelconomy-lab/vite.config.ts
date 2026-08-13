import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(ROOT, './src') },
  },
  server: { port: 5173, open: true },
  build: {
    // gzip 크기 보고를 끈다. 이 환경(Windows + OneDrive 경로)에서 vite의 gzip 계산
    // 단계가 네이티브 zlib 크래시를 일으켜 빌드가 중단되는 문제가 있었다.
    // 번들 결과에는 영향이 없고, 보고 문구만 사라진다.
    reportCompressedSize: false,
  },
})
