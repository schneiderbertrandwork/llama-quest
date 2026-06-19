# Llama Quest — Phases 2–6 Master Roadmap

> **Purpose:** This document is a self-contained reference for implementing Phases 2–6. Each phase section is detailed enough to feed directly into `superpowers:writing-plans` without a new brainstorm session. Read the relevant phase section, run `writing-plans`, then execute with `superpowers:subagent-driven-development`.

> **Phase 1 status:** Complete (14 tasks, 36 tests passing). See `.superpowers/sdd/progress.md` for commit history.

---

## Global Constraints (All Phases)

These apply to every task in every phase — copy verbatim into each plan's Global Constraints section.

- **Expo SDK 52** managed workflow; no ejecting
- **TypeScript strict** with `noUncheckedIndexedAccess: true`; all array/object index access uses `??` fallback
- **`--legacy-peer-deps`** required for all `npm install` calls (peer dep conflicts with Expo ecosystem)
- **No arbitrary colors** — pull from the established palette (see HUD.tsx and TilemapRenderer.tsx for the palette constants)
- **Entity IDs** kebab-case strings (e.g., `'npc-smith'`); lesson IDs `<tech>-<concept>` (e.g., `'oll-run'`)
- **Save key** `'llama_quest_v1'` — never change; changing it wipes all player saves
- **TDD**: write failing test first → implement minimal code → confirm green → commit
- **`Record<string, boolean>`** for all progression tracking (not `Set<string>`)
- **Constants**: `TILE_SIZE = 32`, `PLAYER_SPEED = 4` tiles/sec, `MAX_DT = 0.05` (50ms cap)
- **XP_PER_LEVEL = 120**; XP rewards: lesson read +20, NPC met +8, correct quiz answer +5, concept mastered +40, boss defeated +100, sandbox completed +15

---

## Execution Order

```
Phase 2 (Battle System)
  ↓  [QBANK content feeds Phase 3]
Phase 3 (Content Migration)
  ↓  [Acts II–IV lessons feed Phase 5 city libraries]
Phase 4 (Audio)        ←→   Phase 5 (Remaining Cities)   [independent, can swap order]
  ↓                              ↓
Phase 6 (Mobile Polish — last; polishes everything built above)
```

---

## Foundation: What Phase 1 Built

Understanding what already exists prevents reimplementation.

### Engine (pure TypeScript, zero React deps)

**`engine/tilemap.ts`**
```typescript
type TileType = 'grass' | 'forest' | 'path' | 'water' | 'building_wall' | 'floor' | 'door'
interface Tile { type: TileType; walkable: boolean }
interface TileGrid { width: number; height: number; tiles: Tile[] }
function makeTile(type: TileType): Tile
function makeGrid(width: number, height: number, fill: TileType): TileGrid
function tileAt(grid: TileGrid, x: number, y: number): Tile | null
function isWalkable(grid: TileGrid, x: number, y: number): boolean
function setTile(grid: TileGrid, x: number, y: number, type: TileType): void
```
Walkable: grass, path, floor, door. Non-walkable: forest, water, building_wall.

**`engine/entity.ts`**
```typescript
type Facing = 'up' | 'down' | 'left' | 'right'
type EntityType = 'player' | 'npc' | 'sign' | 'building_entrance' | 'gate'
interface Entity { id: string; type: EntityType; x: number; y: number; facing: Facing; interactable: boolean; data: Record<string, unknown> }
function makePlayer(x: number, y: number): Entity
function makeNPC(id: string, x: number, y: number, data?: Record<string, unknown>): Entity
function makeBuildingEntrance(id: string, x: number, y: number, destination: string): Entity
function makeGate(id: string, x: number, y: number, destination: string, locked: boolean): Entity
function nearestInteractable(entities: Entity[], playerX: number, playerY: number, maxDist?: number): Entity | null
// maxDist defaults to 1.5 tiles
```

**`engine/movement.ts`**
```typescript
interface InputState { dx: number; dy: number }
function movePlayer(player: Entity, input: InputState, grid: TileGrid, dt: number): Entity
// Axis-separated collision: checks X then Y independently; slides to wall face
```

**`engine/camera.ts`**
```typescript
interface Camera { x: number; y: number }
function followEntity(entity: { x: number; y: number }, tileSize: number, screenW: number, screenH: number): Camera
function clampCamera(camera: Camera, tileSize: number, gridW: number, gridH: number, screenW: number, screenH: number): Camera
```

### Store (`store/game-store.ts`)
```typescript
type PlayerClass = 'Tinkerer' | 'Scholar' | 'Architect'
type CityId = 'overworld' | 'llamatown' | 'forge' | 'vale' | 'ridge'

interface PlayerData { name: string; class: PlayerClass; hp: number; maxHp: number; level: number; xp: number }
// Defaults: hp=60, maxHp=60, level=1, xp=0

interface ProgressionData {
  currentCity: CityId
  position: { x: number; y: number }
  masteredConcepts: Record<string, boolean>   // key: lesson id
  readLessons: Record<string, boolean>
  metNPCs: Record<string, boolean>
  completedSandboxes: Record<string, boolean>
  defeatedBosses: Record<string, boolean>
}

interface SettingsData { musicEnabled: boolean; sfxEnabled: boolean; masterVolume: number }
// Defaults: musicEnabled=true, sfxEnabled=true, masterVolume=0.8

// Actions:
initPlayer(name: string, cls: PlayerClass): void      // resets all state to defaults
awardXP(amount: number): void                          // loops for multi-level gains
markLessonRead(lessonId: string): void                 // +20 XP, idempotent
markNPCMet(npcId: string): void                        // +8 XP, idempotent
setPosition(city: CityId, x: number, y: number): void
updateSettings(partial: Partial<SettingsData>): void
```
Persisted via Zustand + AsyncStorage; save key `'llama_quest_v1'`.

### Content
- **`content/lessons.ts`**: 6 Act I lessons (oll-intro through oll-params); `getLessonsForAct(act)`, `getLessonById(id)`
- **`content/diagrams.ts`**: 5 diagrams (arch, modelfile, reqflow, toolloop, embed); `DIAGRAMS: Record<string, DiagramDef>`
- **`content/world-data.ts`**: OVERWORLD (40×30) + LLAMATOWN (20×15); `getCityDef(id)`, `CityDef` type

### Screens
- `app/index.tsx` — Title screen (name + class select → `/overworld`)
- `app/overworld.tsx` — WASD movement, camera follow, HUD, dialogue, routing to `/city/[id]`
- `app/city/[id].tsx` — Generic city (movement, NPC dialogue, building/gate routing)
- `app/building/[id].tsx` — Library (lesson list → Codex reader)

### Components
- `components/HUD.tsx` — Level, HP bar (color-coded), XP bar
- `components/DialogueBox.tsx` — Typewriter, multi-line, tap to advance
- `components/Codex.tsx` — Renders all 9 block types (h2, p, ul, code, tip, warn, note, prism, diagram)

### Hooks
- `hooks/useGameLoop.ts` — `useFrameCallback` wrapper, dt capped at 50ms
- `hooks/usePlayerInput.ts` — Keyboard (web only), returns `React.RefObject<InputState>`

### Renderers (Skia)
- `renderer/TilemapRenderer.tsx` — Colored rects per tile type, viewport culling
- `renderer/EntityRenderer.tsx` — Colored rects 0.8× tile size, 10% inset
- `renderer/WorldRenderer.tsx` — Composes tilemap + entity renderers with camera

---

## Phase 2 — Battle System

**Goal:** Turn-based Earthbound-style combat. Random encounters while walking. PSI moves are quiz questions — correct answers deal big damage. Earthbound rolling HP counter (HP drains visually at 30 pts/sec; acting before it hits zero saves you). Boss enemies guard act gates.

### Files

