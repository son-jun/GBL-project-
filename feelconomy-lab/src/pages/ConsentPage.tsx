/** 페이지 2. 익명 참여 안내 — 요구사항 §15, §18 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Lead, LinkButton, Notice, SectionTitle } from '@/components/ui'
import { useSession } from '@/state/SessionContext'

const NOT_COLLECTED = ['이름', '전화번호', '이메일', '학번', '학교', '생년월일']

const COLLECTED = [
  { label: '현재 감성욕구 6개', detail: '각각 1~10점' },
  { label: '소비대안 8개 평가', detail: '48개 점수, 각각 1~10점' },
  { label: '입력 시각', detail: '분석 순서 확인용' },
  { label: '자동 생성 익명 ID', detail: '예: P-20260814-001' },
]

export function ConsentPage() {
  const { beginSession } = useSession()
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)

  const start = async () => {
    setBusy(true)
    try {
      await beginSession()
      navigate('/needs')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lab-enter space-y-5">
      <SectionTitle>익명으로 참여합니다</SectionTitle>
      <Lead>
        이 활동은 개인을 알아내기 위한 것이 아니라, 내가 입력한 데이터로 데이터
        분석 과정을 직접 체험하기 위한 것입니다.
      </Lead>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card tone="accent">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-lab-accent">
            <span aria-hidden>✔</span> 이것만 저장합니다
          </p>
          <ul className="space-y-2">
            {COLLECTED.map((item) => (
              <li key={item.label} className="text-sm">
                <span className="font-semibold text-lab-text">{item.label}</span>
                <span className="ml-2 text-xs text-lab-muted">{item.detail}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-lab-muted">
            <span aria-hidden>✖</span> 이것은 받지 않습니다
          </p>
          <ul className="flex flex-wrap gap-2">
            {NOT_COLLECTED.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-lab-border px-2.5 py-1 text-xs text-lab-muted line-through"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-lab-muted">
            익명 ID는 <span className="font-mono text-lab-text">P-날짜-순번</span> 형식으로 자동
            생성됩니다. 이 ID로는 누가 입력했는지 알 수 없습니다.
          </p>
        </Card>
      </div>

      <Notice tone="info" title="이 분석은 오직 내 데이터로만 계산됩니다">
        {'다른 참가자의 데이터는 계산에 전혀 쓰이지 않습니다.\n' +
          '내가 입력한 욕구와 대안 평가만으로 SVD와 군집 분석이 그 자리에서 완결됩니다.'}
      </Notice>

      <Card>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-lab-accent)]"
          />
          <span className="text-sm leading-relaxed text-lab-text">
            위 내용을 확인했고, 익명으로 입력한 데이터가 이 탐구 활동의 분석에 사용되는 것에
            동의합니다.
          </span>
        </label>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button onClick={() => void start()} disabled={!agreed || busy} size="lg" full>
          {busy ? '참가자 ID 발급 중…' : '동의하고 시작 →'}
        </Button>
        <LinkButton to="/" variant="secondary" size="lg">
          ← 뒤로
        </LinkButton>
      </div>
    </div>
  )
}
