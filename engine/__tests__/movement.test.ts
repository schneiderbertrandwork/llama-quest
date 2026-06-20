import { movePlayer } from '../movement'
import { makePlayer } from '../entity'
import { makeGrid, setTile } from '../tilemap'

const SPEED = 8
const DT = 1

describe('movePlayer', () => {
  it('moves right when dx=1', () => {
    const grid = makeGrid(20, 20, 'grass')
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 1, dy: 0 }, grid, DT)
    expect(moved.x).toBeCloseTo(5 + SPEED)
    expect(moved.facing).toBe('right')
  })

  it('moves up when dy=-1', () => {
    const grid = makeGrid(20, 20, 'grass')
    const player = makePlayer(10, 10)
    const moved = movePlayer(player, { dx: 0, dy: -1 }, grid, DT)
    expect(moved.y).toBeCloseTo(10 - SPEED)
    expect(moved.facing).toBe('up')
  })

  it('stops at non-walkable tile boundary', () => {
    const grid = makeGrid(10, 10, 'grass')
    setTile(grid, 7, 5, 'water')
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 1, dy: 0 }, grid, DT)
    // Player should have moved right but stopped before tile x=7
    expect(moved.x).toBeGreaterThan(5)
    expect(moved.x).toBeLessThan(7)
  })

  it('does not move when input is zero', () => {
    const grid = makeGrid(10, 10, 'grass')
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 0, dy: 0 }, grid, DT)
    expect(moved.x).toBe(5)
    expect(moved.y).toBe(5)
  })

  it('normalises diagonal movement', () => {
    const grid = makeGrid(20, 20, 'grass')
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 1, dy: 1 }, grid, DT)
    const dist = Math.hypot(moved.x - 5, moved.y - 5)
    expect(dist).toBeCloseTo(SPEED, 1)
  })
})
