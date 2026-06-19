# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Finding Functionality

**Always check `Architecture.md` first** before searching the codebase. It maps every layer, file, export, constant, test suite, and web infrastructure fix. Use it to answer:
- Which file owns feature X?
- What does module Y export?
- Where is constant Z defined?
- Which tests cover component W?

Only search the code directly when `Architecture.md` doesn't cover the detail you need.

---

## Project Overview

**Llama Quest** is a cross-platform Earthbound-style SNES RPG that teaches local AI fundamentals (Ollama, ChromaDB, RAG) through city exploration, turn-based battles, and sandbox labs. Built with Expo SDK 52 (iOS + Android + Web from one codebase).

`localhost-quest.html` in the root is the **original source game** (single-file vanilla JS). It is the content migration source — do not modify it.

## Implementation Roadmap

**Phase 1 is complete.** For all remaining implementation work, the canonical reference is:

```
docs/superpowers/specs/2026-06-19-llama-quest-phases2-6-roadmap.md
```

This document contains:
- Complete TypeScript interfaces for every phase
- Enemy roster, NPC dialogue, sandbox command patterns
- Task-by-task breakdown ready to feed into `writing-plans`
- Full content inventory (25 lessons, 5 sandboxes, 10 diagrams, 8 NPCs)
- Global constraints that apply to all phases

**Progress ledger** (tracks completed tasks and commit ranges):
```
.superpowers/sdd/progress.md
```

### Phase Status

| Phase | Status | Plan File |
|-------|--------|-----------|
| 1 — Foundation | ✅ Complete | `docs/superpowers/plans/2026-06-19-llama-quest-phase1-foundation.md` |
| 2 — Battle System | 🚧 In progress | `docs/superpowers/plans/2026-06-19-llama-quest-phase2-battle.md` |
| 3 — Content Migration | 🔜 Not started | Generate with `writing-plans` from roadmap Phase 3 section |
| 4 — Audio | 🔜 Not started | Generate with `writing-plans` from roadmap Phase 4 section |
| 5 — Remaining Cities | 🔜 Not started | Generate with `writing-plans` from roadmap Phase 5 section |
| 6 — Mobile Polish | 🔜 Not started | Generate with `writing-plans` from roadmap Phase 6 section |

**When a phase completes:** Update the Status column above to `✅ Complete` and add the plan file path. Also mark it done in `.superpowers/sdd/progress.md`.

## Commands

```bash
# Start dev server
npx expo start

# Web only
npx expo start --web

# Run tests (all)
npm test

# Run tests (watch)
npm test -- --watchAll

# Run a single test file
npm test -- engine/__tests__/movement.test.ts

# TypeScript check (no emit)
npx tsc --noEmit

# Install packages (always use --legacy-peer-deps)
npm install <pkg> --legacy-peer-deps
npx expo install <expo-pkg>   # Expo-native packages don't need the flag
```

## Architecture

### Layer Map

```
app/          ← Expo Router screens (title, overworld, city/[id], building/[id])
components/   ← Reusable UI (HUD, DialogueBox, Codex)
renderer/     ← Skia canvas drawing (TilemapRenderer, EntityRenderer, WorldRenderer)
hooks/        ← React integration (useGameLoop, usePlayerInput)
engine/       ← Pure TypeScript game logic (tilemap, entity, movement, camera)
store/        ← Zustand state + AsyncStorage persistence
content/      ← Static game data (lessons, diagrams, world-data)
```

**Key rule:** The `engine/` layer has zero React dependencies. All engine functions are pure (input → output). This keeps them fast and trivially testable.

### Engine (`engine/`)

| File | Exports |
|------|---------|
| `tilemap.ts` | `TileType`, `TileGrid`, `makeTile`, `makeGrid`, `tileAt`, `isWalkable`, `setTile` |
| `entity.ts` | `Entity`, `EntityType`, `Facing`, `makePlayer`, `makeNPC`, `makeBuildingEntrance`, `makeGate`, `nearestInteractable` |
| `movement.ts` | `InputState`, `movePlayer` — axis-separated collision, slides to wall face |
| `camera.ts` | `Camera`, `followEntity`, `clampCamera` |

Walkable tiles: `grass`, `path`, `floor`, `door`. Non-walkable: `forest`, `water`, `building_wall`.

### Store (`store/game-store.ts`)

Zustand with AsyncStorage persistence. Save key: `'llama_quest_v1'` — never change this.

```typescript
type PlayerClass = 'Tinkerer' | 'Scholar' | 'Architect'
type CityId = 'overworld' | 'llamatown' | 'forge' | 'vale' | 'ridge'

// State shape:
player: { name, class, hp, maxHp, level, xp }
progression: { currentCity, position, masteredConcepts, readLessons, metNPCs, completedSandboxes, defeatedBosses }
settings: { musicEnabled, sfxEnabled, masterVolume }

// Actions:
initPlayer(name, cls)       // resets all state to defaults
awardXP(amount)             // auto-levels at 120 XP
markLessonRead(lessonId)    // +20 XP, idempotent
markNPCMet(npcId)           // +8 XP, idempotent
setPosition(city, x, y)
updateSettings(partial)
```

All progression tracking uses `Record<string, boolean>` (never `Set<string>`).

### Content (`content/`)

| File | What's in it |
|------|-------------|
| `lessons.ts` | 6 Act I lessons; `LESSONS[]`, `getLessonsForAct(act)`, `getLessonById(id)` |
| `diagrams.ts` | 5 Act I–II diagrams; `DIAGRAMS: Record<string, DiagramDef>` |
| `world-data.ts` | `OVERWORLD` (40×30) + `LLAMATOWN` (20×15); `getCityDef(id)`, `CityDef` type |

