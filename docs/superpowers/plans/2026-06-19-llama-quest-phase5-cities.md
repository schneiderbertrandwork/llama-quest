# Llama Quest Phase 5 — Remaining Cities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Model Forge (Act II), Prism Caverns (Act III), and The Convergence (Act IV) as fully playable cities, plus a gate unlock system driven by lesson mastery and boss defeats.

**Architecture:** Each city is a new `CityDef` added to `content/world-data.ts`; the existing generic `app/city/[id].tsx` screen works for all three without modification (except the gate unlock logic). The gate unlock system adds `ACT_CONCEPTS`, `isActMastered`, and `isGateUnlocked` helpers to `world-data.ts` and one new branch in the city screen's `handleInteract`.

**Tech Stack:** TypeScript strict, existing engine/store/content APIs. No new dependencies.

## Global Constraints

- **Expo SDK 52** managed workflow; no ejecting
- **TypeScript strict** with `noUncheckedIndexedAccess: true`; all array/object index access uses `??` fallback
- **`--legacy-peer-deps`** required for all `npm install` calls
- **No arbitrary colors** — pull from the established palette (see HUD.tsx and TilemapRenderer.tsx)
- **Entity IDs** kebab-case (e.g., `'npc-smith'`); lesson IDs `<tech>-<concept>` (e.g., `'oll-run'`)
- **Save key** `'llama_quest_v1'` — never change
- **TDD**: write failing test first → implement minimal code → confirm green → commit
- **`Record<string, boolean>`** for all progression tracking (not `Set<string>`)
- **Constants**: `TILE_SIZE = 32`, `PLAYER_SPEED = 4`, `MAX_DT = 0.05`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `content/world-data.ts` | Add FORGE, CAVERNS, CONVERGENCE CityDefs; update OVERWORLD entities; add CITY_MAP entries; add ACT_CONCEPTS, isActMastered, isGateUnlocked |
| Create | `content/__tests__/world-data.test.ts` | Unit tests for all 3 cities + gate unlock functions |
| Modify | `store/game-store.ts` | Update `markLessonRead` to also set `masteredConcepts` (makes gate unlock reachable) |
| Modify | `app/city/[id].tsx` | Add `isGateUnlocked` import; add act-mastery gate branch in `handleInteract` |

---

## Existing Code Context

### `content/world-data.ts` current shape (as of Phase 4)

```typescript
import type { CityId } from '../store/game-store'
import { makeGrid, setTile } from '../engine/tilemap'
import type { TileGrid } from '../engine/tilemap'
import { makeNPC, makeBuildingEntrance, makeGate, makeSandboxPortal } from '../engine/entity'
import type { Entity } from '../engine/entity'

export interface CityDef {
  id: CityId | 'overworld'
  grid: TileGrid
  playerSpawn: { x: number; y: number }
  entities: Entity[]
  gateExit: { x: number; y: number; destination: CityId | 'overworld' }
}

// buildOverworldGrid() — 40×30 grass base; horizontal road at y=14,15 (x=5..34); forest at rows 0-1, 28-29
// buildLlamatownGrid() — 20×15 grass base; perimeter walls; path at y=7; 3 buildings; south exit doors

export const OVERWORLD: CityDef = {
  id: 'overworld',
  grid: buildOverworldGrid(),
  playerSpawn: { x: 6, y: 14 },
  entities: [
    makeBuildingEntrance('enter-llamatown', 7, 13, 'llamatown'),
  ],
  gateExit: { x: 0, y: 0, destination: 'llamatown' },
}

export const LLAMATOWN: CityDef = { ... }  // 20×15, includes sandbox portal, boss gate

const CITY_MAP: Record<string, CityDef> = {
  overworld: OVERWORLD,
  llamatown: LLAMATOWN,
}

export function getCityDef(id: CityId | 'overworld'): CityDef {
  const def = CITY_MAP[id]
  if (!def) throw new Error(`Unknown city: ${id}`)
  return def
}
```

### `store/game-store.ts` `markLessonRead` (as of Phase 4)

```typescript
markLessonRead: (lessonId) => {
  const { progression } = get()
  if (progression.readLessons[lessonId]) return
  set((state) => ({
    progression: {
      ...state.progression,
      readLessons: { ...state.progression.readLessons, [lessonId]: true },
    },
  }))
  get().awardXP(20)
},
```

