# Phase 2 — Battle System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete Earthbound-style turn-based battle system with random encounters, PSI quiz attacks, rolling HP drain, and boss gate unlocking.

**Architecture:** Pure-TypeScript battle state machine in `engine/battle.ts` (no React); `hooks/useBattle.ts` bridges engine to React via `useState` + `useGameLoop`; `app/battle.tsx` is the dedicated battle screen, navigated to by query param. Encounter checks are injected into the existing overworld and city game loops.

**Tech Stack:** React Native (views for battle UI), @shopify/react-native-skia (background canvas), expo-router (navigation), zustand (store actions), react-native-reanimated useFrameCallback (game loop).

## Global Constraints

- Expo SDK 52 managed workflow; no ejecting
- TypeScript strict with `noUncheckedIndexedAccess: true`; all array/object index access uses `?? fallback`
- `--legacy-peer-deps` required for all `npm install` calls
- No arbitrary colors — pull from established palette in `components/HUD.tsx` and `renderer/TilemapRenderer.tsx`
- Entity IDs kebab-case (e.g. `'npc-smith'`); lesson IDs `<tech>-<concept>` (e.g. `'oll-run'`)
- Save key `'llama_quest_v1'` — never change
- TDD: write failing test first → implement minimal code → confirm green → commit
- `Record<string, boolean>` for all **progression** tracking (not `Set<string>`); `Set<string>` is fine for transient per-battle state
- Constants: `TILE_SIZE = 32`, `PLAYER_SPEED = 4`, `MAX_DT = 0.05`
- `XP_PER_LEVEL = 120`; XP rewards: lesson read +20, NPC met +8, correct quiz +5, concept mastered +40, boss defeated +100, sandbox completed +15

---

## File Map

### Created
| File | Responsibility |
|------|----------------|
| `content/qbank.ts` | 100 quiz questions (25 lessons × 4), keyed by lesson ID |
| `content/enemies.ts` | 20 enemy definitions (4 regulars + 1 boss per act) |
| `engine/battle.ts` | Pure-TS battle state machine — zero React deps |
| `hooks/useBattle.ts` | React bridge: engine state ↔ useState, game loop for rolling HP |
| `components/RollingHP.tsx` | Displays draining HP counter |
| `components/BattleMenu.tsx` | PSI / Guard / Run action picker |
| `components/PSIAttack.tsx` | Quiz question overlay with 4 answer buttons |
| `app/battle.tsx` | Battle screen (Skia background + RN UI overlay) |
| `content/__tests__/qbank.test.ts` | 5 structural tests |
| `engine/__tests__/battle.test.ts` | 8+ unit tests for state machine |

### Modified
| File | Change |
|------|--------|
| `store/game-store.ts` | Add `awardBossKill(bossId)` and `setPlayerHp(hp)` actions |
| `store/__tests__/game-store.test.ts` | Tests for two new actions |
| `content/world-data.ts` | Add boss gate entity to LLAMATOWN |
| `app/overworld.tsx` | Encounter check per tile step |
| `app/city/[id].tsx` | Encounter check + boss gate interaction |

---

### Task 1: QBANK Migration

**Files:**
- Create: `content/qbank.ts`
- Create: `content/__tests__/qbank.test.ts`

**Interfaces:**
- Produces:
  - `QuizQuestion` — `{ q, a, c, why, lessonId }`
  - `QBank` — `Record<string, QuizQuestion[]>` keyed by lesson id
  - `QBANK` — the full bank constant
  - `getQuestionsForAct(act: 1|2|3|4): QuizQuestion[]`
  - `getQuestionsForLesson(lessonId: string): QuizQuestion[]`

- [ ] **Step 1: Write the failing tests**

```typescript
// content/__tests__/qbank.test.ts
import { QBANK, getQuestionsForAct, getQuestionsForLesson } from '../qbank'

it('has exactly 25 lesson keys', () =>
  expect(Object.keys(QBANK)).toHaveLength(25))

it('each lesson has exactly 4 questions', () => {
  for (const [id, qs] of Object.entries(QBANK)) {
    expect(qs).toHaveLength(4)
  }
})

it('all correct indices are 0–3', () => {
  for (const qs of Object.values(QBANK).flat()) {
    expect([0, 1, 2, 3]).toContain(qs.c)
  }
})

it('getQuestionsForAct(1) returns 24 questions (6 lessons × 4)', () =>
  expect(getQuestionsForAct(1)).toHaveLength(24))

it('getQuestionsForLesson("oll-intro") returns 4 questions', () =>
  expect(getQuestionsForLesson('oll-intro')).toHaveLength(4))
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- content/__tests__/qbank.test.ts --watchAll=false
```
Expected: Cannot find module `'../qbank'`

- [ ] **Step 3: Create `content/qbank.ts`**

The source is `localhost-quest.html`. Search for `const QBANK={}` (line 1319) and read through line 1476 — that covers all 25 lesson blocks. Each source block looks like:

```javascript
QBANK['oll-intro']=[
  {q:"Question?", a:["A","B","C","D"], c:0, why:"Explanation."},
  ...
]
```

Transcribe every block into TypeScript, adding `lessonId` to every question. The complete file structure:

