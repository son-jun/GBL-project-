/**
 * 시드 고정 난수 생성기.
 *
 * k-means++ 초기화는 난수를 쓰므로, 시드를 고정하지 않으면 같은 데이터로 모델을
 * 다시 만들 때마다 결과가 달라진다. 요구사항 §26 마지막 항목("같은 입력과 같은
 * model version에는 같은 inference 결과")을 만족시키려면 재현 가능한 난수가 필요하다.
 *
 * mulberry32: 32비트 상태를 쓰는 짧고 통계적 품질이 충분한 PRNG.
 */

export interface Rng {
  /** [0, 1) 구간의 실수 */
  next(): number
  /** [0, n) 구간의 정수 */
  nextInt(n: number): number
}

/** 주어진 시드로 결정론적 난수 생성기를 만든다 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    nextInt: (n: number) => Math.floor(next() * n),
  }
}

/**
 * Box-Muller 변환으로 표준정규분포 샘플을 만든다.
 * 기준 데이터셋 생성기에서 잠재 정규변수를 뽑을 때 사용한다.
 */
export function nextGaussian(rng: Rng): number {
  // u1이 정확히 0이면 log(0) = -Infinity가 되므로 아주 작은 값으로 보정
  const u1 = Math.max(rng.next(), Number.EPSILON)
  const u2 = rng.next()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}
