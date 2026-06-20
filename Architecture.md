# Llama Quest — Architecture Reference

Quick-navigation map for the entire codebase. Read this before searching for a feature.

---

## Layer Map

```
app/             ← Expo Router screens (routes)
audio/           ← AudioManager singleton + Tone.js themes + SFX (Phase 4)
components/      ← Reusable UI widgets
renderer/        ← Skia canvas drawing
hooks/           ← React integration hooks
engine/          ← Pure TS game logic (zero React deps)
store/           ← Zustand state + AsyncStorage persistence
content/         ← Static game data
patches/         ← Metro module overrides (web fixes)
```

**Key rule:** `engine/` has zero React dependencies. All engine functions are pure (input → output). This keeps them fast and trivially testable.

---

## engine/ — Pure TypeScript Game Logic

| File | Exports | What it does |
|------|---------|-------------|
| `tilemap.ts` | `TileType`, `TileGrid`, `makeTile`, `makeGrid`, `tileAt`, `isWalkable`, `setTile` | Grid-based tile map; walkable check |
| `entity.ts` | `Entity`, `EntityType`, `Facing`, `makePlayer`, `makeNPC`, `makeBuildingEntrance`, `makeGate`, `nearestInteractable` | Player/NPC/door entities |
| `movement.ts` | `InputState`, `movePlayer` | Axis-separated collision; slides to wall face |
| `camera.ts` | `Camera`, `followEntity`, `clampCamera` | Camera tracks player, clamped to world bounds |
| `battle.ts` | `BattlePhase`, `BattleState`, `initBattle`, `choosePSI`, `answerPSI`, `chooseGuard`, `chooseRun`, `enemyTurn`, `tickDisplayHp` | Turn-based battle state machine |

Walkable tiles: `grass`, `path`, `floor`, `door`. Non-walkable: `forest`, `water`, `building_wall`.

---

## store/ — Global State

**File:** `store/game-store.ts`  
Zustand + AsyncStorage. Save key: `'llama_quest_v1'` — never change this.

```typescript
// State shape
player:      { name, class, hp, maxHp, level, xp }
progression: { currentCity, position, masteredConcepts, readLessons,
               metNPCs, completedSandboxes, defeatedBosses }
settings:    { musicEnabled, sfxEnabled, masterVolume }

// Actions
initPlayer(name, cls)       // resets all state
awardXP(amount)             // auto-levels at 120 XP
awardBossKill(bossId)       // +100 XP, idempotent
setPlayerHp(hp)             // clamps to [1, maxHp]
markLessonRead(lessonId)    // +20 XP, idempotent
markNPCMet(npcId)           // +8 XP, idempotent
setPosition(city, x, y)
updateSettings(partial)
```

All progression tracking uses `Record<string, boolean>` (never `Set<string>`).

---

## content/ — Static Game Data

| File | What's in it |
|------|-------------|
| `lessons.ts` | 25 lessons (Acts I–IV); `LESSONS[]`, `getLessonsForAct(act)`, `getLessonById(id)` |
| `diagrams.ts` | 10 diagrams (Acts I–IV); `DIAGRAMS: Record<string, DiagramDef>` |
| `world-data.ts` | `OVERWORLD` (40×30) + `LLAMATOWN` (20×15) + `FORGE` (20×18) + `CAVERNS` (22×18) + `CONVERGENCE` (20×16); `getCityDef(id)`, `CityDef` type; `ACT_CONCEPTS`, `isActMastered(act, masteredConcepts)`, `isGateUnlocked(fromAct, masteredConcepts, defeatedBosses)` |
| `qbank.ts` | 100 quiz questions (25 lessons × 4); `QBANK`, `getQuestionsForAct(act)`, `getQuestionsForLesson(id)` |
| `enemies.ts` | 20 enemy defs; `ENEMIES[]`, `BOSSES[]`, `getEnemiesForAct(act)`, `getBossForAct(act)` |
| `sandboxes.ts` | 5 sandbox project defs; `SANDBOXES`, `getSandboxDef(id)` — ids: `firstchat`, `modelfile`, `api`, `collection`, `rag` |

**Bosses:** `frozen-boot` (Act 1, 120 HP), `rate-limiter` (Act 2, 150 HP), `dimensionless-beast` (Act 3, 180 HP), `hallucinator` (Act 4, 220 HP).