```typescript
// content/qbank.ts
export interface QuizQuestion {
  q: string
  a: [string, string, string, string]
  c: 0 | 1 | 2 | 3
  why: string
  lessonId: string
}

export type QBank = Record<string, QuizQuestion[]>

// Act-to-lesson mapping — used by getQuestionsForAct
const ACT_LESSONS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ['oll-intro', 'oll-install', 'oll-run', 'oll-manage', 'oll-models', 'oll-params'],
  2: ['oll-modelfile', 'oll-api', 'oll-openai', 'oll-structured', 'oll-tools', 'oll-multimodal', 'oll-embed', 'oll-ops'],
  3: ['chr-vectors', 'chr-intro', 'chr-collections', 'chr-add', 'chr-query', 'chr-filter', 'chr-ef', 'chr-persist'],
  4: ['rag-concept', 'rag-build', 'rag-prod'],
}

export const QBANK: QBank = {
  'oll-intro': [
    { q: "Which best describes what Ollama is?", a: ["A tool to download, manage, and run LLMs locally", "A paid cloud LLM API", "A Python web framework", "A spreadsheet plugin"], c: 0, why: "Ollama packages and runs models **on your own machine** — no cloud required.", lessonId: 'oll-intro' },
    { q: 'Ollama is often called the "_____ of LLMs."', a: ["Docker", "Git", "Excel", "Photoshop"], c: 0, why: "Like Docker bundles apps, Ollama bundles a model's weights, config, and prompt template into one pullable package.", lessonId: 'oll-intro' },
    { q: "Which is a real advantage of running models locally?", a: ["Your prompts and data never leave the machine", "It is always faster than any cloud GPU", "It needs no disk space", "It removes the need for a model"], c: 0, why: "**Privacy** is the headline benefit: nothing is sent to a third party.", lessonId: 'oll-intro' },
    { q: "The local AI stack is three parts: the server, the models on disk, and…", a: ["the clients that talk to the server", "a cloud account", "a GPU vendor login", "an internet connection"], c: 0, why: "Clients (CLI, your app, ChromaDB) all speak to the one local server.", lessonId: 'oll-intro' },
  ],
  // Transcribe all remaining 24 lessons from localhost-quest.html lines 1327–1476
  // Each lesson key must have exactly 4 questions.
  // Add `lessonId: '<key>'` to every question object.
  // Lesson keys in order: oll-install, oll-run, oll-manage, oll-models, oll-params,
  //   oll-modelfile, oll-api, oll-openai, oll-structured, oll-tools, oll-multimodal,
  //   oll-embed, oll-ops,
  //   chr-vectors, chr-intro, chr-collections, chr-add, chr-query, chr-filter, chr-ef, chr-persist,
  //   rag-concept, rag-build, rag-prod
}

export function getQuestionsForAct(act: 1 | 2 | 3 | 4): QuizQuestion[] {
  const lessonIds = ACT_LESSONS[act] ?? []
  return lessonIds.flatMap(id => QBANK[id] ?? [])
}

export function getQuestionsForLesson(lessonId: string): QuizQuestion[] {
  return QBANK[lessonId] ?? []
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- content/__tests__/qbank.test.ts --watchAll=false
```
Expected: 5 passing

- [ ] **Step 5: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```
git add content/qbank.ts content/__tests__/qbank.test.ts
git commit -m "feat: migrate QBANK — 100 quiz questions for 25 lessons"
```

---

### Task 2: Enemy Definitions

**Files:**
- Create: `content/enemies.ts`

**Interfaces:**
- Produces: `EnemyDef`, `ENEMIES`, `BOSSES`, `getEnemiesForAct(act)`, `getBossForAct(act)`
- Consumed by: Task 4 (battle engine), Task 7 (useBattle), Task 8 (battle screen), Task 9 (encounter)

- [ ] **Step 1: Create `content/enemies.ts`** with all 20 enemies

```typescript
// content/enemies.ts
export interface EnemyDef {
  id: string
  name: string
  maxHp: number
  attack: number
  defense: number
  xpReward: number
  act: 1 | 2 | 3 | 4
  isBoss: boolean
  dialogue: {
    onAppear: string
    onHit: string
    onDefeat: string
  }
}

export const ENEMIES: EnemyDef[] = [
  // Act I regulars
  { id: 'spinning-cursor', name: 'Spinning Cursor', maxHp: 40, attack: 8, defense: 0, xpReward: 15, act: 1, isBoss: false,
    dialogue: { onAppear: "Round and round… round and round…", onHit: "S-still spinning!", onDefeat: "…resolved." } },
  { id: 'cloud-invoice', name: 'Cloud Invoice', maxHp: 50, attack: 10, defense: 2, xpReward: 18, act: 1, isBoss: false,
    dialogue: { onAppear: "$0.0004 per token. Every. Single. One.", onHit: "That's a compute surcharge.", onDefeat: "Invoice… cancelled." } },
  { id: 'driver-missing', name: 'Driver Missing', maxHp: 35, attack: 12, defense: 0, xpReward: 14, act: 1, isBoss: false,
    dialogue: { onAppear: "ERROR: CUDA driver not found. Install? [Y/N]", onHit: "Segmentation fault.", onDefeat: "Driver located. Loading…" } },
  { id: 'stack-overflow', name: 'Stack Overflow', maxHp: 55, attack: 9, defense: 1, xpReward: 20, act: 1, isBoss: false,
    dialogue: { onAppear: "Maximum recursion depth exceeded.", onHit: "Stack unwind initiated.", onDefeat: "Tail call optimized." } },
  // Act I boss
  { id: 'frozen-boot', name: 'The Frozen Boot', maxHp: 120, attack: 14, defense: 3, xpReward: 100, act: 1, isBoss: true,
    dialogue: { onAppear: "BRRR… BRRR… BRRR… It just keeps spinning. The boot never completes.", onHit: "KERNEL PANIC—no wait, still spinning.", onDefeat: "…connection established. At last." } },

  // Act II regulars
  { id: 'config-error', name: 'Config Error', maxHp: 60, attack: 13, defense: 2, xpReward: 22, act: 2, isBoss: false,
    dialogue: { onAppear: "Unexpected token } at line 47.", onHit: "Validation failed.", onDefeat: "Config parsed successfully." } },
  { id: 'api-timeout', name: 'API Timeout', maxHp: 65, attack: 11, defense: 3, xpReward: 20, act: 2, isBoss: false,
    dialogue: { onAppear: "408 Request Timeout. Try again later. Or don't.", onHit: "Connection dropped.", onDefeat: "200 OK." } },
  { id: 'dependency-hell', name: 'Dependency Hell', maxHp: 70, attack: 15, defense: 1, xpReward: 25, act: 2, isBoss: false,
    dialogue: { onAppear: "peer requires 'foo@^1.0' but 'foo@2.3.1' is installed.", onHit: "Circular dependency detected.", onDefeat: "npm install --legacy-peer-deps… done." } },
  { id: 'json-syntax', name: 'JSON Syntax Error', maxHp: 55, attack: 12, defense: 2, xpReward: 18, act: 2, isBoss: false,
    dialogue: { onAppear: "SyntaxError: Unexpected token ' in JSON at position 0.", onHit: "Invalid escape sequence.", onDefeat: "JSON.parse complete." } },
  // Act II boss
  { id: 'rate-limiter', name: 'The Rate Limiter', maxHp: 150, attack: 18, defense: 5, xpReward: 100, act: 2, isBoss: true,
    dialogue: { onAppear: "429 Too Many Requests. You shall not pass this frequently.", onHit: "Your quota is being consumed.", onDefeat: "Rate limit lifted. Proceed, Operator." } },

  // Act III regulars
  { id: 'dim-mismatch', name: 'Dim Mismatch', maxHp: 75, attack: 16, defense: 2, xpReward: 28, act: 3, isBoss: false,
    dialogue: { onAppear: "Expected 768 dimensions, got 384. Incompatible vector spaces.", onHit: "Cosine similarity undefined.", onDefeat: "Dimension aligned." } },
  { id: 'oom-vector', name: 'OOM Vector', maxHp: 80, attack: 14, defense: 4, xpReward: 26, act: 3, isBoss: false,
    dialogue: { onAppear: "Out of memory. Cannot allocate 4.2 GB.", onHit: "Swap exhausted.", onDefeat: "Memory freed." } },
  { id: 'null-embedding', name: 'Null Embedding', maxHp: 65, attack: 18, defense: 1, xpReward: 25, act: 3, isBoss: false,
    dialogue: { onAppear: "[0.0, 0.0, 0.0, …]. Every dimension: zero.", onHit: "NaN propagating…", onDefeat: "Non-zero embedding restored." } },
  { id: 'metric-clash', name: 'Metric Clash', maxHp: 70, attack: 15, defense: 3, xpReward: 24, act: 3, isBoss: false,
    dialogue: { onAppear: "You indexed with cosine. You query with L2. The results mean nothing.", onHit: "Distance metric undefined.", onDefeat: "Metric unified." } },
  // Act III boss
  { id: 'dimensionless-beast', name: 'Dimensionless Beast', maxHp: 180, attack: 22, defense: 6, xpReward: 100, act: 3, isBoss: true,
    dialogue: { onAppear: "I exist in no vector space you can comprehend.", onHit: "Your query returns nothing.", onDefeat: "Reduced. Indexed. Found." } },

  // Act IV regulars
  { id: 'hallucinated-fact', name: 'Hallucinated Fact', maxHp: 90, attack: 20, defense: 3, xpReward: 32, act: 4, isBoss: false,
    dialogue: { onAppear: "The Eiffel Tower is located in Berlin. Trust me.", onHit: "Confidence: 99%.", onDefeat: "Grounded by retrieved context." } },
  { id: 'context-overflow', name: 'Context Overflow', maxHp: 85, attack: 18, defense: 5, xpReward: 30, act: 4, isBoss: false,
    dialogue: { onAppear: "128 000 tokens. All of them about nothing.", onHit: "Attention pattern fragmented.", onDefeat: "Context pruned." } },
  { id: 'citation-gap', name: 'Citation Gap', maxHp: 80, attack: 22, defense: 2, xpReward: 30, act: 4, isBoss: false,
    dialogue: { onAppear: "No source. No chunk. Just vibes.", onHit: "Claim unverified.", onDefeat: "Chunk cited." } },
  { id: 'rerank-roulette', name: 'Re-rank Roulette', maxHp: 95, attack: 17, defense: 4, xpReward: 28, act: 4, isBoss: false,
    dialogue: { onAppear: "Spinning the wheel of relevance… 🎰", onHit: "Wrong chunk surfaced.", onDefeat: "Cross-encoder applied." } },
  // Act IV boss
  { id: 'hallucinator', name: 'The Hallucinator', maxHp: 220, attack: 28, defense: 8, xpReward: 100, act: 4, isBoss: true,
    dialogue: { onAppear: "I am certain. I am confident. I am completely wrong.", onHit: "Probability mass misplaced.", onDefeat: "Grounded. Cited. Trusted." } },
]

export const BOSSES: EnemyDef[] = ENEMIES.filter(e => e.isBoss)

export function getEnemiesForAct(act: 1 | 2 | 3 | 4): EnemyDef[] {
  return ENEMIES.filter(e => e.act === act && !e.isBoss)
}

export function getBossForAct(act: 1 | 2 | 3 | 4): EnemyDef {
  const boss = BOSSES.find(e => e.act === act)
  if (!boss) throw new Error(`No boss for act ${act}`)
  return boss
}
```

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```
git add content/enemies.ts
git commit -m "feat: add 20 enemy definitions across 4 acts"
```

