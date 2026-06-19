import { makePlayer } from '../entity'

describe('makePlayer', () => {
  it('creates a player entity at given tile coordinates', () => {
    const player = makePlayer(5, 3)
    expect(player.type).toBe('player')
    expect(player.x).toBe(5)
    expect(player.y).toBe(3)
    expect(player.facing).toBe('down')
    expect(player.interactable).toBe(false)
  })
})
