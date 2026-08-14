/**
 * 페이지 7. 군집 판정.
 *
 * 이 페이지에서 전체 분석(SVD + k-means)을 실행하고 참가자 레코드를 저장한다.
 * 표현 규칙: "당신은 무조건 ○○형이다"가 아니라
 * "현재 욕구가 ○○ 집단과 가장 가까운 것으로 나타났습니다."
 */

import { useEffect, useState } from 'react'
import { FlowGuard } from '@/components/FlowGuard'
import { PersonalMap } from '@/components/PersonalMap'
import {
  AnimatedBar,
  Card,
  ClusterBadge,
  clusterColor,
  FormulaDetails,
  Lead,
  LinkButton,
  Notice,
  ProgressBar,
  SectionTitle,
} from '@/components/ui'
import { ALTERNATIVE_DIM } from '@/config/alternatives'
import { CLUSTER_NAMING_EXPLANATION } from '@/lib/math/clusterNaming'
import { formatCoordinate, formatDistance } from '@/lib/util/format'
import { useSession } from '@/state/SessionContext'

export function ClusterPage() {
  const { computeAndSave, result } = useSession()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    computeAndSave().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e))
    })
  }, [computeAndSave])

  return (
    <div className="lab-enter">
      <ProgressBar stepIndex={5} />
      {error ? (
        <div className="space-y-4">
          <Notice tone="danger" title="결과를 계산하지 못했습니다">
            {error}
          </Notice>
          <LinkButton to="/needs" variant="secondary">
            ← 처음부터 다시 확인
          </LinkButton>
        </div>
      ) : (
        <FlowGuard requireResult>
          {() => (result ? <ClusterContent /> : <Notice tone="info">계산 중입니다…</Notice>)}
        </FlowGuard>
      )}
    </div>
  )
}

function ClusterContent() {
  const { result } = useSession()
  if (!result) return null

  const ranked = result.clusters
    .map((cluster) => ({ cluster, distance: result.distancesToClusters[cluster.index] }))
    .sort((a, b) => a.distance - b.distance)
  const nearest = ranked[0]
  const maxDistance = ranked[ranked.length - 1].distance || 1

  return (
    <>
      <SectionTitle>어느 소비 군집이 가장 가까울까?</SectionTitle>
      <Lead>
        소비대안 {ALTERNATIVE_DIM}개를 {result.k}개 군집으로 나누고, 지금 내 욕구점에서 각
        군집 중심까지 거리를 재서 비교합니다.
      </Lead>

      <PersonalMap
        alternativeLatent={result.alternativeLatent}
        needProjected={result.needProjected}
        clusters={result.clusters}
        highlightCluster={result.assignedCluster}
        showDistanceLines
        height={340}
      />

      <Card className="mt-4">
        <p className="mb-1 text-sm font-bold text-lab-text">군집 중심까지의 거리</p>
        <p className="mb-4 text-xs text-lab-muted">
          짧을수록 지금 내 욕구와 가깝습니다.
        </p>

        <div className="space-y-2.5">
          {ranked.map(({ cluster, distance }, rank) => {
            const isNearest = rank === 0
            const color = clusterColor(cluster.index)
            return (
              <div
                key={cluster.index}
                className="lab-stagger flex items-center gap-2 sm:gap-3"
                style={{ animationDelay: `${rank * 70}ms` }}
              >
                <span
                  className={`w-6 shrink-0 text-center font-mono text-xs ${isNearest ? 'font-black text-lab-accent' : 'text-lab-muted'}`}
                >
                  {isNearest ? '1위' : rank + 1}
                </span>
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold"
                  style={{ backgroundColor: color, color: 'var(--color-lab-bg)' }}
                >
                  {cluster.displayNumber}
                </span>
                <span
                  className={`w-20 shrink-0 truncate text-xs sm:w-28 sm:text-sm ${isNearest ? 'font-bold text-lab-text' : 'text-lab-muted'}`}
                >
                  {cluster.name}
                </span>
                <AnimatedBar
                  percent={Math.max(6, (distance / maxDistance) * 100)}
                  delayMs={rank * 130}
                  fillStyle={{ backgroundColor: isNearest ? color : `${color}55` }}
                  heightClassName="h-5"
                  roundedClassName="rounded-md"
                />
                <span
                  className={`w-14 shrink-0 text-right font-mono text-sm tabular-nums ${isNearest ? 'font-black text-lab-accent' : 'text-lab-muted'}`}
                >
                  {formatDistance(distance)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card tone="accent" className="relative mt-4 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-lab-accent/25 to-lab-accent-2/10 blur-2xl"
        />
        <p className="relative mb-2 font-mono text-xs tracking-[0.2em] text-lab-accent">판정 결과</p>
        <p className="mb-3 text-base leading-relaxed text-lab-text sm:text-lg">
          현재 나의 욕구가{' '}
          <span className="inline-block align-middle">
            <ClusterBadge index={nearest.cluster.index} name={nearest.cluster.name} />
          </span>{' '}
          군집과 <strong className="text-lab-accent">가장 가까운 것</strong>으로 나타났습니다.
        </p>
        <p className="text-xs leading-relaxed text-lab-muted">
          {ranked[1] ? (
            <>
              2위 집단(<span className="text-lab-text">{ranked[1].cluster.name}</span>)과의 거리
              차이는{' '}
              <span className="font-mono text-lab-text">
                {formatDistance(result.marginToSecondCluster)}
              </span>{' '}
              입니다.
              {result.marginToSecondCluster < 1
                ? ' 차이가 작기 때문에, 욕구 점수를 조금만 다르게 눌렀다면 다른 군집으로 판정될 수도 있었습니다.'
                : ' 차이가 충분히 크기 때문에 이 판정은 비교적 뚜렷합니다.'}
            </>
          ) : null}
        </p>
      </Card>

      <Notice tone="info" title="이 군집 이름은 어떻게 만들어졌나요?">
        {CLUSTER_NAMING_EXPLANATION}
      </Notice>

      <FormulaDetails summary="수식으로 보기">
        <p>각 군집 중심까지의 거리:</p>
        <p className="my-2 text-lab-text">Dk = ‖q* − μk‖</p>
        <div className="mt-3 space-y-1">
          {result.clusters.map((cluster) => (
            <p key={cluster.index}>
              D{cluster.displayNumber} = ‖[{result.needProjected.map((v) => formatCoordinate(v)).join(', ')}] − [
              {cluster.centroid.map((v) => formatCoordinate(v)).join(', ')}]‖ ={' '}
              <span className="text-lab-text">
                {result.distancesToClusters[cluster.index].toFixed(3)}
              </span>
            </p>
          ))}
        </div>
        <p className="mt-3">
          가장 작은 값을 가진 군집을 선택합니다 →{' '}
          <span className="text-lab-accent">
            {nearest.cluster.displayNumber}. {nearest.cluster.name}
          </span>
        </p>
        <p className="mt-4 border-t border-lab-border pt-3">
          군집은 k-means++ 로 {result.k}개 나뉘었습니다 (WCSS={result.wcss.toFixed(2)}, 평균
          silhouette={result.silhouette.toFixed(3)}). 분석 규격 버전:{' '}
          <span className="text-lab-text">{result.specVersion}</span>
        </p>
      </FormulaDetails>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <LinkButton to="/result" size="lg" full>
          다음: 잠재수요 결과 보기 →
        </LinkButton>
        <LinkButton to="/map" variant="secondary" size="lg">
          ← 뒤로
        </LinkButton>
      </div>
    </>
  )
}
