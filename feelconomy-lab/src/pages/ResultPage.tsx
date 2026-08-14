/**
 * 페이지 8. 최종 결과.
 *
 * 표현 규칙 — 이 페이지에서 가장 중요한 부분:
 *   ✅ "지금 내 욕구와 가장 가까운 소비 군집은 ○○형이고, 그 안에서는 △△가 가장 가깝습니다."
 *   ❌ "당신은 △△를 살 것입니다." / "AI가 정확히 예측했습니다."
 *
 * 모든 문구가 "거리가 가깝다"를 주어로 삼고, 참가자 개인의 미래를 단정하지 않는다.
 *
 * ----------------------------------------------------------------------------
 *  더 동적으로 (2026-08-16)
 * ----------------------------------------------------------------------------
 * "결과 화면이 좀 더 동적이고 멋있으면 좋겠다"는 요청에 따라 네 가지를 더했다.
 *   ① 지도 다시 보기 — 군집 판정 페이지에서 봤던 PersonalMap을 여기에도
 *      다시 그려서, 판정 과정과 결과를 시각적으로 잇는다. 이미 만들어 둔
 *      등장 애니메이션·펄스 링·글라이드 전환을 그대로 물려받는다.
 *   ② 카드가 순서대로 나타난다 — 기존 lab-stagger를 각 카드에 걸어
 *      위에서부터 하나씩 나타나게 했다.
 *   ③ 숫자가 세어 올라간다 — 좌표·거리 숫자에 AnimatedNumber(ui.tsx)를 써서
 *      0에서 실제 값까지 세는 것처럼 보이게 했다.
 *   ④ 순위표를 막대 목록으로 — 표 안에 숫자만 있던 소비대안 순위를,
 *      군집 판정 페이지와 같은 "배지 + 막대 + 숫자" 목록으로 바꿨다.
 */

import { useState } from 'react'
import { FlowGuard } from '@/components/FlowGuard'
import { PersonalMap } from '@/components/PersonalMap'
import {
  AnimatedBar,
  AnimatedNumber,
  Button,
  Card,
  ClusterBadge,
  clusterColor,
  DataTable,
  Lead,
  LinkButton,
  Notice,
  ProgressBar,
  SectionTitle,
} from '@/components/ui'
import { ALTERNATIVE_DIM, CONSUMPTION_ALTERNATIVES } from '@/config/alternatives'
import { NEED_AXES } from '@/config/needs'
import { CLUSTER_NAMING_EXPLANATION } from '@/lib/math/clusterNaming'
import { formatCoordinate, formatSigned } from '@/lib/util/format'
import { useSession } from '@/state/SessionContext'
import type { AlternativeCluster } from '@/lib/types'

export function ResultPage() {
  return (
    <div className="lab-enter">
      <ProgressBar stepIndex={6} />
      <FlowGuard requireResult>{() => <ResultContent />}</FlowGuard>
    </div>
  )
}

/** 카드가 위에서부터 하나씩 나타나도록 각 카드 사이의 등장 지연 간격 */
const CARD_STAGGER = 90

