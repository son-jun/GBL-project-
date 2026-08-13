/**
 * 소비대안 설정 (v3).
 *
 * 참가자는 이 소비대안 각각에 대해 "이 소비가 나의 각 감성욕구를
 * 얼마나 충족시켜줄 것 같은가"를 1~10점으로 평가한다. 그 결과가
 * [소비대안 × 감성욕구] 행렬이 되고, 이것이 SVD의 입력이다.
 *
 * v1의 "최근 소비 / 희망 소비" 카테고리 다중 선택은 더 이상 쓰지 않는다.
 * 대신 이 평가행렬 자체가 "이 사람에게 각 소비가 어떤 의미인지"를 담고,
 * 현재 감성욕구 벡터를 같은 잠재공간에 투영해 가장 가까운 소비를 찾는
 * 방식으로 대체되었다.
 *
 * ---------------------------------------------------------------------------
 *  v3에서 대안을 8개 → 6개로 줄인 이유
 * ---------------------------------------------------------------------------
 * 부스 활동에서 참가자가 눌러야 하는 칸이 8×6 = 48개였고, 여기에 감성욕구
 * 6개를 더하면 54번을 입력해야 했다. 현장에서 이탈이 생기기 쉬운 분량이다.
 *
 * 줄일 수 있는 쪽은 대안뿐이다 — 감성욕구 6개는 필코노미 유형 체계가
 * 정확히 3쌍(자극/회복, 표현/관계, 성취/즐거움)으로 쓰고 있어서 하나라도
 * 빼면 유형 판정이 성립하지 않는다 (config/feelconomyTypes.ts 참고).
 *
 * 대안을 6개까지만 줄인 것은 k-means 때문이다. 기본 K가 3이므로 대안이
 * 6개면 군집당 평균 2개가 되어 "군집"이라 부를 수 있는 하한선이고,
 * 5개 이하로 내리면 군집 하나에 대안이 1개만 남는 경우가 생겨 군집의
 * 의미가 사라진다.
 *
 * 뺀 두 항목과 근거:
 *   - 카페·디저트: 식음료와 충족시키는 욕구 패턴이 가장 많이 겹쳤다.
 *   - 생활·실용(생필품·문구): 감성적 동기보다 필요에 의한 소비라, 이
 *     활동의 주제인 "감성욕구를 채우는 소비"와 거리가 멀었다.
 *
 * 이 목록을 바꾸면 평가행렬의 모양이 바뀌므로 ANALYSIS_SPEC.version도
 * 함께 올린다 (config/model.ts 참고).
 */

export interface ConsumptionAlternative {
  key: string
  label: string
  icon: string
  /** 참가자용 짧은 예시 — 이 카테고리가 막연하지 않도록 돕는다 */
  example: string
}

export const CONSUMPTION_ALTERNATIVES: readonly ConsumptionAlternative[] = [
  { key: 'food',     label: '식음료',      icon: '🍔', example: '밥, 배달음식, 카페·디저트' },
  { key: 'fashion',  label: '패션',        icon: '👕', example: '옷, 신발, 액세서리' },
  { key: 'gaming',   label: '게임',        icon: '🎮', example: '모바일·콘솔 게임' },
  { key: 'content',  label: '콘텐츠·구독', icon: '📱', example: '웹툰, OTT, 음악 구독' },
  { key: 'culture',  label: '문화·공연',   icon: '🎭', example: '영화, 콘서트, 전시' },
  { key: 'travel',   label: '여행·체험',   icon: '✈️', example: '여행, 액티비티, 방탈출' },
] as const

/** 소비대안 개수 (= 개인별 평가행렬의 행 수) */
export const ALTERNATIVE_DIM = CONSUMPTION_ALTERNATIVES.length

export function alternativeLabel(key: string): string {
  return CONSUMPTION_ALTERNATIVES.find((a) => a.key === key)?.label ?? key
}

export function alternativeIcon(key: string): string {
  return CONSUMPTION_ALTERNATIVES.find((a) => a.key === key)?.icon ?? '•'
}