`localhost-quest.html` is the migration source for all remaining content (Acts II–IV lessons, QBANK, sandboxes). Search for `const LESSONS = [` (~line 594) and `const QBANK = {` (~line 1050).

### Renderers (`renderer/`)

All use `@shopify/react-native-skia`. Render colored rect placeholders (sprites wired in Phase 5+).

- `TilemapRenderer` — viewport-culled tile rects; props: `grid, camera, tileSize, width, height`
- `EntityRenderer` — entity rects at 0.8× tile size; same prop shape
- `WorldRenderer` — composes both; accepts `grid, player, entities, tileSize, screenWidth, screenHeight`

### Hooks (`hooks/`)

- `useGameLoop(callback: (dt: number) => void)` — `useFrameCallback` at 60fps; dt capped at 50ms
- `usePlayerInput()` → `{ input: React.RefObject<InputState>, resetInput }` — keyboard on web only

### Screens (`app/`)

| Screen | Route | Purpose |
|--------|-------|---------|
| `index.tsx` | `/` | Title: name input + class select → `/overworld` |
| `overworld.tsx` | `/overworld` | WASD movement, camera, HUD, city entrances |
| `city/[id].tsx` | `/city/llamatown` | Generic city: movement, NPC dialogue, building routing |
| `building/[id].tsx` | `/building/llamatown-library` | Lesson list + Codex reader |

## Key Constants

```typescript
TILE_SIZE = 32          // px per tile
PLAYER_SPEED = 4        // tiles per second
MAX_DT = 0.05           // 50ms delta-time cap (spiral-of-death prevention)
XP_PER_LEVEL = 120
```

XP rewards: lesson read +20, NPC met +8, correct quiz answer +5, concept mastered +40, boss defeated +100, sandbox completed +15.

## Conventions

- **TypeScript strict** + `noUncheckedIndexedAccess: true` — all array/object index access needs `?? fallback`
- **`--legacy-peer-deps`** on all `npm install` calls
- **No arbitrary colors** — reuse palette hex values from existing components
- **Entity IDs**: kebab-case (e.g., `'npc-smith'`); **Lesson IDs**: `'<tech>-<concept>'` (e.g., `'oll-run'`)
- **TDD**: failing test → implement → green → commit

## Testing

36 tests across 6 suites (all passing as of Phase 1):
- `engine/__tests__/` — tilemap, entity, camera, movement
- `store/__tests__/game-store.test.ts` — store actions
- `renderer/__tests__/TilemapRenderer.test.tsx` — Skia rendering (mocked)

Skia is mocked in `__mocks__/@shopify/react-native-skia.js`. AsyncStorage mocked in `__mocks__/@react-native-async-storage/async-storage.js`.

CI runs on every push/PR to `main` via `.github/workflows/ci.yml` (`npm ci --legacy-peer-deps && npm test -- --ci --coverage --watchAll=false`).

## Tech Stack

| Concern | Library | Version |
|---------|---------|---------|
| Framework | Expo (managed) | ~52.0 |
| Navigation | expo-router | ~4.0 |
| Rendering | @shopify/react-native-skia | 1.5.0 |
| Game loop | react-native-reanimated `useFrameCallback` | ~3.16 |
| State | zustand + AsyncStorage | ^5.0 |
| Testing | jest-expo + @testing-library/react-native | ~52.0 / ^12.4 |

## Web / Expo Dev Server — Known Issues & Fixes

These issues have been debugged and fixed; do not re-investigate or revert.

### Node 24 + react-native-reanimated plugin
`react-native-reanimated` config plugin fails under Node 24 (ESM/CJS conflict). Fix: remove `"react-native-reanimated"` from `app.json` plugins. The Babel plugin in `babel.config.js` handles worklet transforms — the config plugin isn't needed.

### Skia WASM — "Aborted(both async and sync fetching of the wasm failed)"
Metro doesn't serve `.wasm` files. Fix: `metro.config.js` intercepts `GET /canvaskit.wasm` and pipes `node_modules/canvaskit-wasm/bin/full/canvaskit.wasm` directly. **Do not use a CDN** (`locateFile` CDN approach) — the Accenture corporate network blocks external CDNs.

### Skia — "Cannot read properties of undefined (reading 'Matrix')"
Root cause: `@shopify/react-native-skia/lib/module/skia/Skia.web.js` runs `export const Skia = JsiSkApi(global.CanvasKit)` at Metro bundle load time, before `LoadSkiaWeb()` has set `global.CanvasKit`. The Skia API object permanently closes over `undefined`.

Fix (two parts, both in `metro.config.js`):
1. Serve `canvaskit.wasm` locally (see above) so `LoadSkiaWeb()` resolves.
2. `resolver.resolveRequest` redirects any resolution to `Skia.web.js` → `patches/SkiaWeb.js`, which uses a Proxy that defers `JsiSkApi(global.CanvasKit)` until the first property access (by which time the WASM has loaded).

`app/_layout.tsx` blocks the navigation Stack behind a `skiaReady` gate — `LoadSkiaWeb()` must resolve before any Canvas renders.

**After any change to `metro.config.js`**: restart the dev server fully (`Ctrl+C` → `npx expo start --web`). Metro caches the config.

### Missing web dependencies (one-time installs, already done)
- `react-dom`, `react-native-web` — required by Expo web bundler
- `react-native-safe-area-context` — required by expo-router
- `react-native-screens` — reinstalled to restore missing `utils.js` on web

---

**Last updated**: 2026-06-19 · Phase 2 in progress (Tasks 1–8 of 9 complete, 65 tests) · See roadmap for Phases 2–6
