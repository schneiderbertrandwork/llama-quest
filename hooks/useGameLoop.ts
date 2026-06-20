import { useEffect, useRef } from 'react'

const MAX_DT = 0.05  // 50ms cap (Global Constraint)

export function useGameLoop(callback: (dt: number) => void): void {
  const lastTimestamp = useRef<number>(0)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let rafId: number

    function loop(timestamp: number) {
      const raw = lastTimestamp.current === 0 ? 0 : (timestamp - lastTimestamp.current) / 1000
      lastTimestamp.current = timestamp
      const dt = Math.min(raw, MAX_DT)
      callbackRef.current(dt)
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])
}
