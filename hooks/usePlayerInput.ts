import { useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import type { InputState } from '../engine/movement'

export function usePlayerInput(): { input: React.RefObject<InputState>; resetInput: () => void } {
  const input = useRef<InputState>({ dx: 0, dy: 0 })

  const resetInput = useCallback(() => {
    input.current = { dx: 0, dy: 0 }
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web') return

    const keys = new Set<string>()

    function update() {
      let dx = 0
      let dy = 0
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx = 1
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx = -1
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy = 1
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy = -1
      input.current = { dx, dy }
    }

    const onDown = (e: KeyboardEvent) => { keys.add(e.key); update() }
    const onUp = (e: KeyboardEvent) => { keys.delete(e.key); update() }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  return { input, resetInput }
}
