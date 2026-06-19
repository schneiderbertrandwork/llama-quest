import { getCityDef } from '../world-data'

// ── Forge ────────────────────────────────────────────────────────────────────
it('getCityDef("forge") returns Forge city', () => {
  const city = getCityDef('forge')
  expect(city.id).toBe('forge')
})
it('Forge grid is 20 wide × 18 tall', () => {
  const city = getCityDef('forge')
  expect(city.grid.width).toBe(20)
  expect(city.grid.height).toBe(18)
})
it('Forge has enter-forge-library building entrance', () => {
  const city = getCityDef('forge')
  const e = city.entities.find(e => e.id === 'enter-forge-library')
  expect(e).toBeDefined()
  expect(e?.type).toBe('building_entrance')
})
it('Forge has npc-smith', () => {
  expect(getCityDef('forge').entities.find(e => e.id === 'npc-smith')).toBeDefined()
})
it('Forge has npc-api-artificer', () => {
  expect(getCityDef('forge').entities.find(e => e.id === 'npc-api-artificer')).toBeDefined()
})
it('OVERWORLD has enter-forge entity', () => {
  const ow = getCityDef('overworld')
  expect(ow.entities.find(e => e.id === 'enter-forge')).toBeDefined()
})

// ── Prism Caverns ─────────────────────────────────────────────────────────────
it('getCityDef("vale") returns Prism Caverns city', () => {
  const city = getCityDef('vale')
  expect(city.id).toBe('vale')
})
it('Caverns grid is 22 wide × 18 tall', () => {
  const city = getCityDef('vale')
  expect(city.grid.width).toBe(22)
  expect(city.grid.height).toBe(18)
})
it('Caverns has enter-vale-library building entrance', () => {
  const city = getCityDef('vale')
  const e = city.entities.find(e => e.id === 'enter-vale-library')
  expect(e).toBeDefined()
  expect(e?.type).toBe('building_entrance')
})
it('Caverns has npc-prism-oracle', () => {
  expect(getCityDef('vale').entities.find(e => e.id === 'npc-prism-oracle')).toBeDefined()
})
it('Caverns has npc-vector-sprite', () => {
  expect(getCityDef('vale').entities.find(e => e.id === 'npc-vector-sprite')).toBeDefined()
})
it('OVERWORLD has enter-vale entity', () => {
  const ow = getCityDef('overworld')
  expect(ow.entities.find(e => e.id === 'enter-vale')).toBeDefined()
})

// ── The Convergence ───────────────────────────────────────────────────────────
it('getCityDef("ridge") returns The Convergence city', () => {
  const city = getCityDef('ridge')
  expect(city.id).toBe('ridge')
})
it('Convergence grid is 20 wide × 16 tall', () => {
  const city = getCityDef('ridge')
  expect(city.grid.width).toBe(20)
  expect(city.grid.height).toBe(16)
})
it('Convergence has enter-ridge-library building entrance', () => {
  const city = getCityDef('ridge')
  const e = city.entities.find(e => e.id === 'enter-ridge-library')
  expect(e).toBeDefined()
  expect(e?.type).toBe('building_entrance')
})
it('Convergence has npc-architect', () => {
  expect(getCityDef('ridge').entities.find(e => e.id === 'npc-architect')).toBeDefined()
})
it('Convergence has npc-keeper', () => {
  expect(getCityDef('ridge').entities.find(e => e.id === 'npc-keeper')).toBeDefined()
})
it('OVERWORLD has enter-ridge entity', () => {
  const ow = getCityDef('overworld')
  expect(ow.entities.find(e => e.id === 'enter-ridge')).toBeDefined()
})

// ── Gate unlock ───────────────────────────────────────────────────────────────
import { ACT_CONCEPTS, isActMastered, isGateUnlocked } from '../world-data'

it('ACT_CONCEPTS[1] has 6 lesson ids', () => {
  expect(ACT_CONCEPTS[1]).toHaveLength(6)
})
it('ACT_CONCEPTS[2] has 8 lesson ids', () => {
  expect(ACT_CONCEPTS[2]).toHaveLength(8)
})
it('ACT_CONCEPTS[3] has 8 lesson ids', () => {
  expect(ACT_CONCEPTS[3]).toHaveLength(8)
})
it('ACT_CONCEPTS[4] has 3 lesson ids', () => {
  expect(ACT_CONCEPTS[4]).toHaveLength(3)
})
it('isActMastered returns false when nothing mastered', () => {
  expect(isActMastered(1, {})).toBe(false)
})
it('isActMastered returns true when all Act I concepts mastered', () => {
  const mastered: Record<string, boolean> = {}
  for (const id of ACT_CONCEPTS[1]!) mastered[id] = true
  expect(isActMastered(1, mastered)).toBe(true)
})
it('isActMastered returns false when only partial Act I concepts mastered', () => {
  expect(isActMastered(1, { 'oll-intro': true })).toBe(false)
})
it('isGateUnlocked returns false when act not mastered', () => {
  expect(isGateUnlocked(1, {}, { 'frozen-boot': true })).toBe(false)
})
it('isGateUnlocked returns false when boss not defeated', () => {
  const mastered: Record<string, boolean> = {}
  for (const id of ACT_CONCEPTS[1]!) mastered[id] = true
  expect(isGateUnlocked(1, mastered, {})).toBe(false)
})
it('isGateUnlocked returns true when act mastered and boss defeated', () => {
  const mastered: Record<string, boolean> = {}
  for (const id of ACT_CONCEPTS[1]!) mastered[id] = true
  expect(isGateUnlocked(1, mastered, { 'frozen-boot': true })).toBe(true)
})

// ── Boss Gates ────────────────────────────────────────────────────────────────
it('Forge has gate-boss-forge boss gate entity', () => {
  const city = getCityDef('forge')
  const bg = city.entities.find(e => e.id === 'gate-boss-forge')
  expect(bg).toBeDefined()
  expect(bg?.data['bossId']).toBe('rate-limiter')
})
it('Caverns has gate-boss-vale boss gate entity', () => {
  const city = getCityDef('vale')
  const bg = city.entities.find(e => e.id === 'gate-boss-vale')
  expect(bg).toBeDefined()
  expect(bg?.data['bossId']).toBe('dimensionless-beast')
})
