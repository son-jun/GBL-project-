/**
 * 페이지 4. 소비대안 평가.
 *
 * 참가자는 각 소비대안에 대해 "이 소비가 나의 각 감성욕구를 얼마나
 * 충족시켜줄 것 같은가"를 1~10점으로 평가한다. 결과는 [소비대안 × 감성욕구]
 * 평가행렬이 되고, 이것이 SVD의 유일한 입력이다.
 *
 * 한 화면에 평가칸을 전부 띄우면 부스 활동으로는 부담이 크므로, 소비대안 하나씩
 * 카드로 넘겨가며 6개 욕구만 평가하는 방식으로 나눴다 (감성욕구 입력 화면과
 * 같은 1~10 버튼 UI를 재사용해 일관된 조작감을 준다).
 *
 * 욕구 입력 화면(NeedsPage)은 한 문항을 답하면 화면이 다음 문항으로 자동으로
 * 내려가는데, 이 화면에는 그 기능이 없어서 아쉬웠다는 피드백을 받아 같은
 * 패턴을 그대로 적용했다(2026-08-15) — 한 욕구를 채점하면 카드 안에서 다음
 * 욕구 줄로 스크롤된다.
 *
 * 대안을 넘길 때(다음/이전 대안, 상단 탭)는 새 대안 카드의 맨 위(아이콘·이름)로
 * 스크롤한다(2026-08-16 추가) — 이전 대안의 마지막 욕구 줄이 화면 중앙에 있는
 * 상태에서 대안이 바뀌면, 새 카드의 제목도 못 보고 중간 욕구부터 보이는
 * 문제가 있었다.
 */

import { useEffect, useRef, useState } from 'react'
import { Card, Lead, LinkButton, ProgressBar, ScoreButtons, SectionTitle } from '@/components/ui'
import { CONSUMPTION_ALTERNATIVES } from '@/config/alternatives'
import { NEED_AXES, NEED_SCORE_MAX } from '@/config/needs'
import { useSession } from '@/state/SessionContext'

export function RatingsPage() {
  const { alternativeRatings, setRating, ratingsComplete, ratingsCompletedAlternatives } =
    useSession()
  const [current, setCurrent] = useState(0)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const cardTopRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  const alternative = CONSUMPTION_ALTERNATIVES[current]
  const row = alternativeRatings[current]
  const rowComplete = row.every((v) => v !== null)

  // 대안이 바뀔 때(다음/이전 대안, 상단 탭) 새 카드의 맨 위로 스크롤한다.
  // goTo() 안에서 바로 scrollIntoView를 부르면 아직 이전 대안 기준으로 그려진
  // 레이아웃을 대상으로 계산되어 버려서(리액트가 새 대안의 DOM을 커밋하기 전),
  // 엉뚱한 위치로 스크롤되는 문제가 있었다 — 그래서 current가 실제로 바뀌고
  // 새 카드가 커밋된 뒤에 실행되는 이 effect에서 스크롤한다(2026-08-16).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    cardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [current])

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(CONSUMPTION_ALTERNATIVES.length - 1, index))
    setCurrent(clamped)
  }

  const handleSelect = (needIndex: number, value: number) => {
    setRating(current, needIndex, value)
    const next = needIndex + 1
    if (next < NEED_AXES.length && row[next] === null) {
      rowRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="lab-enter">
      <ProgressBar
        stepIndex={2}
        subLabel={`대안 ${current + 1}/${CONSUMPTION_ALTERNATIVES.length}`}
      />
      <SectionTitle>이 소비, 나에게 어떤 의미일까?</SectionTitle>
      <Lead>
        아래 소비가 나의 각 욕구를 얼마나 채워줄 것 같은지 {NEED_SCORE_MAX}점 만점으로
        평가해 주세요. 실제로 해본 적이 없어도 상상해서 답하면 됩니다.
      </Lead>

      {/* 대안들을 오가는 탭 — 완료된 대안은 체크 표시 */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CONSUMPTION_ALTERNATIVES.map((alt, i) => {
          const complete = alternativeRatings[i].every((v) => v !== null)
          const active = i === current
          return (
            <button
              key={alt.key}
              type="button"
              onClick={() => goTo(i)}
              className={`flex min-h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                active
                  ? 'border-lab-accent bg-lab-accent/15 text-lab-accent'
                  : complete
                    ? 'border-lab-positive/30 bg-lab-positive/5 text-lab-muted hover:border-lab-positive/50 hover:text-lab-text'
                    : 'border-lab-border bg-lab-surface-2 text-lab-muted hover:border-lab-accent/40 hover:text-lab-text'
              }`}
            >
              <span aria-hidden>{alt.icon}</span>
              <span className="hidden sm:inline">{alt.label}</span>
              {complete ? (
                <span aria-hidden className="text-lab-positive">
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div ref={cardTopRef} />
      <Card tone="accent">
        <div className="mb-4 flex items-center gap-3 border-b border-lab-border pb-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lab-surface-2 text-2xl">
            <span aria-hidden>{alternative.icon}</span>
          </span>
          <div>
            <p className="text-lg font-bold text-lab-text">{alternative.label}</p>
            <p className="text-xs text-lab-muted">{alternative.example}</p>
          </div>
        </div>

        <div className="space-y-4">
          {NEED_AXES.map((axis, needIndex) => {
            const value = row[needIndex]
            return (
              <div
                key={axis.key}
                ref={(el) => {
                  rowRefs.current[needIndex] = el
                }}
              >
                <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-lab-text">{axis.label}</span>
                  <span className="text-xs text-lab-muted">{axis.hint}</span>
                  {value !== null ? (
                    <span className="ml-auto font-mono text-base font-black text-lab-accent tabular-nums">
                      {value}
                    </span>
                  ) : null}
                </div>
                <ScoreButtons
                  value={value}
                  onChange={(v) => handleSelect(needIndex, v)}
                  label={`${alternative.label} - ${axis.label}`}
                />
              </div>
            )
          })}
        </div>
      </Card>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="min-h-11 flex-1 rounded-2xl border border-lab-border text-sm font-semibold text-lab-muted transition-all duration-150 hover:border-lab-accent/40 hover:text-lab-text active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
        >
          ← 이전 대안
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={current === CONSUMPTION_ALTERNATIVES.length - 1 || !rowComplete}
          className="min-h-11 flex-1 rounded-2xl border border-lab-border text-sm font-semibold text-lab-muted transition-all duration-150 hover:border-lab-accent/40 hover:text-lab-text active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
        >
          다음 대안 →
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-lab-border bg-lab-surface-2 px-4 py-2.5 text-center text-xs text-lab-muted">
        <span
          className={`font-mono font-bold ${ratingsComplete ? 'text-lab-positive' : 'text-lab-accent'}`}
        >
          {ratingsCompletedAlternatives}
        </span>
        {' / '}
        {CONSUMPTION_ALTERNATIVES.length} 개 대안 평가 완료
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <LinkButton to="/svd" size="lg" full disabled={!ratingsComplete}>
          다음: SVD 분석 →
        </LinkButton>
        <LinkButton to="/type" variant="secondary" size="lg">
          ← 뒤로
        </LinkButton>
      </div>
    </div>
  )
}
