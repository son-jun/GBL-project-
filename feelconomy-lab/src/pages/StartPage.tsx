/**
 * 페이지 1. 시작 화면 (v2).
 *
 * v1은 "기준 데이터셋으로 만든 모델이 준비되어야" 시작할 수 있었다. v2는 참가자
 * 한 명의 입력만으로 분석이 완결되므로 그런 준비 상태 확인이 필요 없어졌다 —
 * 첫 번째 참가자도 곧바로 시작할 수 있다.
 */

import { Card, LinkButton } from '@/components/ui'
import { SchoolLogo } from '@/components/SchoolLogo'
import { ALTERNATIVE_DIM } from '@/config/alternatives'
import { NEED_DIM } from '@/config/needs'

const FLOW_PREVIEW = [
  { icon: '🎚️', label: `욕구 ${NEED_DIM}개 입력` },
  { icon: '🧭', label: '내 유형 확인' },
  { icon: '📊', label: `대안 ${ALTERNATIVE_DIM}개 평가` },
  { icon: '🗜️', label: 'SVD로 압축' },
  { icon: '🗺️', label: '지도에 표시' },
  { icon: '🎯', label: '가까운 군집 찾기' },
  { icon: '🔮', label: '잠재수요 확인' },
]

export function StartPage() {
  return (
    <div className="lab-enter space-y-8">
      <section className="pt-8 text-center sm:pt-16">
        <div className="mb-6 flex justify-center">
          <SchoolLogo size={64} glow />
        </div>
        <p className="mb-4 font-mono text-xs tracking-[0.3em] text-lab-accent">
          MY DATA · MY LATENT DEMAND
        </p>
        <h1 className="text-4xl leading-tight font-black tracking-tight text-lab-text sm:text-6xl">
          FEELCONOMY
          <span className="ml-2 inline-block rounded-2xl bg-gradient-to-br from-lab-accent to-lab-accent-2 px-3 py-1 text-3xl text-white sm:text-5xl">
            LAB
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-lab-muted sm:text-base">
          지금 내가 원하는 것과, 내가 소비를 통해 얻고 싶은 것들을 숫자로 입력하면
          그 자리에서 나만의 데이터 분석이 시작됩니다. 다른 사람의 데이터는 전혀
          필요 없습니다 — 처음부터 끝까지 오직 나의 데이터로만 계산됩니다.
        </p>
      </section>

      <Card tone="accent">
        <ol className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {FLOW_PREVIEW.map((step, i) => (
            <li
              key={step.label}
              className="lab-stagger text-center"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative mx-auto mb-1.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-lab-border bg-lab-surface-2 text-xl">
                <span aria-hidden>{step.icon}</span>
                <span
                  aria-hidden
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-lab-accent to-lab-accent-2 font-mono text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(238,125,83,0.5)]"
                >
                  {i + 1}
                </span>
              </div>
              <p className="font-mono text-[10px] text-lab-accent">STEP {i + 1}</p>
              <p className="text-[11px] leading-tight text-lab-muted">{step.label}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <LinkButton to="/consent" size="lg" full>
          시작하기 →
        </LinkButton>
        <p className="text-center text-xs text-lab-muted">
          감성욕구 {NEED_DIM}개 · 소비대안 {ALTERNATIVE_DIM}개 · 이름·전화번호·이메일·학번을
          수집하지 않습니다.
        </p>
      </div>
    </div>
  )
}