`progression.masteredConcepts` is currently never written — `isGateUnlocked` would always return false. Task 4 fixes this by also writing `masteredConcepts` when a lesson is read.

### `app/city/[id].tsx` gate handler (as of Phase 4)

```typescript
} else if (nearbyEntity.type === 'gate') {
  const dest = nearbyEntity.data['destination'] as string
  const bossId = nearbyEntity.data['bossId'] as string | undefined
  const locked = nearbyEntity.data['locked'] as boolean | undefined

  if (locked && bossId) {
    if (progression.defeatedBosses[bossId]) {
      if (dest === 'overworld') router.push('/overworld')
      else router.push(`/city/${dest}`)
    } else {
      encounterCooldown.current = 90
      router.push(`/battle?enemyId=${bossId}`)
    }
  } else {
    // currently routes through even if locked=true with no bossId — fixed in Task 4
    if (dest === 'overworld') router.push('/overworld')
    else router.push(`/city/${dest}`)
  }
}
```

---

## Task 1: Model Forge CityDef + overworld entrance

**Files:**
- Create: `content/__tests__/world-data.test.ts`
- Modify: `content/world-data.ts`

**Interfaces:**
- Produces: `FORGE: CityDef`, `getCityDef('forge')` returns it, `OVERWORLD.entities` includes `enter-forge`

- [ ] **Step 1: Write the failing tests**

Create `content/__tests__/world-data.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- content/__tests__/world-data.test.ts --watchAll=false`

Expected: FAIL — "Unknown city: forge" (getCityDef throws because 'forge' is not in CITY_MAP yet)

- [ ] **Step 3: Add `buildForgeGrid` and `FORGE` to `content/world-data.ts`**

Insert after the `LLAMATOWN` definition, before `CITY_MAP`:

```typescript
function buildForgeGrid(): TileGrid {
  const g = makeGrid(20, 18, 'floor')
  // Perimeter walls
  for (let x = 0; x < 20; x++) {
    setTile(g, x, 0, 'building_wall')
    setTile(g, x, 17, 'building_wall')
  }
  for (let y = 0; y < 18; y++) {
    setTile(g, 0, y, 'building_wall')
    setTile(g, 19, y, 'building_wall')
  }
  // South exit (back to overworld)
  setTile(g, 9, 17, 'door')
  setTile(g, 10, 17, 'door')
  // East gate tile to Prism Caverns
  setTile(g, 19, 9, 'door')
  // Main east-west street
  for (let x = 1; x < 19; x++) setTile(g, x, 9, 'path')
  // Forge Library: x=1..3, y=1..6; door at (2,6)
  for (let x = 1; x <= 3; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 2, 6, 'door')
  // API Workshop (sandbox portal): x=7..11, y=1..6; portal at (9,6)
  for (let x = 7; x <= 11; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 9, 6, 'door')
  // Modelfile Foundry (sandbox portal): x=14..18, y=1..6; portal at (16,6)
  for (let x = 14; x <= 18; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 16, 6, 'door')
  return g
}

export const FORGE: CityDef = {
  id: 'forge',
  grid: buildForgeGrid(),
  playerSpawn: { x: 9, y: 15 },
  entities: [
    makeBuildingEntrance('enter-forge-library', 2, 6, 'forge-library'),
    makeSandboxPortal('sandbox-api-workshop', 9, 6, 'api'),
    makeSandboxPortal('sandbox-modelfile-foundry', 16, 6, 'modelfile'),
    makeNPC('npc-smith', 4, 4, {
      name: 'Smith Forge-Hand',
      lines: [
        "This is the Forge. Here we don't just use models — we shape them.",
        "A Modelfile is a recipe: FROM a base, add a SYSTEM persona, bake in PARAMETERs.",
        '`ollama create mybot -f Modelfile` and your custom model is born.',
      ],
    }),
    makeNPC('npc-api-artificer', 15, 8, {
      name: 'API Artificer',
      lines: [
        "Every CLI command is really a POST to :11434. Learn the API and you can build anything.",
        "/api/chat for conversation, /api/embed for vectors, /v1 if you speak OpenAI.",
      ],
    }),
    makeGate('gate-forge-south', 9, 16, 'overworld', false),
    makeGate('gate-forge-east', 18, 9, 'vale', true),
  ],
  gateExit: { x: 9, y: 16, destination: 'overworld' },
}
```

