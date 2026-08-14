/**
 * 개인 잠재공간 지도 (v2).
 *
 * v1의 LatentMap은 기준 데이터셋 참가자 수백 명의 점을 배경에 뿌리고 그 안에서
 * 내 위치를 찾는 그림이었다. v2에는 그런 배경 집단이 없다 — 지도에 그려지는
 * 점은 오직 "내 소비대안 전체"와 "내 현재 욕구 1개"뿐이다. 점이 적으므로
 * 범례 대신 각 점 옆에 아이콘과 이름을 직접 라벨로 붙인다.
 *
 * clusters를 넘기지 않으면 모든 소비대안이 같은 중립색으로 그려진다 (아직
 * 군집화 전 단계). clusters를 넘기면 소비대안이 군집별 색으로 칠해지고
 * 군집 중심이 함께 표시된다 (군집 판정 이후 단계).
 *
 * ----------------------------------------------------------------------------
 *  모션 (2026-08-15 추가)
 * ----------------------------------------------------------------------------
 * "지도가 유동적으로 움직였으면 좋겠다"는 요청에 따라 두 종류의 모션을 넣었다.
 *   ① 등장 — 점·군집 중심·거리선이 lab-stagger로 순서대로 나타난다. 소비대안
 *      점 → (조금 늦게) 군집 중심·거리선 → (가장 늦게) 내 욕구점 순서로,
 *      "데이터가 하나씩 자리를 잡아가는" 느낌을 준다.
 *   ② 전환 — SVD 페이지에서 잠재축 r을 바꾸거나(축 3개 중 2개 선택), 이
 *      페이지의 "표시할 축" 선택을 바꾸면 좌표가 바뀐다. cx/cy/x/y 같은 SVG
 *      위치 속성에 CSS transition을 걸어서, 점이 순간이동하지 않고 새 위치로
 *      미끄러지듯 움직이게 했다(SVG2 이후 cx/cy/x/y는 CSS 트랜지션 대상이 될
 *      수 있는 표준 속성이다).
 * 내 욕구점에는 추가로 lab-pulse-ring(index.css, §5 규칙 4의 예외)을 얹어
 * 계속 옅게 신호를 보내게 했다 — 지도에서 가장 먼저 찾아야 할 점이기 때문이다.
 */

import { useMemo, type CSSProperties } from 'react'
import { clusterColor } from './ui'
import { CONSUMPTION_ALTERNATIVES } from '@/config/alternatives'
import type { AlternativeCluster } from '@/lib/types'

interface PersonalMapProps {
  alternativeLatent: number[][]
  needProjected: number[]
  clusters?: AlternativeCluster[]
  highlightCluster?: number | null
  showDistanceLines?: boolean
  axisX?: number
  axisY?: number
  height?: number
}

/** 프로젝트 공통 스프링 이징(docs/06) — 위치 전환에도 같은 것을 쓴다 */
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const GLIDE_DURATION = '0.6s'

/** 넘겨준 SVG 속성들에 부드러운 전환을 거는 style 객체를 만든다 */
function glide(...props: string[]): CSSProperties {
  return { transition: props.map((p) => `${p} ${GLIDE_DURATION} ${EASE}`).join(', ') }
}

