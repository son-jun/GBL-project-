import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

// 수학 모듈 단위 테스트 전용 설정 (요구사항 §26).
// UI를 렌더링하지 않으므로 node 환경으로 충분하고, 실행이 매우 빠르다.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(ROOT, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
