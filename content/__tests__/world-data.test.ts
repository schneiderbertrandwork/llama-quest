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
