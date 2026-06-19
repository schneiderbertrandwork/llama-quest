import { act, renderHook } from '@testing-library/react-native'
import { useGameStore } from '../game-store'

import { initialGameState } from '../game-store'

// Reset store before each test
beforeEach(() => {
  useGameStore.setState(initialGameState)
})

describe('initPlayer', () => {
  it('sets player name and class, resets progression', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Scholar'))
    expect(result.current.player.name).toBe('Ada')
    expect(result.current.player.class).toBe('Scholar')
    expect(result.current.player.level).toBe(1)
    expect(result.current.player.xp).toBe(0)
    expect(result.current.player.hp).toBe(result.current.player.maxHp)
  })
})

describe('awardXP', () => {
  it('increases XP', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.awardXP(20))
    expect(result.current.player.xp).toBe(20)
  })

  it('levels up when XP reaches 120', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.awardXP(120))
    expect(result.current.player.level).toBe(2)
    expect(result.current.player.xp).toBe(0)
  })
})

describe('markLessonRead', () => {
  it('records lesson as read and awards 20 XP', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.markLessonRead('oll-intro'))
    expect(result.current.progression.readLessons['oll-intro']).toBe(true)
    expect(result.current.player.xp).toBe(20)
  })

  it('does not award XP a second time for the same lesson', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.markLessonRead('oll-intro'))
    act(() => result.current.markLessonRead('oll-intro'))
    expect(result.current.player.xp).toBe(20)
  })
})
