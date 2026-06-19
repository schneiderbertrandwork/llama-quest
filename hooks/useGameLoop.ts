import { useCallback, useRef } from 'react'
import { useFrameCallback } from 'react-native-reanimated'

const MAX_DT = 0.05  // 50ms cap (Global Constraint)

export function useGameLoop(callback: (dt: number) => void): void {
  const lastTimestamp = useRef<number>(0)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useFrameCallback((info) => {
    const now = info.timestamp
    const raw = lastTimestamp.current === 0 ? 0 : (now - lastTimestamp.current) / 1000
    lastTimestamp.current = now
    const dt = Math.min(raw, MAX_DT)
    callbackRef.current(dt)
  })
}
