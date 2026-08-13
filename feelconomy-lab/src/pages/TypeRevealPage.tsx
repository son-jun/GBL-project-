/**
 * 페이지 3.5. 필코노미 유형 공개.
 *
 * 참가자가 방금 입력한 감성욕구 6개만으로 결정되는 고정 유형(3문자 코드,
 * 예: SMG)을 MBTI 결과 화면처럼 "짜잔" 하고 보여준다. SVD/K-means 분석은
 * 아직 시작하지 않았다 — 이 유형은 그것과 독립적으로, 참가자가 오래 기억할
 * 수 있는 정체성 역할을 한다.
 */

import { useState } from 'react'
import { FlowGuard } from '@/components/FlowGuard'
import { Card, Lead, LinkButton, Notice, ProgressBar, SectionTitle } from '@/components/ui'
import { FEELCONOMY_TYPES, TYPE_DIMENSIONS } from '@/config/feelconomyTypes'
import { alternativeIcon, alternativeLabel } from '@/config/alternatives'
import { NEED_DIM } from '@/config/needs'
import { MBTI_ESTIMATE_BADGE, MBTI_ESTIMATE_CAVEAT } from '@/config/mbtiAxes'
import type { MbtiEstimate } from '@/lib/math/mbtiEstimate'
import { useSession } from '@/state/SessionContext'

export function TypeRevealPage() {
  return (
    <div className="lab-enter">
      <ProgressBar stepIndex={1} />
      <FlowGuard requireRatings={false}>{() => <TypeRevealContent />}</FlowGuard>
    </div>
  )
}

