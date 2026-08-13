/**
 * 수학 모듈 단위 테스트 (v2).
 *
 * 핵심 검증 항목:
 *   1. SVD가 알려진 성질(직교 축, 설명분산 합=1, 내적 일관성)을 만족하는가
 *   2. K-means가 명백히 분리된 점들을 정확히 찾아내는가
 *   3. 군집 즉석 이름 생성 규칙이 의도대로 동작하는가
 *   4. 개인별 분석 파이프라인이 유효하지 않은 입력을 거부하는가
 *   5. 같은 입력 + 같은 옵션이면 항상 같은 결과인가 (재현성)
 *   6. 1~10 범위를 벗어난 값을 허용하지 않는가
 */

import { describe, expect, it } from 'vitest'
import { ALTERNATIVE_DIM } from '@/config/alternatives'
import { FEELCONOMY_TYPE_CODES, FEELCONOMY_TYPES } from '@/config/feelconomyTypes'
import { ANALYSIS_SPEC } from '@/config/model'
import { NEED_DIM } from '@/config/needs'
import { nameCluster } from './clusterNaming'
import {
  compareHandCalculation,
  runPersonalAnalysis,
  validateNeedsVector,
  validateRatingsMatrix,
  ValidationError,
} from './inference'
import { meanSilhouette, runKMeans, squaredEuclidean } from './kmeans'
import { resolveFeelconomyType } from './typeCode'
import { createRng } from './random'
import { columnMeans } from './stats'
import { computeSvd, explainProjection, projectMatrixToLatent, projectToLatent } from './svd'

// ---------------------------------------------------------------------------
// 테스트 전용 픽스처 — 실제 참가자 데이터가 아니라 계산 검증용 예시 행렬이다.
// 행 순서는 CONSUMPTION_ALTERNATIVES 순서(식음료·카페·패션·게임·콘텐츠·문화·여행·생활)와
// 동일하고, 열 순서는 NEED_AXES 순서(즐거움·자극·회복·소속·표현·성취)와 동일하다.
// ---------------------------------------------------------------------------
const SAMPLE_RATINGS: number[][] = [
  [6, 4, 7, 7, 3, 3], // 식음료
  [7, 3, 8, 6, 3, 2], // 카페·디저트
  [6, 6, 4, 5, 9, 4], // 패션
  [8, 8, 5, 5, 4, 7], // 게임
  [7, 6, 6, 4, 4, 3], // 콘텐츠·구독
  [8, 8, 5, 6, 7, 4], // 문화·공연
  [9, 9, 6, 7, 6, 5], // 여행·체험
  [3, 2, 7, 2, 3, 8], // 생활·실용
]
const SAMPLE_NEEDS = [8, 9, 3, 7, 8, 4] // 현재 감성욕구 q

const ANALYSIS_OPTIONS = {
  latentDim: 2,
  k: 3,
  nInit: 20,
  randomSeed: 42,
}

describe('config 일관성', () => {
  it('픽스처 크기가 설정값과 일치한다', () => {
    expect(SAMPLE_RATINGS).toHaveLength(ALTERNATIVE_DIM)
    expect(SAMPLE_RATINGS.every((row) => row.length === NEED_DIM)).toBe(true)
    expect(SAMPLE_NEEDS).toHaveLength(NEED_DIM)
  })
})

describe('stats', () => {
  it('열 평균을 정확히 계산한다', () => {
    expect(columnMeans([[1, 10], [3, 20], [5, 30]])).toEqual([3, 20])
  })
})

