/**
 * 소비대안 군집의 즉석 이름 생성.
 *
 * ============================================================================
 *  왜 시스템이 이름을 자동으로 짓는가 (v1과의 차이)
 * ============================================================================
 * v1에서는 "K-means가 이름을 지은 것처럼 보이면 안 된다. 군집을 수학적으로
 * 형성한 뒤, 연구자가 그 특성을 해석해서 이름을 붙인다"는 원칙이 있었다.
 * 이는 하나의 고정된 기준 데이터셋에서 나온 군집을 놓고, 연구자가 시간을 들여
 * 해석하는 상황을 전제로 한다.
 *
 * v2는 상황이 다르다. 군집이 **매 참가자마다, 그 자리에서, 그 사람의 데이터로만**
 * 새로 만들어진다. 부스에서 수십 명이 각자 자기 군집을 실시간으로 받는데
 * 연구자가 매번 이름을 붙일 수는 없다. 그래서 이름 짓기 자체를 게임 규칙으로
 * 명시적으로 코드화했다:
 *
 *   "이 군집에 속한 소비대안들이 원래 평가에서 평균적으로 가장 높게 준
 *    감성욕구 1~2개를 찾아, 그 욕구의 이름을 그대로 군집 이름으로 쓴다."
 *
 * 이것은 "숨겨진 진실을 발견한 과학적 명명"이 아니라 "이미 참가자가 스스로
 * 입력한 숫자를 요약해서 보여주는 투명한 규칙"이다. 결과 화면에서도 이
 * 생성 규칙을 그대로 설명해 참가자가 "AI가 알아서 판단했다"고 오해하지
 * 않게 한다.
 */

import { NEED_AXES } from '@/config/needs'

/**
 * 두 욕구의 평균 점수 차이가 이 값보다 작으면 "공동 1위"로 보고 두 이름을
 * 함께 쓴다. 1~10 척도에서 1.0점 차이는 사실상 우열을 가리기 어려운
 * 수준이라고 보고 정한 값이다.
 */
const CO_DOMINANT_GAP_THRESHOLD = 1.0

/**
 * 군집에 속한 소비대안들의 감성욕구 평균값(needMeans, 길이 = NEED_DIM)을 보고
 * 즉석 이름을 만든다.
 *
 * 예: needMeans에서 '즐거움'과 '자극·설렘'이 공동으로 가장 높다면
 *     → "즐거움·자극추구형"
 *     '회복·안정'만 뚜렷하게 높다면
 *     → "회복안정형"
 */
export function nameCluster(needMeans: number[]): string {
  if (needMeans.length !== NEED_AXES.length) {
    throw new Error(
      `군집 이름 생성 실패: needMeans 길이(${needMeans.length})가 감성욕구 개수(${NEED_AXES.length})와 다릅니다.`,
    )
  }

  const ranked = needMeans
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)

  const top = NEED_AXES[ranked[0].index]
  const second = ranked.length > 1 ? NEED_AXES[ranked[1].index] : null
  const gap = ranked.length > 1 ? ranked[0].value - ranked[1].value : Infinity

  if (second && gap < CO_DOMINANT_GAP_THRESHOLD) {
    return `${top.archetypeLabel}·${second.archetypeLabel}형`
  }
  return `${top.archetypeLabel}형`
}

/**
 * 이 이름이 어떤 규칙으로 만들어졌는지 참가자에게 보여줄 한 줄 설명.
 * 결과 화면과 관리자 화면 양쪽에서 재사용한다.
 */
export const CLUSTER_NAMING_EXPLANATION =
  '군집 이름은 그 군집에 속한 소비대안들에 내가 직접 매긴 점수 중 평균적으로 가장 높았던 감성욕구 1~2개를 그대로 딴 것입니다. AI가 별도로 판단한 것이 아니라, 내가 입력한 숫자를 요약해서 보여주는 규칙입니다.'