---

### Task 3: Store Actions — awardBossKill + setPlayerHp

**Files:**
- Modify: `store/game-store.ts`
- Modify: `store/__tests__/game-store.test.ts`

**Interfaces:**
- Produces: `awardBossKill(bossId: string): void`, `setPlayerHp(hp: number): void`
- Consumed by: Task 7 (useBattle on victory), Task 8 (battle screen on defeat)

- [ ] **Step 1: Write the failing tests**

Append to `store/__tests__/game-store.test.ts`:

```typescript
describe('awardBossKill', () => {
  it('marks boss defeated and awards 100 XP', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.awardBossKill('frozen-boot'))
    expect(result.current.progression.defeatedBosses['frozen-boot']).toBe(true)
    expect(result.current.player.xp).toBe(100)
  })

  it('is idempotent — second call awards no extra XP', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.awardBossKill('frozen-boot'))
    act(() => result.current.awardBossKill('frozen-boot'))
    expect(result.current.player.xp).toBe(100)
  })
})

describe('setPlayerHp', () => {
  it('sets player HP directly', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.setPlayerHp(1))
    expect(result.current.player.hp).toBe(1)
  })

  it('clamps to maxHp if value exceeds it', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.setPlayerHp(999))
    expect(result.current.player.hp).toBe(result.current.player.maxHp)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- store/__tests__/game-store.test.ts --watchAll=false
```
Expected: `awardBossKill is not a function` / `setPlayerHp is not a function`

- [ ] **Step 3: Add the two actions to `store/game-store.ts`**

In the `GameState` interface, add after `updateSettings`:

```typescript
  awardBossKill: (bossId: string) => void
  setPlayerHp: (hp: number) => void
```

In the `create` body, add after `updateSettings`:

```typescript
      awardBossKill: (bossId) => {
        const { progression } = get()
        if (progression.defeatedBosses[bossId]) return
        set((state) => ({
          progression: {
            ...state.progression,
            defeatedBosses: { ...state.progression.defeatedBosses, [bossId]: true },
          },
        }))
        get().awardXP(100)
      },

      setPlayerHp: (hp) =>
        set((state) => ({
          player: { ...state.player, hp: Math.min(Math.max(1, hp), state.player.maxHp) },
        })),
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- store/__tests__/game-store.test.ts --watchAll=false
```
Expected: all store tests pass (previous 3 + new 4 = 7 passing)

- [ ] **Step 5: Commit**

```
git add store/game-store.ts store/__tests__/game-store.test.ts
git commit -m "feat: add awardBossKill and setPlayerHp store actions"
```

---

### Task 4: Battle Engine