function ResultContent() {
  const { result, participantId, feelconomyType } = useSession()
  if (!result) return null

  const cluster = result.clusters[result.assignedCluster]
  const color = clusterColor(cluster.index)
  const detailAlternative = CONSUMPTION_ALTERNATIVES[result.nearestAlternativeInCluster]
  const maxDistance = Math.max(...result.distancesToAlternatives, 1)

  const rankedAlternatives = result.distancesToAlternatives
    .map((distance, i) => ({ index: i, distance }))
    .sort((a, b) => a.distance - b.distance)

  return (
    <>
      <SectionTitle>분석 결과</SectionTitle>
      <Lead>
        아래는 예측이 아니라, 지금 내 욕구점에서 잠재공간을 재보고 가장 가까운 소비를 찾은
        결과입니다.
      </Lead>

      {/* 카드 0: 필코노미 유형 요약 (앞서 공개한 정체성과 오늘의 분석을 연결) */}
      {feelconomyType ? (
        <Card
          className="lab-stagger relative mb-4 overflow-hidden"
          style={{
            borderColor: `${feelconomyType.type.color}55`,
            background: `${feelconomyType.type.color}0f`,
            animationDelay: `${0 * CARD_STAGGER}ms`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -left-10 h-36 w-36 rounded-full blur-2xl"
            style={{ background: `${feelconomyType.type.color}30` }}
          />
          <div className="relative flex items-center gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl"
              style={{ backgroundColor: `${feelconomyType.type.color}22` }}
            >
              <span aria-hidden>{feelconomyType.type.icon}</span>
            </span>
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold tracking-[0.2em]" style={{ color: feelconomyType.type.color }}>
                {feelconomyType.code} · 필코노미 유형
              </p>
              <p className="text-lg font-black text-lab-text">{feelconomyType.type.name}</p>
              <p className="text-xs text-lab-muted">
                오늘의 데이터 분석에서는 이 유형의 성향이{' '}
                <strong style={{ color }}>{cluster.name}</strong> 군집과 가장 가깝게 나타났습니다.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* 카드 1: 가장 가까운 군집 — 판정 페이지의 지도를 다시 보여줘 과정과 결과를 잇는다 */}
      <Card
        tone="accent"
        className="lab-stagger relative mb-4 overflow-hidden"
        style={{ animationDelay: `${1 * CARD_STAGGER}ms` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-lab-accent/25 to-lab-accent-2/10 blur-2xl"
        />
        <div className="relative grid gap-5 sm:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="mb-2 font-mono text-xs tracking-[0.2em] text-lab-accent">
              나와 가장 가까운 소비 군집
            </p>
            <div className="mb-3">
              <ClusterBadge index={cluster.index} name={cluster.name} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cluster.memberIndices.map((i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-lg border border-lab-border bg-lab-surface-2 px-2 py-1 text-xs text-lab-text"
                >
                  <span aria-hidden>{CONSUMPTION_ALTERNATIVES[i].icon}</span>
                  {CONSUMPTION_ALTERNATIVES[i].label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-xs tracking-[0.2em] text-lab-accent">
              현재 나의 욕구 좌표
            </p>
            <div className="space-y-1.5">
              {result.needProjected.map((value, k) => (
                <p key={k} className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-lab-muted">축 {k + 1}</span>
                  <AnimatedNumber
                    value={value}
                    delayMs={k * 120}
                    className="font-mono text-xl font-black text-lab-text"
                  />
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-4 border-t border-lab-border pt-4">
          <p className="mb-2 text-xs text-lab-muted">군집 판정 페이지에서 본 지도를 다시 봅니다.</p>
          <PersonalMap
            alternativeLatent={result.alternativeLatent}
            needProjected={result.needProjected}
            clusters={result.clusters}
            highlightCluster={result.assignedCluster}
            showDistanceLines
            height={300}
          />
        </div>
      </Card>

      {/* 카드 2: 세부 잠재수요 */}
      <Card className="lab-stagger mb-4" style={{ animationDelay: `${2 * CARD_STAGGER}ms` }}>
        <p className="mb-1 text-sm font-bold text-lab-text">이 군집 안에서 가장 가까운 소비</p>
        <p className="mb-3 text-xs text-lab-muted">
          군집이 하나의 방향이라면, 이것은 그 방향 안에서 지금 나에게 가장 가까운 지점입니다.
        </p>
        <div className="flex items-center gap-4 rounded-2xl border border-lab-border bg-lab-surface-2 p-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lab-surface-2 text-3xl">
            <span aria-hidden>{detailAlternative.icon}</span>
          </span>
          <div>
            <p className="text-lg font-bold text-lab-text">{detailAlternative.label}</p>
            <p className="text-xs text-lab-muted">
              거리{' '}
              <AnimatedNumber
                value={result.distancesToAlternatives[result.nearestAlternativeInCluster]}
                delayMs={150}
                className="font-mono font-bold text-lab-text"
              />
            </p>
          </div>
        </div>
      </Card>

      {/* 카드 3: 이 군집의 대표 감성욕구 */}
      <Card className="lab-stagger mb-4" style={{ animationDelay: `${3 * CARD_STAGGER}ms` }}>
        <p className="mb-1 text-sm font-bold text-lab-text">이 군집이 채워주는 욕구</p>
        <p className="mb-3 text-xs text-lab-muted">
          이 군집에 속한 소비대안들에 내가 매긴 평균 점수입니다.
        </p>
        <NeedMeansList cluster={cluster} color={color} />
      </Card>

      {/* 카드 4: 전체 소비대안 순위 — 배지·막대·숫자로 보여준다(군집 판정 페이지와 같은 언어) */}
      <Card className="lab-stagger mb-4" style={{ animationDelay: `${4 * CARD_STAGGER}ms` }}>
        <p className="mb-1 text-sm font-bold text-lab-text">
          전체 소비대안 {ALTERNATIVE_DIM}개 순위
        </p>
        <p className="mb-4 text-xs leading-relaxed text-lab-muted">
          지금 내 욕구점에서 가까운 순서입니다. 배정 군집에 속한 대안은 강조 표시했습니다.
        </p>
        <div className="space-y-2.5">
          {rankedAlternatives.map(({ index, distance }, rank) => {
            const alt = CONSUMPTION_ALTERNATIVES[index]
            const inAssignedCluster = cluster.memberIndices.includes(index)
            const isTop = rank === 0
            return (
              <div key={alt.key} className="flex items-center gap-2 sm:gap-3">
                <span
                  className={`w-6 shrink-0 text-center font-mono text-xs ${isTop ? 'font-black text-lab-accent' : 'text-lab-muted'}`}
                >
                  {isTop ? '1위' : rank + 1}
                </span>
                <span
                  className={`flex w-24 shrink-0 items-center gap-1.5 truncate text-xs sm:w-28 sm:text-sm ${
                    inAssignedCluster ? 'font-bold text-lab-text' : 'text-lab-muted'
                  }`}
                >
                  <span aria-hidden>{alt.icon}</span>
                  {alt.label}
                </span>
                <AnimatedBar
                  percent={Math.max(6, (distance / maxDistance) * 100)}
                  delayMs={rank * 90}
                  fillStyle={{ backgroundColor: inAssignedCluster ? color : `${color}55` }}
                  heightClassName="h-5"
                  roundedClassName="rounded-md"
                />
                <AnimatedNumber
                  value={distance}
                  delayMs={rank * 90}
                  className={`w-14 shrink-0 text-right font-mono text-sm ${isTop ? 'font-black text-lab-accent' : 'text-lab-muted'}`}
                />
              </div>
            )
          })}
        </div>
      </Card>

      {/* 카드 5: 결과 해석 */}
      <Card
        tone="accent"
        className="lab-stagger mb-4"
        style={{ animationDelay: `${5 * CARD_STAGGER}ms` }}
      >
        <p className="mb-2 font-mono text-xs tracking-[0.2em] text-lab-accent">결과 해석</p>
        <p className="text-sm leading-relaxed text-lab-text sm:text-base">
          지금 내 욕구 패턴은{' '}
          <strong style={{ color }}>{cluster.name}</strong> 군집과 가장 가까웠고, 그 안에서는{' '}
          <strong className="text-lab-text">{detailAlternative.label}</strong>가 가장 가까운
          소비였습니다.
        </p>
        <p className="mt-3 rounded-lg bg-lab-surface-2 p-3 text-xs leading-relaxed text-lab-muted">
          이것은 "내가 그 소비를 하게 된다"는 예측이 아닙니다. 내가 직접 매긴 평가 점수를
          가지고 계산한 <strong className="text-lab-text">거리 기반의 탐색적 결과</strong>입니다.
          같은 데이터라도 감성욕구나 평가 점수가 조금만 달랐다면 다른 소비가 나올 수 있습니다.
        </p>
      </Card>

      <Notice tone="info" title="이 군집 이름은 어떻게 만들어졌나요?">
        {CLUSTER_NAMING_EXPLANATION}
      </Notice>

      <div className="mt-4">
        <HandCalculationCard latentDim={result.needProjected.length} />
      </div>

      <div className="mt-4">
        <Notice tone="success" title="기록된 정보">
          {`참가자 ID: ${participantId}\n분석 규격 버전: ${result.specVersion}\n` +
            '같은 데이터를 같은 규격으로 다시 계산하면 항상 같은 결과가 나옵니다.'}
        </Notice>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <LinkButton to="/finish" size="lg" full>
          마무리 정리 보기 →
        </LinkButton>
        <LinkButton to="/cluster" variant="secondary" size="lg">
          ← 판정 과정 다시 보기
        </LinkButton>
      </div>
    </>
  )
}

function NeedMeansList({ cluster, color }: { cluster: AlternativeCluster; color: string }) {
  const ranked = cluster.needMeans
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
  const maxValue = Math.max(...cluster.needMeans, 1)

  return (
    <div className="space-y-2">
      {ranked.map(({ value, index }, rank) => (
        <div key={index} className="flex items-center gap-2 sm:gap-3">
          <span className="w-16 shrink-0 truncate text-xs font-semibold text-lab-text sm:w-20 sm:text-sm">
            {NEED_AXES[index].label}
          </span>
          <AnimatedBar percent={(value / maxValue) * 100} delayMs={rank * 90} fillStyle={{ backgroundColor: color }} />
          <AnimatedNumber
            value={value}
            decimals={1}
            delayMs={rank * 90}
            className="w-8 shrink-0 text-right font-mono text-xs text-lab-text"
          />
        </div>
      ))}
    </div>
  )
}

function HandCalculationCard({ latentDim }: { latentDim: number }) {
  const { result, handCheck, recordHandCheck } = useSession()
  const [open, setOpen] = useState(false)
  const [inputs, setInputs] = useState<string[]>(() => Array.from({ length: latentDim }, () => ''))
  const [error, setError] = useState<string | null>(null)

  if (!result) return null

  const submit = async () => {
    const parsed = inputs.map((s) => Number(s))
    if (parsed.some((v) => !Number.isFinite(v))) {
      setError('모든 칸에 숫자를 입력해 주세요. (예: 2.63, -0.84)')
      return
    }
    setError(null)
    await recordHandCheck(parsed)
  }

  if (!open && !handCheck) {
    return (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-lab-text">학습지 손계산과 비교하기</p>
            <p className="mt-0.5 text-xs text-lab-muted">
              종이 학습지에서 직접 계산한 q* 좌표가 있다면 입력해 프로그램 계산과 맞춰보세요.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            입력하기
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="lab-enter">
      <p className="mb-3 text-sm font-bold text-lab-text">학습지 손계산과 비교</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: latentDim }, (_, k) => (
          <label key={k} className="block">
            <span className="mb-1 block text-xs text-lab-muted">내가 계산한 z{k + 1}</span>
            <input
              type="text"
              inputMode="decimal"
              value={handCheck ? String(handCheck.reported[k] ?? '') : inputs[k]}
              disabled={Boolean(handCheck)}
              onChange={(e) => {
                const next = [...inputs]
                next[k] = e.target.value
                setInputs(next)
              }}
              placeholder="예: 2.63"
              className="w-full rounded-lg border border-lab-border bg-lab-surface-2 px-3 py-2 font-mono text-sm text-lab-text disabled:opacity-60"
            />
          </label>
        ))}
      </div>
      {error ? <p className="mb-3 text-xs text-lab-danger">{error}</p> : null}
      {handCheck ? (
        <>
          <DataTable
            headers={['축', '내 손계산', '프로그램 계산', '오차 Δz']}
            rows={result.needProjected.map((value, k) => [
              <span key="a" className="text-sm">
                z{k + 1}
              </span>,
              <span key="b" className="font-mono text-sm tabular-nums text-lab-muted">
                {handCheck.reported[k]?.toFixed(2) ?? '—'}
              </span>,
              <span key="c" className="font-mono text-sm tabular-nums text-lab-text">
                {formatCoordinate(value)}
              </span>,
              <span
                key="d"
                className={`font-mono text-sm font-bold tabular-nums ${Math.abs(handCheck.deltas[k]) < 0.05 ? 'text-lab-positive' : 'text-lab-warn'}`}
              >
                {formatSigned(handCheck.deltas[k], 2)}
              </span>,
            ])}
          />
          <p className="mt-3 text-xs leading-relaxed text-lab-muted">
            최대 오차{' '}
            <span className="font-mono font-bold text-lab-text">
              {handCheck.maxAbsDelta.toFixed(3)}
            </span>
            {handCheck.maxAbsDelta < 0.05
              ? ' — 컴퓨터의 계산 과정을 거의 그대로 따라갔습니다.'
              : handCheck.maxAbsDelta < 0.5
                ? ' — 반올림 차이 정도입니다. 계산 방향은 맞았습니다.'
                : ' — 어느 단계에서 갈렸는지 SVD 계산 표를 다시 확인해 보세요.'}
          </p>
        </>
      ) : (
        <div className="flex gap-2">
          <Button onClick={submit}>비교하기</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
        </div>
      )}
    </Card>
  )
}
