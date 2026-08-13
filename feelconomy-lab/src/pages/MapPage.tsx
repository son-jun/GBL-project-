/** 페이지 6. 잠재공간 지도 */

import { useMemo, useState } from 'react'
import { FlowGuard } from '@/components/FlowGuard'
import { PersonalMap } from '@/components/PersonalMap'
import { Card, Lead, LinkButton, Notice, ProgressBar, SectionTitle } from '@/components/ui'
import { ANALYSIS_SPEC } from '@/config/model'
import { computeSvd, projectMatrixToLatent, projectToLatent } from '@/lib/math/svd'
import { formatCoordinate } from '@/lib/util/format'
import { useSession } from '@/state/SessionContext'

export function MapPage() {
  return (
    <div className="lab-enter">
      <ProgressBar stepIndex={4} />
      <FlowGuard>
        {({ needsVector, ratingsMatrix }) => (
          <MapContent needsVector={needsVector} ratingsMatrix={ratingsMatrix} />
        )}
      </FlowGuard>
    </div>
  )
}

function MapContent({
  needsVector,
  ratingsMatrix,
}: {
  needsVector: number[]
  ratingsMatrix: number[][]
}) {
  const { latentDim } = useSession()
  const [axes, setAxes] = useState<[number, number]>([0, 1])

  const svd = useMemo(() => computeSvd(ratingsMatrix, latentDim), [ratingsMatrix, latentDim])
  const alternativeLatent = useMemo(
    () => projectMatrixToLatent(ratingsMatrix, svd.loadings),
    [ratingsMatrix, svd],
  )
  const needProjected = useMemo(
    () => projectToLatent(needsVector, svd.loadings),
    [needsVector, svd],
  )

  return (
    <>
      <SectionTitle>내 소비대안들의 지도</SectionTitle>
      <Lead>
        압축한 좌표를 지도 위 점으로 그렸습니다. 소비대안 8개와 지금 내 욕구가 같은
        공간 위에 놓입니다.
      </Lead>

      {latentDim > 2 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-lab-muted">표시할 축:</span>
          {[0, 1].map((slot) => (
            <select
              key={slot}
              value={axes[slot]}
              onChange={(e) => {
                const next: [number, number] = [...axes]
                next[slot] = Number(e.target.value)
                setAxes(next)
              }}
              className="rounded-lg border border-lab-border bg-lab-surface-2 px-2 py-1 text-lab-text"
            >
              {Array.from({ length: latentDim }, (_, k) => (
                <option key={k} value={k}>
                  잠재축 {k + 1}
                </option>
              ))}
            </select>
          ))}
        </div>
      ) : null}

      <PersonalMap
        alternativeLatent={alternativeLatent}
        needProjected={needProjected}
        axisX={axes[0]}
        axisY={axes[1]}
      />

      <Card className="mt-4">
        <p className="mb-2 text-sm font-bold text-lab-text">이 지도를 읽는 방법</p>
        <ul className="space-y-2 text-xs leading-relaxed text-lab-muted">
          <li className="flex gap-2">
            <span aria-hidden className="text-lab-accent-2">
              ●
            </span>
            <span>
              주황색 점 8개는 각각 <strong className="text-lab-text">소비대안</strong>입니다.
              가까운 위치에 있는 두 소비는 내 평가에서 비슷한 욕구 조합을 충족시킵니다.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-[var(--color-mark-me)]">
              ●
            </span>
            <span>
              진한 갈색 십자 표식이{' '}
              <strong className="text-[var(--color-mark-me)]">지금 내 욕구</strong>입니다. 좌표는
              축 {axes[0] + 1} = {formatCoordinate(needProjected[axes[0]])}, 축 {axes[1] + 1} ={' '}
              {formatCoordinate(needProjected[axes[1]])} 입니다.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-lab-accent">
              ✛
            </span>
            <span>
              가운데 굵은 선(0, 0)은 이 좌표계의 원점입니다. 아직 군집은 나누지 않았습니다 —
              다음 단계에서 이 8개 점을 K={ANALYSIS_SPEC.defaultK}개 그룹으로 나눕니다.
            </span>
          </li>
        </ul>
      </Card>

      <Notice tone="info" title="가까이 있다는 것은 무슨 뜻일까?">
        {'지도에서 가까운 두 소비대안은 "내가 평가한 욕구 충족 패턴이 비슷하다"는 뜻입니다.\n' +
          '내 욕구점과 가까운 소비대안일수록, 지금 나의 욕구를 잘 채워줄 가능성이 있습니다.'}
      </Notice>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <LinkButton to="/cluster" size="lg" full>
          다음: 군집으로 나누기 →
        </LinkButton>
        <LinkButton to="/svd" variant="secondary" size="lg">
          ← 뒤로
        </LinkButton>
      </div>
    </>
  )
}