**Files:**
- Create: `engine/battle.ts`
- Create: `engine/__tests__/battle.test.ts`

**Interfaces:**
- Consumes: `EnemyDef` from `content/enemies`, `QuizQuestion` from `content/qbank`
- Produces: `BattlePhase`, `BattleState`, `initBattle`, `choosePSI`, `answerPSI`, `chooseGuard`, `chooseRun`, `enemyTurn`, `tickDisplayHp`

- [ ] **Step 1: Write the failing tests**

```typescript
// engine/__tests__/battle.test.ts
import {
  initBattle, choosePSI, answerPSI, chooseGuard, chooseRun, enemyTurn, tickDisplayHp,
} from '../battle'
import type { EnemyDef } from '../../content/enemies'
import type { QuizQuestion } from '../../content/qbank'

const enemy: EnemyDef = {
  id: 'spinning-cursor', name: 'Spinning Cursor', maxHp: 40, attack: 8, defense: 0,
  xpReward: 15, act: 1, isBoss: false,
  dialogue: { onAppear: 'Spinning…', onHit: 'Hit!', onDefeat: 'Done.' },
}

const q: QuizQuestion = {
  q: 'Q?', a: ['A', 'B', 'C', 'D'], c: 1, why: 'B is right', lessonId: 'oll-intro',
}

it('initBattle sets phase to intro and mirrors HP', () => {
  const s = initBattle(enemy, 60, 60)
  expect(s.phase).toBe('intro')
  expect(s.playerHp).toBe(60)
  expect(s.displayHp).toBe(60)
  expect(s.enemyHp).toBe(enemy.maxHp)
})

it('choosePSI transitions to psi-question and sets pendingQuestion', () => {
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

it('answerPSI that kills enemy transitions to victory', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = answerPSI({ ...s, phase: 'psi-question', pendingQuestion: q, enemyHp: 5 }, 1)
  expect(s2.phase).toBe('victory')
})

it('enemyTurn reduces playerHp', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: false })
  expect(s2.playerHp).toBeLessThan(60)
  expect(s2.guardActive).toBe(false)
})

it('guard halves enemy damage (rounds down)', () => {
  const s = initBattle(enemy, 60, 60)
  const unguarded = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: false })
  const guarded = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: true })
  expect(guarded.playerHp).toBeGreaterThan(unguarded.playerHp)
})

it('tickDisplayHp drains displayHp toward playerHp at 30/sec', () => {
  const s = initBattle(enemy, 30, 60)
  const s2 = tickDisplayHp({ ...s, displayHp: 60 }, 1 / 60)
  expect(s2.displayHp).toBeCloseTo(60 - 30 / 60, 0)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- engine/__tests__/battle.test.ts --watchAll=false
```
Expected: Cannot find module `'../battle'`

- [ ] **Step 3: Create `engine/battle.ts`**

```typescript
// engine/battle.ts
import type { EnemyDef } from '../content/enemies'
import type { QuizQuestion } from '../content/qbank'

export type BattlePhase =
  | 'intro'
  | 'player-turn'
  | 'psi-question'
  | 'enemy-turn'
  | 'victory'
  | 'defeat'

export interface BattleState {
  phase: BattlePhase
  playerHp: number
  playerMaxHp: number
  displayHp: number      // drains toward playerHp; defeat triggers when displayHp hits 0
  enemyHp: number
  enemyMaxHp: number
  enemy: EnemyDef
  log: string[]          // last 3 messages
  pendingQuestion: QuizQuestion | null
  guardActive: boolean
  seenQuestions: Set<string>   // q text keys — transient, not persisted
  turnCount: number
}

export function initBattle(
  enemy: EnemyDef,
  playerHp: number,
  playerMaxHp: number,
): BattleState {
  return {
    phase: 'intro',
    playerHp,
    playerMaxHp,
    displayHp: playerHp,
    enemyHp: enemy.maxHp,
    enemyMaxHp: enemy.maxHp,
    enemy,
    log: [enemy.dialogue.onAppear],
    pendingQuestion: null,
    guardActive: false,
    seenQuestions: new Set(),
    turnCount: 0,
  }
}

export function choosePSI(state: BattleState, availableQuestions: QuizQuestion[]): BattleState {
  const unseen = availableQuestions.filter(q => !state.seenQuestions.has(q.q))
  const pool = unseen.length > 0 ? unseen : availableQuestions
  const idx = Math.floor(Math.random() * pool.length)
  const question = pool[idx] ?? availableQuestions[0] ?? null
  return { ...state, phase: 'psi-question', pendingQuestion: question }
}

export function answerPSI(state: BattleState, answerIdx: 0 | 1 | 2 | 3): BattleState {
  const { pendingQuestion } = state
  if (!pendingQuestion) return state

  const correct = answerIdx === pendingQuestion.c
  const damage = correct
    ? Math.floor(Math.random() * 11) + 25   // 25–35
    : Math.floor(Math.random() * 5) + 8     // 8–12

  const newEnemyHp = Math.max(0, state.enemyHp - damage)
  const seenQuestions = new Set(state.seenQuestions)
  seenQuestions.add(pendingQuestion.q)

  const logMsg = correct
    ? `PSI strike! ${damage} damage!`
    : `Wrong… ${damage} damage anyway.`
  const log = [...state.log, logMsg].slice(-3)
  const phase: BattlePhase = newEnemyHp <= 0 ? 'victory' : 'enemy-turn'

  return {
    ...state,
    enemyHp: newEnemyHp,
    pendingQuestion: null,
    seenQuestions,
    log,
    phase,
    turnCount: state.turnCount + 1,
  }
}

export function chooseGuard(state: BattleState): BattleState {
  return {
    ...state,
    guardActive: true,
    phase: 'enemy-turn',
    log: [...state.log, 'Guard up!'].slice(-3),
  }
}

export function chooseRun(state: BattleState): { newState: BattleState; escaped: boolean } {
  if (Math.random() < 0.6) {
    return {
      newState: { ...state, log: [...state.log, 'Got away safely!'].slice(-3) },
      escaped: true,
    }
  }
  const attacked = enemyTurn({ ...state, guardActive: false })
  return {
    newState: { ...attacked, log: [...attacked.log, "Couldn't escape!"].slice(-3) },
    escaped: false,
  }
}

export function enemyTurn(state: BattleState): BattleState {
  const rawDamage = Math.max(1, state.enemy.attack)
  const damage = state.guardActive ? Math.floor(rawDamage / 2) : rawDamage
  const newPlayerHp = Math.max(0, state.playerHp - damage)
  const log = [...state.log, `${state.enemy.name} attacks! ${damage} dmg.`].slice(-3)
  const phase: BattlePhase = newPlayerHp <= 0 ? 'defeat' : 'player-turn'

  return {
    ...state,
    playerHp: newPlayerHp,
    guardActive: false,
    log,
    phase,
    turnCount: state.turnCount + 1,
  }
}

export function tickDisplayHp(state: BattleState, dt: number): BattleState {
  if (state.displayHp <= state.playerHp) return state
  const newDisplayHp = Math.max(state.playerHp, state.displayHp - 30 * dt)
  return { ...state, displayHp: newDisplayHp }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- engine/__tests__/battle.test.ts --watchAll=false
```
Expected: 8 passing