describe('svd', () => {
  it('설명분산 비율의 합이 1이고 누적 비율이 단조증가한다', () => {
    const svd = computeSvd(SAMPLE_RATINGS, 2)
    const total = svd.explainedVarianceRatio.reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 10)
    for (let i = 1; i < svd.cumulativeExplainedVarianceRatio.length; i++) {
      expect(svd.cumulativeExplainedVarianceRatio[i]).toBeGreaterThanOrEqual(
        svd.cumulativeExplainedVarianceRatio[i - 1] - 1e-12,
      )
    }
  })

  it('특이값이 내림차순으로 정렬된다', () => {
    const { singularValues } = computeSvd(SAMPLE_RATINGS, 2)
    for (let i = 1; i < singularValues.length; i++) {
      expect(singularValues[i]).toBeLessThanOrEqual(singularValues[i - 1] + 1e-9)
    }
  })

  it('잠재축이 서로 직교하고 단위벡터다', () => {
    const { loadings } = computeSvd(SAMPLE_RATINGS, 2)
    const dot = (k1: number, k2: number) =>
      loadings.reduce((acc, row) => acc + row[k1] * row[k2], 0)
    expect(dot(0, 0)).toBeCloseTo(1, 8)
    expect(dot(1, 1)).toBeCloseTo(1, 8)
    expect(dot(0, 1)).toBeCloseTo(0, 8)
  })

  it('내적 기여도의 합이 잠재좌표와 같다 (교육용 설명의 정확성)', () => {
    const { loadings } = computeSvd(SAMPLE_RATINGS, 2)
    const z = projectToLatent(SAMPLE_NEEDS, loadings)
    const contributions = explainProjection(SAMPLE_NEEDS, loadings, 0)
    expect(contributions.reduce((a, b) => a + b, 0)).toBeCloseTo(z[0], 10)
  })

  it('행렬 투영 결과가 벡터별 투영 결과와 일치한다', () => {
    const { loadings } = computeSvd(SAMPLE_RATINGS, 2)
    const Z = projectMatrixToLatent(SAMPLE_RATINGS, loadings)
    expect(Z[3]).toEqual(projectToLatent(SAMPLE_RATINGS[3], loadings))
  })

  it('r이 감성욕구 개수를 넘으면 오류를 던진다', () => {
    expect(() => computeSvd(SAMPLE_RATINGS, NEED_DIM + 1)).toThrow(/잠재 차원/)
  })
})

describe('kmeans', () => {
  it('명확히 분리된 세 덩어리를 정확히 3개 군집으로 나눈다', () => {
    const points = [
      [0, 0], [0.1, 0], [0.2, 0.1],
      [10, 10], [10.1, 10], [9.9, 10.2],
      [0, 10], [0.1, 10.2], [-0.1, 9.9],
    ]
    const result = runKMeans(points, {
      k: 3,
      nInit: 20,
      maxIterations: 300,
      tolerance: 1e-9,
      randomSeed: 7,
    })
    expect(new Set(result.assignments.slice(0, 3)).size).toBe(1)
    expect(new Set(result.assignments.slice(3, 6)).size).toBe(1)
    expect(new Set(result.assignments.slice(6, 9)).size).toBe(1)
  })

  it('같은 시드로 두 번 실행하면 완전히 같은 결과가 나온다', () => {
    const opts = { k: 3, nInit: 15, maxIterations: 300, tolerance: 1e-9, randomSeed: 99 }
    const a = runKMeans(SAMPLE_RATINGS, opts)
    const b = runKMeans(SAMPLE_RATINGS, opts)
    expect(a.assignments).toEqual(b.assignments)
    expect(a.centroids).toEqual(b.centroids)
  })

  it('데이터가 K보다 적으면 오류를 던진다', () => {
    expect(() =>
      runKMeans([[0, 0], [1, 1]], { k: 5, nInit: 5, maxIterations: 10, tolerance: 1e-9, randomSeed: 1 }),
    ).toThrow(/K/)
  })

  it('잘 분리된 두 군집의 silhouette은 0.7보다 크다', () => {
    const points = [[0, 0], [0.1, 0.1], [0.2, 0], [10, 10], [10.1, 10], [9.9, 9.9]]
    const result = runKMeans(points, {
      k: 2,
      nInit: 10,
      maxIterations: 300,
      tolerance: 1e-9,
      randomSeed: 3,
    })
    expect(meanSilhouette(points, result.assignments, 2)).toBeGreaterThan(0.7)
  })

  it('제곱 유클리드 거리를 정확히 계산한다', () => {
    expect(squaredEuclidean([0, 0], [3, 4])).toBe(25)
  })
})

describe('clusterNaming', () => {
  it('하나의 욕구가 뚜렷하게 높으면 단일 이름을 만든다', () => {
    // 회복·안정(인덱스 2)이 압도적으로 높은 경우
    const name = nameCluster([2, 2, 9, 2, 2, 2])
    expect(name).toBe('회복안정형')
  })

  it('두 욕구가 근소한 차이면(<1.0) 두 이름을 합친다', () => {
    // 즐거움(인덱스 0)과 자극(인덱스 1)이 공동 1위 (차이 0.3)
    const name = nameCluster([8.5, 8.2, 3, 3, 3, 3])
    expect(name).toBe('즐거움·자극추구형')
  })

  it('needMeans 길이가 다르면 오류를 던진다', () => {
    expect(() => nameCluster([1, 2, 3])).toThrow(/길이/)
  })
})

