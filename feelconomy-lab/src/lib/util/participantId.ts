/**
 * 익명 참가자 ID 생성 — 요구사항 §18.
 *
 * 형식: P-YYYYMMDD-NNN  (예: P-20260814-001)
 *
 * 이름·전화번호·이메일·학번을 전혀 수집하지 않으므로, 참가자를 개인적으로
 * 식별할 수 있는 정보는 어디에도 저장되지 않는다. 날짜와 연번만으로 구성된다.
 */

import { participantRepository } from '@/lib/storage'

/** 오늘 날짜를 로컬 시간대 기준 YYYYMMDD 문자열로 만든다 */
export function todayStamp(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/**
 * 다음 익명 ID를 만든다.
 * 같은 날짜에 이미 저장된 참가자 수 + 1 로 연번을 붙인다.
 */
export async function generateParticipantId(date = new Date()): Promise<string> {
  const stamp = todayStamp(date)
  const count = await participantRepository.countForDate(stamp)
  return `P-${stamp}-${String(count + 1).padStart(3, '0')}`
}

/** 사람이 읽기 좋은 시각 표기 (관리자 표 등에서 사용) */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