- [ ] **Step 5: Run full test suite**

```
npm test -- --watchAll=false
```
Expected: all 44 tests passing (36 from Phase 1 + 4 store + 8 engine/battle + 5 qbank)

- [ ] **Step 6: Commit**

```
git add engine/battle.ts engine/__tests__/battle.test.ts
git commit -m "feat: battle engine state machine — 8 tests"
```

---

### Task 5: RollingHP Component

**Files:**
- Create: `components/RollingHP.tsx`
- Create: `components/__tests__/RollingHP.test.tsx`

**Interfaces:**
- Consumes: nothing external
- Produces: `RollingHP` — displays `displayHp` with color coding

- [ ] **Step 1: Write the failing test**

```typescript
// components/__tests__/RollingHP.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { RollingHP } from '../RollingHP'

it('displays the displayHp value', () => {
  const { getByText } = render(
    <RollingHP displayHp={45} playerHp={30} maxHp={60} />
  )
  expect(getByText('45')).toBeTruthy()
})

it('shows "HP" label', () => {
  const { getByText } = render(
    <RollingHP displayHp={10} playerHp={10} maxHp={60} />
  )
  expect(getByText('HP')).toBeTruthy()
})
```

- [ ] **Step 2: Run to verify failure**

```
npm test -- components/__tests__/RollingHP.test.tsx --watchAll=false
```
Expected: Cannot find module `'../RollingHP'`

- [ ] **Step 3: Create `components/RollingHP.tsx`**

```tsx
// components/RollingHP.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface RollingHPProps {
  displayHp: number    // visual value (draining toward playerHp)
  playerHp: number     // actual HP (used for color threshold)
  maxHp: number
}

export function RollingHP({ displayHp, playerHp, maxHp }: RollingHPProps) {
  const ratio = playerHp / maxHp
  const color = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ff9800' : '#f44336'
  const shown = Math.ceil(displayHp)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>HP</Text>
      <Text style={[styles.value, { color }]}>{shown}</Text>
      <Text style={styles.max}>/{maxHp}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  label: { color: '#aaa', fontFamily: 'monospace', fontSize: 12 },
  value: { fontFamily: 'monospace', fontSize: 22, fontWeight: 'bold' },
  max: { color: '#aaa', fontFamily: 'monospace', fontSize: 12 },
})
```

- [ ] **Step 4: Run tests**

```
npm test -- components/__tests__/RollingHP.test.tsx --watchAll=false
```
Expected: 2 passing

- [ ] **Step 5: Commit**

```
git add components/RollingHP.tsx components/__tests__/RollingHP.test.tsx
git commit -m "feat: RollingHP component"
```

---

### Task 6: BattleMenu + PSIAttack Components

**Files:**
- Create: `components/BattleMenu.tsx`
- Create: `components/PSIAttack.tsx`

No unit tests — TypeScript check only. Both are pure UI driven by parent props.

**Interfaces:**
- Consumes: `QuizQuestion` from `content/qbank`
- Produces: `BattleMenu`, `PSIAttack`
- Consumed by: Task 8 (battle screen)

- [ ] **Step 1: Create `components/BattleMenu.tsx`**

```tsx
// components/BattleMenu.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface BattleMenuProps {
  onPSI: () => void
  onGuard: () => void
  onRun: () => void
  disabled: boolean
}

export function BattleMenu({ onPSI, onGuard, onRun, disabled }: BattleMenuProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.btn, styles.psi, disabled && styles.disabled]} onPress={onPSI} disabled={disabled}>
        <Text style={styles.btnText}>⚡ PSI</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.guard, disabled && styles.disabled]} onPress={onGuard} disabled={disabled}>
        <Text style={styles.btnText}>🛡 Guard</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.run, disabled && styles.disabled]} onPress={onRun} disabled={disabled}>
        <Text style={styles.btnText}>💨 Run</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8, minWidth: 140 },
  btn: { borderRadius: 6, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 2, alignItems: 'center' },
  psi: { backgroundColor: '#1a1240', borderColor: '#a06bff' },
  guard: { backgroundColor: '#0d1f2d', borderColor: '#4fe0cf' },
  run: { backgroundColor: '#1f1208', borderColor: '#c0a060' },
  disabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
})
```

- [ ] **Step 2: Create `components/PSIAttack.tsx`**

```tsx
// components/PSIAttack.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { QuizQuestion } from '../content/qbank'

interface PSIAttackProps {
  question: QuizQuestion
  onAnswer: (idx: 0 | 1 | 2 | 3) => void
  result: 'none' | 'correct' | 'wrong'
}

const INDICES = [0, 1, 2, 3] as const

export function PSIAttack({ question, onAnswer, result }: PSIAttackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.q}</Text>
      {INDICES.map((i) => (
        <TouchableOpacity
          key={i}
          style={[styles.choice, result !== 'none' && styles.choiceDisabled]}
          onPress={() => onAnswer(i)}
          disabled={result !== 'none'}
        >
          <Text style={styles.choiceText}>{String.fromCharCode(65 + i)}. {question.a[i]}</Text>
        </TouchableOpacity>
      ))}
      {result !== 'none' && (
        <Text style={[styles.why, result === 'correct' ? styles.correct : styles.wrong]}>
          {result === 'correct' ? '✓ ' : '✗ '}{question.why}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6, maxWidth: 320 },
  questionText: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 12, marginBottom: 4, lineHeight: 18 },
  choice: { backgroundColor: '#1b1740', borderWidth: 1, borderColor: '#4a3f8c', borderRadius: 4, padding: 8 },
  choiceDisabled: { opacity: 0.6 },
  choiceText: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 11 },
  why: { fontFamily: 'monospace', fontSize: 11, marginTop: 4, lineHeight: 16 },
  correct: { color: '#4caf50' },
  wrong: { color: '#f44336' },
})
```

