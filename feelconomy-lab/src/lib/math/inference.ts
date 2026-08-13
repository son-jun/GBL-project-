/**
 * 개인별 잠재수요 분석 파이프라인 (v2 핵심 모듈).
 *
 * ============================================================================
 *  전체 흐름 (참가자 한 명, 한 세션 안에서 전부 계산된다)
 * ============================================================================
 *   ① 참가자가 현재 감성욕구 q(6개)와 소비대안×감성욕구 평가행렬 A를 입력
 *   ② A를 SVD로 분해 → 잠재축 V_r, 특이값, 설명분산
 *   ③ 소비대안 전체를 잠재공간에 투영 → Z = A · V_r
 *   ④ 현재 욕구 q도 같은 잠재공간에 투영 → q* = q · V_r
 *   ⑤ Z(소비대안 전체)에 k-means 적용 → K개 군집, 각 군집에 즉석 이름 부여
 *   ⑥ q*에서 각 군집 중심까지 거리 → 가장 가까운 군집 = "잠재수요 유형"
 *   ⑦ 그 군집 안에서 q*와 가장 가까운 소비대안 = "세부 잠재수요"
 *
 * v1과의 결정적 차이: 이 계산은 어떤 사전 데이터(기준 데이터셋이든 합성
 * 데이터든)도 필요로 하지 않는다. 참가자 한 명의 입력만으로 완결된다.
 * 그래서 "모델이 없으면 결과를 만들지 않는다"는 v1의 안전장치도 필요 없어졌다
 * — 대신 "이 참가자의 입력이 유효한가"만 검증하면 된다.
 */

import { ALTERNATIVE_DIM, CONSUMPTION_ALTERNATIVES } from '@/config/alternatives'
import { ANALYSIS_SPEC } from '@/config/model'
import { NEED_DIM, NEED_SCORE_MAX, NEED_SCORE_MIN } from '@/config/needs'
import type { AlternativeCluster, ParticipantInput, PersonalAnalysisResult } from '../types'
import { nameCluster } from './clusterNaming'
import { meanSilhouette, runKMeans, squaredEuclidean } from './kmeans'
import { columnMeans } from './stats'
import { computeSvd, projectMatrixToLatent, projectToLatent } from './svd'

export class ValidationError extends Error {}

/** 감성욕구 벡터(q)를 검증한다: 길이·정수·범위 */
export function validateNeedsVector(needs: number[]): void {
  if (needs.length !== NEED_DIM) {
    throw new ValidationError(
      `감성욕구 개수가 맞지 않습니다. ${NEED_DIM}개가 필요한데 ${needs.length}개가 들어왔습니다.`,
    )
  }
  needs.forEach((value, index) => {
    assertValidScore(value, `감성욕구 ${index + 1}번`)
  })
}

/** 평가행렬(A)을 검증한다: 행/열 개수·정수·범위 */
export function validateRatingsMatrix(matrix: number[][]): void {
  if (matrix.length !== ALTERNATIVE_DIM) {
    throw new ValidationError(
      `소비대안 개수가 맞지 않습니다. ${ALTERNATIVE_DIM}개가 필요한데 ${matrix.length}개가 들어왔습니다.`,
    )
  }
  matrix.forEach((row, i) => {
    if (row.length !== NEED_DIM) {
      throw new ValidationError(
        `'${CONSUMPTION_ALTERNATIVES[i]?.label ?? i}' 행의 감성욕구 개수가 맞지 않습니다. ` +
          `${NEED_DIM}개가 필요한데 ${row.length}개가 들어왔습니다.`,
      )
    }
    row.forEach((value, j) => {
      assertValidScore(value, `'${CONSUMPTION_ALTERNATIVES[i]?.label ?? i}' × 감성욕구 ${j + 1}번`)
    })
  })
}

function assertValidScore(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new ValidationError(`${label} 값이 비어 있거나 숫자가 아닙니다.`)
  if (!Number.isInteger(value)) throw new ValidationError(`${label} 값(${value})이 정수가 아닙니다.`)
  if (value < NEED_SCORE_MIN || value > NEED_SCORE_MAX) {
    throw new ValidationError(
      `${label} 값(${value})이 허용 범위 ${NEED_SCORE_MIN}~${NEED_SCORE_MAX}를 벗어났습니다.`,
    )
  }
}

export interface PersonalAnalysisOptions {
  /** 참가자가 설명분산 표를 보고 고른 잠재 차원 r */
  latentDim: number
  /** 소비대안을 나눌 군집 개수 K */
  k?: number
  nInit?: number
  maxIterations?: number
  tolerance?: number
  randomSeed?: number
}

/**
 * 참가자 한 명의 입력으로 전체 분석을 실행한다.
 *
 * 같은 입력(currentNeeds, alternativeRatings)과 같은 옵션(latentDim, k, seed)을
 * 넣으면 항상 같은 결과가 나온다 — k-means++ 시드가 고정되어 있고, SVD의
 * 고유벡터 부호 규약이 결정론적이기 때문이다.
 */