**Create:**
- `content/qbank.ts` — 100 questions across 25 lessons (migrate from localhost-quest.html)
- `content/enemies.ts` — Enemy and boss definitions (4 regulars + 1 boss per act = 20 total)
- `engine/battle.ts` — Pure-TS battle state machine
- `hooks/useBattle.ts` — React bridge (engine state → useState)
- `components/RollingHP.tsx` — Animated HP drain counter
- `components/BattleMenu.tsx` — Action picker (PSI / Guard / Run)
- `components/PSIAttack.tsx` — Quiz question overlay with 4 answer choices
- `app/battle.tsx` — Battle screen (Skia background + participant rects)
- `engine/__tests__/battle.test.ts` — 8+ unit tests for state machine
- `content/__tests__/qbank.test.ts` — 5 structural tests (question counts, answer format)

**Modify:**
- `app/overworld.tsx` — Add encounter check per tile step
- `app/city/[id].tsx` — Add encounter check per tile step + boss gate wiring
- `store/game-store.ts` — Add `awardBossKill(bossId: string)` action (+100 XP, sets `defeatedBosses[bossId] = true`)

### TypeScript Interfaces

```typescript
// content/qbank.ts
export interface QuizQuestion {
  q: string
  a: [string, string, string, string]   // exactly 4 answers
  c: 0 | 1 | 2 | 3                     // index of correct answer
  why: string                           // explanation shown after answer
  lessonId: string
}
export type QBank = Record<string, QuizQuestion[]>  // keyed by lesson id
export const QBANK: QBank
export function getQuestionsForAct(act: 1 | 2 | 3 | 4): QuizQuestion[]
export function getQuestionsForLesson(lessonId: string): QuizQuestion[]

// content/enemies.ts
export interface EnemyDef {
  id: string
  name: string
  maxHp: number
  attack: number        // base damage per turn
  defense: number       // flat damage reduction
  xpReward: number
  act: 1 | 2 | 3 | 4
  isBoss: boolean
  dialogue: {
    onAppear: string    // shown when battle starts
    onHit: string       // shown when player deals damage
    onDefeat: string    // shown when HP reaches 0
  }
}
export const ENEMIES: EnemyDef[]
export const BOSSES: EnemyDef[]   // isBoss === true subset
export function getEnemiesForAct(act: 1 | 2 | 3 | 4): EnemyDef[]
export function getBossForAct(act: 1 | 2 | 3 | 4): EnemyDef

// engine/battle.ts
export type BattlePhase =
  | 'intro'         // enemy appears, onAppear dialogue shown
  | 'player-turn'   // player picks action
  | 'psi-question'  // PSI chosen → quiz question shown
  | 'enemy-turn'    // enemy attacks
  | 'victory'       // enemy HP ≤ 0
  | 'defeat'        // player HP ≤ 0

export interface BattleState {
  phase: BattlePhase
  playerHp: number        // actual HP (source of truth)
  playerMaxHp: number
  displayHp: number       // visual HP shown in RollingHP (drains toward playerHp)
  enemyHp: number
  enemyMaxHp: number
  enemy: EnemyDef
  log: string[]           // last 3 battle messages
  pendingQuestion: QuizQuestion | null
  guardActive: boolean    // true when player chose Guard last turn
  seenQuestions: Set<string>   // q text keys, reset per battle
  turnCount: number
}

export function initBattle(enemy: EnemyDef, playerHp: number, playerMaxHp: number): BattleState
export function choosePSI(state: BattleState, availableQuestions: QuizQuestion[]): BattleState
  // transitions phase to 'psi-question', sets pendingQuestion
export function answerPSI(state: BattleState, answerIdx: 0 | 1 | 2 | 3): BattleState
  // correct → deals 25–35 damage; wrong → 8–12 damage; transitions to 'enemy-turn'
export function chooseGuard(state: BattleState): BattleState
  // sets guardActive=true, transitions to 'enemy-turn'
export function chooseRun(state: BattleState): { newState: BattleState; escaped: boolean }
  // 60% escape chance; escaped=false → enemy gets free turn (no guard)
export function enemyTurn(state: BattleState): BattleState
  // deals attack-defense damage (min 1), halved if guardActive; resets guardActive; checks defeat
export function tickDisplayHp(state: BattleState, dt: number): BattleState
  // drains displayHp toward playerHp at 30 pts/sec; pure, no side effects
```

### Battle Mechanics (Complete Rules)

**Encounter trigger:**
```typescript
// In overworld/city game loop, after movePlayer:
const ENCOUNTER_CHANCE = 0.06  // 6% per tile step
const stepped = Math.floor(moved.x) !== Math.floor(prev.x) || Math.floor(moved.y) !== Math.floor(prev.y)
if (stepped && encounterCooldown.current <= 0 && !dialogue && Math.random() < ENCOUNTER_CHANCE) {
  const act = getCurrentAct()  // based on current city
  const enemy = pickRandomEnemy(getEnemiesForAct(act))
  router.push(`/battle?enemyId=${enemy.id}`)
  encounterCooldown.current = 90  // 90 frames (~1.5 sec) suppression after battle
}
encounterCooldown.current = Math.max(0, encounterCooldown.current - 1)
```

**PSI damage:** `Math.floor(Math.random() * 11) + 25` (25–35) on correct; `Math.floor(Math.random() * 5) + 8` (8–12) on wrong.

**Enemy attack damage:** `Math.max(1, enemy.attack - state.player.defense)`, halved (round down) if guardActive.

**Rolling HP drain rate:** 30 HP per second. `displayHp` drains toward `playerHp` each frame; if player acts while displayHp > 0 but playerHp ≤ 0, the player has "survived on the gauge" — defeat only triggers when displayHp reaches 0.

**Victory:** enemy.xpReward XP awarded via `awardXP()`; boss victory also calls `awardBossKill(boss.id)`.

**Defeat:** Player HP set to 1, position reset to city spawn, route back.

**Act determination for encounters:**
```typescript
const CITY_ACT: Record<string, 1 | 2 | 3 | 4> = {
  overworld: 1, llamatown: 1, forge: 2, vale: 3, ridge: 4
}
```

### Enemy Roster

**Act I (Llamatown region):**
| ID | Name | HP | ATK | DEF | XP | Boss |
|----|------|----|-----|-----|----|------|
| `spinning-cursor` | Spinning Cursor | 40 | 8 | 0 | 15 | No |
| `cloud-invoice` | Cloud Invoice | 50 | 10 | 2 | 18 | No |
| `driver-missing` | Driver Missing | 35 | 12 | 0 | 14 | No |
| `stack-overflow` | Stack Overflow | 55 | 9 | 1 | 20 | No |
| `frozen-boot` | The Frozen Boot | 120 | 14 | 3 | 100 | Yes |

**Act II (Forge region):**
| ID | Name | HP | ATK | DEF | XP | Boss |
|----|------|----|-----|-----|----|------|
| `config-error` | Config Error | 60 | 13 | 2 | 22 | No |
| `api-timeout` | API Timeout | 65 | 11 | 3 | 20 | No |
| `dependency-hell` | Dependency Hell | 70 | 15 | 1 | 25 | No |
| `json-syntax` | JSON Syntax Error | 55 | 12 | 2 | 18 | No |
| `rate-limiter` | The Rate Limiter | 150 | 18 | 5 | 100 | Yes |

**Act III (Prism Caverns region):**
| ID | Name | HP | ATK | DEF | XP | Boss |
|----|------|----|-----|-----|----|------|
| `dim-mismatch` | Dim Mismatch | 75 | 16 | 2 | 28 | No |
| `oom-vector` | OOM Vector | 80 | 14 | 4 | 26 | No |
| `null-embedding` | Null Embedding | 65 | 18 | 1 | 25 | No |
| `metric-clash` | Metric Clash | 70 | 15 | 3 | 24 | No |
| `dimensionless-beast` | Dimensionless Beast | 180 | 22 | 6 | 100 | Yes |

