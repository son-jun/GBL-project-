/**
 * 페이지 5. SVD 분석.
 *
 * 참가자 자신의 [소비대안 × 감성욕구] 8×6 행렬을 SVD로 분해해서 보여준다.
 * "10개를 2개로 압축한다"는 v1의 설명 대신, v2는 "내가 8개 소비를 평가할 때
 * 반복적으로 나타나는 욕구의 결합을 찾는다"는 프레임으로 설명한다.
 *
 * 요구사항 §7 원문의 취지("특이값 누적 설명비율을 보고 r을 선택한다")를 그대로
 * 살려, 참가자가 직접 r=2 또는 r=3을 고르게 한다 — 이것 자체가 게임 요소다.
 */

import { useMemo, useState } from 'react'
import { FlowGuard } from '@/components/FlowGuard'
import {
  Button,
  Card,
  DataTable,
  FormulaDetails,
  Lead,
  LinkButton,
  ProgressBar,
  SectionTitle,
} from '@/components/ui'
import { CONSUMPTION_ALTERNATIVES } from '@/config/alternatives'
import { ANALYSIS_SPEC } from '@/config/model'
import { NEED_AXES, NEED_DIM } from '@/config/needs'
import { computeSvd, explainProjection, projectMatrixToLatent, projectToLatent } from '@/lib/math/svd'
import { formatCoordinate, formatPercent, formatSigned } from '@/lib/util/format'
import { useSession } from '@/state/SessionContext'

export function SvdPage() {
  return (
    <div className="lab-enter">
      <ProgressBar stepIndex={3} />
      <FlowGuard>
        {({ needsVector, ratingsMatrix }) => (
          <SvdContent needsVector={needsVector} ratingsMatrix={ratingsMatrix} />
        )}
      </FlowGuard>
    </div>
  )
}

