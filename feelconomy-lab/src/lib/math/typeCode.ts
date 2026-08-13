/**
 * 필코노미 유형(FEELCONOMY TYPE) 판정 — 순수 함수.
 *
 * 참가자의 현재 감성욕구 벡터 q(6개)만으로 3문자 유형 코드를 결정한다.
 * SVD나 K-means와 무관하며, 소비대안 평가행렬도 필요 없다 — 그래서 참가자가
 * 욕구 입력만 마치면 곧바로(RatingsPage 이전에) 유형을 공개할 수 있다.
 */

import { FEELCONOMY_TYPES, TYPE_DIMENSIONS, type FeelconomyTypeDef } from '@/config/feelconomyTypes'
import { NEED_AXES } from '@/config/needs'

export interface DimensionResult {
  key: string
  letter: string
  positiveLabel: string
  negativeLabel: string
  positiveScore: number
  negativeScore: number
  question: string
}

export interface FeelconomyTypeResolution {
  code: string
  dimensions: DimensionResult[]
  type: FeelconomyTypeDef
}

/** 감성욕구 key로 배열 인덱스를 찾는다 (config 순서가 바뀌어도 안전하도록) */
function needIndex(key: string): number {
  const index = NEED_AXES.findIndex((axis) => axis.key === key)
  if (index < 0) throw new Error(`필코노미 유형 판정 실패: 감성욕구 키 '${key}'를 찾을 수 없습니다.`)
  return index
}

/**
 * 감성욕구 벡터로 필코노미 유형을 판정한다.
 *
 * 규칙: 각 차원에서 두 축의 점수를 비교해 더 높은 쪽의 문자를 채택한다.
 * 두 점수가 같으면 **항상 양의 문자(S, M, G)**를 채택한다 — "능동적으로
 * 원하는 쪽을 우선한다"는 하나의 일관된 규칙이며, 모든 축에 예외 없이
 * 적용해 재현 가능하게 만든다.
 */
export function resolveFeelconomyType(needs: number[]): FeelconomyTypeResolution {
  const dimensions: DimensionResult[] = TYPE_DIMENSIONS.map((dimension) => {
    const positiveScore = needs[needIndex(dimension.positiveNeedKey)]
    const negativeScore = needs[needIndex(dimension.negativeNeedKey)]
    const letter = positiveScore >= negativeScore ? dimension.positiveLetter : dimension.negativeLetter
    return {
      key: dimension.key,
      letter,
      positiveLabel: dimension.positiveLabel,
      negativeLabel: dimension.negativeLabel,
      positiveScore,
      negativeScore,
      question: dimension.question,
    }
  })

  const code = dimensions.map((d) => d.letter).join('')
  const type = FEELCONOMY_TYPES[code]
  if (!type) throw new Error(`필코노미 유형 판정 실패: 코드 '${code}'에 대한 정의가 없습니다.`)

  return { code, dimensions, type }
}
