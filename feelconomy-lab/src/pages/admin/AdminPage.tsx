/**
 * 관리자 페이지 (v2).
 *
 * v1은 4개 탭(기준 데이터셋 / 모델 구축 / 군집 분석 / 참가자 데이터)이 필요했다.
 * v2는 사전 학습이라는 절차 자체가 없으므로 2개 탭으로 줄었다:
 *   1. 분석 규격 — 지금 코드에 고정된 축·대안·K·r 값을 확인한다 (실행 아님)
 *   2. 참가자 데이터 — 조회 및 CSV 내보내기
 */

import { useState } from 'react'
import { LinkButton, SectionTitle } from '@/components/ui'
import { AdminParticipantsTab } from './AdminParticipantsTab'
import { AdminSpecTab } from './AdminSpecTab'

const TABS = [
  { id: 'spec', label: '분석 규격', icon: '🧭' },
  { id: 'participants', label: '참가자 데이터', icon: '👥' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminPage() {
  const [tab, setTab] = useState<TabId>('spec')

  return (
    <div className="lab-enter">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <SectionTitle>관리자</SectionTitle>
        <LinkButton to="/" variant="secondary">
          참가자 화면 →
        </LinkButton>
      </div>

      <div
        role="tablist"
        aria-label="관리자 기능"
        className="mb-4 flex gap-1 overflow-x-auto border-b border-lab-border pb-px"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-t-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? 'border-b-2 border-lab-accent bg-lab-surface text-lab-accent'
                : 'text-lab-muted hover:text-lab-text'
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'spec' ? <AdminSpecTab /> : null}
      {tab === 'participants' ? <AdminParticipantsTab /> : null}
    </div>
  )
}
