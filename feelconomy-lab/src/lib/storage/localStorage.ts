/**
 * localStorage 기반 참가자 저장소.
 *
 * 브라우저 하나 안에서만 데이터를 공유한다. 부스에서 한 대의 기기로 운영할 때는
 * 충분하다. 여러 기기 운영으로 확장할 때는 같은 인터페이스를 구현한 DB 버전을
 * 만들어 `index.ts`의 팩토리만 바꾸면 된다.
 */

import type { ParticipantRecord } from '@/lib/types'
import type { ParticipantRepository } from './repositories'

const KEY = 'feelconomy:participants:v2'

function readAll(): ParticipantRecord[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY)
    return raw ? (JSON.parse(raw) as ParticipantRecord[]) : []
  } catch {
    return []
  }
}

function writeAll(records: ParticipantRecord[]): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(records))
  } catch (error) {
    throw new Error(
      '브라우저 저장 공간에 쓸 수 없습니다. 저장 공간이 꽉 찼을 수 있습니다. ' +
        `관리자 화면에서 CSV로 내보낸 뒤 데이터를 정리해 주세요.\n원인: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export class LocalParticipantRepository implements ParticipantRepository {
  async save(record: ParticipantRecord): Promise<void> {
    const all = readAll()
    all.push(record)
    writeAll(all)
  }

  async listAll(): Promise<ParticipantRecord[]> {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async findById(participantId: string): Promise<ParticipantRecord | null> {
    return readAll().find((r) => r.participantId === participantId) ?? null
  }

  async update(participantId: string, patch: Partial<ParticipantRecord>): Promise<void> {
    const all = readAll()
    const index = all.findIndex((r) => r.participantId === participantId)
    if (index < 0) throw new Error(`참가자 ${participantId}를 찾을 수 없습니다.`)
    all[index] = { ...all[index], ...patch }
    writeAll(all)
  }

  async clear(): Promise<void> {
    writeAll([])
  }

  async countForDate(yyyymmdd: string): Promise<number> {
    return readAll().filter((r) => r.participantId.includes(`-${yyyymmdd}-`)).length
  }
}
