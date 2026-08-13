import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

/**
 * GitHub Pages의 프로젝트 사이트는 https://<계정>.github.io/<저장소>/ 처럼
 * 하위 경로에서 서비스된다. 그래서 빌드할 때만 base를 그 경로로 바꿔야 한다.
 *
 * 환경변수로 받는 이유: base를 코드에 고정하면 로컬 `npm run dev`도
 * localhost:5173/<저장소>/ 로 열려서 불편하다. 배포(Actions)에서만
 * VITE_BASE를 넘기고, 로컬은 기본값 '/'를 쓴다.
 */
const BASE = process.env.VITE_BASE ?? '/'

/**
 * GitHub Pages는 서버 라우팅을 설정할 수 없어서, /needs 같은 주소로 직접
 * 들어오면(새로고침·QR 링크·주소 직접 입력) 정적 파일이 없다고 404를 준다.
 * Pages는 그때 404.html을 돌려주므로, index.html과 똑같은 내용을 404.html로
 * 복사해 두면 SPA 셸이 로드되고 react-router가 주소를 알아서 처리한다.
 *
 * 셸 스크립트(cp) 대신 플러그인으로 만든 이유는 윈도우에서도 같은 명령으로
 * 빌드가 되게 하기 위함이다.
 */
function spaFallback404(): Plugin {
  return {
    name: 'feelconomy-spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(ROOT, 'dist')
      const indexHtml = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexHtml)) return
      fs.copyFileSync(indexHtml, path.join(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss(), spaFallback404()],
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
