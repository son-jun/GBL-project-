/**
 * 아주 작은 통계 유틸.
 *
 * v1에는 "기준 데이터셋 중심화"를 위한 columnMeans/columnStdDevs가 있었지만,
 * v2는 참가자 개인의 원본 평가행렬을 중심화 없이 그대로 SVD에 사용한다
 * (요구사항 문서 원문의 11단계 흐름에 중심화 단계가 없다 — 개인의 평가행렬은
 *  이미 "이 사람만의" 절대적인 만족도 척도이므로, 집단 평균과 비교해 상대화할
 *  필요가 없다).
 *
 * 여기 남은 columnMeans는 오직 하나의 용도로 쓰인다: 소비대안 군집이 만들어진
 * 뒤, 그 군집에 속한 소비대안들의 감성욕구 평균을 구해서 군집 이름을 자동으로
 * 짓는 데 사용한다 (src/lib/math/clusterNaming.ts 참고).
 */

export function columnMeans(matrix: number[][]): number[] {
  if (matrix.length === 0) return []
  const dim = matrix[0].length
  const sums = new Array<number>(dim).fill(0)
  for (const row of matrix) {
    for (let j = 0; j < dim; j++) sums[j] += row[j]
  }
  return sums.map((s) => s / matrix.length)
}