- [ ] **Step 4: Add `enter-forge` to OVERWORLD entities and `forge` to CITY_MAP**

In `content/world-data.ts`, update the OVERWORLD entities array:

```typescript
export const OVERWORLD: CityDef = {
  id: 'overworld',
  grid: buildOverworldGrid(),
  playerSpawn: { x: 6, y: 14 },
  entities: [
    makeBuildingEntrance('enter-llamatown', 7, 13, 'llamatown'),
    makeBuildingEntrance('enter-forge', 33, 14, 'forge'),
  ],
  gateExit: { x: 0, y: 0, destination: 'llamatown' },
}
```

Update CITY_MAP:

```typescript
const CITY_MAP: Record<string, CityDef> = {
  overworld: OVERWORLD,
  llamatown: LLAMATOWN,
  forge: FORGE,
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- content/__tests__/world-data.test.ts --watchAll=false`

Expected: PASS (6 tests)

- [ ] **Step 6: TypeScript check**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add content/world-data.ts content/__tests__/world-data.test.ts
git commit -m "feat: add Model Forge city with NPCs, library, sandbox portals (Phase 5 Task 1)"
```

---

## Task 2: Prism Caverns CityDef + overworld entrance

**Files:**
- Modify: `content/world-data.ts`
- Modify: `content/__tests__/world-data.test.ts`

**Interfaces:**
- Consumes: FORGE (already added to CITY_MAP)
- Produces: `CAVERNS: CityDef` exported as `id: 'vale'`, `getCityDef('vale')` returns it, `OVERWORLD.entities` includes `enter-vale`

- [ ] **Step 1: Add failing tests for Caverns**

Append to `content/__tests__/world-data.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- content/__tests__/world-data.test.ts --watchAll=false`

Expected: FAIL — "Unknown city: vale"

- [ ] **Step 3: Add `buildCavernsGrid` and `CAVERNS` to `content/world-data.ts`**

Insert after the FORGE definition, before CITY_MAP:

```typescript
function buildCavernsGrid(): TileGrid {
  const g = makeGrid(22, 18, 'floor')
  // Perimeter walls
  for (let x = 0; x < 22; x++) {
    setTile(g, x, 0, 'building_wall')
    setTile(g, x, 17, 'building_wall')
  }
  for (let y = 0; y < 18; y++) {
    setTile(g, 0, y, 'building_wall')
    setTile(g, 21, y, 'building_wall')
  }
  // North exit tiles (back to overworld — entered from north)
  setTile(g, 10, 0, 'door')
  setTile(g, 11, 0, 'door')
  // West gate tile to The Convergence
  setTile(g, 0, 9, 'door')
  // Main east-west path
  for (let x = 1; x < 21; x++) setTile(g, x, 9, 'path')
  // Vale Library: x=2..6, y=2..7; door at (4,7)
  for (let x = 2; x <= 6; x++) for (let y = 2; y <= 7; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 4, 7, 'door')
  // ChromaDB Cave (sandbox portal: collection): x=13..19, y=2..7; portal at (16,7)
  for (let x = 13; x <= 19; x++) for (let y = 2; y <= 7; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 16, 7, 'door')
  return g
}

