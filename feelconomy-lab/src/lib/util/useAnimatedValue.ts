import { useEffect, useState } from 'react'

/**
 * 마운트되거나 target이 바뀔 때, 0에서 target까지 CSS transition으로 자연스럽게
 * 올라가는 값을 돌려준다. 그래프 막대가 자라나는 것처럼 보이게 하는 용도다.
 *
 * 실제 애니메이션은 이 훅이 아니라 사용하는 쪽의 CSS transition
 * (예: className="transition-[width] duration-700")이 담당한다. 이 훅은 그
 * transition이 재생되도록 "0 → 실제값"의 두 렌더를 만들어 주는 역할만 한다 —
 * 같은 프레임에 두 값을 그리면 브라우저가 transition 대상으로 인식하지 못하고
 * 바로 최종값으로 그려 버린다.
 *
 * 참가자 결과 화면의 그래프(SVD 설명분산, 군집 거리, 유형 판정 막대, 욕구
 * 평균 막대)가 "그 자리에서 계산되는 느낌"을 주도록 2026-08-15에 도입했다
 * (그래프·지도가 유동적으로 움직였으면 좋겠다는 피드백에 대응).
 */
export function useAnimatedValue(target: number, delayMs = 0): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    setValue(0)
    let raf = 0
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(() => setValue(target))
    }, delayMs)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, delayMs])

  return value
}
