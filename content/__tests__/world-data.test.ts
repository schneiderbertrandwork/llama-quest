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