export const CAVERNS: CityDef = {
  id: 'vale',
  grid: buildCavernsGrid(),
  playerSpawn: { x: 10, y: 2 },
  entities: [
    makeBuildingEntrance('enter-vale-library', 4, 7, 'vale-library'),
    makeSandboxPortal('sandbox-collection', 16, 7, 'collection'),
    makeNPC('npc-prism-oracle', 11, 4, {
      name: 'The Prism Oracle',
      lines: [
        "Deep in these caverns, text turns into light — vectors of pure meaning.",
        "Similar ideas glow near each other. A vector database finds neighbors in that space.",
        "ChromaDB is our store. One rule above all: embed queries with the *same* model you indexed with.",
      ],
    }),
    makeNPC('npc-vector-sprite', 18, 13, {
      name: 'Vector Sprite',
      lines: [
        '`PersistentClient(path=...)` keeps your collection on disk between runs.',
        '`get_or_create_collection` never crashes. `add` then `query`. That\'s the whole dance.',
      ],
    }),
    makeGate('gate-vale-north', 10, 1, 'overworld', false),
    makeGate('gate-vale-west', 1, 9, 'ridge', true),
  ],
  gateExit: { x: 10, y: 1, destination: 'overworld' },
}
```

- [ ] **Step 4: Add `enter-vale` to OVERWORLD entities and `vale` to CITY_MAP**

Update OVERWORLD.entities in `content/world-data.ts`:

```typescript
entities: [
  makeBuildingEntrance('enter-llamatown', 7, 13, 'llamatown'),
  makeBuildingEntrance('enter-forge', 33, 14, 'forge'),
  makeBuildingEntrance('enter-vale', 25, 22, 'vale'),
],
```

Update CITY_MAP:

```typescript
const CITY_MAP: Record<string, CityDef> = {
  overworld: OVERWORLD,
  llamatown: LLAMATOWN,
  forge: FORGE,
  vale: CAVERNS,
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- content/__tests__/world-data.test.ts --watchAll=false`

Expected: PASS (12 tests — 6 Forge + 6 Caverns)

- [ ] **Step 6: TypeScript check**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add content/world-data.ts content/__tests__/world-data.test.ts
git commit -m "feat: add Prism Caverns city with NPCs, library, collection sandbox (Phase 5 Task 2)"
```

---

## Task 3: The Convergence CityDef + overworld entrance

**Files:**
- Modify: `content/world-data.ts`
- Modify: `content/__tests__/world-data.test.ts`

**Interfaces:**
- Consumes: FORGE, CAVERNS (already in CITY_MAP)
- Produces: `CONVERGENCE: CityDef` exported as `id: 'ridge'`, `getCityDef('ridge')` returns it, `OVERWORLD.entities` includes `enter-ridge`

- [ ] **Step 1: Add failing tests for The Convergence**

Append to `content/__tests__/world-data.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- content/__tests__/world-data.test.ts --watchAll=false`

Expected: FAIL — "Unknown city: ridge"

- [ ] **Step 3: Add `buildConvergenceGrid` and `CONVERGENCE` to `content/world-data.ts`**

Insert after the CAVERNS definition, before CITY_MAP:

```typescript
function buildConvergenceGrid(): TileGrid {
  const g = makeGrid(20, 16, 'floor')
  // Perimeter walls
  for (let x = 0; x < 20; x++) {
    setTile(g, x, 0, 'building_wall')
    setTile(g, x, 15, 'building_wall')
  }
  for (let y = 0; y < 16; y++) {
    setTile(g, 0, y, 'building_wall')
    setTile(g, 19, y, 'building_wall')
  }
  // West exit tile (back to overworld — entered from west)
  setTile(g, 0, 8, 'door')
  // Main east-west path
  for (let x = 1; x < 19; x++) setTile(g, x, 8, 'path')
  // Ridge Library: x=1..3, y=1..6; door at (2,6)
  for (let x = 1; x <= 3; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 2, 6, 'door')
  // RAG Production Vault (sandbox portal: rag): x=12..18, y=1..6; portal at (15,6)
  for (let x = 12; x <= 18; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 15, 6, 'door')
  return g
}

export const CONVERGENCE: CityDef = {
  id: 'ridge',
  grid: buildConvergenceGrid(),
  playerSpawn: { x: 2, y: 8 },
  entities: [
    makeBuildingEntrance('enter-ridge-library', 2, 6, 'ridge-library'),
    makeSandboxPortal('sandbox-rag', 15, 6, 'rag'),
    makeNPC('npc-architect', 4, 4, {
      name: 'Architect of the Convergence',
      lines: [
        "You've reached the Convergence, Operator. Here Ollama and ChromaDB become one system.",
        "RAG: retrieve relevant chunks from Chroma, hand them to Ollama, generate a grounded answer.",
        "Index once. Query forever. All on your own machine.",
      ],
    }),
    makeNPC('npc-keeper', 15, 11, {
      name: 'Keeper of Citations',
      lines: [
        "Tell the model: answer ONLY from the context, and cite the chunk. That's how trust is built.",
        "Low temperature. Top-k retrieval. Re-rank when precision matters.",
      ],
    }),
    makeGate('gate-ridge-west', 1, 8, 'overworld', false),
  ],
  gateExit: { x: 1, y: 8, destination: 'overworld' },
}
```

- [ ] **Step 4: Add `enter-ridge` to OVERWORLD entities and `ridge` to CITY_MAP**

Update OVERWORLD.entities in `content/world-data.ts`:

```typescript
entities: [
  makeBuildingEntrance('enter-llamatown', 7, 13, 'llamatown'),
  makeBuildingEntrance('enter-forge', 33, 14, 'forge'),
  makeBuildingEntrance('enter-vale', 25, 22, 'vale'),
  makeBuildingEntrance('enter-ridge', 10, 22, 'ridge'),
],
```

Update CITY_MAP:

```typescript
const CITY_MAP: Record<string, CityDef> = {
  overworld: OVERWORLD,
  llamatown: LLAMATOWN,
  forge: FORGE,
  vale: CAVERNS,
  ridge: CONVERGENCE,
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- content/__tests__/world-data.test.ts --watchAll=false`

Expected: PASS (18 tests — 6 Forge + 6 Caverns + 6 Convergence)

- [ ] **Step 6: TypeScript check**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add content/world-data.ts content/__tests__/world-data.test.ts
git commit -m "feat: add The Convergence city with NPCs, library, RAG sandbox (Phase 5 Task 3)"
```

---

## Task 4: Gate unlock system

**Files:**
- Modify: `content/world-data.ts` — add ACT_CONCEPTS, isActMastered, isGateUnlocked exports
- Modify: `content/__tests__/world-data.test.ts` — add tests for gate unlock functions
- Modify: `store/game-store.ts` — update markLessonRead to also set masteredConcepts
- Modify: `app/city/[id].tsx` — add isGateUnlocked import; add act-mastery gate branch

**Interfaces:**
- Consumes: `progression.masteredConcepts`, `progression.defeatedBosses` from store
- Produces: `isGateUnlocked(act, masteredConcepts, defeatedBosses): boolean` — gate handler calls this

**Why the store change matters:** `masteredConcepts` is currently never written — `isGateUnlocked` would always return false and gates would never open. Adding a single line to `markLessonRead` makes reading a lesson count as mastering its concept, which is the intended gameplay model.

- [ ] **Step 1: Add failing tests for gate unlock functions**

Append to `content/__tests__/world-data.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- content/__tests__/world-data.test.ts --watchAll=false`

Expected: FAIL — "ACT_CONCEPTS is not exported from '../world-data'"

- [ ] **Step 3: Add ACT_CONCEPTS, isActMastered, isGateUnlocked to `content/world-data.ts`**

Append at the end of `content/world-data.ts` (after getCityDef):

```typescript
export const ACT_CONCEPTS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ['oll-intro', 'oll-install', 'oll-run', 'oll-manage', 'oll-models', 'oll-params'],
  2: ['oll-modelfile', 'oll-api', 'oll-openai', 'oll-structured', 'oll-tools', 'oll-multimodal', 'oll-embed', 'oll-ops'],
  3: ['chr-vectors', 'chr-intro', 'chr-collections', 'chr-add', 'chr-query', 'chr-filter', 'chr-ef', 'chr-persist'],
  4: ['rag-concept', 'rag-build', 'rag-prod'],
}

