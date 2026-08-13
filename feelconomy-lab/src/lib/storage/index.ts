/**
 * 저장소 팩토리.
 *
 * 화면 코드는 여기서 반환하는 객체만 사용한다. 중앙 DB로 옮길 때는
 * 이 파일의 한 줄만 바꾸면 되고, 나머지 코드는 전혀 손대지 않는다.
 */

import { LocalParticipantRepository } from './localStorage'
import type { ParticipantRepository } from './repositories'

export const participantRepository: ParticipantRepository = new LocalParticipantRepository()

export type { ParticipantRepository }