**Act IV (Convergence region):**
| ID | Name | HP | ATK | DEF | XP | Boss |
|----|------|----|-----|-----|----|------|
| `hallucinated-fact` | Hallucinated Fact | 90 | 20 | 3 | 32 | No |
| `context-overflow` | Context Overflow | 85 | 18 | 5 | 30 | No |
| `citation-gap` | Citation Gap | 80 | 22 | 2 | 30 | No |
| `rerank-roulette` | Re-rank Roulette | 95 | 17 | 4 | 28 | No |
| `hallucinator` | The Hallucinator | 220 | 28 | 8 | 100 | Yes |

**Enemy dialogue examples (follow this style for all):**
```typescript
// The Frozen Boot
onAppear: "BRRR... BRRR... BRRR... It just keeps spinning. The boot never completes.",
onHit: "KERNEL PANIC—no wait, still spinning.",
onDefeat: "...connection established. At last."

// The Rate Limiter
onAppear: "429 Too Many Requests. You shall not pass this frequently.",
onHit: "Your quota is being consumed.",
onDefeat: "Rate limit lifted. Proceed, Operator."
```

### Task Breakdown (Phase 2)

**Task 1: Migrate QBANK → `content/qbank.ts`**

Source: `localhost-quest.html`, search for `const QBANK = {` (around line 1050). Transcribe all 25 lesson question sets to TypeScript. Each lesson has 4 questions.

Files: Create `content/qbank.ts`, `content/__tests__/qbank.test.ts`

Tests (write these first, they fail until file is created):
```typescript
// content/__tests__/qbank.test.ts
import { QBANK, getQuestionsForAct, getQuestionsForLesson } from '../qbank'
it('has exactly 25 lesson keys', () => expect(Object.keys(QBANK)).toHaveLength(25))
it('each lesson has exactly 4 questions', () => {
  for (const [id, qs] of Object.entries(QBANK)) {
    expect(qs).toHaveLength(4), { message: `${id} should have 4 questions` }
  }
})
it('all correct indices are 0–3', () => {
  for (const qs of Object.values(QBANK).flat()) {
    expect([0,1,2,3]).toContain(qs.c)
  }
})
it('getQuestionsForAct(1) returns 24 questions (6 lessons × 4)', () =>
  expect(getQuestionsForAct(1)).toHaveLength(24))
it('getQuestionsForLesson("oll-intro") returns 4 questions', () =>
  expect(getQuestionsForLesson('oll-intro')).toHaveLength(4))
```

**Task 2: Enemy definitions → `content/enemies.ts`**

Create all 20 enemies (16 regulars + 4 bosses) using the roster table above. No tests needed (pure data — type-check via `tsc --noEmit`).

Files: Create `content/enemies.ts`

**Task 3: Battle engine → `engine/battle.ts`**

Pure TypeScript state machine. No React, no async. All functions are pure (take state, return new state).

Files: Create `engine/battle.ts`, `engine/__tests__/battle.test.ts`

Tests:
```typescript
import { initBattle, choosePSI, answerPSI, chooseGuard, enemyTurn, tickDisplayHp } from '../battle'
import { ENEMIES } from '../../content/enemies'
const enemy = ENEMIES.find(e => e.id === 'spinning-cursor')!
const q: QuizQuestion = { q: 'Q?', a: ['A','B','C','D'], c: 1, why: 'B is right', lessonId: 'oll-intro' }

it('initBattle sets phase to intro', () => {
  const s = initBattle(enemy, 60, 60)
  expect(s.phase).toBe('intro')
  expect(s.playerHp).toBe(60)
  expect(s.enemyHp).toBe(enemy.maxHp)
  expect(s.displayHp).toBe(60)
})
it('choosePSI sets pendingQuestion and psi-question phase', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = choosePSI({ ...s, phase: 'player-turn' }, [q])
  expect(s2.phase).toBe('psi-question')
  expect(s2.pendingQuestion).toBe(q)
})
it('answerPSI correct reduces enemyHp by 25–35', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = answerPSI({ ...s, phase: 'psi-question', pendingQuestion: q }, 1)
  expect(s2.enemyHp).toBeLessThanOrEqual(enemy.maxHp - 25)
  expect(s2.enemyHp).toBeGreaterThanOrEqual(enemy.maxHp - 35)
  expect(s2.phase).toBe('enemy-turn')
})
it('answerPSI wrong reduces enemyHp by 8–12', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = answerPSI({ ...s, phase: 'psi-question', pendingQuestion: q }, 0)
  expect(s2.enemyHp).toBeLessThanOrEqual(enemy.maxHp - 8)
  expect(s2.enemyHp).toBeGreaterThanOrEqual(enemy.maxHp - 12)
})
it('enemyTurn reduces playerHp', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: false })
  expect(s2.playerHp).toBeLessThan(60)
})
it('guard halves enemy damage', () => {
  const s = initBattle(enemy, 60, 60)
  const unguarded = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: false })
  const guarded = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: true })
  expect(guarded.playerHp).toBeGreaterThan(unguarded.playerHp)
})
it('enemyHp ≤ 0 sets phase to victory', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = answerPSI({ ...s, phase: 'psi-question', pendingQuestion: q, enemyHp: 5 }, 1)
  expect(s2.phase).toBe('victory')
})
it('tickDisplayHp drains toward playerHp at 30/sec', () => {
  const s = initBattle(enemy, 30, 60)  // playerHp=30, displayHp=60
  const s2 = tickDisplayHp({ ...s, displayHp: 60 }, 1/60)  // one frame
  expect(s2.displayHp).toBeCloseTo(60 - 30/60, 0)
})
```

**Task 4: RollingHP component**

Files: Create `components/RollingHP.tsx`

```tsx
// RollingHP displays the displayHp value, NOT playerHp
// Color: green when displayHp > 50% of max, orange > 25%, red ≤ 25%
// No animation library needed — value is driven externally by tickDisplayHp in game loop
interface RollingHPProps {
  displayHp: number     // visual HP (draining)
  playerHp: number      // actual HP (for color threshold)
  maxHp: number
}
```

Test with `@testing-library/react-native`: renders correct HP value, applies red color when displayHp ≤ 25% of maxHp.

**Task 5: BattleMenu + PSIAttack components**

Files: Create `components/BattleMenu.tsx`, `components/PSIAttack.tsx`

```tsx
// BattleMenu
interface BattleMenuProps {
  onPSI: () => void
  onGuard: () => void
  onRun: () => void
  disabled: boolean   // true when phase !== 'player-turn'
}

// PSIAttack
interface PSIAttackProps {
  question: QuizQuestion
  onAnswer: (idx: 0 | 1 | 2 | 3) => void
  result: 'none' | 'correct' | 'wrong'   // 'none' while unanswered
}
```

No unit tests needed — TypeScript check via `tsc --noEmit`.

**Task 6: useBattle hook**

Files: Create `hooks/useBattle.ts`

```typescript
interface UseBattleReturn {
  state: BattleState
  choosePSI: () => void
  answer: (idx: 0 | 1 | 2 | 3) => void
  chooseGuard: () => void
  chooseRun: () => { escaped: boolean }
}

export function useBattle(enemy: EnemyDef, playerHp: number, playerMaxHp: number): UseBattleReturn
```

The hook:
1. Calls `initBattle` on mount
2. Uses `useGameLoop` to call `tickDisplayHp` every frame (drains display HP)
3. Exposes action functions that call engine functions and `setState`
4. Calls `awardXP(enemy.xpReward)` and `awardBossKill(enemy.id)` on victory (via `useGameStore`)

**Task 7: Battle screen `app/battle.tsx`**

