import { makePlayer, makeDecoration, makeCritter } from '../entity'

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

describe('makeDecoration', () => {
  it('creates a decoration entity', () => {
    const d = makeDecoration('deco-llama-1', 3, 4)
    expect(d.id).toBe('deco-llama-1')
    expect(d.type).toBe('decoration')
    expect(d.x).toBe(3)
    expect(d.y).toBe(4)
    expect(d.interactable).toBe(false)
  })
})

describe('makeCritter', () => {
  it('creates a critter entity with critter data', () => {
    const c = makeCritter('critter-rabbit-1', 10, 20, {
      homeX: 10, homeY: 20, targetX: 11, targetY: 20,
      wanderRadius: 4, speed: 1.5, pauseTimer: 0, critterType: 'rabbit',
    })
    expect(c.id).toBe('critter-rabbit-1')
    expect(c.type).toBe('critter')
    expect(c.x).toBe(10)
    expect(c.y).toBe(20)
    expect(c.interactable).toBe(false)
    expect(c.data['critterType']).toBe('rabbit')
  })
})
