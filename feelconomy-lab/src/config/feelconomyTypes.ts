/**
 * 필코노미 유형(FEELCONOMY TYPE) — MBTI 같은 고정 유형 체계.
 *
 * ============================================================================
 *  왜 이 체계를 별도로 만들었는가
 * ============================================================================
 * 이 사이트의 핵심 계산(SVD → 개인별 잠재공간 → K-means)은 참가자마다 결과가
 * 완전히 다른 좌표계를 만든다. 그래서 "군집 1"이 어떤 사람에게는 조용한 유형을,
 * 다른 사람에게는 완전히 다른 조합을 뜻할 수 있다 — 과학적으로는 맞지만,
 * 참가자 입장에서는 "내가 기억할 수 있는 정체성"이 되기 어렵다.
 *
 * 그래서 SVD/K-means와는 별개로, **참가자가 입력한 현재 감성욕구 q(6개) 자체를
 * 3개의 이분법 축으로 나눠 고정된 8가지 유형 중 하나로 분류**하는 체계를
 * 추가했다. MBTI의 4문자 코드처럼, 이 체계도 3문자 코드(예: SMG)로 표현되고,
 * 모든 참가자가 공유하는 고정된 8종의 이름·설명이 있다 (docs/05 참고).
 *
 * 중요한 차이를 참가자에게 항상 함께 알린다:
 *   - 필코노미 유형: 지금 이 순간 내가 원하는 것 6개를 8가지 틀로 요약한 것.
 *     성격을 규정하지 않고, 다시 하면 바뀔 수 있다.
 *   - 잠재수요 분석(SVD/K-means): 내가 평가한 소비대안 데이터를 바탕으로
 *     "지금 이 순간 가장 가까운 소비 방향"을 탐색적으로 찾은 것.
 * 이 둘은 서로 다른 질문에 답하며, 결과 화면에서 함께 보여주되 혼동하지 않게
 * 구분한다.
 */

export interface TypeDimension {
  key: string
  /** 점수가 더 높을 때 배정되는 문자 */
  positiveLetter: string
  negativeLetter: string
  /** 비교에 사용하는 감성욕구 축의 key (src/config/needs.ts 참고) */
  positiveNeedKey: string
  negativeNeedKey: string
  positiveLabel: string
  negativeLabel: string
  /** 참가자용 한 줄 질문 (유형 공개 화면에서 축을 설명할 때 사용) */
  question: string
}

/**
 * 3개의 이분법 축. 감성욕구 6개를 서로 대비되는 3쌍으로 묶었다 — 6개 축을
 * 하나도 남기지 않고 정확히 3쌍으로 나눈 것이라, 유형 체계가 기존 감성욕구
 * 설정과 완전히 맞물린다.
 *
 * 동점 처리 규칙: 두 점수가 같으면 항상 **양의 문자(S, M, G)**를 채택한다.
 * "능동적으로 원하는 쪽을 우선한다"는 하나의 일관된 규칙이며, 예외 없이
 * 모든 축에 동일하게 적용한다 (src/lib/math/typeCode.ts 참고).
 */
export const TYPE_DIMENSIONS: readonly TypeDimension[] = [
  {
    key: 'energy',
    positiveLetter: 'S',
    negativeLetter: 'R',
    positiveNeedKey: 'thrill',
    negativeNeedKey: 'recovery',
    positiveLabel: '자극 Spark',
    negativeLabel: '회복 Rest',
    question: '지금 나는 짜릿함을 원할까, 편안함을 원할까?',
  },
  {
    key: 'focus',
    positiveLetter: 'M',
    negativeLetter: 'W',
    positiveNeedKey: 'expression',
    negativeNeedKey: 'belonging',
    positiveLabel: '표현 Me',
    negativeLabel: '관계 We',
    question: '지금 나는 나를 표현하고 싶을까, 함께하고 싶을까?',
  },
  {
    key: 'reward',
    positiveLetter: 'G',
    negativeLetter: 'J',
    positiveNeedKey: 'achievement',
    negativeNeedKey: 'joy',
    positiveLabel: '성취 Goal',
    negativeLabel: '즐거움 Joy',
    question: '지금 나는 이뤄내고 싶을까, 그냥 즐기고 싶을까?',
  },
] as const