export function PersonalMap({
  alternativeLatent,
  needProjected,
  clusters,
  highlightCluster,
  showDistanceLines = false,
  axisX = 0,
  axisY = 1,
  height = 380,
}: PersonalMapProps) {
  const PADDING = { top: 20, right: 20, bottom: 34, left: 44 }
  const WIDTH = 640
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = height - PADDING.top - PADDING.bottom

  const clusterOf = useMemo(() => {
    if (!clusters) return null
    const map = new Array<number>(alternativeLatent.length).fill(-1)
    clusters.forEach((cluster) => {
      for (const i of cluster.memberIndices) map[i] = cluster.index
    })
    return map
  }, [clusters, alternativeLatent.length])

  const scale = useMemo(() => {
    const xs = [...alternativeLatent.map((p) => p[axisX]), needProjected[axisX]]
    const ys = [...alternativeLatent.map((p) => p[axisY]), needProjected[axisY]]
    if (clusters) {
      for (const c of clusters) {
        xs.push(c.centroid[axisX])
        ys.push(c.centroid[axisY])
      }
    }
    const pad = (min: number, max: number) => {
      const margin = (max - min) * 0.18 || 1
      return [min - margin, max + margin] as const
    }
    const [xMin, xMax] = pad(Math.min(...xs), Math.max(...xs))
    const [yMin, yMax] = pad(Math.min(...ys), Math.max(...ys))
    return {
      xMin,
      xMax,
      yMin,
      yMax,
      toX: (v: number) => PADDING.left + ((v - xMin) / (xMax - xMin)) * plotWidth,
      toY: (v: number) => PADDING.top + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight,
    }
  }, [alternativeLatent, needProjected, clusters, axisX, axisY, plotWidth, plotHeight, PADDING.left, PADDING.top])

  const ticks = (min: number, max: number) => {
    const step = niceStep((max - min) / 4)
    const start = Math.ceil(min / step) * step
    const values: number[] = []
    for (let v = start; v <= max + 1e-9; v += step) values.push(Number(v.toFixed(6)))
    return values
  }
  const xTicks = ticks(scale.xMin, scale.xMax)
  const yTicks = ticks(scale.yMin, scale.yMax)

  const meX = scale.toX(needProjected[axisX])
  const meY = scale.toY(needProjected[axisY])

  // 등장 순서: 소비대안 점들 → 군집 중심/거리선 → 내 욕구점. 각 단계 안에서는
  // 인덱스 순서로 조금씩 늦게 나타난다.
  const pointStagger = 45
  const clusterStartDelay = alternativeLatent.length * pointStagger + 150
  const meStartDelay = clusterStartDelay + (clusters?.length ?? 0) * pointStagger + 150

  const describedAlternatives = alternativeLatent
    .map((p, i) => `${CONSUMPTION_ALTERNATIVES[i].label}(${p[axisX].toFixed(1)}, ${p[axisY].toFixed(1)})`)
    .join(', ')

  return (
    <div className="overflow-hidden rounded-2xl border border-lab-border bg-lab-surface-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`잠재공간 지도. 소비대안 ${alternativeLatent.length}개: ${describedAlternatives}. 내 욕구 위치: (${needProjected[axisX].toFixed(1)}, ${needProjected[axisY].toFixed(1)})`}
      >
        {xTicks.map((tick) => (
          <g key={`x${tick}`}>
            <line
              x1={scale.toX(tick)}
              y1={PADDING.top}
              x2={scale.toX(tick)}
              y2={PADDING.top + plotHeight}
              stroke="var(--color-lab-border)"
              strokeWidth={tick === 0 ? 1.4 : 0.5}
              opacity={tick === 0 ? 0.9 : 0.4}
            />
            <text
              x={scale.toX(tick)}
              y={height - 14}
              textAnchor="middle"
              className="font-mono"
              fontSize="10"
              fill="var(--color-lab-muted)"
              style={glide('x')}
            >
              {tick}
            </text>
          </g>
        ))}
        {yTicks.map((tick) => (
          <g key={`y${tick}`}>
            <line
              x1={PADDING.left}
              y1={scale.toY(tick)}
              x2={PADDING.left + plotWidth}
              y2={scale.toY(tick)}
              stroke="var(--color-lab-border)"
              strokeWidth={tick === 0 ? 1.4 : 0.5}
              opacity={tick === 0 ? 0.9 : 0.4}
            />
            <text
              x={PADDING.left - 7}
              y={scale.toY(tick) + 3}
              textAnchor="end"
              className="font-mono"
              fontSize="10"
              fill="var(--color-lab-muted)"
              style={glide('y')}
            >
              {tick}
            </text>
          </g>
        ))}

        <text x={PADDING.left + plotWidth / 2} y={height - 2} textAnchor="middle" fontSize="10" fill="var(--color-lab-muted)">
          잠재축 {axisX + 1}
        </text>
        <text
          x={11}
          y={PADDING.top + plotHeight / 2}
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-lab-muted)"
          transform={`rotate(-90 11 ${PADDING.top + plotHeight / 2})`}
        >
          잠재축 {axisY + 1}
        </text>

        {/* 참가자 욕구점 → 각 군집 중심으로 향하는 거리선 */}
        {showDistanceLines && clusters
          ? clusters.map((cluster, i) => {
              const isNearest = highlightCluster === cluster.index
              return (
                <line
                  key={`line${cluster.index}`}
                  x1={meX}
                  y1={meY}
                  x2={scale.toX(cluster.centroid[axisX])}
                  y2={scale.toY(cluster.centroid[axisY])}
                  stroke={clusterColor(cluster.index)}
                  strokeWidth={isNearest ? 2.4 : 1}
                  strokeDasharray={isNearest ? undefined : '4 4'}
                  opacity={isNearest ? 0.95 : 0.4}
                  className="lab-stagger"
                  style={{
                    ...glide('x1', 'y1', 'x2', 'y2'),
                    animationDelay: `${clusterStartDelay + i * pointStagger}ms`,
                  }}
                />
              )
            })
          : null}

        {/* 소비대안 점 */}
        {alternativeLatent.map((point, i) => {
          const c = clusterOf ? clusterOf[i] : -1
          const color = c >= 0 ? clusterColor(c) : 'var(--color-lab-accent-2)'
          const alt = CONSUMPTION_ALTERNATIVES[i]
          const cx = scale.toX(point[axisX])
          const cy = scale.toY(point[axisY])
          return (
            <g
              key={alt.key}
              className="lab-stagger"
              style={{ animationDelay: `${i * pointStagger}ms` }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={9}
                fill={color}
                opacity={0.9}
                stroke="var(--color-lab-bg)"
                strokeWidth={1.5}
                style={glide('cx', 'cy')}
              />
              <text x={cx} y={cy - 14} textAnchor="middle" fontSize="16" style={glide('x', 'y')}>
                {alt.icon}
              </text>
              <text
                x={cx}
                y={cy + 22}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="var(--color-lab-text)"
                stroke="var(--color-lab-bg)"
                strokeWidth={3}
                paintOrder="stroke"
                style={glide('x', 'y')}
              >
                {alt.label}
              </text>
            </g>
          )
        })}

        {/* 군집 중심 */}
        {clusters
          ? clusters.map((cluster, i) => {
              const cx = scale.toX(cluster.centroid[axisX])
              const cy = scale.toY(cluster.centroid[axisY])
              const color = clusterColor(cluster.index)
              const isHighlight = highlightCluster === cluster.index
              return (
                <g
                  key={cluster.index}
                  className="lab-stagger"
                  style={{ animationDelay: `${clusterStartDelay + i * pointStagger}ms` }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHighlight ? 16 : 13}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHighlight ? 2.6 : 1.6}
                    strokeDasharray="3 3"
                    opacity={0.9}
                    style={glide('cx', 'cy')}
                  />
                  <text
                    x={cx}
                    y={cy - 20}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={color}
                    stroke="var(--color-lab-bg)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    style={glide('x', 'y')}
                  >
                    {cluster.displayNumber}. {cluster.name}
                  </text>
                </g>
              )
            })
          : null}

        {/*
          현재 욕구점 — 학교 브랜드 그린(--color-mark-me)으로 표시한다.
          바깥 g는 등장 페이드만, 안쪽 g는 위치 전환(transform)만 맡도록 나눴다.
          같은 요소에 CSS 등장 애니메이션과 위치 transform을 함께 걸면 SVG에서는
          CSS transform이 위치 속성(transform 어트리뷰트)을 완전히 덮어써
          애니메이션이 끝난 뒤 마커가 엉뚱한 곳에 멈추는 문제가 있어 이렇게 분리했다.
        */}
        <g className="lab-stagger" style={{ animationDelay: `${meStartDelay}ms` }}>
          <g
            transform={`translate(${meX},${meY})`}
            style={{ transition: `transform ${GLIDE_DURATION} ${EASE}` }}
          >
            {/* 레이더 핑 — index.css의 lab-pulse-ring (지속 애니메이션 예외) */}
            <circle className="lab-pulse-ring" fill="none" stroke="var(--color-mark-me)" strokeWidth={1.4} />
            <circle r={20} fill="none" stroke="var(--color-mark-me)" strokeWidth={1} opacity={0.25} />
            <line x1={-27} y1={0} x2={-10} y2={0} stroke="var(--color-mark-me)" strokeWidth={1.4} opacity={0.55} />
            <line x1={10} y1={0} x2={27} y2={0} stroke="var(--color-mark-me)" strokeWidth={1.4} opacity={0.55} />
            <line x1={0} y1={-27} x2={0} y2={-10} stroke="var(--color-mark-me)" strokeWidth={1.4} opacity={0.55} />
            <line x1={0} y1={10} x2={0} y2={27} stroke="var(--color-mark-me)" strokeWidth={1.4} opacity={0.55} />
            <circle r={8} fill="var(--color-mark-me)" stroke="var(--color-lab-bg)" strokeWidth={2.5} />
            {/* 라벨을 옆으로 붙이고 배경색과 같은 얇은 테두리(halo)를 둘러, 다른 점의 라벨과
                겹쳐도 최대한 읽히게 한다 */}
            <text
              x={16}
              y={4}
              textAnchor="start"
              fontSize="11"
              fontWeight="bold"
              fill="var(--color-mark-me)"
              stroke="var(--color-lab-bg)"
              strokeWidth={3}
              paintOrder="stroke"
            >
              내 욕구
            </text>
          </g>
        </g>
      </svg>
    </div>
  )
}

function niceStep(rough: number): number {
  if (rough <= 0) return 1
  const exponent = Math.floor(Math.log10(rough))
  const magnitude = 10 ** exponent
  const normalized = rough / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}
