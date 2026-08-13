/**
 * 참가자 세션 상태 (v2).
 *
 * v1에는 "모델이 준비됐는지"를 확인하는 modelStatus(loading/ready/missing/error)가
 * 있었다 — 기준 데이터셋으로 학습한 모델이 없으면 참가자가 결과를 볼 수 없었기
 * 때문이다. v2는 그런 사전 준비가 필요 없다. 참가자 한 명의 입력만으로 분석이
 * 완결되므로, "모델 로딩"이라는 단계 자체가 사라졌다.
 *
 * 세션 상태는 순수하게 "이번 참가자가 지금까지 무엇을 입력했는가"만 담는다.
 * 부스에서 다음 참가자가 같은 기기를 쓰기 때문에, `reset()`으로 한 번에 비운다.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ALTERNATIVE_DIM } from '@/config/alternatives'
import { ANALYSIS_SPEC } from '@/config/model'
import { NEED_DIM } from '@/config/needs'
import { runPersonalAnalysis } from '@/lib/math/inference'
import { resolveFeelconomyType } from '@/lib/math/typeCode'
import { participantRepository } from '@/lib/storage'
import { generateParticipantId } from '@/lib/util/participantId'
import type { HandCalculationCheck, ParticipantRecord, PersonalAnalysisResult } from '@/lib/types'

interface SessionState {
  participantId: string | null
  consented: boolean
  /** 현재 감성욕구 6개. 아직 답하지 않은 항목은 null */
  currentNeeds: (number | null)[]
  /** [소비대안 × 감성욕구] 평가행렬. 아직 답하지 않은 셀은 null */
  alternativeRatings: (number | null)[][]
  /** 참가자가 SVD 설명분산을 보고 고른 잠재 차원 r */
  latentDim: number
  result: PersonalAnalysisResult | null
  saved: boolean
  handCheck: HandCalculationCheck | null
}

function emptySession(): SessionState {
  return {
    participantId: null,
    consented: false,
    currentNeeds: Array.from({ length: NEED_DIM }, () => null),
    alternativeRatings: Array.from({ length: ALTERNATIVE_DIM }, () =>
      Array.from({ length: NEED_DIM }, () => null),
    ),
    latentDim: ANALYSIS_SPEC.defaultLatentDim,
    result: null,
    saved: false,
    handCheck: null,
  }
}

interface SessionContextValue extends SessionState {
  beginSession: () => Promise<void>
  setNeed: (index: number, value: number) => void
  setRating: (altIndex: number, needIndex: number, value: number) => void
  setLatentDim: (r: number) => void

  needsComplete: boolean
  needsVector: number[] | null
  /** 욕구 입력만으로 결정되는 필코노미 유형. 욕구가 미완성이면 null. */
  feelconomyType: ReturnType<typeof resolveFeelconomyType> | null
  ratingsComplete: boolean
  ratingsMatrix: number[][] | null
  /** 평가를 마친 소비대안 개수 (진행률 표시용) */
  ratingsCompletedAlternatives: number

  computeAndSave: () => Promise<void>
  recordHandCheck: (reported: number[]) => Promise<void>
  reset: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(emptySession)

  /**
   * 이미 저장한 참가자 ID를 기억한다. React StrictMode의 useEffect 이중 실행이나
   * 뒤로 가기로 인한 중복 저장을 막기 위해 state가 아니라 ref로 관리한다.
   */
  const savedParticipantIds = useRef<Set<string>>(new Set())

  const beginSession = useCallback(async () => {
    const participantId = await generateParticipantId()
    setSession({ ...emptySession(), participantId, consented: true })
  }, [])

  const setNeed = useCallback((index: number, value: number) => {
    setSession((prev) => {
      const currentNeeds = [...prev.currentNeeds]
      currentNeeds[index] = value
      return { ...prev, currentNeeds, result: null, saved: false, handCheck: null }
    })
  }, [])

