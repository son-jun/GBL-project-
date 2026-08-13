/**
 * K-means (k-means++ 초기화).
 *
 * v2에서 이 모듈이 군집화하는 대상은 "참가자 한 명의 소비대안들이 잠재공간에
 * 투영된 좌표 Z (ALTERNATIVE_DIM × r)"다. 대규모 참가자 집단이 아니라 개인
 * 한 명의 소비대안만 군집화한다는 점이 v1과 다르다. 알고리즘 자체는
 * 점의 개수와 무관하게 동일하게 동작한다.
 *   - 초기화: k-means++ (무작위 초기화보다 초기값 의존성이 낮다)
 *   - n_init 회 반복 후 WCSS가 가장 낮은 결과를 채택
 *   - 시드 고정 난수를 써서 재현 가능하게 만든다 (같은 평가행렬 → 같은 군집)
 *
 * K는 이 모듈에서 확정하지 않는다. 호출자가 넘긴 값을 그대로 쓴다.
 */

import { createRng, type Rng } from './random'

export interface KMeansResult {
  /** 각 데이터 점의 군집 인덱스. length = N */
  assignments: number[]
  /** 군집 중심. shape = [k][r] */
  centroids: number[][]
  /** Within-Cluster Sum of Squares (군집 내 제곱거리 합) */
  wcss: number
  /** 실제로 수행된 반복 횟수 */
  iterations: number
  /** 군집별 인원수 */
  sizes: number[]
}

export interface KMeansOptions {
  k: number
  nInit: number
  maxIterations: number
  tolerance: number
  randomSeed: number
}

/** 제곱 유클리드 거리 ||a - b||² */
export function squaredEuclidean(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    sum += d * d
  }
  return sum
}

/**
 * k-means++ 초기 중심 선택.
 *
 * 1) 첫 중심은 무작위로 하나 뽑는다.
 * 2) 이후 각 점이 "가장 가까운 기존 중심까지의 제곱거리"에 비례한 확률로 뽑힌다.
 *    → 서로 멀리 떨어진 중심이 선택되어 초기값이 나빠질 위험이 줄어든다.
 */
function kMeansPlusPlusInit(points: number[][], k: number, rng: Rng): number[][] {
  const n = points.length
  const centroids: number[][] = [[...points[rng.nextInt(n)]]]

  // 각 점에서 "현재까지 선택된 중심 중 가장 가까운 것"까지의 제곱거리
  const closest = points.map((p) => squaredEuclidean(p, centroids[0]))

  while (centroids.length < k) {
    const total = closest.reduce((acc, d) => acc + d, 0)

    let chosen: number
    if (total <= 0) {
      // 모든 점이 이미 중심과 일치하는 퇴화 상황 — 무작위로 채운다
      chosen = rng.nextInt(n)
    } else {
      // 누적합 방식의 확률 추출
      const target = rng.next() * total
      let acc = 0
      chosen = n - 1
      for (let i = 0; i < n; i++) {
        acc += closest[i]
        if (acc >= target) {
          chosen = i
          break
        }
      }
    }

    const newCentroid = [...points[chosen]]
    centroids.push(newCentroid)
    for (let i = 0; i < n; i++) {
      closest[i] = Math.min(closest[i], squaredEuclidean(points[i], newCentroid))
    }
  }

  return centroids
}

/** 각 점을 가장 가까운 중심에 배정하고 WCSS를 함께 계산한다 */
function assignPoints(
  points: number[][],
  centroids: number[][],
): { assignments: number[]; wcss: number } {
  const assignments = new Array<number>(points.length).fill(0)
  let wcss = 0
  for (let i = 0; i < points.length; i++) {
    let bestIndex = 0
    let bestDistance = Infinity
    for (let c = 0; c < centroids.length; c++) {
      const d = squaredEuclidean(points[i], centroids[c])
      if (d < bestDistance) {
        bestDistance = d
        bestIndex = c
      }
    }
    assignments[i] = bestIndex
    wcss += bestDistance
  }
  return { assignments, wcss }
}

/** 배정 결과로부터 새 중심(각 군집의 평균)을 계산한다 */
function updateCentroids(
  points: number[][],
  assignments: number[],
  k: number,
  previous: number[][],
): number[][] {
  const dim = points[0].length
  const sums: number[][] = Array.from({ length: k }, () => new Array<number>(dim).fill(0))
  const counts = new Array<number>(k).fill(0)

  for (let i = 0; i < points.length; i++) {
    const c = assignments[i]
    counts[c]++
    for (let j = 0; j < dim; j++) sums[c][j] += points[i][j]
  }

  return sums.map((sum, c) =>
    // 빈 군집이 생기면 이전 중심을 유지한다 (중심이 NaN이 되는 것을 방지)
    counts[c] === 0 ? [...previous[c]] : sum.map((s) => s / counts[c]),
  )
}

