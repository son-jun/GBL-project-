/**
 * 페이지 9. 마무리.
 *
 * 성공 기준: 참가자가 활동을 마친 뒤 "내 데이터 하나만으로 어떻게 SVD와
 * K-means가 완결되었는지"를 스스로 설명할 수 있어야 한다.
 */

import { useNavigate } from 'react-router-dom'
import { Button, Card, Lead, LinkButton, Notice, ProgressBar, SectionTitle } from '@/components/ui'
import { ALTERNATIVE_DIM } from '@/config/alternatives'
import { NEED_DIM } from '@/config/needs'
import { useSession } from '@/state/SessionContext'

const RECAP_STEPS = [
  {
    icon: '🎚️',
    title: '현재 욕구 벡터 q',
    plain: `지금 원하는 것 ${NEED_DIM}개를 숫자로 입력했습니다.`,
    formula: 'q = [q₁, …, q₆]',
  },
  {
    icon: '📊',
    title: '소비대안 평가행렬 A',
    plain: `소비대안 ${ALTERNATIVE_DIM}개가 각 욕구를 얼마나 채우는지 평가해, 나만의 행렬을 만들었습니다.`,
    formula: 'A (8×6)',
  },
  {
    icon: '🗜️',
    title: 'SVD 압축',
    plain: '내가 소비를 평가할 때 반복되는 욕구의 결합을 찾아, 몇 개의 핵심 축으로 압축했습니다.',
    formula: 'A = U Σ Vᵀ',
  },
  {
    icon: '📍',
    title: '잠재공간에 배치',
    plain: '소비대안 8개와 지금 내 욕구가 같은 좌표 공간의 점이 되었습니다.',
    formula: 'Z = A·V_r,  q* = q·V_r',
  },
  {
    icon: '🧩',
    title: '소비대안 군집화',
    plain: '가까이 있는 소비대안들을 몇 개의 그룹으로 묶고, 각 그룹에 즉석 이름을 붙였습니다.',
    formula: 'k-means on Z',
  },
  {
    icon: '📐',
    title: '거리 비교',
    plain: '지금 내 욕구점에서 각 군집 중심까지 거리를 쟀습니다.',
    formula: 'Dk = ‖q* − μk‖',
  },
  {
    icon: '🎯',
    title: '가장 가까운 군집',
    plain: '거리가 가장 짧은 군집이 지금 나와 가장 가까운 소비 방향입니다.',
    formula: 'argmin Dk',
  },
  {
    icon: '🔮',
    title: '세부 잠재수요',
    plain: '그 군집 안에서 가장 가까운 소비 하나를 더 구체적인 잠재수요로 확인했습니다.',
    formula: '군집 내 최단거리 소비대안',
  },
]

export function FinishPage() {
  const { reset, result, participantId, feelconomyType } = useSession()
  const navigate = useNavigate()

  const startNextParticipant = () => {
    reset()
    navigate('/')
  }

  return (
    <div className="lab-enter">
      <ProgressBar stepIndex={6} />
      <SectionTitle>분석을 마쳤습니다</SectionTitle>
      <Lead>오늘 한 일을 한 문장으로 정리해 봅시다.</Lead>

      {feelconomyType ? (
        <Card
          className="mb-5 text-center"
          style={{ borderColor: `${feelconomyType.type.color}55`, background: `${feelconomyType.type.color}0f` }}
        >
          <p className="text-xs text-lab-muted">오늘 확인한 나의 필코노미 유형은</p>
          <p className="mt-1 text-xl font-black" style={{ color: feelconomyType.type.color }}>
            {feelconomyType.code} · {feelconomyType.type.name} {feelconomyType.type.icon}
          </p>
          <p className="mt-1 text-xs text-lab-muted">오래 기억해 두고, 다음에 또 확인해 보세요.</p>
        </Card>
      ) : null}

      <Card tone="accent" className="mb-5">
        <p className="text-sm leading-relaxed text-lab-text sm:text-base">
          내가 원하는 것과 각 소비가 채워주는 것을 숫자로 입력해{' '}
          <strong className="text-lab-accent">나만의 데이터 행렬</strong>을 만들었습니다.{' '}
          <strong className="text-lab-accent">SVD</strong>로 그 행렬을 압축해 소비를 판단하는
          진짜 기준을 찾고, <strong className="text-lab-accent">K-means</strong>로 소비들을
          묶은 뒤 지금 내 욕구와 가장 가까운 군집을 찾았습니다.
        </p>
      </Card>

      <div className="mb-5 space-y-2">
        {RECAP_STEPS.map((step, i) => (
          <div key={step.title}>
            <Card className="py-3.5">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lab-surface-2 text-lg">
                  <span aria-hidden>{step.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-[10px] text-lab-accent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-bold text-lab-text">{step.title}</span>
                    <span className="font-mono text-[11px] text-lab-muted">{step.formula}</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-lab-muted">{step.plain}</p>
                </div>
              </div>
            </Card>
            {i < RECAP_STEPS.length - 1 ? (
              <p aria-hidden className="py-0.5 text-center text-xs text-lab-border">
                ↓
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <Card className="mb-5">
        <p className="mb-2 text-sm font-bold text-lab-text">
          이렇게 설명할 수 있으면 이 활동을 이해한 것입니다
        </p>
        <blockquote className="border-l-2 border-lab-accent pl-4 text-xs leading-relaxed text-lab-muted italic sm:text-sm">
          "내가 원하는 것과 각 소비가 채워주는 것을 숫자로 입력하면, 그 자체로 나만의 데이터
          행렬이 된다. SVD로 그 행렬을 압축하면 내가 소비를 판단하는 진짜 기준(잠재축)이
          드러난다. 그 축 위에서 소비들을 군집으로 묶고, 지금 내 욕구를 같은 축에 투영해
          가장 가까운 군집을 찾으면, 나에게 나타날 가능성이 있는 소비 방향을 추정할 수 있다."
        </blockquote>
      </Card>

      <Notice tone="warn" title="꼭 기억할 한 가지">
        {'이 결과는 "내가 무엇을 살지"를 맞힌 것이 아닙니다.\n' +
          '지금 이 순간의 욕구와 내가 매긴 평가 점수를 가지고 계산한 거리 기반 결과입니다.\n' +
          '평가 점수나 욕구가 조금만 달라져도 결과는 달라질 수 있습니다.'}
      </Notice>

      {result && participantId ? (
        <p className="mt-4 text-center font-mono text-[11px] text-lab-muted">
          {participantId} · {result.specVersion} · 데이터 저장 완료
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        <Button onClick={startNextParticipant} size="lg" full>
          🔄 세션 초기화 — 다음 참가자 시작
        </Button>
        <p className="text-center text-xs text-lab-muted">
          이 버튼을 누르면 화면에서 내 정보가 모두 지워집니다. (저장된 분석 데이터는 남습니다)
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton to="/result" variant="secondary" full>
            ← 결과 다시 보기
          </LinkButton>
          <LinkButton to="/admin" variant="ghost" full>
            관리자 화면
          </LinkButton>
        </div>
      </div>
    </div>
  )
}
