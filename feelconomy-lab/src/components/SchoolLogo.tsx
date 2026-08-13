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
      src="/branding/school-logo.png"
      alt="대천대신고등학교 오량진 로고"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-contain ${glow ? 'shadow-[0_0_24px_rgba(255,122,74,0.28)]' : ''} ${className}`}
    />
  )
}
