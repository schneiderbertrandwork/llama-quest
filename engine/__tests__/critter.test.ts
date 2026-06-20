import { makeCritter } from '../entity'
import type { CritterData } from '../entity'
import { tickCritter } from '../critter'

function makeCritterAt(x: number, y: number, tx: number, ty: number, extra?: Partial<CritterData>) {
  const data: CritterData = {
    homeX: x, homeY: y, targetX: tx, targetY: ty,
    wanderRadius: 4, speed: 2, pauseTimer: 0, critterType: 'rabbit',
    ...extra,
  }
  return makeCritter('test-critter', x, y, data)
}

describe('tickCritter', () => {
  it('moves entity toward target', () => {
    const c = makeCritterAt(0, 0, 2, 0)
    const next = tickCritter(c, 0.5)
    expect(next.x).toBeCloseTo(1, 1)
    expect(next.y).toBeCloseTo(0, 1)
  })

  it('does not move when paused', () => {
    const c = makeCritterAt(0, 0, 2, 0, { pauseTimer: 1.0 })
    const next = tickCritter(c, 0.5)
    expect(next.x).toBe(0)
    expect(next.y).toBe(0)
    const cd = next.data as unknown as CritterData
    expect(cd.pauseTimer).toBeCloseTo(0.5, 2)
  })

  it('picks new target when reaching current target', () => {
    const c = makeCritterAt(0, 0, 0.05, 0)
    const next = tickCritter(c, 0.5)
    const cd = next.data as unknown as CritterData
    expect(cd.pauseTimer).toBeGreaterThan(0)
  })

  it('returns toward home when too far', () => {
    const data: CritterData = {
      homeX: 0, homeY: 0, targetX: 20, targetY: 0,
      wanderRadius: 4, speed: 2, pauseTimer: 0, critterType: 'rabbit',
    }
    const c = makeCritter('c', 10, 0, data)
    const next = tickCritter(c, 0.5)
    const cd = next.data as unknown as CritterData
    expect(cd.targetX).toBe(0)
    expect(cd.targetY).toBe(0)
  })
})