export function runPersonalAnalysis(
  input: ParticipantInput,
  options: PersonalAnalysisOptions,
): PersonalAnalysisResult {
  validateNeedsVector(input.currentNeeds)
  validateRatingsMatrix(input.alternativeRatings)

  const k = options.k ?? ANALYSIS_SPEC.defaultK
  const nInit = options.nInit ?? ANALYSIS_SPEC.nInit
  const maxIterations = options.maxIterations ?? ANALYSIS_SPEC.maxIterations
  const tolerance = options.tolerance ?? ANALYSIS_SPEC.tolerance
  const randomSeed = options.randomSeed ?? ANALYSIS_SPEC.randomSeed

  if (k < ANALYSIS_SPEC.kMin || k > ANALYSIS_SPEC.kMax) {
    throw new ValidationError(
      `군집 개수 K=${k} 는 ${ANALYSIS_SPEC.kMin}~${ANALYSIS_SPEC.kMax} 범위여야 합니다.`,
    )
  }

  // ② SVD: A = U Σ Vᵀ
  const svd = computeSvd(input.alternativeRatings, options.latentDim)

  // ③ 소비대안 전체를 잠재공간에 투영: Z = A · V_r
  const alternativeLatent = projectMatrixToLatent(input.alternativeRatings, svd.loadings)

  // ④ 현재 욕구도 같은 공간에 투영: q* = q · V_r
  const needProjected = projectToLatent(input.currentNeeds, svd.loadings)

  // ⑤ 소비대안 전체에 k-means 적용
  const kmeans = runKMeans(alternativeLatent, { k, nInit, maxIterations, tolerance, randomSeed })
  const silhouette = meanSilhouette(alternativeLatent, kmeans.assignments, k)

  const clusters: AlternativeCluster[] = kmeans.centroids.map((centroid, clusterIndex) => {
    const memberIndices = kmeans.assignments
      .map((c, i) => (c === clusterIndex ? i : -1))
      .filter((i) => i >= 0)
    const needMeans =
      memberIndices.length > 0
        ? columnMeans(memberIndices.map((i) => input.alternativeRatings[i]))
        : new Array(input.currentNeeds.length).fill(0)

    return {
      index: clusterIndex,
      displayNumber: clusterIndex + 1,
      name: nameCluster(needMeans),
      centroid,
      memberIndices,
      needMeans,
    }
  })

  // ⑥ 현재 욕구점에서 각 군집 중심까지 거리
  const distancesToClusters = clusters.map((cluster) =>
    Math.sqrt(squaredEuclidean(needProjected, cluster.centroid)),
  )
  let assignedCluster = 0
  for (let i = 1; i < distancesToClusters.length; i++) {
    if (distancesToClusters[i] < distancesToClusters[assignedCluster]) assignedCluster = i
  }
  const sortedClusterDistances = [...distancesToClusters].sort((a, b) => a - b)
  const marginToSecondCluster =
    sortedClusterDistances.length > 1
      ? sortedClusterDistances[1] - sortedClusterDistances[0]
      : Infinity

  // ⑦ 현재 욕구점에서 소비대안 각각까지 거리
  const distancesToAlternatives = alternativeLatent.map((point) =>
    Math.sqrt(squaredEuclidean(needProjected, point)),
  )

  let nearestAlternativeOverall = 0
  for (let i = 1; i < distancesToAlternatives.length; i++) {
    if (distancesToAlternatives[i] < distancesToAlternatives[nearestAlternativeOverall]) {
      nearestAlternativeOverall = i
    }
  }

  const assignedMembers = clusters[assignedCluster].memberIndices
  let nearestAlternativeInCluster = assignedMembers[0]
  for (const memberIndex of assignedMembers) {
    if (distancesToAlternatives[memberIndex] < distancesToAlternatives[nearestAlternativeInCluster]) {
      nearestAlternativeInCluster = memberIndex
    }
  }

  return {
    specVersion: ANALYSIS_SPEC.version,
    latentDim: options.latentDim,
    svd,
    alternativeLatent,
    needProjected,
    k,
    clusters,
    wcss: kmeans.wcss,
    silhouette,
    distancesToClusters,
    assignedCluster,
    marginToSecondCluster,
    distancesToAlternatives,
    nearestAlternativeInCluster,
    nearestAlternativeOverall,
  }
}

/** 학습지 손계산과 프로그램 계산을 비교한다 (요구사항 §14) */
export function compareHandCalculation(
  programLatent: number[],
  reported: number[],
): { deltas: number[]; maxAbsDelta: number } {
  const deltas = programLatent.map((value, i) => value - (reported[i] ?? 0))
  const maxAbsDelta = deltas.reduce((acc, d) => Math.max(acc, Math.abs(d)), 0)
  return { deltas, maxAbsDelta }
}