---

## components/ — UI Widgets

| File | Props | What it renders |
|------|-------|----------------|
| `HUD.tsx` | `player` | Top-bar: name, class, HP bar, level, XP bar |
| `DialogueBox.tsx` | `lines`, `onDone` | Typewriter dialogue with advance-on-tap |
| `Codex.tsx` | `lesson` | Full lesson reader (title, blocks) |
| `RollingHP.tsx` | `displayHp`, `playerHp`, `maxHp` | Animated draining HP counter (color-coded) |
| `BattleMenu.tsx` | `onPSI`, `onGuard`, `onRun`, `disabled` | Three battle action buttons |
| `PSIAttack.tsx` | `question`, `onAnswer(idx)`, `result` | Quiz question with A–D choices + feedback |
| `Terminal.tsx` | `sandbox`, `completedObjectives`, `onObjectiveDone`, `onAllDone` | Simulated bash/Python REPL with objectives panel |

**Color palette** (reuse these, no arbitrary colors):
- `#4caf50` green HP / `#ff9800` amber HP / `#f44336` red HP / `#aaa` secondary
- `#1a1a2e` background dark / `#c0a060` gold text / `#0f3460` panel blue

---

## renderer/ — Skia Canvas Drawing

All use `@shopify/react-native-skia`. Render colored rect placeholders (sprites Phase 5+).

| File | Props | What it renders |
|------|-------|----------------|
| `TilemapRenderer.tsx` | `grid, camera, tileSize, width, height` | Viewport-culled tile rects |
| `EntityRenderer.tsx` | `entities, camera, tileSize` | Entity rects at 0.8× tile size |
| `WorldRenderer.tsx` | `grid, player, entities, tileSize, screenWidth, screenHeight` | Composes both; owns the Skia Canvas |

---

## hooks/

| File | Signature | What it does |
|------|-----------|-------------|
| `useGameLoop.ts` | `useGameLoop(callback: (dt: number) => void)` | `useFrameCallback` at 60 fps; dt capped at 50 ms |
| `usePlayerInput.ts` | `() → { input: Ref<InputState>, resetInput }` | Keyboard WASD on web |
| `useBattle.ts` | `useBattle(enemy, playerHp, playerMaxHp) → UseBattleReturn` | Wires battle engine to React; handles XP/HP persistence; fires hit/victory SFX via useEffect |

**`useBattle` return:** `{ state, choosePSI, answer(idx), chooseGuard, chooseRun }`.  
XP: boss kill +100 (via `awardBossKill`), enemy defeated +`enemy.xpReward`, correct PSI +5.  
HP: persisted on victory + escape; NOT written on defeat.

---

## app/ — Screens (expo-router)

| File | Route | Purpose |
|------|-------|---------|
| `_layout.tsx` | root | GestureHandlerRootView + Stack; blocks until Skia WASM loads on web |
| `index.tsx` | `/` | Title: name input + class select → `/overworld` |
| `overworld.tsx` | `/overworld` | WASD movement, camera, HUD, city entrances |
| `city/[id].tsx` | `/city/:id` | City: movement, NPC dialogue, building routing |
| `building/[id].tsx` | `/building/:id` | Lesson list + Codex reader |
| `battle.tsx` | `/battle?enemyId=` | Battle screen: `useBattle` + all battle UI components |
| `sandbox/[id].tsx` | `/sandbox/:id` | Sandbox lab: `Terminal` component + objective tracking |

---

## Key Constants

```typescript
TILE_SIZE = 32          // px per tile
PLAYER_SPEED = 4        // tiles per second
MAX_DT = 0.05           // 50 ms delta-time cap
XP_PER_LEVEL = 120

// XP rewards
lesson read       +20
NPC met           +8
correct PSI       +5
concept mastered  +40
boss defeated     +100
sandbox completed +15
```

---

## audio/ — Music and SFX (Phase 4)

