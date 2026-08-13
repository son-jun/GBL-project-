/**
 * 관리자 탭 1 — 분석 규격 개요 (v2).
 *
 * v1에는 "기준 데이터셋 업로드 → 검증 → 모델 학습 → 잠금"이라는 긴 절차가
 * 있었다. v2는 그런 절차가 없다 — 감성욕구 축, 소비대안, K·r 기본값은 모두
 * 코드 설정 파일(src/config/)에 고정되어 있고, 참가자 각자가 자기 데이터로
 * 그 자리에서 분석을 완결한다.
 *
 * 그래서 이 탭은 "관리자가 무언가를 실행하는 화면"이 아니라 "지금 이 규격이
 * 무엇으로 구성되어 있는지 확인하는 화면"이다. 축이나 대안을 바꾸고 싶으면
 * src/config/needs.ts, src/config/alternatives.ts 를 수정한 뒤 배포한다.
 */

import { Card, DataTable, Notice } from '@/components/ui'
import { CONSUMPTION_ALTERNATIVES, alternativeLabel } from '@/config/alternatives'
import { FEELCONOMY_TYPES, TYPE_DIMENSIONS } from '@/config/feelconomyTypes'
import { ANALYSIS_SPEC } from '@/config/model'
import { NEED_AXES } from '@/config/needs'