describe('inference: 입력 검증', () => {
  it('올바른 감성욕구 벡터를 통과시킨다', () => {
    expect(() => validateNeedsVector(SAMPLE_NEEDS)).not.toThrow()
  })

  it('감성욕구 개수가 틀리면 거부한다', () => {
    expect(() => validateNeedsVector(SAMPLE_NEEDS.slice(0, 4))).toThrow(/개수/)
  })

  it('범위를 벗어난 감성욕구 점수를 거부한다', () => {
    expect(() => validateNeedsVector([...SAMPLE_NEEDS.slice(1), 11])).toThrow(ValidationError)
    expect(() => validateNeedsVector([...SAMPLE_NEEDS.slice(1), 0])).toThrow(ValidationError)
    expect(() => validateNeedsVector([...SAMPLE_NEEDS.slice(1), 5.5])).toThrow(/정수/)
    expect(() => validateNeedsVector([...SAMPLE_NEEDS.slice(1), NaN])).toThrow(/숫자/)
  })

  it('올바른 평가행렬을 통과시킨다', () => {
    expect(() => validateRatingsMatrix(SAMPLE_RATINGS)).not.toThrow()
  })

  it('평가행렬의 행/열 개수가 틀리면 거부한다', () => {
    expect(() => validateRatingsMatrix(SAMPLE_RATINGS.slice(0, 5))).toThrow(/소비대안 개수/)
    expect(() =>
      validateRatingsMatrix(SAMPLE_RATINGS.map((row) => row.slice(0, 3))),
    ).toThrow(/감성욕구 개수/)
  })

  it('평가행렬 셀 값이 범위를 벗어나면 거부한다', () => {
    const broken = SAMPLE_RATINGS.map((row) => [...row])
    broken[0][0] = 15
    expect(() => validateRatingsMatrix(broken)).toThrow(/범위/)
  })
})