function SvdContent({
  needsVector,
  ratingsMatrix,
}: {
  needsVector: number[]
  ratingsMatrix: number[][]
}) {
  const { latentDim, setLatentDim } = useSession()
  const [openAxis, setOpenAxis] = useState<number | null>(0)
  const [showMatrix, setShowMatrix] = useState(false)

  // 전체 축(=감성욕구 개수)까지 미리 계산해 설명분산 표를 보여준다
  const fullSvd = useMemo(() => computeSvd(ratingsMatrix, NEED_DIM), [ratingsMatrix])
  // 참가자가 고른 r로 실제 잠재좌표를 계산한다 (로딩 값은 fullSvd와 같은 알고리즘·같은 부호규약이라 완전히 일치한다)
  const chosenSvd = useMemo(() => computeSvd(ratingsMatrix, latentDim), [ratingsMatrix, latentDim])
  const alternativeLatent = useMemo(
    () => projectMatrixToLatent(ratingsMatrix, chosenSvd.loadings),
    [ratingsMatrix, chosenSvd],
  )
  const needProjected = useMemo(
    () => projectToLatent(needsVector, chosenSvd.loadings),
    [needsVector, chosenSvd],
  )

  const cumulative = fullSvd.cumulativeExplainedVarianceRatio[latentDim - 1] ?? 0

  return (
    <>
      <SectionTitle>8개 소비, 몇 개의 진짜 이유로 압축될까?</SectionTitle>
      <Lead>
        내가 8개 소비대안을 평가한 48개의 숫자 안에는 반복되는 패턴이 있습니다. SVD는 그
        패턴을 몇 개의 핵심 축으로 압축합니다.
      </Lead>

      <Card className="mb-4">
        <button
          type="button"
          onClick={() => setShowMatrix((v) => !v)}
          className="mb-3 flex w-full items-center justify-between text-sm font-bold text-lab-text"
        >
          <span>내가 입력한 평가행렬 A (8×6)</span>
          <span aria-hidden className="text-lab-muted">
            {showMatrix ? '숨기기 ▲' : '보기 ▼'}
          </span>
        </button>
        {showMatrix ? (
          <DataTable
            headers={['소비대안', ...NEED_AXES.map((n) => n.label)]}
            align={['left', ...NEED_AXES.map(() => 'center' as const)]}
            rows={ratingsMatrix.map((row, i) => [
              <span key="l" className="flex items-center gap-1.5 text-xs text-lab-text">
                <span aria-hidden>{CONSUMPTION_ALTERNATIVES[i].icon}</span>
                {CONSUMPTION_ALTERNATIVES[i].label}
              </span>,
              ...row.map((v, j) => (
                <span key={j} className="font-mono text-xs tabular-nums text-lab-muted">
                  {v}
                </span>
              )),
            ])}
          />
        ) : null}
      </Card>

      <Card className="mb-4">
        <p className="mb-1 text-sm font-bold text-lab-text">압축하면 정보가 얼마나 남을까?</p>
        <p className="mb-3 text-xs leading-relaxed text-lab-muted">
          축을 몇 개 남기느냐에 따라 원래 48개 숫자의 패턴이 얼마나 보존되는지가 달라집니다.
        </p>

        <div className="space-y-2">
          {fullSvd.explainedVarianceRatio.map((ratio, k) => {
            const inUse = k < latentDim
            return (
              <div key={k} className="flex items-center gap-3">
                <span
                  className={`w-14 shrink-0 font-mono text-xs ${inUse ? 'font-bold text-lab-accent' : 'text-lab-muted'}`}
                >
                  축 {k + 1}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-lab-surface-2">
                  <div
                    className={`h-full rounded ${inUse ? 'bg-gradient-to-r from-lab-accent to-lab-accent-2' : 'bg-lab-border'}`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-lab-text">
                  {formatPercent(ratio, 1)}
                </span>
              </div>
            )
          })}
        </div>

        {/* 참가자가 직접 r을 고른다 — 요구사항 원문의 "누적 설명비율을 보고 r 선택" */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-lab-border pt-4">
          <span className="text-xs font-semibold text-lab-text">
            몇 개 축으로 압축할까요?
          </span>
          {ANALYSIS_SPEC.latentDimChoices.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setLatentDim(r)}
              className={`min-h-9 rounded-xl border px-3 text-sm font-bold transition ${
                latentDim === r
                  ? 'border-transparent bg-lab-accent text-white'
                  : 'border-lab-border bg-lab-surface-2 text-lab-muted hover:text-lab-text'
              }`}
            >
              r = {r} (누적 {formatPercent(fullSvd.cumulativeExplainedVarianceRatio[r - 1] ?? 0, 0)})
            </button>
          ))}
        </div>

        <p className="mt-3 rounded-lg bg-lab-surface-2 p-3 text-xs leading-relaxed text-lab-muted">
          지금 고른 r = {latentDim}개 축은 원래 정보의{' '}
          <strong className="text-lab-accent">{formatPercent(cumulative, 1)}</strong>를
          담고 있습니다. 100%가 아니라는 점이 중요합니다 — 압축은 "완벽한 복사"가 아니라
          "가장 중요한 방향만 남기기"입니다.
        </p>
      </Card>

      <Card className="mb-4">
        <p className="mb-3 text-sm font-bold text-lab-text">
          소비대안들이 잠재공간에서 어디에 놓이는지
        </p>
        <DataTable
          headers={['소비대안', ...Array.from({ length: latentDim }, (_, k) => `축 ${k + 1}`)]}
          align={['left', ...Array.from({ length: latentDim }, () => 'right' as const)]}
          rows={alternativeLatent.map((point, i) => [
            <span key="l" className="flex items-center gap-1.5 text-xs text-lab-text">
              <span aria-hidden>{CONSUMPTION_ALTERNATIVES[i].icon}</span>
              {CONSUMPTION_ALTERNATIVES[i].label}
            </span>,
            ...point.map((v, k) => (
              <span key={k} className="font-mono text-xs tabular-nums text-lab-text">
                {formatCoordinate(v)}
              </span>
            )),
          ])}
        />
        <p className="mt-3 text-xs leading-relaxed text-lab-muted">
          현재 내 욕구도 같은 공간의 한 점이 됩니다: q* = [
          {needProjected.map((v) => formatCoordinate(v)).join(', ')}]
        </p>
      </Card>

      <Card className="mb-4">
        <p className="mb-1 text-sm font-bold text-lab-text">이 좌표는 어떻게 나온 숫자일까?</p>
        <p className="mb-3 text-xs leading-relaxed text-lab-muted">
          예시로 <strong className="text-lab-text">현재 내 욕구(q)</strong>가 잠재좌표로 바뀌는
          과정을 보여줍니다. 각 소비대안도 똑같은 방식으로 계산됩니다: 욕구 점수와 축의
          계수를 <strong className="text-lab-text">각각 곱한 뒤 모두 더합니다</strong>.
        </p>

        <div className="mb-3 flex gap-2">
          {Array.from({ length: latentDim }, (_, k) => (
            <Button
              key={k}
              variant={openAxis === k ? 'primary' : 'secondary'}
              onClick={() => setOpenAxis(openAxis === k ? null : k)}
            >
              축 {k + 1} 계산 보기
            </Button>
          ))}
        </div>

        {openAxis !== null ? (
          <AxisBreakdown
            axis={openAxis}
            vector={needsVector}
            loadings={chosenSvd.loadings}
            total={needProjected[openAxis]}
          />
        ) : null}
      </Card>

      <FormulaDetails summary="수식으로 보기">
        <p>참가자 개인의 [소비대안 × 감성욕구] 평가행렬 A를 특이값 분해합니다:</p>
        <p className="my-2 text-lab-text">A = U Σ Vᵀ</p>
        <p>V의 앞 r개 열을 잠재축으로 씁니다:</p>
        <p className="my-2 text-lab-text">
          V_r = [v₁{latentDim > 1 ? ', v₂' : ''}
          {latentDim > 2 ? ', …' : ''}]
        </p>
        <p>소비대안 8개의 잠재좌표:</p>
        <p className="my-2 text-lab-text">Z = A × V_r</p>
        <p>현재 욕구 q도 같은 축에 투영합니다:</p>
        <p className="my-2 text-lab-text">q* = q × V_r</p>
        <p className="mt-3">각 축의 설명분산 비율은 특이값의 제곱으로 계산합니다:</p>
        <p className="my-2 text-lab-text">ratio_k = σ_k² / Σ σ²</p>
        <p className="mt-4 border-t border-lab-border pt-3">
          특이값 σ: {fullSvd.singularValues.map((s) => s.toFixed(2)).join(', ')}
        </p>
      </FormulaDetails>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <LinkButton to="/map" size="lg" full>
          다음: 잠재공간 지도 보기 →
        </LinkButton>
        <LinkButton to="/ratings" variant="secondary" size="lg">
          ← 뒤로
        </LinkButton>
      </div>
    </>
  )
}

