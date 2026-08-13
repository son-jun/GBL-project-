/**
 * 계산 단계 페이지의 공통 진입 조건 검사 (v2).
 *
 * v1은 "모델이 준비되었는가"까지 확인해야 했다. v2는 참가자 세션과 입력
 * 완성 여부만 확인하면 된다 — 사전에 준비되어야 할 외부 상태가 없다.
 */

import type { ReactNode } from 'react'
import { LinkButton, Notice } from './ui'
import { ALTERNATIVE_DIM } from '@/config/alternatives'
import { NEED_DIM } from '@/config/needs'
import { useSession } from '@/state/SessionContext'

interface FlowGuardProps {
  requireNeeds?: boolean
  requireRatings?: boolean
  requireResult?: boolean
  children: (context: { needsVector: number[]; ratingsMatrix: number[][] }) => ReactNode
}

export function FlowGuard({
  requireNeeds = true,
  requireRatings = true,
  requireResult = false,
  children,
}: FlowGuardProps) {
  const { participantId, needsVector, ratingsMatrix, result } = useSession()

  if (!participantId) {
    return (
      <div className="space-y-4">
        <Notice tone="warn" title="세션이 없습니다">
          참가자 ID가 발급되지 않았습니다. 처음부터 다시 시작해 주세요.
        </Notice>
        <LinkButton to="/" variant="secondary">
          ← 시작 화면
        </LinkButton>
      </div>
    )
  }

  if (requireNeeds && !needsVector) {
    return (
      <div className="space-y-4">
        <Notice tone="warn" title="감성욕구 입력이 완성되지 않았습니다">
          {NEED_DIM}개 문항을 모두 입력해야 다음 단계로 진행할 수 있습니다.
        </Notice>
        <LinkButton to="/needs" variant="secondary">
          ← 욕구 입력으로
        </LinkButton>
      </div>
    )
  }

  if (requireRatings && !ratingsMatrix) {
    return (
      <div className="space-y-4">
        <Notice tone="warn" title="소비대안 평가가 완성되지 않았습니다">
          {ALTERNATIVE_DIM}개 소비대안 × {NEED_DIM}개 감성욕구를 모두 평가해야 다음 단계로
          진행할 수 있습니다.
        </Notice>
        <LinkButton to="/ratings" variant="secondary">
          ← 대안 평가로
        </LinkButton>
      </div>
    )
  }

  if (requireResult && !result) {
    return (
      <div className="space-y-4">
        <Notice tone="warn" title="아직 계산이 실행되지 않았습니다">
          앞 단계를 순서대로 지나야 결과를 볼 수 있습니다.
        </Notice>
        <LinkButton to="/svd" variant="secondary">
          ← SVD 분석으로
        </LinkButton>
      </div>
    )
  }

  return <>{children({ needsVector: needsVector!, ratingsMatrix: ratingsMatrix! })}</>
}
