/**
 * 저장소 인터페이스.
 *
 * v1에는 ReferenceDatasetRepository / ModelRepository도 있었다 — 기준 데이터셋을
 * 업로드하고 그로부터 학습한 모델을 저장·잠금하기 위해서였다. v2는 참가자 개인의
 * 입력만으로 분석이 완결되므로 그런 "공유 상태"가 존재하지 않는다. 저장소는
 * 참가자 기록 하나만 있으면 된다.
 *
 * 지금은 브라우저 localStorage에 저장하지만, 여러 기기가 동시에 접속하는 실제
 * 운영에서는 중앙 DB(Supabase 등)가 필요할 수 있다. 그래서 화면 코드는 이
 * 인터페이스만 알고, 구현체는 나중에 교체한다.
 */

import type { ParticipantRecord } from '@/lib/types'

export interface ParticipantRepository {
  save(record: ParticipantRecord): Promise<void>
  listAll(): Promise<ParticipantRecord[]>
  findById(participantId: string): Promise<ParticipantRecord | null>
  update(participantId: string, patch: Partial<ParticipantRecord>): Promise<void>
  clear(): Promise<void>
  /** 오늘 날짜의 참가자 수 — 익명 ID 연번을 만들 때 쓴다 */
  countForDate(yyyymmdd: string): Promise<number>
}
