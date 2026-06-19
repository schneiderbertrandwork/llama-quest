import { tileAt, isWalkable, makeGrid, makeTile } from '../tilemap'

describe('tileAt', () => {
  it('returns tile at valid coordinates', () => {
    const grid = makeGrid(3, 3, 'grass')
    const tile = tileAt(grid, 1, 1)
    expect(tile).not.toBeNull()
    expect(tile?.type).toBe('grass')
  })

  it('returns null for out-of-bounds coordinates', () => {
    const grid = makeGrid(3, 3, 'grass')
    expect(tileAt(grid, -1, 0)).toBeNull()
    expect(tileAt(grid, 3, 0)).toBeNull()
    expect(tileAt(grid, 0, 3)).toBeNull()
  })
})

describe('isWalkable', () => {
  it('returns true for walkable tile types', () => {
    const grid = makeGrid(1, 1, 'grass')
    expect(isWalkable(grid, 0, 0)).toBe(true)
  })

  it('returns false for non-walkable tile types', () => {
    const grid = makeGrid(1, 1, 'water')
    expect(isWalkable(grid, 0, 0)).toBe(false)
  })

  it('returns false for out-of-bounds coordinates', () => {
    const grid = makeGrid(3, 3, 'grass')
    expect(isWalkable(grid, -1, 0)).toBe(false)
    expect(isWalkable(grid, 5, 5)).toBe(false)
  })
})

describe('makeGrid', () => {
  it('creates a grid filled with the given tile type', () => {
    const grid = makeGrid(4, 2, 'path')
    expect(grid.width).toBe(4)
    expect(grid.height).toBe(2)
    expect(grid.tiles).toHaveLength(8)
    grid.tiles.forEach((t) => expect(t.type).toBe('path'))
  })
})