  const setRating = useCallback((altIndex: number, needIndex: number, value: number) => {
    setSession((prev) => {
      const alternativeRatings = prev.alternativeRatings.map((row, i) =>
        i === altIndex ? row.map((cell, j) => (j === needIndex ? value : cell)) : row,
      )
      return { ...prev, alternativeRatings, result: null, saved: false, handCheck: null }
    })
  }, [])

  const setLatentDim = useCallback((r: number) => {
    setSession((prev) => ({ ...prev, latentDim: r, result: null, saved: false }))
  }, [])

  const needsComplete = session.currentNeeds.every((v) => v !== null)
  const needsVector = needsComplete ? (session.currentNeeds as number[]) : null

  /**
   * 필코노미 유형은 욕구 벡터만으로 결정되므로 소비대안 평가를 마치기 전에도
   * 바로 계산할 수 있다 (TypeRevealPage가 RatingsPage보다 먼저 이 값을 쓴다).
   */
  const feelconomyType = useMemo(
    () => (needsVector ? resolveFeelconomyType(needsVector) : null),
    [needsVector],
  )

  const ratingsCompletedAlternatives = session.alternativeRatings.filter((row) =>
    row.every((v) => v !== null),
  ).length
  const ratingsComplete = ratingsCompletedAlternatives === ALTERNATIVE_DIM
  const ratingsMatrix = ratingsComplete
    ? (session.alternativeRatings as number[][])
    : null

  const computeAndSave = useCallback(async () => {
    if (!needsVector) throw new Error('현재 감성욕구를 모두 입력해야 합니다.')
    if (!ratingsMatrix) throw new Error('소비대안 평가를 모두 입력해야 합니다.')
    if (!session.participantId) throw new Error('참가자 ID가 없습니다. 처음부터 다시 시작해 주세요.')

    if (savedParticipantIds.current.has(session.participantId)) return
    savedParticipantIds.current.add(session.participantId)

    const result = runPersonalAnalysis(
      { currentNeeds: needsVector, alternativeRatings: ratingsMatrix },
      { latentDim: session.latentDim },
    )

    const record: ParticipantRecord = {
      participantId: session.participantId,
      createdAt: new Date().toISOString(),
      input: { currentNeeds: needsVector, alternativeRatings: ratingsMatrix },
      result,
      feelconomyTypeCode: resolveFeelconomyType(needsVector).code,
    }

    try {
      await participantRepository.save(record)
    } catch (error) {
      savedParticipantIds.current.delete(session.participantId)
      throw error
    }
    setSession((prev) => ({ ...prev, result, saved: true }))
  }, [needsVector, ratingsMatrix, session.participantId, session.latentDim])

  const recordHandCheck = useCallback(
    async (reported: number[]) => {
      if (!session.result || !session.participantId) return
      const deltas = session.result.needProjected.map((value, i) => value - (reported[i] ?? 0))
      const handCheck: HandCalculationCheck = {
        reported,
        deltas,
        maxAbsDelta: deltas.reduce((acc, d) => Math.max(acc, Math.abs(d)), 0),
        checkedAt: new Date().toISOString(),
      }
      setSession((prev) => ({ ...prev, handCheck }))
      await participantRepository.update(session.participantId, { handCalculation: handCheck })
    },
    [session.result, session.participantId],
  )

  const reset = useCallback(() => setSession(emptySession()), [])

  const value = useMemo<SessionContextValue>(
    () => ({
      ...session,
      beginSession,
      setNeed,
      setRating,
      setLatentDim,
      needsComplete,
      needsVector,
      feelconomyType,
      ratingsComplete,
      ratingsMatrix,
      ratingsCompletedAlternatives,
      computeAndSave,
      recordHandCheck,
      reset,
    }),
    [
      session,
      beginSession,
      setNeed,
      setRating,
      setLatentDim,
      feelconomyType,
      needsComplete,
      needsVector,
      ratingsComplete,
      ratingsMatrix,
      ratingsCompletedAlternatives,
      computeAndSave,
      recordHandCheck,
      reset,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession은 SessionProvider 안에서만 쓸 수 있습니다.')
  return context
}
