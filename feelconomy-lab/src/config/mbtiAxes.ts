/**
 * MBTI 형식 추정(MBTI-STYLE ESTIMATE) 설정.
 *
 * ============================================================================
 *  ⚠️ 먼저 읽어야 할 한계
 * ============================================================================
 * 이 파일은 "감성욕구 6개 점수로 MBTI 4문자를 만들어 보여준다"는 요청을 구현한
 * 것이다. 구현하기 전에 분명히 기록해 둔다 — **이것은 MBTI 검사가 아니다.**
 *
 *   1. MBTI는 성격 성향(무엇을 선호하는 사람인가)을 재는 별도의 검사다.
 *      이 활동이 재는 것은 "지금 이 순간 어떤 소비 욕구가 큰가"이며, 다른
 *      날 다시 하면 값이 달라지는 상태(state)에 가깝다. 애초에 측정 대상이
 *      다르다.
 *
 *   2. MBTI의 네 축 중 감각/직관(S/N)과 사고/감정(T/F)에 대응하는 감성욕구
 *      축이 이 활동에는 아예 없다. 그래서 "가장 가까워 보이는" 욕구로 대신
 *      짝지었다. 이 짝짓기에는 통계적 근거가 없다.
 *
 *   3. 욕구가 6개인데 네 축은 8개의 끝점이 필요하므로, 일부 욕구를 두 축에서
 *      다시 쓴다(성취·소속·즐거움). 그래서 축끼리 서로 독립이 아니다 —
 *      예를 들어 성취 점수가 높으면 T와 J가 동시에 나오기 쉽다. 실제 MBTI의
 *      네 축은 서로 독립으로 설계되어 있다는 점에서 이것과 다르다.
 *
 * 따라서 화면에서는 항상 MBTI_ESTIMATE_CAVEAT를 함께 노출하고, "당신의
 * MBTI는 ○○입니다"라고 단정하지 않는다. 이 프로젝트의 표현 규칙(결과를
 * 예측이나 확정으로 말하지 않는다)은 여기에도 똑같이 적용된다.
 *
 * 참가자의 실제 MBTI를 알고 싶다면 정식 검사를 받아야 하며, 이 화면의 결과와
 * 다르게 나오는 것이 정상이다.
 */

export interface MbtiAxisDef {
  key: string
  /** 앞 문자 — 점수가 더 높거나 같을 때 채택 */
  firstLetter: string
  secondLetter: string
  /** 비교에 사용하는 감성욕구 축의 key (src/config/needs.ts 참고) */
  firstNeedKey: string
  secondNeedKey: string
  firstLabel: string
  secondLabel: string
  /** 참가자용 한 줄 설명 */
  question: string
  /** 이 짝짓기가 왜 느슨한 대응인지 — 화면에 그대로 보여준다 */
  proxyNote: string
}

/**
 * 네 축의 짝짓기 규칙.
 *
 * 동점 처리: 항상 앞 문자(E, S, T, J)를 채택한다 — 필코노미 유형 판정과
 * 같은 방향의 일관된 규칙이며(능동적·목표지향 쪽 우선), 예외 없이 적용해
 * 같은 입력이면 항상 같은 결과가 나오게 한다.
 */
export const MBTI_AXES: readonly MbtiAxisDef[] = [
  {
    key: 'attitude',
    firstLetter: 'E',
    secondLetter: 'I',
    firstNeedKey: 'belonging',
    secondNeedKey: 'recovery',
    firstLabel: '외향 E',
    secondLabel: '내향 I',
    question: '사람들과 어울리고 싶은 마음이 큰가, 혼자 회복하고 싶은 마음이 큰가?',
    proxyNote:
      '네 축 중 그래도 가장 자연스럽게 대응되는 축입니다. 다만 MBTI의 외향/내향은 "에너지를 어디서 얻는가"이고, 여기서 비교하는 것은 "지금 무엇을 원하는가"입니다.',
  },
  {
    key: 'perceiving',
    firstLetter: 'S',
    secondLetter: 'N',
    firstNeedKey: 'joy',
    secondNeedKey: 'thrill',
    firstLabel: '감각 S',
    secondLabel: '직관 N',
    question: '지금 당장의 즐거움을 원하는가, 새로운 설렘을 원하는가?',
    proxyNote:
      '대응하는 욕구 축이 없어 가장 무리한 짝짓기입니다. MBTI의 감각/직관은 정보를 받아들이는 방식(현실 위주냐 가능성 위주냐)인데, 여기서는 "지금의 즐거움 vs 새로운 자극"으로 대신했습니다.',
  },
  {
    key: 'judging',
    firstLetter: 'T',
    secondLetter: 'F',
    firstNeedKey: 'achievement',
    secondNeedKey: 'belonging',
    firstLabel: '사고 T',
    secondLabel: '감정 F',
    question: '해냈다는 성취가 더 중요한가, 사람들과의 관계가 더 중요한가?',
    proxyNote:
      '대응하는 욕구 축이 없습니다. MBTI의 사고/감정은 판단 기준(논리냐 사람이냐)인데, 여기서는 "성과 지향 vs 관계 지향"으로 대신했습니다. 소속·교류 점수는 E/I 축에서도 쓰이므로 두 축이 서로 얽혀 있습니다.',
  },
  {
    key: 'lifestyle',
    firstLetter: 'J',
    secondLetter: 'P',
    firstNeedKey: 'achievement',
    secondNeedKey: 'joy',
    firstLabel: '판단 J',
    secondLabel: '인식 P',
    question: '목표를 이뤄내고 싶은가, 그냥 지금을 즐기고 싶은가?',
    proxyNote:
      '성취·효능감 점수는 T/F 축에서도 쓰이고, 즐거움 점수는 S/N 축에서도 쓰입니다. 그래서 이 축은 앞의 두 축과 독립적이지 않습니다.',
  },
] as const

/**
 * 화면에 반드시 함께 노출하는 경고 문구.
 * 이 상수를 쓰지 않고 MBTI 코드만 단독으로 보여주는 화면을 만들지 않는다.
 */
export const MBTI_ESTIMATE_CAVEAT =
  '이건 정식 MBTI 검사가 아닙니다.\n' +
  'MBTI는 성격 성향을 재는 별도의 검사이고, 위 4문자는 방금 입력한 감성욕구 점수를 MBTI와 비슷한 형식으로 옮겨 본 재미용 추정입니다.\n' +
  '특히 감각/직관(S·N)과 사고/감정(T·F)에 해당하는 욕구 항목이 이 활동에는 없어서, 가장 가까워 보이는 욕구로 대신 짝지었습니다.\n' +
  '실제 MBTI와 다르게 나오는 것이 자연스럽고, 다르다고 해서 어느 쪽이 틀린 것도 아닙니다.'

/** 유형 공개 화면에서 카드 제목 옆에 붙이는 짧은 라벨 */
export const MBTI_ESTIMATE_BADGE = '재미용 추정'