export function isActMastered(act: 1 | 2 | 3 | 4, masteredConcepts: Record<string, boolean>): boolean {
  return (ACT_CONCEPTS[act] ?? []).every(id => masteredConcepts[id] === true)
}

export function isGateUnlocked(
  fromAct: 1 | 2 | 3 | 4,
  masteredConcepts: Record<string, boolean>,
  defeatedBosses: Record<string, boolean>,
): boolean {
  const bossIds: Record<1 | 2 | 3 | 4, string> = {
    1: 'frozen-boot',
    2: 'rate-limiter',
    3: 'dimensionless-beast',
    4: 'hallucinator',
  }
  return isActMastered(fromAct, masteredConcepts) && (defeatedBosses[bossIds[fromAct] ?? ''] === true)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- content/__tests__/world-data.test.ts --watchAll=false`

Expected: PASS (28 tests total — 18 city tests + 10 gate unlock tests)

- [ ] **Step 5: Update `markLessonRead` in `store/game-store.ts` to also set masteredConcepts**

Replace the `markLessonRead` action (lines 109–119 in the current file):

```typescript
markLessonRead: (lessonId) => {
  const { progression } = get()
  if (progression.readLessons[lessonId]) return
  set((state) => ({
    progression: {
      ...state.progression,
      readLessons: { ...state.progression.readLessons, [lessonId]: true },
      masteredConcepts: { ...state.progression.masteredConcepts, [lessonId]: true },
    },
  }))
  get().awardXP(20)
},
```

- [ ] **Step 6: Run all tests to verify the store change doesn't break anything**

Run: `npm test -- --watchAll=false`

Expected: all tests pass (the store tests check markLessonRead behavior; the extra field write is additive and idempotent)

- [ ] **Step 7: Update gate handling in `app/city/[id].tsx`**

Add import at the top of the file:

```typescript
import { getCityDef, isGateUnlocked } from '../../content/world-data'
```

Replace the current `else if (nearbyEntity.type === 'gate')` block (starting at the `} else if (nearbyEntity.type === 'gate') {` line) with:

```typescript
} else if (nearbyEntity.type === 'gate') {
  const dest = nearbyEntity.data['destination'] as string
  const bossId = nearbyEntity.data['bossId'] as string | undefined
  const locked = nearbyEntity.data['locked'] as boolean | undefined

  if (locked && bossId) {
    // Boss battle gate (e.g., Llamatown → Forge via Frozen Boot)
    if (progression.defeatedBosses[bossId]) {
      if (dest === 'overworld') router.push('/overworld')
      else router.push(`/city/${dest}`)
    } else {
      encounterCooldown.current = 90
      router.push(`/battle?enemyId=${bossId}`)
    }
  } else if (locked) {
    // Act mastery + boss defeat gate (e.g., Forge → Vale, Vale → Ridge)
    const cityAct = CITY_ACT[id ?? ''] ?? 1
    if (isGateUnlocked(cityAct as 1 | 2 | 3 | 4, progression.masteredConcepts, progression.defeatedBosses)) {
      if (dest === 'overworld') router.push('/overworld')
      else router.push(`/city/${dest}`)
    } else {
      setDialogue({ lines: [`Gate locked — read all Act ${cityAct} lessons and defeat the boss to proceed.`] })
    }
  } else {
    // Unlocked gate — route directly
    if (dest === 'overworld') router.push('/overworld')
    else router.push(`/city/${dest}`)
  }
}
```

Also update the `interactLabel` computation to show "Gate locked" when applicable. Replace the current `interactLabel` const:

```typescript
const interactLabel = nearbyEntity
  ? nearbyEntity.type === 'npc'
    ? `[E] Talk to ${nearbyEntity.data['name']}`
    : nearbyEntity.type === 'sandbox_portal'
    ? '[E] Open Terminal'
    : nearbyEntity.type === 'gate' && nearbyEntity.data['locked'] && !nearbyEntity.data['bossId']
    ? '[E] Gate (locked?)'
    : '[E] Enter'
  : null