function AxisBreakdown({
  axis,
  vector,
  loadings,
  total,
}: {
  axis: number
  vector: number[]
  loadings: number[][]
  total: number
}) {
  const contributions = explainProjection(vector, loadings, axis)
  const maxAbs = Math.max(...contributions.map(Math.abs), 0.01)

  return (
    <div className="rounded-xl border border-lab-border bg-lab-surface-2 p-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-lab-border text-lab-muted">
              <th className="px-1.5 py-1.5 text-left font-semibold">감성욕구</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">내 점수</th>
              <th className="px-1.5 py-1.5 text-center font-semibold">×</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">축 {axis + 1} 계수</th>
              <th className="px-1.5 py-1.5 text-center font-semibold">=</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">기여</th>
              <th className="px-1.5 py-1.5 text-left font-semibold">크기</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {NEED_AXES.map((need, j) => {
              const contribution = contributions[j]
              const positive = contribution >= 0
              return (
                <tr key={need.key} className="border-b border-lab-border/30 last:border-0">
                  <td className="px-1.5 py-1 font-sans whitespace-nowrap text-lab-text">
                    {need.label}
                  </td>
                  <td className="px-1.5 py-1 text-right text-lab-muted">{vector[j]}</td>
                  <td className="px-1.5 py-1 text-center text-lab-border">×</td>
                  <td className="px-1.5 py-1 text-right text-lab-muted">
                    {formatSigned(loadings[j][axis], 3)}
                  </td>
                  <td className="px-1.5 py-1 text-center text-lab-border">=</td>
                  <td
                    className={`px-1.5 py-1 text-right font-bold ${positive ? 'text-lab-positive' : 'text-lab-danger'}`}
                  >
                    {formatSigned(contribution, 2)}
                  </td>
                  <td className="px-1.5 py-1">
                    <div className="relative h-2.5 w-16 rounded bg-lab-surface-2">
                      <div aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-lab-border" />
                      <div
                        className={`absolute inset-y-0 rounded ${positive ? 'bg-lab-positive/70' : 'bg-lab-danger/70'}`}
                        style={
                          positive
                            ? { left: '50%', width: `${(Math.abs(contribution) / maxAbs) * 48}%` }
                            : { right: '50%', width: `${(Math.abs(contribution) / maxAbs) * 48}%` }
                        }
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-lab-accent/40">
              <td colSpan={5} className="px-1.5 py-2 text-right text-sm font-bold text-lab-text">
                모두 더하면 → 축 {axis + 1} 좌표
              </td>
              <td className="px-1.5 py-2 text-right font-mono text-base font-black text-lab-accent tabular-nums">
                {formatCoordinate(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