Navigate here as: `router.push('/battle?enemyId=spinning-cursor')`

```typescript
// Read enemyId from search params:
const { enemyId } = useLocalSearchParams<{ enemyId: string }>()
```

Layout (Skia Canvas overlay):
- Dark background (#0d0d1a)
- Enemy area (top half): colored rect placeholder + name + HP bar
- Player area (bottom left): player rect + Rolling HP
- Battle menu (bottom right): BattleMenu or PSIAttack

On victory → show log message → wait 2s → `router.back()`
On defeat → show log message → `setPosition(currentCity, spawn)` → wait 2s → `router.back()`

No unit tests; TypeScript check via `tsc --noEmit`.

**Task 8: Encounter integration**

Modify `app/overworld.tsx` and `app/city/[id].tsx`:

```typescript
// Add to component:
const encounterCooldown = useRef(90)  // frames; start high to avoid immediate encounter

// In game loop, after movePlayer:
const prev = playerRef.current
// ... move player ...
const stepped = Math.floor(moved.x) !== Math.floor(prev.x) || Math.floor(moved.y) !== Math.floor(prev.y)
if (stepped) {
  encounterCooldown.current = Math.max(0, encounterCooldown.current - 1)
  if (encounterCooldown.current === 0 && !dialogue && Math.random() < 0.06) {
    const enemies = getEnemiesForAct(CITY_ACT[currentCityId] ?? 1)
    const enemy = enemies[Math.floor(Math.random() * enemies.length)]
    if (enemy) {
      encounterCooldown.current = 90
      router.push(`/battle?enemyId=${enemy.id}`)
    }
  }
}
```

Also: add boss gate entity. When player interacts with a locked gate near a boss, route to `/battle?enemyId=${boss.id}&isBoss=true`. On victory with `isBoss=true`, the gate becomes passable (check `progression.defeatedBosses[boss.id]` to render gate as open).

---

## Phase 3 — Content Migration

**Goal:** Add all 19 remaining lessons (Acts II–IV), the 5 remaining diagrams, sandbox definitions, a simulated terminal component, and the sandbox screen. After Phase 3, all curriculum content is playable.

**Prerequisite:** Phase 2 Task 1 (QBANK migration) must be done first — `content/qbank.ts` is shared.

### Files

**Create:**
- `content/sandboxes.ts` — 5 sandbox project definitions
- `components/Terminal.tsx` — Simulated bash/Python REPL with objectives panel
- `app/sandbox/[id].tsx` — Sandbox screen
- `content/__tests__/sandboxes.test.ts` — Structural tests

**Modify:**
- `content/lessons.ts` — Append 19 lessons (Acts II–IV)
- `content/diagrams.ts` — Add 5 remaining diagrams
- `engine/entity.ts` — Add `'sandbox_portal'` to EntityType union
- `content/world-data.ts` — Add sandbox portal entities to city definitions
- `app/city/[id].tsx` — Handle `sandbox_portal` type in `handleInteract`

### TypeScript Interfaces

```typescript
// content/sandboxes.ts
export interface SandboxObjective {
  id: string
  label: string
  hint: string
}

export interface SandboxDef {
  id: 'firstchat' | 'modelfile' | 'api' | 'collection' | 'rag'
  title: string
  intro: string
  act: 1 | 2 | 3 | 4
  concept: string         // lesson id this sandbox relates to
  mode: 'sh' | 'py'      // starting mode
  objectives: SandboxObjective[]
}

export const SANDBOXES: Record<string, SandboxDef>
export function getSandboxDef(id: string): SandboxDef  // throws on unknown id

// components/Terminal.tsx
export interface TerminalProps {
  sandbox: SandboxDef
  completedObjectives: Record<string, boolean>
  onObjectiveDone: (id: string) => void
  onAllDone: () => void
}
```

### Sandbox Definitions

**`firstchat`** (Act I, oll-run, sh mode)
```typescript
objectives: [
  { id: 'pull', label: 'Download llama3.2', hint: 'Run: ollama pull llama3.2' },
  { id: 'list', label: 'List installed models', hint: 'Run: ollama list' },
  { id: 'run', label: 'Start a chat', hint: 'Run: ollama run llama3.2 (then type anything)' },
  { id: 'ps', label: 'Check loaded model', hint: 'Run: ollama ps' },
]
```

**`modelfile`** (Act II, oll-modelfile, sh mode)
```typescript
objectives: [
  { id: 'create-file', label: 'Create a Modelfile', hint: 'Run: printf "FROM llama3.2\\nSYSTEM \\"You are a SQL expert.\\"" > Modelfile' },
  { id: 'build', label: 'Build the custom model', hint: 'Run: ollama create sqlbot -f Modelfile' },
  { id: 'run-custom', label: 'Run your custom model', hint: 'Run: ollama run sqlbot' },
]
```

**`api`** (Act II, oll-api, sh mode)
```typescript
objectives: [
  { id: 'tags', label: 'Health check the API', hint: 'Run: curl localhost:11434/api/tags' },
  { id: 'chat', label: 'Send a chat request', hint: 'Run: curl localhost:11434/api/chat -d \'{"model":"llama3.2","messages":[{"role":"user","content":"hello"}]}\'' },
  { id: 'embed', label: 'Create an embedding', hint: 'Run: curl localhost:11434/api/embed -d \'{"model":"llama3.2","input":"hello"}\'' },
]
```

**`collection`** (Act III, chr-add, py mode)
```typescript
objectives: [
  { id: 'install', label: 'Install chromadb', hint: 'Run: pip install chromadb' },
  { id: 'python', label: 'Enter Python REPL', hint: 'Run: python' },
  { id: 'client', label: 'Create a PersistentClient', hint: 'Type: import chromadb; client = chromadb.PersistentClient(path="./chroma")' },
  { id: 'collection', label: 'Get or create a collection', hint: 'Type: col = client.get_or_create_collection("docs")' },
  { id: 'add', label: 'Add documents', hint: 'Type: col.add(documents=["Ollama runs models locally"],ids=["doc1"])' },
  { id: 'query', label: 'Query the collection', hint: 'Type: col.query(query_texts=["local AI"],n_results=1)' },
]
```

**`rag`** (Act IV, rag-build, sh+py mode)
```typescript
objectives: [
  { id: 'embed-model', label: 'Pull an embedding model', hint: 'Run: ollama pull nomic-embed-text' },
  { id: 'index', label: 'Index documents in ChromaDB', hint: 'Use Python + chromadb + OllamaEmbeddingFunction to add documents' },
  { id: 'retrieve', label: 'Retrieve relevant chunks', hint: 'Use col.query() to retrieve top-k chunks for a question' },
  { id: 'generate', label: 'Generate a grounded answer', hint: 'Pass retrieved chunks as context to ollama.chat()' },
]
```

### Terminal Component — Command Recognition

The Terminal validates commands by regex pattern matching. On match, it calls `onObjectiveDone(objectiveId)`.

**Shell mode command patterns:**
```typescript
const SHELL_PATTERNS: { pattern: RegExp; objectiveId: string; sandboxId: string; response: string }[] = [
  // firstchat
  { pattern: /ollama\s+pull\s+llama3\.2/, objectiveId: 'pull', sandboxId: 'firstchat',
    response: 'pulling manifest\npulling 8eeb52dfb585... 100% ▕████████████████▏ 2.0 GB\nsuccess' },
  { pattern: /ollama\s+list/, objectiveId: 'list', sandboxId: 'firstchat',
    response: 'NAME              ID              SIZE    MODIFIED\nllama3.2:latest   a80c4f17acd5    2.0 GB  1 second ago' },
  { pattern: /ollama\s+run\s+llama3\.2/, objectiveId: 'run', sandboxId: 'firstchat',
    response: '>>> ' },
  { pattern: /ollama\s+ps/, objectiveId: 'ps', sandboxId: 'firstchat',
    response: 'NAME              ID              SIZE    PROCESSOR    UNTIL\nllama3.2:latest   a80c4f17acd5    4.7 GB  100% GPU     4 minutes from now' },
  // modelfile
  { pattern: /printf.*>.*Modelfile|echo.*>.*Modelfile|cat\s*>.*Modelfile|nano\s+Modelfile|vi\s+Modelfile/,
    objectiveId: 'create-file', sandboxId: 'modelfile', response: '' },
  { pattern: /ollama\s+create\s+\S+\s+-f\s+Modelfile/, objectiveId: 'build', sandboxId: 'modelfile',
    response: 'transferring model data\ncreating model layer\nsuccess' },
  { pattern: /ollama\s+run\s+sqlbot/, objectiveId: 'run-custom', sandboxId: 'modelfile',
    response: '>>> ' },
  // api
  { pattern: /curl\s+localhost:11434\/api\/tags/, objectiveId: 'tags', sandboxId: 'api',
    response: '{"models":[{"name":"llama3.2:latest","size":2052668416}]}' },
  { pattern: /curl\s+localhost:11434\/api\/chat/, objectiveId: 'chat', sandboxId: 'api',
    response: '{"model":"llama3.2","message":{"role":"assistant","content":"Hello! How can I help you today?"},"done":true}' },
  { pattern: /curl\s+localhost:11434\/api\/embed/, objectiveId: 'embed', sandboxId: 'api',
    response: '{"model":"llama3.2","embeddings":[[0.1201,-0.0372,0.8821]],"total_duration":523000000}' },
]

// Python mode patterns (match when mode === 'py'):
const PYTHON_PATTERNS: { pattern: RegExp; objectiveId: string; sandboxId: string; response: string }[] = [
  { pattern: /pip\s+install\s+chromadb/, objectiveId: 'install', sandboxId: 'collection',
    response: 'Collecting chromadb\nInstalling collected packages: chromadb\nSuccessfully installed chromadb-0.5.0' },
  { pattern: /import\s+chromadb.*PersistentClient/, objectiveId: 'client', sandboxId: 'collection',
    response: '' },
  { pattern: /get_or_create_collection/, objectiveId: 'collection', sandboxId: 'collection',
    response: '' },
  { pattern: /col\.add\(/, objectiveId: 'add', sandboxId: 'collection',
    response: '' },
  { pattern: /col\.query\(/, objectiveId: 'query', sandboxId: 'collection',
    response: "{'ids': [['doc1']], 'distances': [[0.123]], 'documents': [['Ollama runs models locally']]}" },
]
```

**Mode switching:**
- `python` or `python3` command → switch to Python mode (show `>>>` prompt)
- `exit()` in Python mode → switch back to shell mode

**Unknown command:** `bash: <cmd>: command not found`

### Task Breakdown (Phase 3)

**Task 1: Migrate Acts II–IV lessons into `content/lessons.ts`**

Source: `localhost-quest.html`, locate `const LESSONS = [` (around line 594). Copy all 19 lessons where `act: 2`, `act: 3`, or `act: 4` and append to the LESSONS array. Preserve all block types including `{prism}`.

Verification test:
```typescript
it('Act II has 8 lessons', () => expect(getLessonsForAct(2)).toHaveLength(8))
it('Act III has 8 lessons', () => expect(getLessonsForAct(3)).toHaveLength(8))
it('Act IV has 3 lessons', () => expect(getLessonsForAct(4)).toHaveLength(3))
it('total is 25 lessons', () => expect(LESSONS).toHaveLength(25))
```

**Task 2: Migrate 5 remaining diagrams**

Add to `content/diagrams.ts`: `vectorspace`, `distance`, `collection`, `ragpipe`, `stack`. Source SVGs are in `localhost-quest.html` in the `DIAGRAMS` object.

**Task 3: Sandbox definitions → `content/sandboxes.ts`**

Create file with all 5 definitions from the table above.

Tests:
```typescript
it('has exactly 5 sandboxes', () => expect(Object.keys(SANDBOXES)).toHaveLength(5))
it('getSandboxDef("firstchat") has 4 objectives', () =>
  expect(getSandboxDef('firstchat').objectives).toHaveLength(4))
it('getSandboxDef("collection") has 6 objectives', () =>
  expect(getSandboxDef('collection').objectives).toHaveLength(6))
```

**Task 4: Terminal component `components/Terminal.tsx`**

```tsx
export function Terminal({ sandbox, completedObjectives, onObjectiveDone, onAllDone }: TerminalProps): JSX.Element
```

Layout:
- Top section (40% height): objectives list (label + checkmark, hint on tap)
- Bottom section (60% height): terminal output (ScrollView) + text input
- Mode indicator: `$` for shell, `>>>` for Python

State:
```typescript
const [mode, setMode] = useState<'sh' | 'py'>('sh')
const [output, setOutput] = useState<string[]>([`Type commands below. Objectives: ${sandbox.objectives.length}`])
const [input, setInput] = useState('')
```

Command dispatch:
```typescript
function runCommand(cmd: string) {
  setOutput(prev => [...prev, `${mode === 'sh' ? '$' : '>>>'} ${cmd}`])
  if (mode === 'sh' && (cmd === 'python' || cmd === 'python3')) {
    setMode('py')
    setOutput(prev => [...prev, 'Python 3.11.0 (simulated)', '>>>'])
    return
  }
  if (mode === 'py' && cmd === 'exit()') {
    setMode('sh')
    setOutput(prev => [...prev, '$'])
    return
  }
  const patterns = mode === 'sh' ? SHELL_PATTERNS : PYTHON_PATTERNS
  const match = patterns.find(p => p.sandboxId === sandbox.id && p.pattern.test(cmd))
  if (match) {
    if (match.response) setOutput(prev => [...prev, match.response])
    onObjectiveDone(match.objectiveId)
  } else {
    setOutput(prev => [...prev, `bash: ${cmd.split(' ')[0]}: command not found`])
  }
}
```

Tests: simulate running `ollama pull llama3.2` on firstchat sandbox → `onObjectiveDone('pull')` called.

**Task 5: Sandbox screen `app/sandbox/[id].tsx`**

```typescript
export default function SandboxScreen()
// useLocalSearchParams<{ id: string }>()
// getSandboxDef(id) → render Terminal
// completedObjectives mirrors progression.completedSandboxes (per-sandbox bitmask via id+objId)
// onAllDone → markSandboxCompleted(sandbox.id) → awardXP(15) → router.back()
```

Also: add `markSandboxCompleted(sandboxId: string)` action to `store/game-store.ts` (sets `completedSandboxes[sandboxId] = true`, idempotent, awards +15 XP).

Add sandbox portal entities to city definitions in `content/world-data.ts` (near each city's relevant building). Route: `router.push(\`/sandbox/${dest}\`)` when player interacts with `sandbox_portal` entity type.

---

## Phase 4 — Audio

**Goal:** Per-city background music using Tone.js (web) / expo-av (native). Dynamic layers that build as the player explores (Secret of Mana inspired). SFX for battle hits, level-up, NPC dialogue, and menu navigation.

### Installation

```bash
npm install tone --legacy-peer-deps
npx expo install expo-av
```

Add `expo-av` to plugins array in `app.json`:
```json
{ "expo": { "plugins": ["expo-router", "react-native-reanimated", "expo-av"] } }
```

### Files

**Create:**
- `audio/AudioManager.ts` — Singleton, Platform.OS-aware
- `audio/themes/llamatown.ts` — Tone.js composition
- `audio/themes/overworld.ts`
- `audio/themes/forge.ts`
- `audio/themes/caverns.ts`
- `audio/themes/convergence.ts`
- `audio/themes/battle.ts`
- `audio/sfx.ts` — Tone.js SFX catalog
- `assets/audio/` — Pre-rendered .ogg files (one per city + SFX set; created offline by developer)

**Modify:**
- `app/overworld.tsx`, `app/city/[id].tsx`, `app/battle.tsx` — `useEffect` for AudioManager.play/stop
- `store/game-store.ts` — `updateSettings` triggers `AudioManager.setVolume` / `AudioManager.setMusicEnabled`

### AudioManager Interface

```typescript
// audio/AudioManager.ts
export type TrackId = 'overworld' | 'llamatown' | 'forge' | 'caverns' | 'convergence' | 'battle'

class AudioManagerImpl {
  private currentTrack: TrackId | null = null
  private musicEnabled = true
  private sfxEnabled = true
  private volume = 0.8

  play(trackId: TrackId): void
    // If same track already playing, no-op
    // Stop current track, start new one
    // On web: use Tone.js Transport.start() + relevant theme
    // On native: use expo-av Audio.Sound.createAsync(require('./assets/audio/${trackId}.ogg'))

  stop(): void
  
  sfx(id: keyof typeof SFX_MAP): void
    // On web: fire one-shot Tone.js synth
    // On native: play short .ogg from assets

  setVolume(v: number): void
  setMusicEnabled(v: boolean): void
  setSfxEnabled(v: boolean): void
}

export const AudioManager = new AudioManagerImpl()
```

### Tone.js Theme Structure (per city)

Each city theme file exports a `start()` and `stop()` function. The AudioManager calls these on web.

```typescript
// audio/themes/llamatown.ts — Example structure
import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

// Peaceful village theme: C major pentatonic, 72 BPM, xylophone-like timbre
const NOTES = ['C4', 'E4', 'G4', 'A4', 'C5', 'A4', 'G4', 'E4']

export function start(volume: number) {
  Tone.getTransport().bpm.value = 72
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.8 }
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume)
  seq = new Tone.Sequence((time, note) => synth?.triggerAttackRelease(note, '8n', time), NOTES, '8n')
  seq.start(0)
  Tone.getTransport().start()
  // Layer 2 fades in after 30s (rewards exploration)
  layerTimer = setTimeout(() => addLayer2(volume), 30000)
}

export function stop() {
  if (layerTimer) clearTimeout(layerTimer)
  seq?.stop()
  seq?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null
}
```

### SFX Catalog

```typescript
// audio/sfx.ts
const SFX_MAP = {
  levelUp: () => { /* ascending 3-note chime: C4→E4→G5, 0.1s each */ },
  hit: () => { /* low thud: 150Hz sine, 50ms decay */ },
  miss: () => { /* soft "poof": 400Hz, noise burst */ },
  npcBlip: () => { /* short blip: 880Hz sine, 20ms */ },
  menuMove: () => { /* subtle tick: 660Hz, 15ms */ },
  victory: () => { /* 4-note fanfare: C4-E4-G4-C5, arpeggio */ },
  escape: () => { /* whoosh: pitch drop 800→200Hz, 200ms */ },
}
```

### Task Breakdown (Phase 4)

**Task 1: Install and verify audio packages**
- `npm install tone --legacy-peer-deps && npx expo install expo-av`
- Verify `npx expo start --web` still loads without error
- Verify `npx tsc --noEmit` passes

**Task 2: AudioManager singleton**
- Create `audio/AudioManager.ts` with Platform.OS branching
- Web: Tone.js Transport control
- Native: expo-av `Audio.Sound` management
- Mock Tone.js in Jest (`__mocks__/tone.js`: all classes are jest.fn())

**Task 3: Llamatown + Overworld themes**
- Create `audio/themes/llamatown.ts` and `audio/themes/overworld.ts`
- Test manually in browser: `npx expo start --web`, navigate to Llamatown, music should play

**Task 4: Forge + Caverns + Convergence + Battle themes**
- Forge: industrial rhythm, minor key, 90 BPM
- Caverns: mysterious, slow, arpeggiated minor chords, 60 BPM
- Convergence: epic, triumphant, full chords, 80 BPM
- Battle: tense, percussive, fast, 120 BPM

**Task 5: SFX implementation**
- Create `audio/sfx.ts` with all 7 SFX
- Wire into screens: `AudioManager.sfx('levelUp')` in `awardXP` level-up branch (store), `AudioManager.sfx('npcBlip')` when dialogue opens, `AudioManager.sfx('hit')` in `enemyTurn`, `AudioManager.sfx('victory')` on battle victory

**Task 6: Wire into screens + settings**
- `useEffect(() => { AudioManager.play('llamatown'); return () => AudioManager.stop() }, [])` in each screen
- `updateSettings` in store: call `AudioManager.setMusicEnabled(v)` / `AudioManager.setVolume(v)` when settings change

---

## Phase 5 — Remaining Cities

**Goal:** Add Model Forge (Act II), Prism Caverns (Act III), and The Convergence (Act IV) as fully playable cities. Add a gate unlock system driven by boss defeats and concept mastery.

### Files

**Modify only** (city screen `app/city/[id].tsx` is already generic and works as-is):
- `content/world-data.ts` — Add FORGE, CAVERNS, CONVERGENCE; update OVERWORLD with 3 more entrances; add `ACT_CONCEPTS`, `isGateUnlocked`
- `app/building/[id].tsx` — Add 3 more entries to `BUILDING_ACT`
- `engine/entity.ts` — Optionally add tile type `'crystal'` for caverns visuals; add `makeSandboxPortal(...)` factory function

### Gate Unlock System

```typescript
// content/world-data.ts — add exports:
export const ACT_CONCEPTS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ['oll-intro','oll-install','oll-run','oll-manage','oll-models','oll-params'],
  2: ['oll-modelfile','oll-api','oll-openai','oll-structured','oll-tools','oll-multimodal','oll-embed','oll-ops'],
  3: ['chr-vectors','chr-intro','chr-collections','chr-add','chr-query','chr-filter','chr-ef','chr-persist'],
  4: ['rag-concept','rag-build','rag-prod'],
}

export function isActMastered(act: 1 | 2 | 3 | 4, masteredConcepts: Record<string, boolean>): boolean {
  return (ACT_CONCEPTS[act] ?? []).every(id => masteredConcepts[id] === true)
}

export function isGateUnlocked(
  fromAct: 1 | 2 | 3 | 4,
  masteredConcepts: Record<string, boolean>,
  defeatedBosses: Record<string, boolean>,
): boolean {
  const bossIds: Record<1|2|3|4, string> = {
    1: 'frozen-boot', 2: 'rate-limiter', 3: 'dimensionless-beast', 4: 'hallucinator'
  }
  return isActMastered(fromAct, masteredConcepts) && (defeatedBosses[bossIds[fromAct]] === true)
}
```

In `app/city/[id].tsx`, when player approaches a gate:
```typescript
const gateUnlocked = isGateUnlocked(cityAct, progression.masteredConcepts, progression.defeatedBosses)
// Show lock icon if !gateUnlocked; prompt "[E] Open Gate" if unlocked
```

### City Specifications

**Model Forge** (`id: 'forge'`, 20×18 grid)
```
Floor type: 'floor' for interior, 'path' for streets (brownish-amber in renderer)
Buildings: forge-library (Act II lessons), api-workshop (sandbox portal: api), modelfile-foundry (sandbox portal: modelfile)
NPCs:
  - Smith Forge-Hand (🔨, id: 'npc-smith') at (4, 4)
    lines: ["This is the Forge. Here we don't just use models — we shape them.",
            "A Modelfile is a recipe: FROM a base, add a SYSTEM persona, bake in PARAMETERs.",
            "`ollama create mybot -f Modelfile` and your custom model is born."]
  - API Artificer (⚙️, id: 'npc-api-artificer') at (15, 8)
    lines: ["Every CLI command is really a POST to :11434. Learn the API and you can build anything.",
            "/api/chat for conversation, /api/embed for vectors, /v1 if you speak OpenAI."]
Gates:
  - South gate (y=17): destination='overworld'
  - East gate (x=19, y=9): destination='vale', locked=true (unlocked when Act II mastered + boss defeated)
```

**Prism Caverns** (`id: 'vale'`, 22×18 grid)
```
Floor type: 'floor' for cavern paths (dark purple in renderer; add 'crystal' tile variant if desired)
Buildings: vale-library (Act III lessons), chromadb-cave (sandbox portal: collection), filter-grotto (no sandbox)
NPCs:
  - The Prism Oracle (🔮, id: 'npc-prism-oracle') at (11, 4)
    lines: ["Deep in these caverns, text turns into light — vectors of pure meaning.",
            "Similar ideas glow near each other. A vector database finds neighbors in that space.",
            "ChromaDB is our store. One rule above all: embed queries with the *same* model you indexed with."]
  - Vector Sprite (✨, id: 'npc-vector-sprite') at (18, 13)
    lines: ["`PersistentClient(path=...)` keeps your collection on disk between runs.",
            "`get_or_create_collection` never crashes. `add` then `query`. That's the whole dance."]
Gates:
  - North gate (y=0): destination='overworld'
  - West gate (x=0, y=9): destination='ridge', locked=true (unlocked when Act III mastered + boss defeated)
```

**The Convergence** (`id: 'ridge'`, 20×16 grid)
```
Floor type: 'floor' (golden, elevated feel)
Buildings: ridge-library (Act IV lessons), rag-production-vault (sandbox portal: rag)
NPCs:
  - Architect of the Convergence (🏛️, id: 'npc-architect') at (4, 4)
    lines: ["You've reached the Convergence, Operator. Here Ollama and ChromaDB become one system.",
            "RAG: retrieve relevant chunks from Chroma, hand them to Ollama, generate a grounded answer.",
            "Index once. Query forever. All on your own machine."]
  - Keeper of Citations (📜, id: 'npc-keeper') at (15, 11)
    lines: ["Tell the model: answer ONLY from the context, and cite the chunk. That's how trust is built.",
            "Low temperature. Top-k retrieval. Re-rank when precision matters."]
Gates:
  - Single west gate (x=0, y=8): destination='overworld'
```

**BUILDING_ACT additions for `app/building/[id].tsx`:**
```typescript
const BUILDING_ACT: Record<string, 1 | 2 | 3 | 4> = {
  'llamatown-library': 1,
  'forge-library': 2,
  'vale-library': 3,
  'ridge-library': 4,
}
```

**OVERWORLD additions** (add 3 building_entrance entities to OVERWORLD.entities):
```typescript
makeBuildingEntrance('enter-forge', 30, 14, 'forge'),
makeBuildingEntrance('enter-vale', 30, 20, 'vale'),
makeBuildingEntrance('enter-ridge', 10, 20, 'ridge'),
// (exact tile coordinates to be adjusted after seeing the 40×30 overworld grid)
```

### Task Breakdown (Phase 5)

**Task 1: Model Forge CityDef + overworld entrance**
- Add `FORGE: CityDef` to `content/world-data.ts`
- Add `enter-forge` entity to OVERWORLD
- Add `'forge'` to CITY_MAP
- Add forge-library to BUILDING_ACT map

**Task 2: Prism Caverns CityDef + overworld entrance**
- Add `CAVERNS: CityDef` to `content/world-data.ts`
- Add `enter-vale` entity to OVERWORLD
- Add `'vale'` to CITY_MAP

**Task 3: The Convergence CityDef + overworld entrance**
- Add `CONVERGENCE: CityDef` to `content/world-data.ts`
- Add `enter-ridge` entity to OVERWORLD
- Add `'ridge'` to CITY_MAP

**Task 4: Gate unlock system**
- Add `ACT_CONCEPTS`, `isActMastered`, `isGateUnlocked` exports to `content/world-data.ts`
- Modify `app/city/[id].tsx` gate interaction to check `isGateUnlocked` before routing
- Show "Gate locked — master all Act N concepts and defeat the boss" message if locked
- Write unit tests for `isActMastered` and `isGateUnlocked`

---

## Phase 6 — Mobile Polish

**Goal:** Production-quality mobile UX. Touch D-pad for iOS/Android. Safe area handling. Haptic feedback. Performance optimization. App store readiness.

### Installation

```bash
npx expo install expo-haptics expo-safe-area-context
```

These are Expo-native packages — no `--legacy-peer-deps` needed.

### Files

**Create:**
- `components/TouchDpad.tsx` — Virtual D-pad + interact button (mobile only)
- `components/SafeAreaWrapper.tsx` — Thin wrapper using `useSafeAreaInsets`

**Modify:**
- `app/overworld.tsx`, `app/city/[id].tsx`, `app/battle.tsx`, `app/building/[id].tsx`, `app/sandbox/[id].tsx` — Wrap with SafeAreaWrapper
- `hooks/usePlayerInput.ts` — Accept optional `externalInput` prop to receive D-pad presses
- `store/game-store.ts` — Trigger haptics from level-up branch of `awardXP`

### SafeAreaWrapper

```tsx
// components/SafeAreaWrapper.tsx
import { useSafeAreaInsets } from 'expo-safe-area-context'
import { View, StyleSheet } from 'react-native'

interface Props { children: React.ReactNode; style?: object }

export function SafeAreaWrapper({ children, style }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]}>
      {children}
    </View>
  )
}
```

Wrap in `app/_layout.tsx`'s `SafeAreaProvider` (from `expo-safe-area-context`).

### TouchDpad Interface

```tsx
// components/TouchDpad.tsx
interface TouchDpadProps {
  onInput: (dx: number, dy: number) => void   // called while button held; dx/dy are -1, 0, or 1
  onInteract: () => void                       // called on center button press
}

export function TouchDpad({ onInput, onInteract }: TouchDpadProps): JSX.Element | null {
  if (Platform.OS === 'web') return null  // keyboard handles web
  // ... 5-button layout
}
```

Layout (fixed position, bottom-right, z-index: 100):
```
        [↑]
    [←] [E] [→]
        [↓]
```
Button size: 64×64px. Gap: 8px. Background: `rgba(255,255,255,0.15)`. Border-radius: 8px.

Integration in `app/overworld.tsx`:
```tsx
// Pass D-pad input into the same InputState ref that keyboard uses
const { input } = usePlayerInput()
<TouchDpad
  onInput={(dx, dy) => { input.current.dx = dx; input.current.dy = dy }}
  onInteract={handleInteract}
/>
```

### Haptics

```typescript
import * as Haptics from 'expo-haptics'

// Level up (in store/game-store.ts awardXP level-up branch):
if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

// Battle hit received (in hooks/useBattle.ts enemyTurn):
if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

// NPC dialogue open (in app/overworld.tsx + app/city/[id].tsx):
if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

// Menu selection in BattleMenu + class select on title screen:
if (Platform.OS !== 'web') Haptics.selectionAsync()
```

### Performance Pass

Key areas to optimize:
1. **Entity list memoization**: `useMemo` on entity arrays in WorldRenderer (only recompute when city changes, not every frame)
2. **Skia Canvas size**: Ensure canvas dimensions match actual screen (not 100% width causing layout recalculation)
3. **Camera calculation**: Move `followEntity` + `clampCamera` calls inside the game loop ref (not in render path)
4. **DialogueBox**: Replace character-by-character `setTimeout` with `useInterval` or `useAnimatedValue` for smoother typewriter

### Task Breakdown (Phase 6)

**Task 1: Safe area integration**
- Install `expo-safe-area-context`
- Add `SafeAreaProvider` to `app/_layout.tsx`
- Create `SafeAreaWrapper` component
- Apply to all 5 screen files

**Task 2: TouchDpad component**
- Create `components/TouchDpad.tsx` (platform-conditional rendering)
- Modify `usePlayerInput` to accept external InputState override
- Integrate into `app/overworld.tsx` and `app/city/[id].tsx`
- Test on iOS simulator: player moves with D-pad

**Task 3: Haptics integration**
- Install `expo-haptics`
- Wire 4 haptic events (level-up, hit, dialogue-open, menu-select)
- All wrapped in `Platform.OS !== 'web'` guards

**Task 4: Performance optimization**
- Profile with React Native DevTools (Profiler tab)
- Apply `useMemo` to entity lists
- Apply `useCallback` to game loop callback in overworld/city screens (already done; verify no regressions)
- Measure FPS before and after on a mid-range device

**Task 5: App store assets + metadata**
- Verify `assets/icon.png` (1024×1024), `assets/splash-icon.png` (200×200) are correct
- Update `app.json`: add `description`, `version: "1.0.0"`, `android.package: "com.llamaquest.app"`, `ios.bundleIdentifier: "com.llamaquest.app"`
- Run `npx expo-doctor` and fix any warnings
- Test `npx expo build:web` to verify static export works

---

## Content Inventory (Complete Reference)

### All 25 Lessons

Source of truth for implementers: `localhost-quest.html`, `const LESSONS = [` (~line 594)

| Act | Idx | ID | Title | Lede |
|-----|-----|----|-------|------|
| I | 0 | `oll-intro` | What Is Ollama? | Run LLMs on your machine, no cloud, no bill. |
| I | 1 | `oll-install` | Install & the Server | Get Ollama running; understand port 11434. |
| I | 2 | `oll-run` | Your First Model | Pull a model and start chatting in seconds. |
| I | 3 | `oll-manage` | Managing Your Models | Inventory, inspect, copy, delete, reclaim space. |
| I | 4 | `oll-models` | Choosing Models & Quantization | Parameters, GGUF, Q4_K_M vs fp16. |
| I | 5 | `oll-params` | Tuning Inference | Temperature, num_ctx, num_predict, top_p/top_k, seed. |
| II | 6 | `oll-modelfile` | Modelfiles: Custom Models | Recipe-driven model variants with personality. |
| II | 7 | `oll-api` | The REST API | /api/generate, /api/chat, streaming, stateless. |
| II | 8 | `oll-openai` | OpenAI Compatibility & SDKs | /v1 layer, Python/JS libraries. |
| II | 9 | `oll-structured` | Structured Outputs | Force JSON schema conformance. |
| II | 10 | `oll-tools` | Tool Calling | Model calls your functions; loop-based orchestration. |
| II | 11 | `oll-multimodal` | Vision & Reasoning Models | Images, llava/gemma3, deepseek-r1. |
| II | 12 | `oll-embed` | Embeddings | Turn text into vectors; bridge to RAG. |
| II | 13 | `oll-ops` | Operations & Performance | keep_alive, parallel requests, Docker, network exposure. |
| III | 14 | `chr-vectors` | Vectors & Vector Space | Meaning as geometry; cosine/L2/inner product. |
| III | 15 | `chr-intro` | Meet ChromaDB | Vector database; four client modes. |
| III | 16 | `chr-collections` | Collections | Fundamental storage unit; distance metric selection. |
| III | 17 | `chr-add` | Adding Documents | add() with docs/embeddings/metadata; auto-embed. |
| III | 18 | `chr-query` | Querying & Managing Data | Semantic search, get(), update(), delete(). |
| III | 19 | `chr-filter` | Metadata Filtering | where (metadata) + where_document (text). |
| III | 20 | `chr-ef` | Embedding Functions | OllamaEmbeddingFunction, custom EFs, dimension matching. |
| III | 21 | `chr-persist` | Persistence & Server Mode | PersistentClient, chroma run, pitfalls. |
| IV | 22 | `rag-concept` | What Is RAG? | Retrieval-Augmented Generation; two phases (index + query). |
| IV | 23 | `rag-build` | Build a Local RAG System | End-to-end: embed, retrieve, augment, generate. |
| IV | 24 | `rag-prod` | Production & Tuning | Chunk size, k selection, re-ranking, evaluation, grounding. |

### All 5 Sandbox Projects

| ID | Act | Concept | Mode | # Objectives |
|----|-----|---------|------|-------------|
| `firstchat` | I | oll-run | sh | 4 |
| `modelfile` | II | oll-modelfile | sh | 3 |
| `api` | II | oll-api | sh | 3 |
| `collection` | III | chr-add | py | 6 |
| `rag` | IV | rag-build | sh+py | 4 |

### All 10 Diagrams

| Key | Caption | Acts Used In |
|-----|---------|-------------|
| `arch` | Ollama architecture: client → server → model | I |
| `modelfile` | Modelfile layers → ollama create | II |
| `reqflow` | Every library call is HTTP to :11434 | II |
| `toolloop` | Tool calling loop | II |
| `embed` | Text → embedding vector | II |
| `vectorspace` | Meaning becomes geometry (semantic clusters) | III |
| `distance` | Cosine vs Euclidean for text similarity | III |
| `collection` | ChromaDB collection: ID/doc/embedding/metadata | III |
| `ragpipe` | RAG two phases: indexing + querying | IV |
| `stack` | Full RAG stack on one machine | IV |

### QBANK Coverage

All 25 lesson IDs have 4 questions each = **100 questions total**. Source: `localhost-quest.html`, `const QBANK = {` (~line 1050).

Format per question:
```javascript
{ q: 'Question text?', a: ['A', 'B', 'C', 'D'], c: 0, why: 'Explanation.' }
```

### NPCs (All Locations)

| Name | Emoji | City | ID | Lines Summary |
|------|-------|------|-----|--------------|
| Llama Elder | 🦙 | Llamatown | `npc-llama-elder` | Welcome, Ollama local-first intro, how to use Codex |
| Pulled-Model Pip | 🐑 | Llamatown | `npc-pip` | Tips: `ollama run`, sandbox pointer |
| Smith Forge-Hand | 🔨 | Forge | `npc-smith` | Modelfile recipe metaphor, `ollama create` |
| API Artificer | ⚙️ | Forge | `npc-api-artificer` | CLI = HTTP to :11434, /v1 OpenAI compat |
| The Prism Oracle | 🔮 | Prism Caverns | `npc-prism-oracle` | Text→vectors, semantic clustering, embedding model rule |
| Vector Sprite | ✨ | Prism Caverns | `npc-vector-sprite` | PersistentClient, get_or_create_collection, add→query |
| Architect of the Convergence | 🏛️ | The Convergence | `npc-architect` | RAG = Ollama + ChromaDB, index once query forever |
| Keeper of Citations | 📜 | The Convergence | `npc-keeper` | Grounding instructions, low temp, top-k, re-rank |
| Crossroads Guide | 🧭 | Overworld | `npc-crossroads-guide` | Orients to 4 realms, explains mastery gating |

---

## Known Tech Debt (From Phase 1)

Address these when they become blocking, not proactively:

- `BUILDING_ACT` in `app/building/[id].tsx` typed `Record<string, number>` — should be `Record<string, 1|2|3|4>`
- Hardcoded palette hex strings in `Codex.tsx` — should import from a shared constants file
- `progression` destructured but unused in `app/city/[id].tsx` — clean up when editing that file
- Stale `.worktrees/task-4-movement-collision/` directory — safe to delete manually
- `input.current!` non-null assertion in overworld screen — necessary for TypeScript but worth a note

---

*Last updated: 2026-06-19 · Phase 1 complete (14 tasks, 36 tests) · Phases 2–6 planned*
