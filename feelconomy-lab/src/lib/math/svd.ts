/**
 * SVD (특이값 분해).
 *
 * v2에서 이 모듈이 분해하는 대상은 "참가자 한 명의 [소비대안 × 감성욕구]
 * 평가행렬 A" (ALTERNATIVE_DIM × NEED_DIM, 예: 8×6)다. 참가자 집단의
 * 기준 데이터셋을 중심화한 행렬이 아니다 — v2에는 그런 집단 데이터가
 * 아예 존재하지 않는다. 참가자 개인의 원본 평가값을 그대로 분해한다.
 *
 *   A = U Σ Vᵀ
 *
 * 구현 전략:
 *   A = U Σ Vᵀ  ⟹  Aᵀ A = V Σ² Vᵀ
 * 즉 d×d 대칭행렬 G = Aᵀ A 의 고유분해를 구하면 V(잠재축)와 Σ(특이값)를 얻는다.
 * 감성욕구 변수는 6개뿐(d=6)이므로 이 방법이 가장 단순하고, Jacobi 회전법은
 * 반복 순서가 완전히 결정되어 있어 **결정론적**이다 — 같은 행렬을 다시 넣으면
 * 항상 같은 결과가 나온다.
 *
 * 왜 직접 구현했는가: 브라우저에서 바로 돌아야 하고, 부호 규약과 반복 종료 조건을
 * 우리가 통제해야 "같은 입력 → 항상 같은 결과"를 보장할 수 있기 때문이다.
 * 알고리즘 자체는 표준적인 cyclic Jacobi eigenvalue 알고리즘이다.
 */

import type { PersonalSvdSummary } from '../types'

/** Jacobi 반복의 최대 스윕 횟수 — d가 작으므로 10회면 충분히 수렴한다 */
const MAX_SWEEPS = 100
/** 비대각 원소가 이 값보다 작아지면 0으로 간주하고 종료 */
const JACOBI_EPSILON = 1e-12

/**
 * 대칭 양의 준정부호 행렬의 고유분해.
 * @returns values 내림차순 고유값, vectors[j][k] = k번째 고유벡터의 j번째 성분
 */
export function symmetricEigenDecomposition(input: number[][]): {
  values: number[]
  vectors: number[][]
} {
  const n = input.length
  // 입력을 복사해서 파괴적으로 회전시킨다
  const a = input.map((row) => [...row])
  // v는 단위행렬에서 시작해 회전을 누적한다
  const v: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  )

  for (let sweep = 0; sweep < MAX_SWEEPS; sweep++) {
    // 비대각 원소의 크기 합이 충분히 작으면 수렴
    let offDiagonal = 0
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) offDiagonal += a[i][j] * a[i][j]
    }
    if (offDiagonal < JACOBI_EPSILON) break

    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < JACOBI_EPSILON) continue

        // a[p][q]를 0으로 만드는 회전각 θ 계산 (수치적으로 안정한 형태)
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
        const t =
          Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const s = t * c

        // A ← Jᵀ A J
        for (let k = 0; k < n; k++) {
          const akp = a[k][p]
          const akq = a[k][q]
          a[k][p] = c * akp - s * akq
          a[k][q] = s * akp + c * akq
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k]
          const aqk = a[q][k]
          a[p][k] = c * apk - s * aqk
          a[q][k] = s * apk + c * aqk
        }
        // V ← V J  (고유벡터 누적)
        for (let k = 0; k < n; k++) {
          const vkp = v[k][p]
          const vkq = v[k][q]
          v[k][p] = c * vkp - s * vkq
          v[k][q] = s * vkp + c * vkq
        }
      }
    }
  }

  // 고유값(대각 원소)을 내림차순으로 정렬하고 고유벡터도 같은 순서로 재배열
  const order = Array.from({ length: n }, (_, i) => i).sort((x, y) => a[y][y] - a[x][x])
  const values = order.map((i) => a[i][i])
  const vectors: number[][] = Array.from({ length: n }, (_, row) =>
    order.map((col) => v[row][col]),
  )

  // 부호 규약: 각 고유벡터에서 절댓값이 가장 큰 성분을 양수로 맞춘다.
  // 고유벡터는 부호가 뒤집혀도 수학적으로 같지만, 이렇게 고정해야 매번
  // 같은 좌표값이 나와 학습지 손계산과 대조할 수 있다.
  for (let col = 0; col < n; col++) {
    let maxRow = 0
    for (let row = 1; row < n; row++) {
      if (Math.abs(vectors[row][col]) > Math.abs(vectors[maxRow][col])) maxRow = row
    }
    if (vectors[maxRow][col] < 0) {
      for (let row = 0; row < n; row++) vectors[row][col] = -vectors[row][col]
    }
  }

  return { values, vectors }
}