```

- [ ] **Step 8: TypeScript check**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 9: Run the full test suite**

Run: `npm test -- --watchAll=false`

Expected: all tests pass

- [ ] **Step 10: Commit**

```bash
git add content/world-data.ts content/__tests__/world-data.test.ts store/game-store.ts app/city/[id].tsx
git commit -m "feat: gate unlock system — ACT_CONCEPTS, isGateUnlocked, masteredConcepts write (Phase 5 Task 4)"
```

---

## Task 5: End-of-phase Playwright verification

**Files:** none modified — verification only

**What to verify (Phase 5 checklist):**
- Forge, Vale, Ridge cities reachable via overworld
- NPCs have dialogue in all 3 cities
- Library buildings show correct act's lessons
- Sandbox portals open Terminal
- Gate locked message shows when conditions not met
- No browser console errors

- [ ] **Step 1: Start the dev server**

In a terminal: `npx expo start --web`

Wait for "Web Bundled" in console output.

- [ ] **Step 2: Navigate through title screen (required — never navigate directly to game routes)**

Using Playwright MCP:

1. Navigate to `http://localhost:8081`
2. Wait for title screen to render (up to 5 seconds)
3. Fill in player name (e.g., "TestPlayer")
4. Select a class (e.g., "Tinkerer")
5. Confirm navigation to overworld

