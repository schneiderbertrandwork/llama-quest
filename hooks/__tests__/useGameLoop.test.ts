import { renderHook, act } from '@testing-library/react-native'
import { useGameLoop } from '../useGameLoop'

// requestAnimationFrame is not available in the react-test-renderer environment.
// Install a minimal manual control shim so the hook can be exercised.
const pendingCallbacks = new Map<number, (ts: number) => void>()
let nextId = 0

function triggerFrame(timestamp = 100): void {
  for (const [id, cb] of Array.from(pendingCallbacks.entries())) {
    pendingCallbacks.delete(id)
    cb(timestamp)
  }
}

describe('useGameLoop', () => {
  beforeEach(() => {
    nextId = 0
    pendingCallbacks.clear()
    ;(global as any).requestAnimationFrame = (cb: (ts: number) => void): number => {
      const id = ++nextId
      pendingCallbacks.set(id, cb)
      return id
    }
    ;(global as any).cancelAnimationFrame = (id: number): void => {
      pendingCallbacks.delete(id)
    }
  })

  afterEach(() => {
    delete (global as any).requestAnimationFrame
    delete (global as any).cancelAnimationFrame
    pendingCallbacks.clear()
  })

  it('invokes callback each frame', () => {
    const cb = jest.fn()
    const { unmount } = renderHook(() => useGameLoop(cb))

    act(() => { triggerFrame() })

    expect(cb).toHaveBeenCalled()
    unmount()
  })

  it('passes dt=0 on the very first frame (no previous timestamp)', () => {
    const cb = jest.fn()
    const { unmount } = renderHook(() => useGameLoop(cb))

    act(() => { triggerFrame(500) })

    // lastTimestamp starts at 0, so raw = 0, dt = min(0, 0.05) = 0
    expect(cb).toHaveBeenCalledWith(0)
    unmount()
  })

  it('stops calling callback after unmount', () => {
    const cb = jest.fn()
    const { unmount } = renderHook(() => useGameLoop(cb))

    act(() => { triggerFrame() })
    const countBefore = cb.mock.calls.length

    unmount()

    act(() => { triggerFrame() })
    expect(cb.mock.calls.length).toBe(countBefore)
  })
})
