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
 */

import { useMemo } from 'react'
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
          ? clusters.map((cluster) => {
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
            <g key={alt.key}>
              <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.9} stroke="var(--color-lab-bg)" strokeWidth={1.5} />
              <text x={cx} y={cy - 14} textAnchor="middle" fontSize="16">
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
              >
                {alt.label}
              </text>
            </g>
          )
        })}

        {/* 군집 중심 */}
        {clusters
          ? clusters.map((cluster) => {
              const cx = scale.toX(cluster.centroid[axisX])
              const cy = scale.toY(cluster.centroid[axisY])
              const color = clusterColor(cluster.index)
              const isHighlight = highlightCluster === cluster.index
              return (
                <g key={cluster.index}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHighlight ? 16 : 13}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHighlight ? 2.6 : 1.6}
                    strokeDasharray="3 3"
                    opacity={0.9}
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
                  >
                    {cluster.displayNumber}. {cluster.name}
                  </text>
                </g>
              )
            })
          : null}

        {/* 현재 욕구점 — 밝은 배경에서 눈에 띄도록 진한 브라운(--color-mark-me)을 쓴다.
            다른 소비대안·군집 색과 절대 겹치지 않는 전용 색이다. */}
        <g transform={`translate(${meX},${meY})`}>
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
