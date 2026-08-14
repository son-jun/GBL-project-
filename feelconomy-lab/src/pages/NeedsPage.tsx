/**
 * 페이지 3. 현재 감성욕구 입력.
 *
 * 참가자는 "지금 이 순간 무엇을 원하는가"를 6개 축으로 1~10점 입력한다.
 * 이 벡터 q는 나중에 SVD로 만든 잠재공간에 투영되어, 소비대안 군집 중
 * 어디에 가장 가까운지를 찾는 기준점이 된다.
 */

import { useRef } from 'react'
import { Card, Lead, LinkButton, ProgressBar, ScoreButtons, SectionTitle } from '@/components/ui'
import { NEED_AXES, NEED_SCORE_MAX } from '@/config/needs'
import { useSession } from '@/state/SessionContext'

export function NeedsPage() {
  const { currentNeeds, setNeed, needsComplete } = useSession()
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])

  const answered = currentNeeds.filter((v) => v !== null).length

  const handleSelect = (index: number, value: number) => {
    setNeed(index, value)
    const next = index + 1
    if (next < NEED_AXES.length && currentNeeds[next] === null) {
      rowRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="lab-enter">
      <ProgressBar stepIndex={0} />
      <SectionTitle>지금 나는 무엇을 원할까?</SectionTitle>
      <Lead>
        정답은 없습니다. 지금 이 순간 느껴지는 대로 {NEED_SCORE_MAX}점 만점으로 눌러 주세요.
      </Lead>

      {/* z-40 = index.css에 적어 둔 "화면에 고정되는 막대" 단계 */}
      <div className="sticky top-0 z-40 -mx-4 mb-4 border-b border-lab-border bg-lab-bg/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-mono font-bold text-lab-accent">{answered}</span>
            <span className="text-lab-muted"> / {NEED_AXES.length} 문항 완료</span>
          </p>
          <LinkButton to="/type" disabled={!needsComplete}>
            다음: 내 유형 확인하기 →
          </LinkButton>
        </div>
      </div>

      {/* 번호가 매겨진 문항 묶음이므로 ol/li로 표시한다. 보조기술이 "6개 중 3번째"
          같은 위치를 읽어 줄 수 있고, 마커는 list-none으로 감춘다 */}
      <ol className="list-none space-y-3 p-0">
        {NEED_AXES.map((axis, index) => {
          const value = currentNeeds[index]
          return (
            <li
              key={axis.key}
              ref={(el) => {
                rowRefs.current[index] = el
              }}
              className="lab-stagger"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className={value === null ? '' : 'border-lab-accent/30'}>
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-lab-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base font-bold text-lab-text">{axis.label}</span>
                  <span className="text-xs text-lab-muted">{axis.hint}</span>
                  {value !== null ? (
                    <span className="ml-auto font-mono text-lg font-black text-lab-text tabular-nums">
                      {value}
                      <span className="text-xs font-normal text-lab-muted">/{NEED_SCORE_MAX}</span>
                    </span>
                  ) : null}
                </div>
                <ScoreButtons
                  value={value}
                  onChange={(v) => handleSelect(index, v)}
                  label={axis.label}
                />
                <div className="mt-1.5 flex justify-between px-1 text-[10px] text-lab-muted">
                  <span>전혀 아니다</span>
                  <span>매우 그렇다</span>
                </div>
              </Card>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <LinkButton to="/type" size="lg" full disabled={!needsComplete}>
          {needsComplete
            ? '다음: 내 유형 확인하기 →'
            : `${NEED_AXES.length - answered}개 문항이 남았습니다`}
        </LinkButton>
        <LinkButton to="/consent" variant="secondary" size="lg">
          ← 뒤로
        </LinkButton>
      </div>
    </div>
  )
}
