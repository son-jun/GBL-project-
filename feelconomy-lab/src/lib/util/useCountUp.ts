import { useEffect, useState } from 'react'

/**
 * 0에서 target까지 실제로 세는 것처럼 보이는 숫자를 반환한다.
 *
 * useAnimatedValue와 다른 점: useAnimatedValue는 "0 → 값"의 두 렌더만 만들고
 * 나머지는 CSS transition에 맡긴다(막대 너비처럼 CSS가 보간할 수 있는 값에만
 * 통한다). 하지만 화면에 찍는 숫자 텍스트는 CSS가 보간해 주지 않는다 —
 * state가 0에서 16.36으로 바뀌면 글자가 그 즉시 "16.36"으로 바뀔 뿐, 중간
 * 숫자가 스쳐 지나가지 않는다. 그래서 숫자 카운트업은 requestAnimationFrame으로
 * 직접 프레임마다 중간값을 계산해 state에 넣는다.
 *
 * 결과 화면의 좌표·거리처럼 "그 자리에서 계산되는" 느낌을 주고 싶은 숫자에 쓴다.
 */
export function useCountUp(target: number, durationMs = 900, delayMs = 0): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    let start: number | null = null

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(1, elapsed / durationMs)
      // 뒤로 갈수록 느려지는 ease-out — docs/06가 쓰는 스프링 이징과 같은 인상을 준다
      const eased = 1 - (1 - progress) ** 3
      setValue(target * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    setValue(0)
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, delayMs)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, durationMs, delayMs])

  return value
}
