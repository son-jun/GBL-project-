/**
 * 학교 로고 표시 컴포넌트.
 *
 * `public/branding/school-logo.png` 파일이 있으면 보여주고, 없으면 아무것도
 * 렌더링하지 않는다 (깨진 이미지 아이콘이 뜨지 않게 onError로 숨긴다).
 * 이렇게 만들어 두면 로고 파일을 나중에 그 경로에 넣기만 해도 사이트 전체에
 * 자동으로 반영된다 — 코드를 다시 손댈 필요가 없다.
 */

import { useState } from 'react'

export function SchoolLogo({
  size = 40,
  className = '',
  glow = false,
}: {
  size?: number
  className?: string
  glow?: boolean
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <img
      // BASE_URL을 붙인다. 절대경로('/branding/...')로 두면 GitHub Pages처럼
      // 하위 경로(/<저장소>/)에서 서비스될 때 파일을 찾지 못하고, 아래 onError가
      // 이미지를 숨겨버려서 로고가 조용히 사라진다. BASE_URL은 항상 '/'로
      // 끝나므로 로컬('/')과 배포('/<저장소>/') 양쪽에서 올바른 경로가 된다.
      src={`${import.meta.env.BASE_URL}branding/school-logo.png`}
      alt="대천대신고등학교 오량진 로고"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-contain ${glow ? 'shadow-[0_0_28px_rgba(31,94,76,0.22)]' : ''} ${className}`}
    />
  )
}