describe('inference: runPersonalAnalysis', () => {
  it('요구된 모든 필드를 채운 결과를 만든다', () => {
    const result = runPersonalAnalysis(
      { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS },
      ANALYSIS_OPTIONS,
    )
    expect(result.specVersion).toBe(ANALYSIS_SPEC.version)
    expect(result.alternativeLatent).toHaveLength(ALTERNATIVE_DIM)
    expect(result.needProjected).toHaveLength(2)
    expect(result.clusters).toHaveLength(3)
    expect(result.distancesToAlternatives).toHaveLength(ALTERNATIVE_DIM)
    expect(result.distancesToClusters).toHaveLength(3)
  })

  it('군집 인원(소비대안)의 합이 전체 대안 수와 같다', () => {
    const result = runPersonalAnalysis(
      { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS },
      ANALYSIS_OPTIONS,
    )
    const total = result.clusters.reduce((a, c) => a + c.memberIndices.length, 0)
    expect(total).toBe(ALTERNATIVE_DIM)
  })

  it('assignedCluster는 실제로 거리가 가장 짧은 군집이다', () => {
    const result = runPersonalAnalysis(
      { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS },
      ANALYSIS_OPTIONS,
    )
    const minDistance = Math.min(...result.distancesToClusters)
    expect(result.distancesToClusters[result.assignedCluster]).toBe(minDistance)
  })

  it('nearestAlternativeInCluster는 배정 군집의 구성원 중 하나다', () => {
    const result = runPersonalAnalysis(
      { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS },
      ANALYSIS_OPTIONS,
    )
    const members = result.clusters[result.assignedCluster].memberIndices
    expect(members).toContain(result.nearestAlternativeInCluster)
  })

  it('nearestAlternativeOverall은 전체 8개 중 실제 최단거리 대안이다', () => {
    const result = runPersonalAnalysis(
      { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS },
      ANALYSIS_OPTIONS,
    )
    const minDistance = Math.min(...result.distancesToAlternatives)
    expect(result.distancesToAlternatives[result.nearestAlternativeOverall]).toBe(minDistance)
  })

  it('같은 입력 + 같은 옵션이면 항상 같은 결과다 (재현성)', () => {
    const input = { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS }
    const a = runPersonalAnalysis(input, ANALYSIS_OPTIONS)
    const b = runPersonalAnalysis(input, ANALYSIS_OPTIONS)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('K가 허용 범위를 벗어나면 오류를 던진다', () => {
    expect(() =>
      runPersonalAnalysis(
        { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS },
        { ...ANALYSIS_OPTIONS, k: 1 },
      ),
    ).toThrow(/K=/)
    expect(() =>
      runPersonalAnalysis(
        { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS },
        { ...ANALYSIS_OPTIONS, k: 8 },
      ),
    ).toThrow(/K=/)
  })

  it('유효하지 않은 입력이면 계산 전에 거부한다', () => {
    expect(() =>
      runPersonalAnalysis(
        { currentNeeds: [1, 2, 3], alternativeRatings: SAMPLE_RATINGS },
        ANALYSIS_OPTIONS,
      ),
    ).toThrow(ValidationError)
  })

  it('각 군집의 이름이 그 군집 구성원의 욕구 평균에서 유도된다', () => {
    const result = runPersonalAnalysis(
      { currentNeeds: SAMPLE_NEEDS, alternativeRatings: SAMPLE_RATINGS },
      ANALYSIS_OPTIONS,
    )
    for (const cluster of result.clusters) {
      expect(cluster.name).toBe(nameCluster(cluster.needMeans))
    }
  })
})

describe('compareHandCalculation', () => {
  it('손계산과 프로그램 계산의 오차를 정확히 계산한다', () => {
    const { deltas, maxAbsDelta } = compareHandCalculation([2.63, -0.84], [2.6, -0.8])
    expect(deltas[0]).toBeCloseTo(0.03, 5)
    expect(deltas[1]).toBeCloseTo(-0.04, 5)
    expect(maxAbsDelta).toBeCloseTo(0.04, 5)
  })
})

describe('random', () => {
  it('같은 시드는 같은 난수열을 만든다', () => {
    const a = createRng(2024)
    const b = createRng(2024)
    expect(Array.from({ length: 10 }, () => a.next())).toEqual(
      Array.from({ length: 10 }, () => b.next()),
    )
  })

  it('nextInt는 [0, n) 범위를 지킨다', () => {
    const rng = createRng(77)
    for (let i = 0; i < 500; i++) {
      const v = rng.nextInt(7)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(7)
      expect(Number.isInteger(v)).toBe(true)
    }
  })
})

describe('typeCode: 필코노미 유형 판정', () => {
  // 순서: [joy, thrill, recovery, belonging, expression, achievement]
  it('모든 축이 양의 문자를 향하면 SMG가 된다', () => {
    const result = resolveFeelconomyType([1, 9, 1, 1, 9, 9])
    expect(result.code).toBe('SMG')
    expect(result.type.name).toBe(FEELCONOMY_TYPES.SMG.name)
  })

  it('모든 축이 음의 문자를 향하면 RWJ가 된다', () => {
    const result = resolveFeelconomyType([9, 1, 9, 9, 1, 1])
    expect(result.code).toBe('RWJ')
  })

  it('동점이면 항상 양의 문자(S, M, G)를 채택한다', () => {
    const result = resolveFeelconomyType([5, 5, 5, 5, 5, 5])
    expect(result.code).toBe('SMG')
  })

  it('세 차원이 섞인 경우도 정확히 판정한다 (RMG)', () => {
    // energy: thrill < recovery → R, focus: expression >= belonging → M, reward: achievement >= joy → G
    const result = resolveFeelconomyType([2, 3, 8, 2, 7, 6])
    expect(result.code).toBe('RMG')
  })

  it('8가지 코드 전부에 이름·태그라인·설명이 정의되어 있다', () => {
    expect(FEELCONOMY_TYPE_CODES).toHaveLength(8)
    for (const code of FEELCONOMY_TYPE_CODES) {
      const type = FEELCONOMY_TYPES[code]
      expect(type.name.length).toBeGreaterThan(0)
      expect(type.tagline.length).toBeGreaterThan(0)
      expect(type.description.length).toBeGreaterThan(0)
      expect(type.exampleAlternatives.length).toBeGreaterThan(0)
    }
  })

  it('같은 욕구 벡터는 항상 같은 유형을 낸다 (재현성)', () => {
    const needs = [4, 8, 2, 6, 7, 5]
    expect(resolveFeelconomyType(needs).code).toBe(resolveFeelconomyType(needs).code)
  })

  it('차원 판정 결과에 원본 점수가 그대로 기록된다', () => {
    const result = resolveFeelconomyType([1, 9, 1, 1, 9, 9])
    const energy = result.dimensions.find((d) => d.key === 'energy')!
    expect(energy.positiveScore).toBe(9) // thrill
    expect(energy.negativeScore).toBe(1) // recovery
    expect(energy.letter).toBe('S')
  })
})