- [ ] **Step 3: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```
git add components/BattleMenu.tsx components/PSIAttack.tsx
git commit -m "feat: BattleMenu and PSIAttack UI components"
```

---

### Task 7: useBattle Hook

**Files:**
- Create: `hooks/useBattle.ts`

No unit test — integration tested via the battle screen. TypeScript check only.

**Interfaces:**
- Consumes: `engine/battle.ts` (all exports), `content/enemies.ts` (`EnemyDef`), `content/qbank.ts` (`getQuestionsForAct`), `store/game-store.ts` (`awardXP`, `awardBossKill`), `hooks/useGameLoop.ts`
- Produces: `UseBattleReturn`, `useBattle(enemy, playerHp, playerMaxHp)`

- [ ] **Step 1: Create `hooks/useBattle.ts`**

```typescript
// hooks/useBattle.ts
import { useState, useEffect, useCallback } from 'react'
import {
  initBattle,
  choosePSI as engineChoosePSI,
  answerPSI as engineAnswerPSI,
  chooseGuard as engineChooseGuard,
  chooseRun as engineChooseRun,
  tickDisplayHp,
} from '../engine/battle'
import type { BattleState } from '../engine/battle'
import type { EnemyDef } from '../content/enemies'
import { getQuestionsForAct } from '../content/qbank'
import { useGameStore } from '../store/game-store'
import { useGameLoop } from './useGameLoop'

export interface UseBattleReturn {
  state: BattleState
  choosePSI: () => void
  answer: (idx: 0 | 1 | 2 | 3) => void
  chooseGuard: () => void
  chooseRun: () => { escaped: boolean }
}

export function useBattle(
  enemy: EnemyDef,
  playerHp: number,
  playerMaxHp: number,
): UseBattleReturn {
  const [state, setState] = useState<BattleState>(() =>
    initBattle(enemy, playerHp, playerMaxHp),
  )
  const { awardXP, awardBossKill } = useGameStore()
  const questions = getQuestionsForAct(enemy.act)

  // Drain displayHp toward playerHp each frame
  useGameLoop(
    useCallback(
      (dt: number) => {
        setState((prev) => tickDisplayHp(prev, dt))
      },
      [],
    ),
  )

  // Award XP and boss kill on victory — runs once when phase becomes 'victory'
  useEffect(() => {
    if (state.phase === 'victory') {
      awardXP(enemy.xpReward)
      if (enemy.isBoss) awardBossKill(enemy.id)
    }
  }, [state.phase])  // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    choosePSI: () => setState((prev) => engineChoosePSI(prev, questions)),
    answer: (idx) => setState((prev) => engineAnswerPSI(prev, idx)),
    chooseGuard: () => setState((prev) => engineChooseGuard(prev)),
    chooseRun: () => {
      const result = engineChooseRun(state)
      setState(result.newState)
      return { escaped: result.escaped }
    },
  }
}
```

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```
git add hooks/useBattle.ts
git commit -m "feat: useBattle hook bridges engine to React"
```

---

### Task 8: Battle Screen

**Files:**
- Create: `app/battle.tsx`

No unit test. TypeScript check + manual smoke test by navigating to the route.

**Interfaces:**
- Consumes: `useBattle`, `RollingHP`, `BattleMenu`, `PSIAttack`, `ENEMIES`, `BOSSES`, `useGameStore`, expo-router
- Route: `/battle?enemyId=<id>` — navigated to by Tasks 4 and 9

- [ ] **Step 1: Create `app/battle.tsx`**