export function AdminSpecTab() {
  return (
    <div className="space-y-4">
      <Notice tone="info" title="이 화면은 '실행'이 아니라 '확인'입니다">
        {'v1(기준 데이터셋 → 모델 학습) 방식과 달리, 이 버전은 참가자 한 명의 입력만으로 ' +
          '분석이 완결됩니다. 그래서 관리자가 사전에 준비하거나 학습시켜야 할 것이 없습니다.\n' +
          '축이나 소비대안 구성을 바꾸려면 코드의 설정 파일을 수정한 뒤 다시 배포해야 합니다.'}
      </Notice>

      <Card>
        <p className="mb-3 text-sm font-bold text-lab-text">분석 규격</p>
        <DataTable
          headers={['항목', '값']}
          align={['left', 'left']}
          rows={[
            ['규격 버전', <span key="v" className="font-mono text-xs text-lab-accent">{ANALYSIS_SPEC.version}</span>],
            ['잠재 차원 r 기본값', <span key="r" className="font-mono text-xs text-lab-text">{ANALYSIS_SPEC.defaultLatentDim}</span>],
            ['r 선택 범위', <span key="rc" className="font-mono text-xs text-lab-text">{ANALYSIS_SPEC.latentDimChoices.join(', ')}</span>],
            ['군집 개수 K 기본값', <span key="k" className="font-mono text-xs text-lab-text">{ANALYSIS_SPEC.defaultK}</span>],
            ['K 허용 범위', <span key="kr" className="font-mono text-xs text-lab-text">{ANALYSIS_SPEC.kMin} ~ {ANALYSIS_SPEC.kMax}</span>],
            ['k-means 초기화 횟수', <span key="n" className="font-mono text-xs text-lab-text">{ANALYSIS_SPEC.nInit}</span>],
            ['난수 시드', <span key="s" className="font-mono text-xs text-lab-text">{ANALYSIS_SPEC.randomSeed}</span>],
          ]}
        />
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold text-lab-text">감성욕구 축 ({NEED_AXES.length}개)</p>
        <DataTable
          headers={['#', '이름', '설명', '군집 자동명명 라벨']}
          align={['center', 'left', 'left', 'left']}
          rows={NEED_AXES.map((axis, i) => [
            <span key="i" className="font-mono text-xs text-lab-muted">{i + 1}</span>,
            <span key="l" className="text-sm font-semibold text-lab-text">{axis.label}</span>,
            <span key="h" className="text-xs text-lab-muted">{axis.hint}</span>,
            <span key="a" className="font-mono text-xs text-lab-accent">{axis.archetypeLabel}형</span>,
          ])}
        />
        <p className="mt-3 text-xs text-lab-muted">
          수정 위치: <span className="font-mono text-lab-text">src/config/needs.ts</span>
        </p>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold text-lab-text">
          소비대안 ({CONSUMPTION_ALTERNATIVES.length}개)
        </p>
        <DataTable
          headers={['#', '이름', '예시']}
          align={['center', 'left', 'left']}
          rows={CONSUMPTION_ALTERNATIVES.map((alt, i) => [
            <span key="i" className="font-mono text-xs text-lab-muted">{i + 1}</span>,
            <span key="l" className="flex items-center gap-1.5 text-sm font-semibold text-lab-text">
              <span aria-hidden>{alt.icon}</span>
              {alt.label}
            </span>,
            <span key="e" className="text-xs text-lab-muted">{alt.example}</span>,
          ])}
        />
        <p className="mt-3 text-xs text-lab-muted">
          수정 위치: <span className="font-mono text-lab-text">src/config/alternatives.ts</span>
        </p>
      </Card>

      <Card>
        <p className="mb-1 text-sm font-bold text-lab-text">필코노미 유형 (MBTI 식 8유형)</p>
        <p className="mb-3 text-xs leading-relaxed text-lab-muted">
          SVD/K-means와 별개로, 현재 욕구 6개만으로 결정되는 고정 유형 체계입니다. 자세한 설명과
          근거는 <span className="font-mono text-lab-text">docs/05_필코노미_유형표.md</span> 참고.
        </p>

        <p className="mb-2 text-xs font-semibold text-lab-text">3가지 판정 기준</p>
        <DataTable
          headers={['기준', '문자 (점수 높은 쪽)', '동점 시']}
          align={['left', 'left', 'left']}
          rows={TYPE_DIMENSIONS.map((d) => [
            <span key="q" className="text-xs text-lab-text">{d.question}</span>,
            <span key="l" className="font-mono text-xs text-lab-muted">
              {d.positiveLetter}={d.positiveLabel} / {d.negativeLetter}={d.negativeLabel}
            </span>,
            <span key="t" className="font-mono text-xs text-lab-accent">{d.positiveLetter} 채택</span>,
          ])}
        />

        <p className="mt-4 mb-2 text-xs font-semibold text-lab-text">8가지 유형</p>
        <DataTable
          headers={['코드', '이름', '태그라인', '예시 소비']}
          align={['left', 'left', 'left', 'left']}
          rows={Object.values(FEELCONOMY_TYPES).map((t) => [
            <span key="c" className="font-mono text-xs font-bold" style={{ color: t.color }}>
              {t.icon} {t.code}
            </span>,
            <span key="n" className="text-sm font-semibold text-lab-text">{t.name}</span>,
            <span key="tg" className="text-xs text-lab-muted">{t.tagline}</span>,
            <span key="e" className="text-xs text-lab-muted">
              {t.exampleAlternatives.map(alternativeLabel).join(', ')}
            </span>,
          ])}
        />
        <p className="mt-3 text-xs text-lab-muted">
          수정 위치: <span className="font-mono text-lab-text">src/config/feelconomyTypes.ts</span>
        </p>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-bold text-lab-text">계산 흐름 요약</p>
        <ol className="list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-lab-muted">
          <li>참가자가 현재 감성욕구 q({NEED_AXES.length}개)를 입력한다</li>
          <li>참가자가 소비대안 {CONSUMPTION_ALTERNATIVES.length}개 × 감성욕구를 평가해 행렬 A를 만든다</li>
          <li>A를 SVD로 분해한다: A = U Σ Vᵀ</li>
          <li>설명분산 누적 비율을 보고 참가자가 r을 선택한다</li>
          <li>소비대안과 q를 같은 잠재공간에 투영한다: Z = A·V_r, q* = q·V_r</li>
          <li>Z에 k-means++를 적용해 K개 군집을 만들고 즉석 이름을 붙인다</li>
          <li>q*에서 각 군집 중심까지 거리를 비교해 가장 가까운 군집을 찾는다</li>
          <li>그 군집 안에서 q*와 가장 가까운 소비대안을 세부 잠재수요로 제시한다</li>
        </ol>
      </Card>
    </div>
  )
}
