/**
 * 프로젝트 전역 데이터 타입 정의 (v2).
 *
 * v1의 ReferenceRecord / FeelconomyModel(사전학습 모델) 개념은 완전히 제거되었다.
 * v2는 참가자 한 명의 입력에서 결과까지 전부 이 파일의 타입 몇 개로 표현된다.
 */

// ---------------------------------------------------------------------------
// 참가자 입력
// ---------------------------------------------------------------------------

/** 참가자가 입력한 원자료 */
export interface ParticipantInput {
  /** 현재 감성욕구 벡터 q. 길이 = NEED_DIM */
  currentNeeds: number[]
  /**
   * [소비대안 × 감성욕구] 평가행렬 A.
   * shape = [ALTERNATIVE_DIM][NEED_DIM]
   * ratings[i][j] = i번째 소비대안이 j번째 감성욕구를 충족시키는 정도 (1~10)
   */
  alternativeRatings: number[][]
}

// ---------------------------------------------------------------------------
// 개인별 SVD 결과
// ---------------------------------------------------------------------------

export interface PersonalSvdSummary {
  /** 특이값 σ1 ≥ σ2 ≥ ... (길이 = min(ALTERNATIVE_DIM, NEED_DIM)) */
  singularValues: number[]
  explainedVarianceRatio: number[]
  cumulativeExplainedVarianceRatio: number[]
  /**
   * 잠재축 V의 앞 r개 열. shape = [NEED_DIM][r]
   * loadings[j][k] = j번째 감성욕구가 k번째 잠재축에 기여하는 계수
   */
  loadings: number[][]
}

// ---------------------------------------------------------------------------
// 개인별 소비대안 군집
// ---------------------------------------------------------------------------

export interface AlternativeCluster {
  index: number
  displayNumber: number
  /**
   * 즉석 생성 이름. 이 군집에 속한 소비대안들이 원래 평가행렬에서 평균적으로
   * 가장 높게 준 감성욕구 1~2개를 골라 archetypeLabel을 조합해서 만든다.
   * (요구사항: 시스템이 "연구 결과"인 것처럼 확정 이름을 짓지 않는다는 원칙은
   *  유지하되, 이 게임에서는 매 참가자마다 즉석에서 이름이 필요하므로 그
   *  생성 규칙 자체를 결과 화면에 투명하게 설명한다.)
   */
  name: string
  /** 군집 중심의 잠재좌표. 길이 = latentDim */
  centroid: number[]
  /** 이 군집에 속한 소비대안의 인덱스 (alternativeRatings 행 인덱스) */
  memberIndices: number[]
  /** 이 군집 소비대안들의 감성욕구 평균 (원척도 1~10, 길이 = NEED_DIM) */
  needMeans: number[]
}

// ---------------------------------------------------------------------------
// 최종 분석 결과
// ---------------------------------------------------------------------------

export interface PersonalAnalysisResult {
  /** 사용된 분석 규격 버전 (ANALYSIS_SPEC.version) */
  specVersion: string
  /** 이번 계산에 실제로 쓰인 잠재 차원 r (참가자가 선택) */
  latentDim: number
  svd: PersonalSvdSummary

  /** 소비대안 전체의 잠재좌표. shape = [ALTERNATIVE_DIM][latentDim] */
  alternativeLatent: number[][]
  /** 현재 감성욕구 벡터를 같은 잠재공간에 투영한 좌표. 길이 = latentDim */
  needProjected: number[]

  /** 소비대안에 적용된 군집 개수 K */
  k: number
  clusters: AlternativeCluster[]
  wcss: number
  silhouette: number

  /** 현재 욕구점에서 각 군집 중심까지의 거리 */
  distancesToClusters: number[]
  /** 배정된(가장 가까운) 군집 인덱스 */
  assignedCluster: number
  /** 1위와 2위 군집 거리 차이 */
  marginToSecondCluster: number

  /** 현재 욕구점에서 각 소비대안까지의 거리 (전체) */
  distancesToAlternatives: number[]
  /** 배정 군집 내부에서 가장 가까운 소비대안의 인덱스 — "세부 잠재수요" */
  nearestAlternativeInCluster: number
  /** 배정 군집과 무관하게 전체 중 가장 가까운 소비대안 인덱스 (참고용) */
  nearestAlternativeOverall: number
}

// ---------------------------------------------------------------------------
// 저장되는 참가자 레코드
// ---------------------------------------------------------------------------

export interface ParticipantRecord {
  participantId: string
  createdAt: string
  input: ParticipantInput
  result: PersonalAnalysisResult
  /**
   * 필코노미 유형 코드(예: "SMG"). 현재 감성욕구 q만으로 결정되며
   * (src/lib/math/typeCode.ts), SVD/K-means 결과와는 독립적이다.
   * 참가자가 기억하기 쉬운 고정 정체성 역할을 한다 — docs/05 참고.
   */
  feelconomyTypeCode: string
  handCalculation?: HandCalculationCheck
}

/** 종이 학습지 손계산과 프로그램 계산의 비교 (요구사항 §14) */
export interface HandCalculationCheck {
  /** 참가자가 손으로 계산한 값. latentDim 길이 */
  reported: number[]
  /** 프로그램 계산값 - 손계산값 */
  deltas: number[]
  maxAbsDelta: number
  checkedAt: string
}
