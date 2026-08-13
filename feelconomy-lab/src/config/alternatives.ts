/**
 * 소비대안 설정 (v2).
 *
 * 참가자는 이 8개 소비대안 각각에 대해 "이 소비가 나의 각 감성욕구를
 * 얼마나 충족시켜줄 것 같은가"를 1~10점으로 평가한다. 그 결과가
 * [소비대안 × 감성욕구] = 8×6 행렬이 되고, 이것이 SVD의 입력이다.
 *
 * v1의 "최근 소비 / 희망 소비" 카테고리 다중 선택은 더 이상 쓰지 않는다.
 * 대신 이 평가행렬 자체가 "이 사람에게 각 소비가 어떤 의미인지"를 담고,
 * 현재 감성욕구 벡터를 같은 잠재공간에 투영해 가장 가까운 소비를 찾는
 * 방식으로 대체되었다.
 */

export interface ConsumptionAlternative {
  key: string
  label: string
  icon: string
  /** 참가자용 짧은 예시 — 이 카테고리가 막연하지 않도록 돕는다 */
  example: string
}

export const CONSUMPTION_ALTERNATIVES: readonly ConsumptionAlternative[] = [
  { key: 'food',     label: '식음료',      icon: '🍔', example: '밥, 배달음식, 술·음료' },
  { key: 'cafe',     label: '카페·디저트', icon: '☕', example: '커피, 빵, 디저트' },
  { key: 'fashion',  label: '패션',        icon: '👕', example: '옷, 신발, 액세서리' },
  { key: 'gaming',   label: '게임',        icon: '🎮', example: '모바일·콘솔 게임' },
  { key: 'content',  label: '콘텐츠·구독', icon: '📱', example: '웹툰, OTT, 음악 구독' },
  { key: 'culture',  label: '문화·공연',   icon: '🎭', example: '영화, 콘서트, 전시' },
  { key: 'travel',   label: '여행·체험',   icon: '✈️', example: '여행, 액티비티, 방탈출' },
  { key: 'lifestyle',label: '생활·실용',   icon: '🧴', example: '생필품, 문구, 학용품' },
] as const

/** 소비대안 개수 (= 개인별 평가행렬의 행 수) */
export const ALTERNATIVE_DIM = CONSUMPTION_ALTERNATIVES.length

export function alternativeLabel(key: string): string {
  return CONSUMPTION_ALTERNATIVES.find((a) => a.key === key)?.label ?? key
}

export function alternativeIcon(key: string): string {
  return CONSUMPTION_ALTERNATIVES.find((a) => a.key === key)?.icon ?? '•'
}