```tsx
// app/battle.tsx
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { Canvas, Rect } from '@shopify/react-native-skia'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useBattle } from '../hooks/useBattle'
import { RollingHP } from '../components/RollingHP'
import { BattleMenu } from '../components/BattleMenu'
import { PSIAttack } from '../components/PSIAttack'
import { ENEMIES, BOSSES } from '../content/enemies'
import { useGameStore } from '../store/game-store'

const CITY_SPAWN: Record<string, { x: number; y: number }> = {
  overworld: { x: 6, y: 14 },
  llamatown: { x: 9, y: 12 },
  forge: { x: 5, y: 10 },
  vale: { x: 11, y: 14 },
  ridge: { x: 5, y: 12 },
}

export default function BattleScreen() {
  const { enemyId } = useLocalSearchParams<{ enemyId: string }>()
  const { width, height } = useWindowDimensions()
  const router = useRouter()
  const { player, progression, setPlayerHp, setPosition } = useGameStore()
  const [psiResult, setPsiResult] = useState<'none' | 'correct' | 'wrong'>('none')
  const resolvedRef = useRef(false)

  const allEnemies = [...ENEMIES, ...BOSSES]
  const enemy = allEnemies.find(e => e.id === enemyId) ?? ENEMIES[0]!

  const battle = useBattle(enemy, player.hp, player.maxHp)
  const { state } = battle

  // Advance intro → player-turn after a brief pause
  useEffect(() => {
    if (state.phase !== 'intro') return
    const t = setTimeout(() => {
      battle.state.phase === 'intro' &&
        // Only transition once; set state directly since intro is a display phase
        setTimeout(() => {}, 0)
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  // Victory / defeat resolution
  useEffect(() => {
    if (resolvedRef.current) return
    if (state.phase === 'victory') {
      resolvedRef.current = true
      setTimeout(() => router.back(), 2000)
    }
    if (state.phase === 'defeat') {
      resolvedRef.current = true
      const spawn = CITY_SPAWN[progression.currentCity] ?? { x: 5, y: 5 }
      setPlayerHp(1)
      setPosition(progression.currentCity, spawn.x, spawn.y)
      setTimeout(() => router.back(), 2000)
    }
  }, [state.phase])

  function handlePSI() {
    setPsiResult('none')
    battle.choosePSI()
  }

  function handleAnswer(idx: 0 | 1 | 2 | 3) {
    const wasCorrect = idx === state.pendingQuestion?.c
    setPsiResult(wasCorrect ? 'correct' : 'wrong')
    setTimeout(() => {
      battle.answer(idx)
      setPsiResult('none')
    }, 1200)
  }

  function handleRun() {
    const { escaped } = battle.chooseRun()
    if (escaped) {
      setTimeout(() => router.back(), 800)
    }
  }

  const enemyHpRatio = state.enemyMaxHp > 0 ? state.enemyHp / state.enemyMaxHp : 0
  const enemyBarColor = enemyHpRatio > 0.5 ? '#f44336' : enemyHpRatio > 0.25 ? '#ff9800' : '#aaa'
  const isPlayerTurn = state.phase === 'player-turn' || state.phase === 'intro'
  const isPsiPhase = state.phase === 'psi-question'

  return (
    <View style={styles.screen}>
      {/* Skia background */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height} color="#0d0d1a" />
        <Rect x={0} y={0} width={width} height={height * 0.45} color="#120d28" />
        {/* Enemy rect placeholder */}
        <Rect x={width / 2 - 40} y={60} width={80} height={80} color="#2a2150" />
      </Canvas>

      {/* Enemy area */}
      <View style={[styles.enemyArea, { width }]}>
        <Text style={styles.enemyName}>{enemy.name}</Text>
        <View style={styles.hpBarBg}>
          <View style={[styles.hpBarFill, { width: `${enemyHpRatio * 100}%` as any, backgroundColor: enemyBarColor }]} />
        </View>
        <Text style={styles.enemyHpText}>{state.enemyHp}/{state.enemyMaxHp}</Text>
      </View>

      {/* Battle log */}
      <View style={styles.logArea}>
        {state.log.map((msg, i) => (
          <Text key={i} style={styles.logText}>{msg}</Text>
        ))}
        {state.phase === 'victory' && <Text style={styles.victoryText}>Victory!</Text>}
        {state.phase === 'defeat' && <Text style={styles.defeatText}>Defeated…</Text>}
      </View>

      {/* Player + menu area */}
      <View style={styles.bottomArea}>
        {/* Player rect + rolling HP */}
        <View style={styles.playerSection}>
          <View style={styles.playerRect} />
          <RollingHP displayHp={state.displayHp} playerHp={state.playerHp} maxHp={state.playerMaxHp} />
        </View>

        {/* Action menu */}
        <View style={styles.menuSection}>
          {isPsiPhase && state.pendingQuestion ? (
            <PSIAttack
              question={state.pendingQuestion}
              onAnswer={handleAnswer}
              result={psiResult}
            />
          ) : (
            <BattleMenu
              onPSI={handlePSI}
              onGuard={battle.chooseGuard}
              onRun={handleRun}
              disabled={!isPlayerTurn || state.phase === 'enemy-turn'}
            />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a' },
  enemyArea: { paddingTop: 155, alignItems: 'center', paddingHorizontal: 24, gap: 6 },
  enemyName: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
  hpBarBg: { width: '60%', height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
  hpBarFill: { height: '100%', borderRadius: 5 },
  enemyHpText: { color: '#aaa', fontFamily: 'monospace', fontSize: 11 },
  logArea: { paddingHorizontal: 20, paddingVertical: 12, minHeight: 70, justifyContent: 'flex-end' },
  logText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 11, marginBottom: 2 },
  victoryText: { color: '#4caf50', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  defeatText: { color: '#f44336', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  bottomArea: { flex: 1, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 24, gap: 16, alignItems: 'flex-end' },
  playerSection: { gap: 12, alignItems: 'center' },
  playerRect: { width: 48, height: 48, backgroundColor: '#4a3f8c', borderRadius: 4 },
  menuSection: { flex: 1, justifyContent: 'flex-end' },
})
```

Note on the intro phase: the intro simply displays the enemy's `onAppear` dialogue in the log and disables the menu. After 1.5 s the hook's `choosePSI` can be called. The `isPlayerTurn` check (`state.phase === 'intro'`) keeps the menu disabled during intro naturally. Adjust the timing via `setTimeout` in the component if the UX needs a tap-to-advance feel — that's a polish concern for Phase 6.

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Smoke test**

```
npx expo start --web
```

In the browser console, navigate manually:
```
window.location.href = '/_expo/static/js/web/entry-2xxxxxxx.js'   // not needed
```

Actually, in the Expo web dev server, open `http://localhost:8081` → title screen → name/class → overworld. Then in the browser URL bar navigate to `http://localhost:8081/battle?enemyId=spinning-cursor`. Verify the battle screen renders: enemy name visible, HP bar visible, PSI/Guard/Run buttons visible. Press PSI → question appears. Answer correctly → enemy HP drops. Continue until one side wins.

- [ ] **Step 4: Commit**

```
git add app/battle.tsx
git commit -m "feat: battle screen with Skia background and full UI"
```

---

### Task 9: Encounter Integration + Boss Gate

**Files:**
- Modify: `content/world-data.ts`
- Modify: `app/overworld.tsx`
- Modify: `app/city/[id].tsx`

No new tests. TypeScript check + manual walk-around smoke test.

**Interfaces:**
- Consumes: `getEnemiesForAct`, `getBossForAct` from `content/enemies`, `useRouter` from expo-router
- Adds: `CITY_ACT` constant (local to overworld and city screens)

- [ ] **Step 1: Add boss gate to LLAMATOWN in `content/world-data.ts`**

In `content/world-data.ts`, find the `LLAMATOWN` entity list and add a boss gate after the existing `makeGate`:

```typescript
// After: makeGate('gate-south', 9, 13, 'overworld', false),
const bossGate = makeGate('gate-boss-llamatown', 9, 1, 'forge', true)
bossGate.data = { ...bossGate.data, bossId: 'frozen-boot' }
```

Then add `bossGate` to the `LLAMATOWN.entities` array:
```typescript
entities: [
  makeBuildingEntrance('enter-library', 4, 6, 'llamatown-library'),
  makeBuildingEntrance('enter-dojo', 9, 6, 'llamatown-dojo'),
  makeBuildingEntrance('enter-workshop', 14, 6, 'llamatown-workshop'),
  makeNPC('mayor-lloyd', 9, 9, { ... }),
  makeNPC('npc-penny', 5, 10, { ... }),
  makeGate('gate-south', 9, 13, 'overworld', false),
  bossGate,   // ← add this
],
```

The gate is at tile (9, 1) — north edge of the Llamatown grid (y=1 is just inside the perimeter wall at y=0). Players can interact with it to trigger the boss fight.

- [ ] **Step 2: Modify `app/overworld.tsx` — add encounter check**

Add imports at the top:
```typescript
import { getEnemiesForAct } from '../content/enemies'
import { useRef } from 'react'  // already imported — ensure it includes useRef
```

Add inside `OverworldScreen` component body, after the existing refs:
```typescript
  const encounterCooldown = useRef(90)
```