/** k-means를 한 번 실행한다 (초기화 1회 + 수렴까지 반복) */
function runOnce(points: number[][], k: number, options: KMeansOptions, rng: Rng): KMeansResult {
  let centroids = kMeansPlusPlusInit(points, k, rng)
  let iterations = 0

  for (let iter = 0; iter < options.maxIterations; iter++) {
    iterations = iter + 1
    // 할당 단계: 각 점을 가장 가까운 중심에 붙인다
    const { assignments } = assignPoints(points, centroids)
    // 갱신 단계: 각 군집의 평균을 새 중심으로 삼는다
    const next = updateCentroids(points, assignments, k, centroids)

    // 중심 이동량이 tolerance보다 작으면 수렴으로 간주하고 멈춘다
    let shift = 0
    for (let c = 0; c < k; c++) shift += squaredEuclidean(next[c], centroids[c])
    centroids = next
    if (shift < options.tolerance) break
  }

  // 마지막 중심 갱신 이후의 배정/WCSS로 마무리한다
  const final = assignPoints(points, centroids)
  const sizes = new Array<number>(k).fill(0)
  for (const c of final.assignments) sizes[c]++

  return { assignments: final.assignments, centroids, wcss: final.wcss, iterations, sizes }
}

/**
 * n_init 회 실행 후 WCSS가 가장 낮은 결과를 채택한다 (요구사항 §9).
 *
 * 각 초기화마다 시드를 randomSeed + i 로 파생시켜서, 전체 과정이 결정론적이면서도
 * 초기화끼리는 서로 다른 난수열을 쓰도록 한다.
 */
export function runKMeans(points: number[][], options: KMeansOptions): KMeansResult {
  if (points.length === 0) throw new Error('K-means 실패: 데이터가 비어 있습니다.')
  if (options.k < 1) throw new Error('K-means 실패: K는 1 이상이어야 합니다.')
  if (points.length < options.k) {
    throw new Error(
      `K-means 실패: 데이터 행 수(${points.length})가 K(${options.k})보다 적습니다.`,
    )
  }

  let best: KMeansResult | null = null
  for (let i = 0; i < Math.max(1, options.nInit); i++) {
    const rng = createRng(options.randomSeed + i * 7919) // 7919는 시드를 잘 흩뜨리기 위한 소수
    const result = runOnce(points, options.k, options, rng)
    if (best === null || result.wcss < best.wcss) best = result
  }

  // 군집 인덱스를 "첫 번째 좌표축 기준 오름차순"으로 재정렬한다.
  // 같은 데이터에 대해 군집 번호까지 항상 동일하게 만들기 위한 정규화 단계다.
  return normalizeClusterOrder(best!)
}

/**
 * 군집 번호를 안정적으로 만든다.
 *
 * k-means는 군집의 "내용"은 같아도 번호는 초기화에 따라 뒤바뀔 수 있다.
 * 중심의 첫 축 좌표(동률이면 두 번째 축)로 정렬해 번호를 다시 매기면,
 * 재실행해도 "군집 1"이 항상 같은 군집을 가리킨다.
 */
function normalizeClusterOrder(result: KMeansResult): KMeansResult {
  const order = result.centroids
    .map((centroid, index) => ({ centroid, index }))
    .sort((a, b) => {
      for (let axis = 0; axis < a.centroid.length; axis++) {
        const diff = a.centroid[axis] - b.centroid[axis]
        if (Math.abs(diff) > 1e-12) return diff
      }
      return a.index - b.index
    })

  // oldIndex → newIndex 매핑
  const remap = new Array<number>(result.centroids.length).fill(0)
  order.forEach((entry, newIndex) => {
    remap[entry.index] = newIndex
  })

  return {
    assignments: result.assignments.map((c) => remap[c]),
    centroids: order.map((entry) => entry.centroid),
    wcss: result.wcss,
    iterations: result.iterations,
    sizes: order.map((entry) => result.sizes[entry.index]),
  }
}

/**
 * 평균 silhouette score를 계산한다 (요구사항 §9 관리자 화면).
 *
 * 한 점의 silhouette = (b - a) / max(a, b)
 *   a = 같은 군집 점들과의 평균 거리
 *   b = 가장 가까운 "다른" 군집 점들과의 평균 거리
 * 1에 가까우면 잘 분리된 군집, 0 근처면 경계에 걸쳐 있음, 음수면 잘못 배정된 느낌.
 *
 * O(N²)이므로 기준 데이터가 수천 행 이하일 때만 쓴다. 그 이상이면 표본을 뽑는다.
 */
export function meanSilhouette(
  points: number[][],
  assignments: number[],
  k: number,
  maxSample = 1200,
): number {
  const n = points.length
  if (k < 2 || n <= k) return 0

  // N이 너무 크면 균등 간격으로 표본을 뽑아 계산량을 제한한다 (결정론적 표본)
  const step = n > maxSample ? Math.ceil(n / maxSample) : 1
  const sampleIndices: number[] = []
  for (let i = 0; i < n; i += step) sampleIndices.push(i)

  let total = 0
  let counted = 0

  for (const i of sampleIndices) {
    const own = assignments[i]
    const sums = new Array<number>(k).fill(0)
    const counts = new Array<number>(k).fill(0)

    for (let j = 0; j < n; j++) {
      if (j === i) continue
      const c = assignments[j]
      sums[c] += Math.sqrt(squaredEuclidean(points[i], points[j]))
      counts[c]++
    }

    if (counts[own] === 0) continue // 혼자 있는 군집은 정의상 s=0으로 두고 건너뛴다
    const a = sums[own] / counts[own]

    let b = Infinity
    for (let c = 0; c < k; c++) {
      if (c === own || counts[c] === 0) continue
      b = Math.min(b, sums[c] / counts[c])
    }
    if (!Number.isFinite(b)) continue

    const denominator = Math.max(a, b)
    if (denominator > 0) {
      total += (b - a) / denominator
      counted++
    }
  }

  return counted > 0 ? total / counted : 0
}