- [ ] **Step 3: Walk to Model Forge and enter**

1. Simulate WASD input to move player east toward x=33, y=14 (enter-forge entrance)
2. Press E to enter
3. Verify city screen renders (Forge grid visible)
4. Walk to npc-smith at (4,4) → press E → verify dialogue appears ("This is the Forge...")
5. Walk to library entrance at (2,6) → press E → verify building screen opens showing Act II lessons

- [ ] **Step 4: Navigate to Prism Caverns and enter**

1. Navigate back to overworld
2. Walk to enter-vale at (25,22)
3. Press E to enter
4. Walk to npc-prism-oracle at (11,4) → press E → verify dialogue appears ("Deep in these caverns...")
5. Walk to library entrance at (4,7) → press E → verify building screen opens showing Act III lessons

- [ ] **Step 5: Navigate to The Convergence and enter**

1. Navigate back to overworld
2. Walk to enter-ridge at (10,22)
3. Press E to enter
4. Walk to npc-architect at (4,4) → press E → verify dialogue appears ("You've reached the Convergence...")
5. Walk to library entrance at (2,6) → press E → verify building screen opens showing Act IV lessons

- [ ] **Step 6: Verify locked gate shows message**

1. In Forge, walk to gate-forge-east at (18,9)
2. Press E → verify dialogue shows "Gate locked — read all Act 2 lessons and defeat the boss to proceed."

- [ ] **Step 7: Check browser console for errors**

Capture console output. Expected: zero uncaught errors. AudioContext warnings are acceptable (known non-issue).

- [ ] **Step 8: If any regression found, fix it before marking done**

A regression means any failure in the golden path: title screen, overworld movement, Llamatown, or battle. Fix before proceeding.

- [ ] **Step 9: Update progress ledger and CLAUDE.md**

In `.superpowers/sdd/progress.md`, add Phase 5 section:

```markdown
## Phase 5 — Remaining Cities ✅ Complete

Plan: docs/superpowers/plans/2026-06-19-llama-quest-phase5-cities.md

| Task | Status | Commits | Notes |
|------|--------|---------|-------|
| 1: Model Forge CityDef | complete | <commit> | |
| 2: Prism Caverns CityDef | complete | <commit> | |
| 3: The Convergence CityDef | complete | <commit> | |
| 4: Gate unlock system | complete | <commit> | |
| Playwright end-of-phase | complete | — | |
```

In `CLAUDE.md`, update the Phase Status table for Phase 5 from `🔜 Not started` to `✅ Complete`.

- [ ] **Step 10: Commit documentation updates**

```bash
git add .superpowers/sdd/progress.md CLAUDE.md
git commit -m "docs: Phase 5 complete in progress ledger and CLAUDE.md"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Model Forge (20×18): library, api workshop, modelfile foundry, npc-smith, npc-api-artificer, south gate, east locked gate
- ✅ Prism Caverns (22×18): library, chromadb-cave sandbox, npc-prism-oracle, npc-vector-sprite, north gate, west locked gate
- ✅ The Convergence (20×16): library, rag vault sandbox, npc-architect, npc-keeper, west gate
- ✅ Overworld entrances: enter-forge, enter-vale, enter-ridge
- ✅ CITY_MAP: forge, vale, ridge added
- ✅ ACT_CONCEPTS, isActMastered, isGateUnlocked
- ✅ masteredConcepts populated via markLessonRead
- ✅ City screen gate handler updated for act-mastery gates
- ✅ Playwright verification
- ✅ BUILDING_ACT already has forge-library:2, vale-library:3, ridge-library:4 (no change needed — already present from Phase 1)
- ✅ CITY_ACT and CITY_TRACK in city/[id].tsx already have forge/vale/ridge wired (Phase 2/4 additions)

**Potential gap:** The `makeSandboxPortal` import is already in `content/world-data.ts` from Phase 3 (Llamatown sandbox portal). Verify the import line before implementing — if it's missing, add it.