function TypeRevealContent() {
  const { feelconomyType, mbtiEstimate } = useSession()
  const [showAll, setShowAll] = useState(false)
  if (!feelconomyType) return null

  const { code, type, dimensions } = feelconomyType

  return (
    <>
      <SectionTitle>내 필코노미 유형이 나왔어요</SectionTitle>
      <Lead>
        방금 입력한 욕구 {NEED_DIM}개를 {TYPE_DIMENSIONS.length}가지 기준으로 나눈 결과입니다.
      </Lead>

      {/* 큰 리빌 카드 */}
      <Card
        className="mb-5 text-center"
        style={{ borderColor: `${type.color}55`, background: `${type.color}0f` }}
      >
        <div
          className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-sm"
          style={{ backgroundColor: `${type.color}22` }}
        >
          <span aria-hidden>{type.icon}</span>
        </div>
        <p className="mb-1 font-mono text-sm font-bold tracking-[0.25em]" style={{ color: type.color }}>
          {code}
        </p>
        <h3 className="mb-2 text-2xl font-black text-lab-text sm:text-3xl">{type.name}</h3>
        <p className="mb-4 text-base font-semibold" style={{ color: type.color }}>
          "{type.tagline}"
        </p>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-lab-muted">
          {type.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-lab-muted">이런 소비와 잘 어울려요</span>
          {type.exampleAlternatives.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full border border-lab-border bg-white px-2.5 py-1 text-xs font-semibold text-lab-text"
            >
              <span aria-hidden>{alternativeIcon(key)}</span>
              {alternativeLabel(key)}
            </span>
          ))}
        </div>
      </Card>

      {/* 3가지 기준 분해 */}
      <Card className="mb-5">
        <p className="mb-1 text-sm font-bold text-lab-text">이 유형은 어떻게 정해졌을까?</p>
        <p className="mb-4 text-xs text-lab-muted">
          3가지 질문에 대한 내 대답으로 코드 {code}가 만들어졌습니다.
        </p>
        <div className="space-y-4">
          {dimensions.map((dimension) => {
            const total = dimension.positiveScore + dimension.negativeScore || 1
            const positivePercent = (dimension.positiveScore / total) * 100
            const wonPositive = dimension.positiveScore >= dimension.negativeScore
            return (
              <div key={dimension.key}>
                <p className="mb-1.5 text-xs text-lab-muted">{dimension.question}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-20 shrink-0 text-right text-xs font-semibold ${wonPositive ? 'text-lab-text' : 'text-lab-muted'}`}
                  >
                    {dimension.positiveLabel}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-lab-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${positivePercent}%`, backgroundColor: type.color }}
                    />
                  </div>
                  <span
                    className={`w-20 shrink-0 text-xs font-semibold ${!wonPositive ? 'text-lab-text' : 'text-lab-muted'}`}
                  >
                    {dimension.negativeLabel}
                  </span>
                </div>
                <p className="mt-1 text-center font-mono text-[11px] text-lab-muted">
                  {dimension.positiveScore} : {dimension.negativeScore} → 문자 "{dimension.letter}"
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 같은 욕구 점수를 MBTI 형식으로 옮겨 본 것 — 검사 결과가 아니라는 경고를 함께 붙인다 */}
      {mbtiEstimate ? <MbtiEstimateCard estimate={mbtiEstimate} /> : null}

      <Notice tone="info" title="이 유형이 나를 완전히 규정하지는 않아요">
        {'지금 이 순간 원하는 것 6가지를 8가지 틀 중 하나로 요약한 것입니다.\n' +
          '다른 날, 다른 기분에 다시 하면 다른 유형이 나올 수도 있어요 — 그것도 자연스러운 일입니다.'}
      </Notice>

      {/* 다른 유형 둘러보기 */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full rounded-2xl border border-lab-border bg-white px-4 py-3 text-sm font-semibold text-lab-muted transition-colors duration-150 hover:border-lab-accent/40 hover:text-lab-text"
        >
          {showAll ? '접기 ▲' : '다른 7가지 유형도 궁금하다면? ▼'}
        </button>
        {showAll ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {Object.values(FEELCONOMY_TYPES).map((t, i) => (
              <div
                key={t.code}
                className={`lab-stagger rounded-2xl border p-3 text-center ${t.code === code ? 'ring-2' : ''}`}
                style={{
                  borderColor: `${t.color}40`,
                  background: t.code === code ? `${t.color}14` : '#fff',
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <span className="text-2xl">{t.icon}</span>
                <p className="mt-1 font-mono text-[10px] font-bold" style={{ color: t.color }}>
                  {t.code}
                </p>
                <p className="text-xs font-bold text-lab-text">{t.name}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <LinkButton to="/ratings" size="lg" full>
          다음: 소비대안 평가하기 →
        </LinkButton>
        <LinkButton to="/needs" variant="secondary" size="lg">
          ← 뒤로
        </LinkButton>
      </div>
    </>
  )
}

/**
 * MBTI 형식 추정 카드.
 *
 * 이 화면을 만들 때의 원칙 — 코드를 재미있게 보여주되, "당신의 MBTI"라고
 * 말하지 않는다. 그래서
 *   ① 제목에 '추정'과 배지를 붙이고,
 *   ② 축마다 어떤 욕구를 짝지었는지와 그 짝짓기가 왜 느슨한지를 펼쳐 볼 수
 *      있게 하고,
 *   ③ 카드 안에 경고 문구를 항상 함께 둔다.
 * 필코노미 유형 카드보다 시각적으로 덜 강조해서, 무엇이 이 활동의 본체인지
 * 헷갈리지 않게 한다.
 */
function MbtiEstimateCard({ estimate }: { estimate: MbtiEstimate }) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <Card className="mb-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-lab-text">MBTI 형식으로 바꿔 보면</p>
        <span className="rounded-full border border-lab-warn/40 bg-lab-warn/10 px-2 py-0.5 text-[11px] font-bold text-lab-warn">
          {MBTI_ESTIMATE_BADGE}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 py-2">
        {estimate.axes.map((axis) => (
          <span
            key={axis.key}
            className="flex h-12 w-11 items-center justify-center rounded-xl border border-lab-border-strong bg-lab-surface-2 font-mono text-2xl font-black text-lab-text"
          >
            {axis.letter}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="mt-3 w-full rounded-xl border border-lab-border px-3 py-2 text-xs font-semibold text-lab-muted transition-colors duration-150 hover:border-lab-accent/40 hover:text-lab-text"
      >
        {showDetail ? '어떻게 나온 글자인지 접기 ▲' : '어떻게 나온 글자인지 보기 ▼'}
      </button>

      {showDetail ? (
        <div className="lab-enter mt-3 space-y-3">
          {estimate.axes.map((axis) => (
            <div key={axis.key} className="rounded-xl border border-lab-border bg-lab-surface-2 p-3">
              <p className="mb-1.5 text-xs text-lab-muted">{axis.question}</p>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span
                  className={`text-xs font-semibold ${axis.firstWon ? 'text-lab-text' : 'text-lab-muted'}`}
                >
                  {axis.firstLabel} {axis.firstScore}점
                </span>
                <span aria-hidden className="text-xs text-lab-muted-2">
                  vs
                </span>
                <span
                  className={`text-xs font-semibold ${!axis.firstWon ? 'text-lab-text' : 'text-lab-muted'}`}
                >
                  {axis.secondLabel} {axis.secondScore}점
                </span>
                <span className="ml-auto font-mono text-sm font-black text-lab-accent">
                  → {axis.letter}
                </span>
              </div>
              {axis.tied ? (
                <p className="mt-1 text-[11px] text-lab-warn">
                  두 점수가 같아서 규칙에 따라 {axis.firstLetter}를 골랐습니다.
                </p>
              ) : null}
              <p className="mt-2 border-t border-lab-border pt-2 text-[11px] leading-relaxed text-lab-muted">
                {axis.proxyNote}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3">
        <Notice tone="warn" title="이건 MBTI 검사 결과가 아닙니다">
          {MBTI_ESTIMATE_CAVEAT}
        </Notice>
      </div>
    </Card>
  )
}