export interface FeelconomyTypeDef {
  code: string
  name: string
  tagline: string
  description: string
  icon: string
  color: string
  /** 이 유형과 잘 어울리는 소비대안 예시 (config/alternatives.ts의 key). 확정이 아니라 예시. */
  exampleAlternatives: string[]
}

/**
 * 8가지 필코노미 유형. 이름·설명은 전부 여기서만 관리한다.
 * 자세한 설명과 표는 docs/05_필코노미_유형표.md 참고.
 */
export const FEELCONOMY_TYPES: Record<string, FeelconomyTypeDef> = {
  SMG: {
    code: 'SMG',
    name: '반짝이는 개척자',
    tagline: '짜릿함으로 나만의 길을 만든다',
    description:
      '새로운 자극 속에서 스스로 성장하는 것을 즐기는 유형입니다. 낯선 도전과 경험을 통해 나다움을 확인하고, 그 과정 자체에서 성취감을 느낍니다.',
    icon: '🧭',
    color: '#E2704A',
    exampleAlternatives: ['travel', 'fashion'],
  },
  SMJ: {
    code: 'SMJ',
    name: '반짝이는 자유영혼',
    tagline: '순간의 짜릿함을 온전히 나답게 즐긴다',
    description:
      '즉흥적이고 자유로운 성향으로, 강렬한 즐거움을 나만의 방식으로 만끽합니다. 정해진 틀보다 지금 이 순간의 재미를 우선합니다.',
    icon: '🎈',
    color: '#FF8F6B',
    exampleAlternatives: ['gaming', 'content'],
  },
  SWG: {
    code: 'SWG',
    name: '열정적인 리더',
    tagline: '함께 짜릿하게, 함께 이뤄낸다',
    description:
      '사람들과 함께 도전하고 성장하는 데서 에너지를 얻는 유형입니다. 목표를 향해 사람들을 이끌고 함께 나아가는 것을 즐깁니다.',
    icon: '🔥',
    color: '#D9534F',
    exampleAlternatives: ['travel', 'culture'],
  },
  SWJ: {
    code: 'SWJ',
    name: '신나는 무드메이커',
    tagline: '함께 있을 때 가장 즐겁다',
    description:
      '사람들과 함께 신나는 순간을 만드는 분위기 메이커입니다. 즐거움은 나눌 때 배가 된다고 믿습니다.',
    icon: '🎉',
    color: '#F4A93F',
    exampleAlternatives: ['culture', 'food'],
  },
  RMG: {
    code: 'RMG',
    name: '차분한 완성가',
    tagline: '조용히, 그러나 확실하게 이뤄낸다',
    description:
      '안정된 상태에서 스스로 계획하고 하나씩 성취해가는 유형입니다. 혼자만의 속도로 꾸준히 나아가는 것을 편안해합니다.',
    icon: '🌱',
    color: '#7FAE7A',
    exampleAlternatives: ['lifestyle', 'content'],
  },
  RMJ: {
    code: 'RMJ',
    name: '고요한 탐닉가',
    tagline: '나만의 시간 속에서 작은 행복을 찾는다',
    description:
      '혼자만의 편안한 시간 속에서 소소하지만 확실한 즐거움을 찾는 유형입니다. 조용한 몰입이 가장 큰 힐링입니다.',
    icon: '🕯️',
    color: '#A97C50',
    exampleAlternatives: ['cafe', 'content'],
  },
  RWG: {
    code: 'RWG',
    name: '든든한 동행자',
    tagline: '함께라서 더 단단해진다',
    description:
      '신뢰하는 사람들과 안정적으로 성장해가는 것을 선호하는 유형입니다. 조급하지 않게, 함께 오래가는 관계를 중요하게 여깁니다.',
    icon: '🤝',
    color: '#D4B36A',
    exampleAlternatives: ['lifestyle', 'food'],
  },
  RWJ: {
    code: 'RWJ',
    name: '포근한 나눔러',
    tagline: '편안한 분위기에서 함께 웃는 게 좋다',
    description:
      '따뜻하고 편안한 분위기 속에서 사람들과 소소한 즐거움을 나누는 유형입니다. 거창하지 않아도 함께라면 충분합니다.',
    icon: '☕',
    color: '#E0959D',
    exampleAlternatives: ['cafe', 'food'],
  },
}

export const FEELCONOMY_TYPE_CODES = Object.keys(FEELCONOMY_TYPES)