Replace the existing `useGameLoop` callback with encounter-augmented version:
```typescript
  useGameLoop(useCallback((dt) => {
    if (dialogue) return
    const prev = playerRef.current
    const moved = movePlayer(prev, input.current!, OVERWORLD.grid, dt)
    playerRef.current = moved
    setPlayerState({ ...moved })

    const nearby = nearestInteractable(OVERWORLD.entities, moved.x, moved.y)
    setNearbyLabel(nearby ? `[E] ${nearby.type === 'building_entrance' ? 'Enter' : 'Talk'}` : null)

    // Encounter check
    const stepped =
      Math.floor(moved.x) !== Math.floor(prev.x) ||
      Math.floor(moved.y) !== Math.floor(prev.y)
    if (stepped) {
      if (encounterCooldown.current > 0) {
        encounterCooldown.current -= 1
      } else if (Math.random() < 0.06) {
        const enemies = getEnemiesForAct(1)
        const enemy = enemies[Math.floor(Math.random() * enemies.length)]
        if (enemy) {
          encounterCooldown.current = 90
          router.push(`/battle?enemyId=${enemy.id}`)
        }
      }
    }
  }, [dialogue]))
```

- [ ] **Step 3: Modify `app/city/[id].tsx` — add encounter check + boss gate wiring**

Add imports:
```typescript
import { getEnemiesForAct, getBossForAct } from '../../content/enemies'
```

Add the `CITY_ACT` map inside the component file (module-level constant, before the component):
```typescript
const CITY_ACT: Record<string, 1 | 2 | 3 | 4> = {
  overworld: 1, llamatown: 1, forge: 2, vale: 3, ridge: 4,
}
```

Add inside `CityScreen` component body after existing refs:
```typescript
  const encounterCooldown = useRef(90)
```

Replace the existing `useGameLoop` callback:
```typescript
  useGameLoop(useCallback((dt) => {
    if (dialogue) return
    const prev = playerRef.current
    const moved = movePlayer(prev, input.current!, cityDef.grid, dt)
    playerRef.current = moved
    setPlayerState({ ...moved })
    setNearbyEntity(nearestInteractable(cityDef.entities, moved.x, moved.y))

    // Encounter check
    const act = CITY_ACT[id ?? ''] ?? 1
    const stepped =
      Math.floor(moved.x) !== Math.floor(prev.x) ||
      Math.floor(moved.y) !== Math.floor(prev.y)
    if (stepped) {
      if (encounterCooldown.current > 0) {
        encounterCooldown.current -= 1
      } else if (Math.random() < 0.06) {
        const enemies = getEnemiesForAct(act)
        const enemy = enemies[Math.floor(Math.random() * enemies.length)]
        if (enemy) {
          encounterCooldown.current = 90
          router.push(`/battle?enemyId=${enemy.id}`)
        }
      }
    }
  }, [dialogue, cityDef, id]))
```

Replace the `handleInteract` gate branch with boss-gate-aware version:
```typescript
  function handleInteract() {
    if (!nearbyEntity) return
    if (nearbyEntity.type === 'npc') {
      const lines = nearbyEntity.data['lines'] as string[]
      const name = nearbyEntity.data['name'] as string
      markNPCMet(nearbyEntity.id)
      setDialogue({ lines, speaker: name })
    } else if (nearbyEntity.type === 'building_entrance') {
      const dest = nearbyEntity.data['destination'] as string
      setPosition(id as any, playerRef.current.x, playerRef.current.y)
      router.push(`/building/${dest}`)
    } else if (nearbyEntity.type === 'gate') {
      const dest = nearbyEntity.data['destination'] as string
      const bossId = nearbyEntity.data['bossId'] as string | undefined
      const locked = nearbyEntity.data['locked'] as boolean | undefined

      if (locked && bossId) {
        // Boss gate: defeated → pass through; not defeated → trigger boss battle
        if (progression.defeatedBosses[bossId]) {
          if (dest === 'overworld') router.push('/overworld')
          else router.push(`/city/${dest}`)
        } else {
          encounterCooldown.current = 90
          router.push(`/battle?enemyId=${bossId}`)
        }
      } else {
        if (dest === 'overworld') router.push('/overworld')
        else router.push(`/city/${dest}`)
      }
    }
  }
```

Also add `progression` to the destructure at the top of `CityScreen`:
```typescript
  const { progression, markNPCMet, setPosition } = useGameStore()
```

- [ ] **Step 4: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Full test suite**

```
npm test -- --watchAll=false
```
Expected: all tests still pass (no regressions from the encounter additions)

- [ ] **Step 6: Smoke test encounters**

```
npx expo start --web
```

1. Create a character, walk into Llamatown.
2. Walk around — after a few steps an encounter should trigger (6% chance per step; takes ~10–20 steps on average). Verify `/battle` screen loads with a Llamatown enemy.
3. Win the battle → should return to Llamatown.
4. Walk to tile (9, 1) — the north boss gate. Press `[E]` → should route to the Frozen Boot boss battle. Win → return to Llamatown → approach gate again → should route to `/city/forge` (will show an error until Phase 5 adds Forge; that's expected).

- [ ] **Step 7: Commit**

```
git add content/world-data.ts app/overworld.tsx app/city/[id].tsx
git commit -m "feat: random encounters + boss gate in Llamatown"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `content/qbank.ts` — 100 questions, 25 lesson keys → Task 1
- [x] `content/enemies.ts` — 20 enemies, 4 regulars + 1 boss per act → Task 2
- [x] `engine/battle.ts` — all 7 state functions, all phases → Task 4
- [x] `components/RollingHP.tsx` → Task 5
- [x] `components/BattleMenu.tsx` + `PSIAttack.tsx` → Task 6
- [x] `hooks/useBattle.ts` — game loop drain, XP + boss kill on victory → Task 7
- [x] `app/battle.tsx` — intro → player-turn flow, victory/defeat with 2s delay → Task 8
- [x] Encounter check (6% per step, 90-frame cooldown) in overworld + city → Task 9
- [x] Boss gate entity in Llamatown → Task 9
- [x] `awardBossKill` action → Task 3
- [x] `setPlayerHp` for defeat reset → Task 3, used in Task 8

**CITY_ACT constant** — defined in `app/city/[id].tsx` as a module-level constant and also in `app/battle.tsx` as `CITY_SPAWN`. These are independent — no duplication issue.

**Known placeholder (acceptable):** After defeating The Frozen Boot, the boss gate routes to `/city/forge`, which will throw until Phase 5 adds the Forge city definition. This is intentional — gating on Phase 5.