/**
 * 참가자 개인의 [소비대안 × 감성욕구] 평가행렬 A의 SVD 요약을 계산한다.
 *
 * @param ratings 참가자의 평가행렬 (ALTERNATIVE_DIM × NEED_DIM, 중심화하지 않은 원값)
 * @param latentDim 사용할 잠재 차원 수 r (참가자가 설명분산 표를 보고 2 또는 3 중 선택)
 */
export function computeSvd(ratings: number[][], latentDim: number): PersonalSvdSummary {
  if (ratings.length === 0) throw new Error('SVD 실패: 평가행렬이 비어 있습니다.')
  const dim = ratings[0].length
  if (latentDim < 1 || latentDim > dim) {
    throw new Error(`SVD 실패: 잠재 차원 r=${latentDim} 은 1 이상 ${dim} 이하여야 합니다.`)
  }

  // G = Aᵀ A  (d × d 대칭행렬, d = 감성욕구 개수)
  const gram: number[][] = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
  for (const row of ratings) {
    for (let i = 0; i < dim; i++) {
      for (let j = i; j < dim; j++) {
        const product = row[i] * row[j]
        gram[i][j] += product
        if (i !== j) gram[j][i] += product
      }
    }
  }

  const { values, vectors } = symmetricEigenDecomposition(gram)

  // 특이값 σ_k = sqrt(λ_k). 수치오차로 λ가 아주 작은 음수가 될 수 있으므로 0으로 클램프한다.
  const singularValues = values.map((lambda) => Math.sqrt(Math.max(lambda, 0)))

  // 설명분산 비율 = σ_k² / Σσ²
  const totalVariance = singularValues.reduce((acc, s) => acc + s * s, 0)
  const explainedVarianceRatio = singularValues.map((s) =>
    totalVariance > 0 ? (s * s) / totalVariance : 0,
  )
  let running = 0
  const cumulativeExplainedVarianceRatio = explainedVarianceRatio.map((r) => (running += r))

  // V_r = 앞 r개 열만 남긴다. loadings[j][k] = 감성욕구 j가 축 k에 기여하는 계수
  const loadings: number[][] = vectors.map((row) => row.slice(0, latentDim))

  return {
    singularValues,
    explainedVarianceRatio,
    cumulativeExplainedVarianceRatio,
    loadings,
  }
}

/**
 * 벡터를 잠재좌표로 투영한다: z = v · V_r
 *
 * 소비대안 한 행을 투영할 때도, 참가자의 "현재 감성욕구" 벡터 q를 투영할 때도
 * 같은 이 함수를 쓴다 — 같은 잠재공간 안에 두 종류의 점을 함께 놓아야
 * "내 욕구점에서 가장 가까운 소비대안"을 거리로 비교할 수 있기 때문이다.
 *
 * 교육용 설명: "각 감성욕구 점수와 잠재축의 숫자를 각각 곱한 뒤 모두 더합니다."
 */
export function projectToLatent(vector: number[], loadings: number[][]): number[] {
  if (vector.length !== loadings.length) {
    throw new Error(
      `투영 실패: 벡터 길이(${vector.length})와 잠재축 행 수(${loadings.length})가 다릅니다.`,
    )
  }
  const latentDim = loadings[0]?.length ?? 0
  const z = new Array<number>(latentDim).fill(0)
  for (let k = 0; k < latentDim; k++) {
    let sum = 0
    for (let j = 0; j < vector.length; j++) sum += vector[j] * loadings[j][k]
    z[k] = sum
  }
  return z
}

/** 행렬 전체(소비대안 8개)를 잠재공간으로 투영한다: Z = A · V_r */
export function projectMatrixToLatent(ratings: number[][], loadings: number[][]): number[][] {
  return ratings.map((row) => projectToLatent(row, loadings))
}

/**
 * 잠재좌표 하나를 만드는 데 각 감성욕구가 얼마나 기여했는지 분해한다.
 * "SVD 체험" 페이지에서 "내적이 무엇인가"를 보여주기 위한 교육용 함수다.
 *
 * @returns contributions[j] = vector[j] * loadings[j][axis]
 */
export function explainProjection(vector: number[], loadings: number[][], axis: number): number[] {
  return vector.map((value, j) => value * loadings[j][axis])
}
