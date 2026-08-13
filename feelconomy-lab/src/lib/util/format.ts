/** 숫자 표시 형식을 한 곳에서 관리한다 (화면마다 소수점 자리가 달라지는 것을 방지) */

/** 잠재좌표처럼 부호가 의미 있는 값 — 소수 둘째 자리 */
export function formatCoordinate(value: number): string {
  return value.toFixed(2)
}

/** 거리 값 — 소수 둘째 자리, 항상 0 이상 */
export function formatDistance(value: number): string {
  return value.toFixed(2)
}

/** 비율(0~1)을 퍼센트 문자열로 — 소수점 없이 */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

/** 평균 점수 — 소수 첫째 자리 */
export function formatScore(value: number): string {
  return value.toFixed(1)
}

/** 편차 — 부호를 항상 붙인다 */
export function formatSigned(value: number, digits = 1): string {
  const fixed = value.toFixed(digits)
  return value > 0 ? `+${fixed}` : fixed
}
