/**
 * MBTI 형식 추정 — 순수 함수.
 *
 * 감성욕구 벡터 q만으로 4문자 코드를 만든다. 필코노미 유형 판정
 * (typeCode.ts)과 완전히 같은 구조이고, 역시 SVD·K-means와 무관하다.
 *
 * ⚠️ 이 함수의 결과는 MBTI 검사 결과가 아니다. 한계와 근거는
 * config/mbtiAxes.ts 상단 주석에 전부 적어 두었으니 화면을 만들기 전에
 * 반드시 읽어야 한다. 화면에서는 MBTI_ESTIMATE_CAVEAT를 항상 함께 보여준다.
 *
 * 결과를 저장소(ParticipantRecord)에 따로 기록하지 않는다 — 감성욕구
 * 점수만 있으면 언제든 똑같이 다시 계산되는 값이라(순수 함수 + 동점 규칙
 * 고정) 중복 저장할 이유가 없고, 저장 스키마와 CSV를 건드리지 않는 쪽이
 * 기존 데이터와의 호환에 안전하다.
 */

import { MBTI_AXES } from '@/config/mbtiAxes'
import { NEED_AXES } from '@/config/needs'

export interface MbtiAxisResult {
  key: string
  letter: string
  firstLetter: string
  secondLetter: string
  firstLabel: string
  secondLabel: string
  firstScore: number
  secondScore: number
  question: string
  proxyNote: string
  /** 앞 문자가 채택되었는가 (동점이면 true) */
  firstWon: boolean
  /** 두 점수가 같아서 동점 규칙으로 결정되었는가 */
  tied: boolean
}

export interface MbtiEstimate {
  code: string
  axes: MbtiAxisResult[]
}

/** 감성욕구 key로 배열 인덱스를 찾는다 (config 순서가 바뀌어도 안전하도록) */
function needIndex(key: string): number {
  const index = NEED_AXES.findIndex((axis) => axis.key === key)
  if (index < 0) {
    throw new Error(`MBTI 형식 추정 실패: 감성욕구 키 '${key}'를 찾을 수 없습니다.`)
  }
  return index
}

/**
 * 감성욕구 벡터로 MBTI 형식의 4문자 코드를 추정한다.
 *
 * 규칙: 각 축에서 두 욕구 점수를 비교해 더 높은 쪽의 문자를 채택하고,
 * 동점이면 앞 문자(E, S, T, J)를 채택한다. 같은 입력이면 항상 같은 결과다.
 */
export function estimateMbti(needs: number[]): MbtiEstimate {
  if (needs.length !== NEED_AXES.length) {
    throw new Error(
      `MBTI 형식 추정 실패: 감성욕구 개수가 ${NEED_AXES.length}개여야 하는데 ${needs.length}개입니다.`,
    )
  }

  const axes: MbtiAxisResult[] = MBTI_AXES.map((axis) => {
    const firstScore = needs[needIndex(axis.firstNeedKey)]
    const secondScore = needs[needIndex(axis.secondNeedKey)]
    const firstWon = firstScore >= secondScore
    return {
      key: axis.key,
      letter: firstWon ? axis.firstLetter : axis.secondLetter,
      firstLetter: axis.firstLetter,
      secondLetter: axis.secondLetter,
      firstLabel: axis.firstLabel,
      secondLabel: axis.secondLabel,
      firstScore,
      secondScore,
      question: axis.question,
      proxyNote: axis.proxyNote,
      firstWon,
      tied: firstScore === secondScore,
    }
  })

  return { code: axes.map((a) => a.letter).join(''), axes }
}
