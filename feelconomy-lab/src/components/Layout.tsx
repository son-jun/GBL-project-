/**
 * 전체 레이아웃 (v2).
 *
 * v1 헤더에는 "모델 버전 배지"와 "DEMO 데이터 배지"가 있었다 — 기준 데이터셋으로
 * 학습한 모델이 있는지, 그것이 합성 데이터인지를 항상 보여줘야 했기 때문이다.
 * v2는 그런 사전 모델이 없으므로 두 배지 모두 제거되었다. 대신 학교 로고를
 * 헤더에 작게 배치해 브랜드 정체성을 드러낸다.
 */

import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSession } from '@/state/SessionContext'
import { SchoolLogo } from './SchoolLogo'

export function Layout({ children }: { children: ReactNode }) {
  const { participantId } = useSession()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <SchoolLogo size={30} />
          <span className="flex items-baseline gap-2">
            <span className="text-xl font-black tracking-tight text-lab-text sm:text-2xl">
              FEELCONOMY
            </span>
            {/* LAB 배지는 학교 로고의 짙은 그린. 강조 테라코타와 144° 떨어져 있어
                머리말에서 두 색이 서로를 받쳐 준다 (v3까지는 화면 전체가 주황 하나였다) */}
            <span className="rounded-lg bg-brand-green px-1.5 py-0.5 font-mono text-xs font-black text-white">
              LAB
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {participantId ? (
            <span className="rounded-lg border border-lab-accent/30 bg-lab-accent/10 px-2 py-0.5 font-mono text-[11px] font-bold text-lab-accent">
              {participantId}
            </span>
          ) : null}
          <Link
            to={isAdmin ? '/' : '/admin'}
            className="rounded-lg border border-lab-border px-2 py-0.5 text-[11px] text-lab-muted transition-colors duration-150 hover:border-lab-accent/50 hover:bg-lab-surface-2 hover:text-lab-text"
          >
            {isAdmin ? '참가자 화면' : '관리자'}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 flex items-center justify-center gap-2 border-t border-lab-border pt-6 text-[11px] text-lab-muted-2">
        <SchoolLogo size={16} />
        <span>대천대신고등학교 오량진 GBL 부스</span>
      </footer>
    </div>
  )
}
