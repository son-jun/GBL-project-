import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root 엘리먼트를 찾을 수 없습니다.')

/*
 * basename에 BASE_URL을 넘긴다.
 *
 * GitHub Pages 프로젝트 사이트는 /<저장소>/ 하위에서 서비스되므로, 라우터도
 * 그 접두사를 알아야 /needs 같은 경로를 올바로 매칭한다. 로컬 개발에서는
 * BASE_URL이 '/'라서 아무 영향이 없다 (vite.config.ts의 base 설명 참고).
 */
createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