| File | Exports | What it does |
|------|---------|-------------|
| `AudioManager.ts` | `AudioManager` (singleton), `AudioManagerImpl` (class), `TrackId` | Platform-aware play/stop/sfx/settings; Tone.js on web, expo-av on native |
| `sfx.ts` | `SFX_MAP` | 7 one-shot Tone.js SFX: `levelUp`, `hit`, `miss`, `npcBlip`, `menuMove`, `victory`, `escape` |
| `themes/llamatown.ts` | `start(volume)`, `stop()` | C major pentatonic, 72 BPM, triangle; second layer at 30s |
| `themes/overworld.ts` | `start(volume)`, `stop()` | G major pentatonic, 80 BPM, square; second layer at 30s |
| `themes/forge.ts` | `start(volume)`, `stop()` | D minor, 90 BPM, sawtooth; second layer at 30s |
| `themes/caverns.ts` | `start(volume)`, `stop()` | A minor arpeggios, 60 BPM, sine; second layer at 30s |
| `themes/convergence.ts` | `start(volume)`, `stop()` | C major, 80 BPM, triangle dual-layer (immediate) |
| `themes/battle.ts` | `start(volume)`, `stop()` | B diminished, 120 BPM, square+sawtooth dual-layer (immediate) |

**TrackId:** `'overworld' | 'llamatown' | 'forge' | 'caverns' | 'convergence' | 'battle'`

**SFX wiring:** `npcBlip` fires on NPC dialogue open (city screens); `hit` fires when enemy turn completes (useBattle useEffect); `victory` fires on battle win (battle.tsx useEffect); `levelUp` fires in `awardXP` level-up branch.

**Settings:** `AudioManager.setMusicEnabled(v)`, `AudioManager.setSfxEnabled(v)`, `AudioManager.setVolume(v)` are called from `store/game-store.ts` `updateSettings` action.

**Mocks:** `__mocks__/tone.js`, `__mocks__/expo-av.js` for Jest.

---

## Tests (116 total, all passing as of Phase 4)

| Suite | File | Count |
|-------|------|-------|
| Tilemap engine | `engine/__tests__/tilemap.test.ts` | — |
| Entity engine | `engine/__tests__/entity.test.ts` | — |
| Camera engine | `engine/__tests__/camera.test.ts` | — |
| Movement engine | `engine/__tests__/movement.test.ts` | — |
| Battle engine | `engine/__tests__/battle.test.ts` | 8 |
| Game store | `store/__tests__/game-store.test.ts` | 9 |
| TilemapRenderer | `renderer/__tests__/TilemapRenderer.test.tsx` | — |
| QBANK content | `content/__tests__/qbank.test.ts` | 5 |
| RollingHP | `components/__tests__/RollingHP.test.tsx` | 2 |
| BattleMenu | `components/__tests__/BattleMenu.test.tsx` | 7 |
| Battle screen | `app/__tests__/battle.test.tsx` | 3 |

Mocks: `__mocks__/@shopify/react-native-skia.js`, `__mocks__/@react-native-async-storage/async-storage.js`, `__mocks__/tone.js`, `__mocks__/expo-av.js`

---

## Web Infrastructure (metro.config.js + patches/)

Two Metro overrides, both required for Skia to work on web:

1. **WASM middleware** — intercepts `GET /canvaskit.wasm`, pipes file from `node_modules/canvaskit-wasm/bin/full/`. Metro doesn't serve `.wasm` natively.

2. **Skia lazy-proxy** (`patches/SkiaWeb.js`) — replaces `Skia.web.js` via `resolver.resolveRequest`. The original file runs `JsiSkApi(global.CanvasKit)` at bundle-load time before `LoadSkiaWeb()` has set `global.CanvasKit`. The patch defers `JsiSkApi` creation to first property access via a Proxy.

**After any `metro.config.js` change:** restart the dev server fully.

---

## content/world-data.ts — Gate Unlock System (Phase 5)

| Export | Signature | What it does |
|--------|-----------|-------------|
| `ACT_CONCEPTS` | `Record<1\|2\|3\|4, string[]>` | Maps act number → required lesson IDs for mastery |
| `isActMastered` | `(act, masteredConcepts) → boolean` | True when all act lesson IDs are in masteredConcepts |
| `isGateUnlocked` | `(fromAct, masteredConcepts, defeatedBosses) → boolean` | True when act mastered AND act boss defeated |

**Boss IDs by act:** `frozen-boot` (1), `rate-limiter` (2), `dimensionless-beast` (3), `hallucinator` (4).

**Locked gate message** (shown by city/[id].tsx): `"Gate locked — read all Act N lessons and defeat the boss to proceed."`

---

*Updated: 2026-06-19 · Phase 5 complete (116 tests) · Phase 6 next*
