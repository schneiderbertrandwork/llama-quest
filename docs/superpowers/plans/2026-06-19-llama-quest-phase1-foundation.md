# Llama Quest — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a working Expo project where a player can walk around the Llamatown overworld, enter the city exterior, enter the Library building, and read an Act I lesson — with state persisted between sessions.

**Architecture:** Single Expo managed-workflow project using `expo-router` for screen navigation, `@shopify/react-native-skia` for GPU-accelerated tile rendering, `react-native-reanimated` `useFrameCallback` for the 60 fps game loop, and Zustand for persisted game state. The `engine/` layer is pure TypeScript with zero React/React Native imports — all rendering is delegated to `renderer/`. Each screen is a thin coordinator that wires engine + renderer + store.

**Tech Stack:** Expo SDK 52 (managed), expo-router v4, @shopify/react-native-skia 1.x, react-native-reanimated 3.x, react-native-gesture-handler 2.x, zustand 5.x, @react-native-async-storage/async-storage 2.x, TypeScript 5 strict mode, jest-expo for testing.

## Global Constraints

- Expo SDK version: 52 exactly — do not use SDK 53+ (peer dep chain not settled)
- TypeScript: strict mode on, `"noUncheckedIndexedAccess": true` in tsconfig
- All game engine files in `engine/` must have zero React/React Native imports
- Save key: `llama_quest_v1` (AsyncStorage / localStorage)
- Tile coordinate system: integer `(x, y)` where `(0,0)` is top-left; tile size = 32 px
- Player speed: 4 tiles/second
- Game loop: cap delta time at 50 ms to prevent spiral-of-death on tab blur
- All `Record<string, boolean>` fields in game state (not `Set<>` — not JSON-serializable)
- XP per lesson read: 20; per NPC met: 8
- Phase 1 delivers placeholder colored-rect tiles only — sprite pack wiring is Phase 5

---

## File Map

Files created in this phase (in dependency order):

```
engine/
  tilemap.ts              # Tile types, TileGrid, tileAt, isWalkable
  entity.ts               # Entity types, PlayerEntity, NPCEntity
  camera.ts               # Camera type, followEntity, clampCamera
  movement.ts             # movePlayer, collision resolution
  __tests__/
    tilemap.test.ts
    entity.test.ts
    camera.test.ts
    movement.test.ts

store/
  game-store.ts           # Zustand store: player, progression, settings
  __tests__/
    game-store.test.ts

hooks/
  useGameLoop.ts          # useFrameCallback wrapper with dt
  usePlayerInput.ts       # Keyboard (web) + placeholder touch (native)

renderer/
  TilemapRenderer.tsx     # Skia Canvas: colored-rect tiles from TileGrid
  EntityRenderer.tsx      # Skia: player + NPC colored rects with facing indicator
  WorldRenderer.tsx       # Composes TilemapRenderer + EntityRenderer + camera
  __tests__/
    TilemapRenderer.test.tsx

content/
  world-data.ts           # Overworld TileGrid + Llamatown city definition
  lessons.ts              # Act I lessons (migrated from original, all 14)
  diagrams.ts             # SVG diagram definitions (migrated)

components/
  DialogueBox.tsx         # Earthbound-style bordered text window
  HUD.tsx                 # HP bar, XP, level (reads from game-store)
  Codex.tsx               # Block renderer: h2/p/ul/code/tip/warn/diagram

app/
  _layout.tsx             # Root Expo Router layout (gesture handler + reanimated)
  index.tsx               # Title screen: name input + class select
  overworld.tsx           # Overworld: WorldRenderer + game loop + input
  city/
    [id].tsx              # City exterior (Llamatown): WorldRenderer + game loop
  building/
    [id].tsx              # Building interior: Codex viewer (Library)

jest.config.js
jest.setup.ts
__mocks__/
  @shopify/
    react-native-skia.js  # Skia mock for Jest
```

---

## Task 1: Expo Project Scaffold

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `.gitignore`, `jest.config.js`, `jest.setup.ts`, `__mocks__/@shopify/react-native-skia.js`

**Interfaces:**
- Produces: runnable Expo project, `npm test` command, git repo

- [ ] **Step 1: Initialise the Expo project**

Run inside the `Llama Quest` directory (not a subdirectory — the project lives at the root):

```bash
npx create-expo-app@latest . --template blank-typescript
```

When prompted about an existing directory, confirm overwrite. This creates `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `App.tsx`.

- [ ] **Step 2: Initialise git**

```bash
git init
git add .
git commit -m "chore: initial expo scaffold"
```

- [ ] **Step 3: Install all Phase 1 dependencies**

```bash
npx expo install expo-router @shopify/react-native-skia react-native-reanimated react-native-gesture-handler @react-native-async-storage/async-storage zustand
npm install --save-dev jest-expo @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 4: Replace `app.json` with expo-router config**

Replace `app.json` entirely:

```json
{
  "expo": {
    "name": "Llama Quest",
    "slug": "llama-quest",
    "version": "1.0.0",
    "scheme": "llama-quest",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "react-native-reanimated"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 5: Replace `tsconfig.json` with strict config**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 6: Replace `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
```

- [ ] **Step 7: Replace `App.tsx` with expo-router entry point**

Delete `App.tsx` and create `app/_layout.tsx`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StyleSheet } from 'react-native'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
})
```

- [ ] **Step 8: Create `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

- [ ] **Step 9: Create `jest.setup.ts`**

```ts
import '@testing-library/jest-native/extend-expect'
```

- [ ] **Step 10: Create the Skia mock**

Create `__mocks__/@shopify/react-native-skia.js`:

```js
const React = require('react')

const mockComponent = (name) => {
  const Comp = ({ children, testID }) =>
    React.createElement('View', { testID }, children)
  Comp.displayName = name
  return Comp
}

module.exports = {
  Canvas: mockComponent('Canvas'),
  Rect: mockComponent('Rect'),
  Group: mockComponent('Group'),
  Text: mockComponent('SkiaText'),
  Image: mockComponent('SkiaImage'),
  useImage: jest.fn(() => null),
  useFont: jest.fn(() => null),
  useDerivedValue: jest.fn((fn) => ({ value: fn() })),
  useSharedValue: jest.fn((v) => ({ value: v })),
  Skia: { Color: jest.fn((c) => c) },
}
```

- [ ] **Step 11: Verify the project boots**

```bash
npx expo start --web
```

Expected: browser opens to a blank dark screen with no console errors.

- [ ] **Step 12: Verify tests run**

```bash
npm test -- --passWithNoTests
```

Expected: `Test Suites: 0 passed` with exit code 0.

- [ ] **Step 13: Create GitHub repository and push**

```bash
gh repo create llama-quest --public --description "Llama Quest — SNES-style AI learning RPG" --source=. --remote=origin --push
```

Expected output: `✓ Created repository <username>/llama-quest on GitHub` and `✓ Pushed commits to github.com/<username>/llama-quest`

- [ ] **Step 14: Create GitHub Actions CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --ci --coverage --watchAll=false
```

- [ ] **Step 15: Commit and push CI workflow**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: add GitHub Actions CI workflow"
git push
```

Expected: push succeeds; navigate to `github.com/<username>/llama-quest/actions` and confirm the CI run starts and passes (0 test suites, exit 0).

- [ ] **Step 16: Commit scaffold**

```bash
git add -A
git commit -m "chore: install deps, configure expo-router, jest, skia mock"
git push
```

---

## Task 2: Engine — Tilemap

**Files:**
- Create: `engine/tilemap.ts`
- Test: `engine/__tests__/tilemap.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  type TileType = 'grass' | 'forest' | 'path' | 'water' | 'building_wall' | 'floor' | 'door'
  interface Tile { type: TileType; walkable: boolean }
  interface TileGrid { width: number; height: number; tiles: Tile[] }
  function tileAt(grid: TileGrid, x: number, y: number): Tile | null
  function isWalkable(grid: TileGrid, x: number, y: number): boolean
  function makeTile(type: TileType): Tile
  function makeGrid(width: number, height: number, fill: TileType): TileGrid
  ```

- [ ] **Step 1: Write the failing tests**

Create `engine/__tests__/tilemap.test.ts`:

```typescript
import { tileAt, isWalkable, makeGrid, makeTile } from '../tilemap'

describe('tileAt', () => {
  it('returns tile at valid coordinates', () => {
    const grid = makeGrid(3, 3, 'grass')
    const tile = tileAt(grid, 1, 1)
    expect(tile).not.toBeNull()
    expect(tile?.type).toBe('grass')
  })

  it('returns null for out-of-bounds coordinates', () => {
    const grid = makeGrid(3, 3, 'grass')
    expect(tileAt(grid, -1, 0)).toBeNull()
    expect(tileAt(grid, 3, 0)).toBeNull()
    expect(tileAt(grid, 0, 3)).toBeNull()
  })
})

describe('isWalkable', () => {
  it('returns true for walkable tile types', () => {
    const grid = makeGrid(1, 1, 'grass')
    expect(isWalkable(grid, 0, 0)).toBe(true)
  })

  it('returns false for non-walkable tile types', () => {
    const grid = makeGrid(1, 1, 'water')
    expect(isWalkable(grid, 0, 0)).toBe(false)
  })

  it('returns false for out-of-bounds coordinates', () => {
    const grid = makeGrid(3, 3, 'grass')
    expect(isWalkable(grid, -1, 0)).toBe(false)
    expect(isWalkable(grid, 5, 5)).toBe(false)
  })
})

describe('makeGrid', () => {
  it('creates a grid filled with the given tile type', () => {
    const grid = makeGrid(4, 2, 'path')
    expect(grid.width).toBe(4)
    expect(grid.height).toBe(2)
    expect(grid.tiles).toHaveLength(8)
    grid.tiles.forEach((t) => expect(t.type).toBe('path'))
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- engine/__tests__/tilemap.test.ts
```

Expected: `Cannot find module '../tilemap'`

- [ ] **Step 3: Implement `engine/tilemap.ts`**

```typescript
export type TileType =
  | 'grass'
  | 'forest'
  | 'path'
  | 'water'
  | 'building_wall'
  | 'floor'
  | 'door'

export interface Tile {
  type: TileType
  walkable: boolean
}

export interface TileGrid {
  width: number
  height: number
  tiles: Tile[]  // row-major: index = y * width + x
}

const WALKABLE: Record<TileType, boolean> = {
  grass: true,
  forest: false,
  path: true,
  water: false,
  building_wall: false,
  floor: true,
  door: true,
}

export function makeTile(type: TileType): Tile {
  return { type, walkable: WALKABLE[type] }
}

export function makeGrid(width: number, height: number, fill: TileType): TileGrid {
  return {
    width,
    height,
    tiles: Array.from({ length: width * height }, () => makeTile(fill)),
  }
}

export function tileAt(grid: TileGrid, x: number, y: number): Tile | null {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return null
  return grid.tiles[y * grid.width + x] ?? null
}

export function isWalkable(grid: TileGrid, x: number, y: number): boolean {
  const tile = tileAt(grid, x, y)
  return tile?.walkable ?? false
}

export function setTile(grid: TileGrid, x: number, y: number, type: TileType): void {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return
  grid.tiles[y * grid.width + x] = makeTile(type)
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm test -- engine/__tests__/tilemap.test.ts
```

Expected: `Tests: 6 passed`

- [ ] **Step 5: Commit**

```bash
git add engine/tilemap.ts engine/__tests__/tilemap.test.ts
git commit -m "feat(engine): tilemap data structures and walkability"
```

---

## Task 3: Engine — Entity & Camera

**Files:**
- Create: `engine/entity.ts`, `engine/camera.ts`
- Test: `engine/__tests__/entity.test.ts`, `engine/__tests__/camera.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  type Facing = 'up' | 'down' | 'left' | 'right'
  type EntityType = 'player' | 'npc' | 'sign' | 'building_entrance' | 'gate'
  interface Entity { id: string; type: EntityType; x: number; y: number; facing: Facing; interactable: boolean; data: Record<string, unknown> }
  function makePlayer(x: number, y: number): Entity
  interface Camera { x: number; y: number }
  function followEntity(entity: Entity, tileSize: number, screenW: number, screenH: number): Camera
  function clampCamera(camera: Camera, tileSize: number, gridW: number, gridH: number, screenW: number, screenH: number): Camera
  ```

- [ ] **Step 1: Write the failing tests**

Create `engine/__tests__/entity.test.ts`:

```typescript
import { makePlayer } from '../entity'

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
```

Create `engine/__tests__/camera.test.ts`:

```typescript
import { followEntity, clampCamera } from '../camera'
import { makePlayer } from '../entity'

describe('followEntity', () => {
  it('centers camera on entity', () => {
    const player = makePlayer(5, 5)
    const cam = followEntity(player, 32, 320, 240)
    // Player at tile (5,5) = pixel (160, 160); screen center = (160, 120)
    // camera.x = 160 - 160 = 0; camera.y = 160 - 120 = 40
    expect(cam.x).toBe(0)
    expect(cam.y).toBe(40)
  })
})

describe('clampCamera', () => {
  it('prevents camera from showing outside world bounds', () => {
    const cam = { x: -50, y: -50 }
    const clamped = clampCamera(cam, 32, 20, 15, 320, 240)
    expect(clamped.x).toBe(0)
    expect(clamped.y).toBe(0)
  })

  it('clamps to max bounds', () => {
    const cam = { x: 9999, y: 9999 }
    // World: 20×15 tiles × 32px = 640×480; screen 320×240; max cam = (320, 240)
    const clamped = clampCamera(cam, 32, 20, 15, 320, 240)
    expect(clamped.x).toBe(320)
    expect(clamped.y).toBe(240)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- engine/__tests__/entity.test.ts engine/__tests__/camera.test.ts
```

Expected: `Cannot find module '../entity'`

- [ ] **Step 3: Implement `engine/entity.ts`**

```typescript
export type Facing = 'up' | 'down' | 'left' | 'right'
export type EntityType = 'player' | 'npc' | 'sign' | 'building_entrance' | 'gate'

export interface Entity {
  id: string
  type: EntityType
  x: number  // tile coordinate (float during movement)
  y: number
  facing: Facing
  interactable: boolean
  data: Record<string, unknown>
}

let _nextId = 1
function nextId(prefix: string): string {
  return `${prefix}_${_nextId++}`
}

export function makePlayer(x: number, y: number): Entity {
  return {
    id: nextId('player'),
    type: 'player',
    x,
    y,
    facing: 'down',
    interactable: false,
    data: {},
  }
}

export function makeNPC(id: string, x: number, y: number, data: Record<string, unknown> = {}): Entity {
  return { id, type: 'npc', x, y, facing: 'down', interactable: true, data }
}

export function makeBuildingEntrance(id: string, x: number, y: number, destination: string): Entity {
  return { id, type: 'building_entrance', x, y, facing: 'down', interactable: true, data: { destination } }
}

export function makeGate(id: string, x: number, y: number, destination: string, locked: boolean): Entity {
  return { id, type: 'gate', x, y, facing: 'down', interactable: true, data: { destination, locked } }
}

export function nearestInteractable(entities: Entity[], playerX: number, playerY: number, maxDist = 1.5): Entity | null {
  let nearest: Entity | null = null
  let nearestDist = maxDist
  for (const entity of entities) {
    if (!entity.interactable) continue
    const dist = Math.hypot(entity.x - playerX, entity.y - playerY)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = entity
    }
  }
  return nearest
}
```

- [ ] **Step 4: Implement `engine/camera.ts`**

```typescript
export interface Camera {
  x: number  // world-space pixel offset (top-left corner of viewport)
  y: number
}

export function followEntity(
  entity: { x: number; y: number },
  tileSize: number,
  screenW: number,
  screenH: number,
): Camera {
  return {
    x: entity.x * tileSize - screenW / 2 + tileSize / 2,
    y: entity.y * tileSize - screenH / 2 + tileSize / 2,
  }
}

export function clampCamera(
  camera: Camera,
  tileSize: number,
  gridW: number,
  gridH: number,
  screenW: number,
  screenH: number,
): Camera {
  const maxX = Math.max(0, gridW * tileSize - screenW)
  const maxY = Math.max(0, gridH * tileSize - screenH)
  return {
    x: Math.max(0, Math.min(camera.x, maxX)),
    y: Math.max(0, Math.min(camera.y, maxY)),
  }
}
```

- [ ] **Step 5: Run to verify pass**

```bash
npm test -- engine/__tests__/entity.test.ts engine/__tests__/camera.test.ts
```

Expected: `Tests: 4 passed`

- [ ] **Step 6: Commit**

```bash
git add engine/entity.ts engine/camera.ts engine/__tests__/entity.test.ts engine/__tests__/camera.test.ts
git commit -m "feat(engine): entity types and camera follow/clamp"
```

---

## Task 4: Engine — Movement

**Files:**
- Create: `engine/movement.ts`
- Test: `engine/__tests__/movement.test.ts`

**Interfaces:**
- Consumes: `Entity` from `engine/entity.ts`, `TileGrid`, `isWalkable` from `engine/tilemap.ts`
- Produces:
  ```typescript
  interface InputState { dx: number; dy: number }  // each -1 | 0 | 1
  function movePlayer(player: Entity, input: InputState, grid: TileGrid, dt: number): Entity
  ```

- [ ] **Step 1: Write the failing tests**

Create `engine/__tests__/movement.test.ts`:

```typescript
import { movePlayer } from '../movement'
import { makePlayer } from '../entity'
import { makeGrid, setTile } from '../tilemap'

const SPEED = 4  // tiles/second (Global Constraint)
const DT = 1     // 1 second for easy math

describe('movePlayer', () => {
  it('moves right when dx=1', () => {
    const grid = makeGrid(10, 10, 'grass')
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 1, dy: 0 }, grid, DT)
    expect(moved.x).toBeCloseTo(5 + SPEED)
    expect(moved.facing).toBe('right')
  })

  it('moves up when dy=-1', () => {
    const grid = makeGrid(10, 10, 'grass')
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 0, dy: -1 }, grid, DT)
    expect(moved.y).toBeCloseTo(5 - SPEED)
    expect(moved.facing).toBe('up')
  })

  it('stops at non-walkable tile boundary', () => {
    const grid = makeGrid(10, 10, 'grass')
    setTile(grid, 7, 5, 'water')  // wall to the right
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 1, dy: 0 }, grid, DT)
    // Player should not enter tile x=7
    expect(moved.x).toBeLessThan(7)
  })

  it('does not move when input is zero', () => {
    const grid = makeGrid(10, 10, 'grass')
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 0, dy: 0 }, grid, DT)
    expect(moved.x).toBe(5)
    expect(moved.y).toBe(5)
  })

  it('normalises diagonal movement to avoid faster speed', () => {
    const grid = makeGrid(20, 20, 'grass')
    const player = makePlayer(5, 5)
    const moved = movePlayer(player, { dx: 1, dy: 1 }, grid, DT)
    const dist = Math.hypot(moved.x - 5, moved.y - 5)
    expect(dist).toBeCloseTo(SPEED, 1)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- engine/__tests__/movement.test.ts
```

Expected: `Cannot find module '../movement'`

- [ ] **Step 3: Implement `engine/movement.ts`**

```typescript
import type { Entity, Facing } from './entity'
import type { TileGrid } from './tilemap'
import { isWalkable } from './tilemap'

export interface InputState {
  dx: number  // -1 | 0 | 1
  dy: number  // -1 | 0 | 1
}

const PLAYER_SPEED = 4  // tiles per second

function facingFromInput(dx: number, dy: number): Facing {
  if (dx > 0) return 'right'
  if (dx < 0) return 'left'
  if (dy < 0) return 'up'
  return 'down'
}

export function movePlayer(
  player: Entity,
  input: InputState,
  grid: TileGrid,
  dt: number,
): Entity {
  const { dx, dy } = input
  if (dx === 0 && dy === 0) return player

  const mag = Math.hypot(dx, dy)
  const ndx = dx / mag
  const ndy = dy / mag
  const distance = PLAYER_SPEED * dt

  let newX = player.x + ndx * distance
  let newY = player.y + ndy * distance

  // Axis-separated collision: try each axis independently
  if (!isWalkable(grid, Math.round(newX), Math.round(player.y))) {
    newX = player.x
  }
  if (!isWalkable(grid, Math.round(newX), Math.round(newY))) {
    newY = player.y
  }

  return {
    ...player,
    x: newX,
    y: newY,
    facing: facingFromInput(dx, dy),
  }
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm test -- engine/__tests__/movement.test.ts
```

Expected: `Tests: 5 passed`

- [ ] **Step 5: Commit**

```bash
git add engine/movement.ts engine/__tests__/movement.test.ts
git commit -m "feat(engine): player movement with axis-separated collision"
```

---

## Task 5: Game Store

**Files:**
- Create: `store/game-store.ts`
- Test: `store/__tests__/game-store.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  type PlayerClass = 'Tinkerer' | 'Scholar' | 'Architect'
  type CityId = 'overworld' | 'llamatown' | 'forge' | 'vale' | 'ridge'
  interface GameState { player: PlayerData; progression: ProgressionData; settings: SettingsData }
  // actions:
  useGameStore().initPlayer(name, cls)
  useGameStore().awardXP(amount)
  useGameStore().markLessonRead(lessonId)
  useGameStore().markNPCMet(npcId)
  useGameStore().setPosition(city, x, y)
  useGameStore().updateSettings(partial)
  ```

- [ ] **Step 1: Write the failing tests**

Create `store/__tests__/game-store.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react-native'
import { useGameStore } from '../game-store'

import { initialGameState } from '../game-store'

// Reset store before each test
beforeEach(() => {
  useGameStore.setState(initialGameState)
})

describe('initPlayer', () => {
  it('sets player name and class, resets progression', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Scholar'))
    expect(result.current.player.name).toBe('Ada')
    expect(result.current.player.class).toBe('Scholar')
    expect(result.current.player.level).toBe(1)
    expect(result.current.player.xp).toBe(0)
    expect(result.current.player.hp).toBe(result.current.player.maxHp)
  })
})

describe('awardXP', () => {
  it('increases XP', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.awardXP(20))
    expect(result.current.player.xp).toBe(20)
  })

  it('levels up when XP reaches 120', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.awardXP(120))
    expect(result.current.player.level).toBe(2)
    expect(result.current.player.xp).toBe(0)
  })
})

describe('markLessonRead', () => {
  it('records lesson as read and awards 20 XP', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.markLessonRead('oll-intro'))
    expect(result.current.progression.readLessons['oll-intro']).toBe(true)
    expect(result.current.player.xp).toBe(20)
  })

  it('does not award XP a second time for the same lesson', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.markLessonRead('oll-intro'))
    act(() => result.current.markLessonRead('oll-intro'))
    expect(result.current.player.xp).toBe(20)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- store/__tests__/game-store.test.ts
```

Expected: `Cannot find module '../game-store'`

- [ ] **Step 3: Implement `store/game-store.ts`**

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type PlayerClass = 'Tinkerer' | 'Scholar' | 'Architect'
export type CityId = 'overworld' | 'llamatown' | 'forge' | 'vale' | 'ridge'

const XP_PER_LEVEL = 120

interface PlayerData {
  name: string
  class: PlayerClass
  hp: number
  maxHp: number
  level: number
  xp: number
}

interface ProgressionData {
  currentCity: CityId
  position: { x: number; y: number }
  masteredConcepts: Record<string, boolean>
  readLessons: Record<string, boolean>
  metNPCs: Record<string, boolean>
  completedSandboxes: Record<string, boolean>
  defeatedBosses: Record<string, boolean>
}

interface SettingsData {
  musicEnabled: boolean
  sfxEnabled: boolean
  masterVolume: number
}

interface GameState {
  player: PlayerData
  progression: ProgressionData
  settings: SettingsData
  initPlayer: (name: string, cls: PlayerClass) => void
  awardXP: (amount: number) => void
  markLessonRead: (lessonId: string) => void
  markNPCMet: (npcId: string) => void
  setPosition: (city: CityId, x: number, y: number) => void
  updateSettings: (partial: Partial<SettingsData>) => void
}

const DEFAULT_PLAYER: PlayerData = {
  name: '',
  class: 'Tinkerer',
  hp: 60,
  maxHp: 60,
  level: 1,
  xp: 0,
}

const DEFAULT_PROGRESSION: ProgressionData = {
  currentCity: 'overworld',
  position: { x: 5, y: 5 },
  masteredConcepts: {},
  readLessons: {},
  metNPCs: {},
  completedSandboxes: {},
  defeatedBosses: {},
}

const DEFAULT_SETTINGS: SettingsData = {
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.8,
}

export const initialGameState = {
  player: { ...DEFAULT_PLAYER },
  progression: { ...DEFAULT_PROGRESSION },
  settings: { ...DEFAULT_SETTINGS },
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: { ...DEFAULT_PLAYER },
      progression: { ...DEFAULT_PROGRESSION },
      settings: { ...DEFAULT_SETTINGS },

      initPlayer: (name, cls) =>
        set({
          player: { ...DEFAULT_PLAYER, name, class: cls },
          progression: { ...DEFAULT_PROGRESSION },
        }),

      awardXP: (amount) =>
        set((state) => {
          let { xp, level, hp, maxHp } = state.player
          xp += amount
          while (xp >= XP_PER_LEVEL) {
            xp -= XP_PER_LEVEL
            level++
            maxHp += 5
            hp = maxHp
          }
          return { player: { ...state.player, xp, level, hp, maxHp } }
        }),

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

      markNPCMet: (npcId) => {
        const { progression } = get()
        if (progression.metNPCs[npcId]) return
        set((state) => ({
          progression: {
            ...state.progression,
            metNPCs: { ...state.progression.metNPCs, [npcId]: true },
          },
        }))
        get().awardXP(8)
      },

      setPosition: (city, x, y) =>
        set((state) => ({
          progression: { ...state.progression, currentCity: city, position: { x, y } },
        })),

      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
    }),
    {
      name: 'llama_quest_v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)

```

- [ ] **Step 4: Run to verify pass**

```bash
npm test -- store/__tests__/game-store.test.ts
```

Expected: `Tests: 5 passed`

- [ ] **Step 5: Commit**

```bash
git add store/game-store.ts store/__tests__/game-store.test.ts
git commit -m "feat(store): zustand game store with XP, lessons, NPC tracking"
```

---

## Task 6: Hooks — useGameLoop & usePlayerInput

**Files:**
- Create: `hooks/useGameLoop.ts`, `hooks/usePlayerInput.ts`

**Interfaces:**
- Produces:
  ```typescript
  // useGameLoop: calls callback(dt) at up to 60fps via useFrameCallback
  function useGameLoop(callback: (dt: number) => void): void

  // usePlayerInput: returns current directional input (-1|0|1 per axis)
  function usePlayerInput(): { input: InputState; resetInput: () => void }
  ```

No engine tests for hooks (they wrap platform APIs). Manual verification via the overworld screen in Task 11.

- [ ] **Step 1: Implement `hooks/useGameLoop.ts`**

```typescript
import { useCallback, useRef } from 'react'
import { useFrameCallback } from 'react-native-reanimated'

const MAX_DT = 0.05  // 50ms cap (Global Constraint)

export function useGameLoop(callback: (dt: number) => void): void {
  const lastTimestamp = useRef<number>(0)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useFrameCallback((info) => {
    const now = info.timestamp
    const raw = lastTimestamp.current === 0 ? 0 : (now - lastTimestamp.current) / 1000
    lastTimestamp.current = now
    const dt = Math.min(raw, MAX_DT)
    callbackRef.current(dt)
  })
}
```

- [ ] **Step 2: Implement `hooks/usePlayerInput.ts`**

```typescript
import { useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import type { InputState } from '../engine/movement'

export function usePlayerInput(): { input: React.RefObject<InputState>; resetInput: () => void } {
  const input = useRef<InputState>({ dx: 0, dy: 0 })

  const resetInput = useCallback(() => {
    input.current = { dx: 0, dy: 0 }
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web') return

    const keys = new Set<string>()

    function update() {
      let dx = 0
      let dy = 0
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx = 1
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx = -1
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy = 1
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy = -1
      input.current = { dx, dy }
    }

    const onDown = (e: KeyboardEvent) => { keys.add(e.key); update() }
    const onUp = (e: KeyboardEvent) => { keys.delete(e.key); update() }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  return { input, resetInput }
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useGameLoop.ts hooks/usePlayerInput.ts
git commit -m "feat(hooks): game loop and keyboard input hooks"
```

---

## Task 7: Renderer — TilemapRenderer

**Files:**
- Create: `renderer/TilemapRenderer.tsx`
- Test: `renderer/__tests__/TilemapRenderer.test.tsx`

**Interfaces:**
- Consumes: `TileGrid`, `TileType`, `tileAt` from `engine/tilemap.ts`; `Camera` from `engine/camera.ts`
- Produces:
  ```typescript
  interface TilemapRendererProps {
    grid: TileGrid; camera: Camera; tileSize: number; width: number; height: number
  }
  function TilemapRenderer(props: TilemapRendererProps): JSX.Element
  ```

- [ ] **Step 1: Write the failing test**

Create `renderer/__tests__/TilemapRenderer.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { TilemapRenderer } from '../TilemapRenderer'
import { makeGrid } from '../../engine/tilemap'

describe('TilemapRenderer', () => {
  it('renders without crashing for a valid grid', () => {
    const grid = makeGrid(5, 5, 'grass')
    const camera = { x: 0, y: 0 }
    const { toJSON } = render(
      <TilemapRenderer grid={grid} camera={camera} tileSize={32} width={320} height={240} />,
    )
    expect(toJSON()).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- renderer/__tests__/TilemapRenderer.test.tsx
```

Expected: `Cannot find module '../TilemapRenderer'`

- [ ] **Step 3: Implement `renderer/TilemapRenderer.tsx`**

```tsx
import React, { useMemo } from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { TileGrid, TileType } from '../engine/tilemap'
import { tileAt } from '../engine/tilemap'
import type { Camera } from '../engine/camera'

// Phase 1: colored rects as tile placeholders (sprite sheet wired in Phase 5)
const TILE_COLOR: Record<TileType, string> = {
  grass: '#3d7a4a',
  forest: '#1e4d22',
  path: '#b5934a',
  water: '#1a5276',
  building_wall: '#5d4037',
  floor: '#7e6551',
  door: '#d4ac0d',
}

interface TilemapRendererProps {
  grid: TileGrid
  camera: Camera
  tileSize: number
  width: number
  height: number
}

export function TilemapRenderer({ grid, camera, tileSize, width, height }: TilemapRendererProps) {
  const visibleTiles = useMemo(() => {
    const startX = Math.max(0, Math.floor(camera.x / tileSize))
    const startY = Math.max(0, Math.floor(camera.y / tileSize))
    const endX = Math.min(grid.width, startX + Math.ceil(width / tileSize) + 2)
    const endY = Math.min(grid.height, startY + Math.ceil(height / tileSize) + 2)
    const tiles: { screenX: number; screenY: number; color: string }[] = []
    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = tileAt(grid, tx, ty)
        if (!tile) continue
        tiles.push({
          screenX: tx * tileSize - camera.x,
          screenY: ty * tileSize - camera.y,
          color: TILE_COLOR[tile.type],
        })
      }
    }
    return tiles
  }, [grid, camera, tileSize, width, height])

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {visibleTiles.map((t, i) => (
          <Rect key={i} x={t.screenX} y={t.screenY} width={tileSize} height={tileSize} color={t.color} />
        ))}
      </Group>
    </Canvas>
  )
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm test -- renderer/__tests__/TilemapRenderer.test.tsx
```

Expected: `Tests: 1 passed`

- [ ] **Step 5: Commit**

```bash
git add renderer/TilemapRenderer.tsx renderer/__tests__/TilemapRenderer.test.tsx
git commit -m "feat(renderer): tilemap renderer with placeholder tile colors"
```

---

## Task 8: Renderer — EntityRenderer & WorldRenderer

**Files:**
- Create: `renderer/EntityRenderer.tsx`, `renderer/WorldRenderer.tsx`

**Interfaces:**
- Consumes: `TilemapRenderer` from Task 7; `Entity`, `Facing` from `engine/entity.ts`; `Camera` from `engine/camera.ts`; `TileGrid` from `engine/tilemap.ts`
- Produces:
  ```typescript
  interface EntityRendererProps { entities: Entity[]; camera: Camera; tileSize: number; width: number; height: number }
  function EntityRenderer(props): JSX.Element

  interface WorldRendererProps { grid: TileGrid; entities: Entity[]; tileSize: number; width: number; height: number; screenWidth: number; screenHeight: number }
  function WorldRenderer(props): JSX.Element  // handles camera internally
  ```

- [ ] **Step 1: Implement `renderer/EntityRenderer.tsx`**

```tsx
import React from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { Entity } from '../engine/entity'
import type { Camera } from '../engine/camera'

// Phase 1 placeholders: colored rects per entity type
const ENTITY_COLOR: Record<string, string> = {
  player: '#f5c518',
  npc: '#4fc3f7',
  sign: '#ce93d8',
  building_entrance: '#80cbc4',
  gate: '#ef9a9a',
}

interface EntityRendererProps {
  entities: Entity[]
  camera: Camera
  tileSize: number
  width: number
  height: number
}

export function EntityRenderer({ entities, camera, tileSize, width, height }: EntityRendererProps) {
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height }}>
      <Group>
        {entities.map((entity) => {
          const sx = entity.x * tileSize - camera.x + tileSize * 0.1
          const sy = entity.y * tileSize - camera.y + tileSize * 0.1
          const size = tileSize * 0.8
          return (
            <Rect
              key={entity.id}
              x={sx}
              y={sy}
              width={size}
              height={size}
              color={ENTITY_COLOR[entity.type] ?? '#ffffff'}
            />
          )
        })}
      </Group>
    </Canvas>
  )
}
```

- [ ] **Step 2: Implement `renderer/WorldRenderer.tsx`**

```tsx
import React, { useMemo } from 'react'
import { View } from 'react-native'
import { TilemapRenderer } from './TilemapRenderer'
import { EntityRenderer } from './EntityRenderer'
import type { TileGrid } from '../engine/tilemap'
import type { Entity } from '../engine/entity'
import { followEntity, clampCamera } from '../engine/camera'

interface WorldRendererProps {
  grid: TileGrid
  player: Entity
  entities: Entity[]
  tileSize: number
  screenWidth: number
  screenHeight: number
}

export function WorldRenderer({ grid, player, entities, tileSize, screenWidth, screenHeight }: WorldRendererProps) {
  const camera = useMemo(() => {
    const raw = followEntity(player, tileSize, screenWidth, screenHeight)
    return clampCamera(raw, tileSize, grid.width, grid.height, screenWidth, screenHeight)
  }, [player.x, player.y, tileSize, screenWidth, screenHeight, grid.width, grid.height])

  const allEntities = useMemo(() => [player, ...entities], [player, entities])

  return (
    <View style={{ width: screenWidth, height: screenHeight, overflow: 'hidden' }}>
      <TilemapRenderer grid={grid} camera={camera} tileSize={tileSize} width={screenWidth} height={screenHeight} />
      <EntityRenderer entities={allEntities} camera={camera} tileSize={tileSize} width={screenWidth} height={screenHeight} />
    </View>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add renderer/EntityRenderer.tsx renderer/WorldRenderer.tsx
git commit -m "feat(renderer): entity renderer and world renderer composition"
```

---

## Task 9: Content — World Data

**Files:**
- Create: `content/world-data.ts`

**Interfaces:**
- Consumes: `TileGrid`, `makeGrid`, `setTile` from `engine/tilemap.ts`; `Entity`, `makeNPC`, `makeBuildingEntrance`, `makeGate` from `engine/entity.ts`
- Produces:
  ```typescript
  interface CityDef { id: CityId; grid: TileGrid; playerSpawn: {x:number;y:number}; entities: Entity[]; gateExit: {x:number;y:number;destination:CityId|'overworld'} }
  const OVERWORLD: CityDef
  const LLAMATOWN: CityDef
  function getCityDef(id: CityId | 'overworld'): CityDef
  ```

- [ ] **Step 1: Implement `content/world-data.ts`**

```typescript
import type { CityId } from '../store/game-store'
import { makeGrid, setTile } from '../engine/tilemap'
import type { TileGrid } from '../engine/tilemap'
import { makeNPC, makeBuildingEntrance, makeGate } from '../engine/entity'
import type { Entity } from '../engine/entity'

export interface CityDef {
  id: CityId | 'overworld'
  grid: TileGrid
  playerSpawn: { x: number; y: number }
  entities: Entity[]
  gateExit: { x: number; y: number; destination: CityId | 'overworld' }
}

function buildOverworldGrid(): TileGrid {
  const g = makeGrid(40, 30, 'grass')
  // Paths between cities
  for (let x = 5; x < 35; x++) setTile(g, x, 14, 'path')  // horizontal road
  for (let x = 5; x < 35; x++) setTile(g, x, 15, 'path')
  // Forest borders
  for (let x = 0; x < 40; x++) {
    setTile(g, x, 0, 'forest'); setTile(g, x, 1, 'forest')
    setTile(g, x, 28, 'forest'); setTile(g, x, 29, 'forest')
  }
  return g
}

function buildLlamatownGrid(): TileGrid {
  const g = makeGrid(20, 15, 'grass')
  // Perimeter wall
  for (let x = 0; x < 20; x++) {
    setTile(g, x, 0, 'building_wall')
    setTile(g, x, 14, 'building_wall')
  }
  for (let y = 0; y < 15; y++) {
    setTile(g, 0, y, 'building_wall')
    setTile(g, 19, y, 'building_wall')
  }
  // Path through middle
  for (let x = 1; x < 19; x++) setTile(g, x, 7, 'path')
  // Building footprints
  for (let x = 3; x <= 6; x++) for (let y = 2; y <= 5; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 4, 5, 'door')   // Library door
  for (let x = 8; x <= 11; x++) for (let y = 2; y <= 5; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 9, 5, 'door')   // Dojo door
  for (let x = 13; x <= 16; x++) for (let y = 2; y <= 5; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 14, 5, 'door')  // Workshop door
  // Exit south
  setTile(g, 9, 14, 'door')
  setTile(g, 10, 14, 'door')
  return g
}

export const OVERWORLD: CityDef = {
  id: 'overworld',
  grid: buildOverworldGrid(),
  playerSpawn: { x: 6, y: 14 },
  entities: [
    makeBuildingEntrance('enter-llamatown', 7, 13, 'llamatown'),
  ],
  gateExit: { x: 0, y: 0, destination: 'llamatown' },
}

export const LLAMATOWN: CityDef = {
  id: 'llamatown',
  grid: buildLlamatownGrid(),
  playerSpawn: { x: 9, y: 12 },
  entities: [
    makeBuildingEntrance('enter-library', 4, 6, 'llamatown-library'),
    makeBuildingEntrance('enter-dojo', 9, 6, 'llamatown-dojo'),
    makeBuildingEntrance('enter-workshop', 14, 6, 'llamatown-workshop'),
    makeNPC('mayor-lloyd', 9, 9, {
      name: 'Mayor Lloyd',
      lines: [
        "Welcome to Llamatown, traveller!",
        "The Great Models have gone silent.",
        "Only one who understands them can help.",
        "Visit the Library — your journey begins there.",
      ],
    }),
    makeNPC('npc-penny', 5, 10, {
      name: 'Penny',
      lines: ["I heard Ollama can run models locally!", "Try the Library if you want to learn more."],
    }),
    makeGate('gate-south', 9, 13, 'overworld', false),
  ],
  gateExit: { x: 9, y: 13, destination: 'overworld' },
}

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

- [ ] **Step 2: Commit**

```bash
git add content/world-data.ts
git commit -m "feat(content): overworld and Llamatown city definitions"
```

---

## Task 10: Components — HUD & DialogueBox

**Files:**
- Create: `components/HUD.tsx`, `components/DialogueBox.tsx`

**Interfaces:**
- Consumes: `useGameStore` from `store/game-store.ts`
- Produces:
  ```typescript
  function HUD(): JSX.Element  // reads from game-store; no props
  interface DialogueBoxProps { lines: string[]; onClose: () => void; speakerName?: string }
  function DialogueBox(props): JSX.Element
  ```

- [ ] **Step 1: Implement `components/HUD.tsx`**

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useGameStore } from '../store/game-store'

export function HUD() {
  const { player } = useGameStore()
  const hpPercent = player.hp / player.maxHp

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.row}>
        <Text style={styles.name}>{player.name || 'LLAMA'}</Text>
        <Text style={styles.level}>Lv.{player.level}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>HP</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${hpPercent * 100}%` as any, backgroundColor: hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336' }]} />
        </View>
        <Text style={styles.hpText}>{player.hp}/{player.maxHp}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>XP</Text>
        <Text style={styles.xpText}>{player.xp}/120</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: 8, borderWidth: 2, borderColor: '#c0a060', minWidth: 160 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { color: '#f5c518', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', flex: 1 },
  level: { color: '#aaa', fontFamily: 'monospace', fontSize: 10 },
  label: { color: '#aaa', fontFamily: 'monospace', fontSize: 10, width: 24 },
  barBg: { flex: 1, height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginHorizontal: 4 },
  barFill: { height: '100%', borderRadius: 4 },
  hpText: { color: '#fff', fontFamily: 'monospace', fontSize: 10, width: 48, textAlign: 'right' },
  xpText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 10 },
})
```

- [ ] **Step 2: Implement `components/DialogueBox.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface DialogueBoxProps {
  lines: string[]
  speakerName?: string
  onClose: () => void
}

export function DialogueBox({ lines, speakerName, onClose }: DialogueBoxProps) {
  const [lineIdx, setLineIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [finished, setFinished] = useState(false)

  const currentLine = lines[lineIdx] ?? ''

  useEffect(() => {
    setDisplayed('')
    setFinished(false)
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(currentLine.slice(0, i))
      if (i >= currentLine.length) {
        clearInterval(interval)
        setFinished(true)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [lineIdx, currentLine])

  const advance = useCallback(() => {
    if (!finished) {
      setDisplayed(currentLine)
      setFinished(true)
      return
    }
    if (lineIdx < lines.length - 1) {
      setLineIdx((n) => n + 1)
    } else {
      onClose()
    }
  }, [finished, lineIdx, lines.length, currentLine, onClose])

  return (
    <TouchableOpacity style={styles.overlay} onPress={advance} activeOpacity={1}>
      <View style={styles.box}>
        {speakerName ? <Text style={styles.speaker}>{speakerName}</Text> : null}
        <Text style={styles.text}>{displayed}</Text>
        {finished && <Text style={styles.arrow}>▼</Text>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 },
  box: { backgroundColor: '#0d0d1a', borderWidth: 3, borderColor: '#c0a060', borderRadius: 4, padding: 12, minHeight: 80 },
  speaker: { color: '#f5c518', fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  text: { color: '#ffffff', fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  arrow: { color: '#c0a060', alignSelf: 'flex-end', fontSize: 12 },
})
```

- [ ] **Step 3: Commit**

```bash
git add components/HUD.tsx components/DialogueBox.tsx
git commit -m "feat(components): HUD and Earthbound-style dialogue box"
```

---

## Task 11: Title Screen

**Files:**
- Create: `app/index.tsx`

**Interfaces:**
- Consumes: `useGameStore` → `initPlayer`; `router.push` from `expo-router`
- Produces: playable title screen navigating to `/overworld`

- [ ] **Step 1: Implement `app/index.tsx`**

```tsx
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useGameStore } from '../store/game-store'
import type { PlayerClass } from '../store/game-store'

const CLASSES: { id: PlayerClass; label: string; desc: string }[] = [
  { id: 'Tinkerer', label: 'TINKERER', desc: 'A hands-on builder. Extra XP from sandboxes.' },
  { id: 'Scholar', label: 'SCHOLAR', desc: 'A careful reader. Extra XP from lessons.' },
  { id: 'Architect', label: 'ARCHITECT', desc: 'A systems thinker. Extra XP from mastery.' },
]

export default function TitleScreen() {
  const router = useRouter()
  const { initPlayer } = useGameStore()
  const [name, setName] = useState('')
  const [cls, setCls] = useState<PlayerClass>('Tinkerer')

  function handleStart() {
    if (!name.trim()) return
    initPlayer(name.trim(), cls)
    router.push('/overworld')
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LLAMA QUEST</Text>
      <Text style={styles.subtitle}>A Learning RPG</Text>

      <Text style={styles.label}>YOUR NAME</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter name..."
        placeholderTextColor="#555"
        maxLength={12}
        autoCorrect={false}
      />

      <Text style={styles.label}>YOUR CLASS</Text>
      {CLASSES.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={[styles.classBtn, cls === c.id && styles.classBtnActive]}
          onPress={() => setCls(c.id)}
        >
          <Text style={[styles.classBtnLabel, cls === c.id && styles.classBtnLabelActive]}>{c.label}</Text>
          <Text style={styles.classBtnDesc}>{c.desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.startBtn, !name.trim() && styles.startBtnDisabled]}
        onPress={handleStart}
        disabled={!name.trim()}
      >
        <Text style={styles.startBtnText}>START GAME</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0d0d1a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#f5c518', fontFamily: 'monospace', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginBottom: 4 },
  subtitle: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 13, marginBottom: 32 },
  label: { color: '#c0a060', fontFamily: 'monospace', fontSize: 11, alignSelf: 'flex-start', marginBottom: 6, marginTop: 12, letterSpacing: 2 },
  input: { backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#c0a060', borderRadius: 4, color: '#fff', fontFamily: 'monospace', fontSize: 16, paddingHorizontal: 12, paddingVertical: 8, width: '100%', maxWidth: 320 },
  classBtn: { width: '100%', maxWidth: 320, backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#444', borderRadius: 4, padding: 12, marginBottom: 8 },
  classBtnActive: { borderColor: '#f5c518' },
  classBtnLabel: { color: '#aaa', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
  classBtnLabelActive: { color: '#f5c518' },
  classBtnDesc: { color: '#777', fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  startBtn: { marginTop: 24, backgroundColor: '#c0a060', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 4 },
  startBtnDisabled: { backgroundColor: '#444' },
  startBtnText: { color: '#0d0d1a', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
})
```

- [ ] **Step 2: Verify manually**

```bash
npx expo start --web
```

Open browser. Expected: dark screen with "LLAMA QUEST" title, name input, three class buttons, START GAME button. Entering a name and clicking START GAME should navigate to `/overworld` (blank screen is fine for now).

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat(app): title screen with name input and class select"
```

---

## Task 12: Overworld Screen

**Files:**
- Create: `app/overworld.tsx`

**Interfaces:**
- Consumes: `WorldRenderer`, `HUD`, `DialogueBox`; `useGameLoop`, `usePlayerInput`; `movePlayer`; `nearestInteractable`; `OVERWORLD` from `content/world-data.ts`; `useGameStore`

- [ ] **Step 1: Implement `app/overworld.tsx`**

```tsx
import React, { useCallback, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { WorldRenderer } from '../renderer/WorldRenderer'
import { HUD } from '../components/HUD'
import { DialogueBox } from '../components/DialogueBox'
import { useGameLoop } from '../hooks/useGameLoop'
import { usePlayerInput } from '../hooks/usePlayerInput'
import { movePlayer } from '../engine/movement'
import { nearestInteractable, makePlayer } from '../engine/entity'
import { OVERWORLD } from '../content/world-data'
import { useGameStore } from '../store/game-store'
import type { Entity } from '../engine/entity'

const TILE_SIZE = 32

export default function OverworldScreen() {
  const { width, height } = useWindowDimensions()
  const router = useRouter()
  const { progression, markNPCMet, setPosition } = useGameStore()

  const playerRef = useRef<Entity>(
    makePlayer(progression.position.x, progression.position.y),
  )
  const [playerState, setPlayerState] = useState(playerRef.current)
  const [dialogue, setDialogue] = useState<{ lines: string[]; speaker?: string } | null>(null)
  const [nearbyLabel, setNearbyLabel] = useState<string | null>(null)

  const { input } = usePlayerInput()

  useGameLoop(useCallback((dt) => {
    if (dialogue) return
    const moved = movePlayer(playerRef.current, input.current, OVERWORLD.grid, dt)
    playerRef.current = moved
    setPlayerState({ ...moved })

    const nearby = nearestInteractable(OVERWORLD.entities, moved.x, moved.y)
    setNearbyLabel(nearby ? `[E] ${nearby.type === 'building_entrance' ? 'Enter' : 'Talk'}` : null)
  }, [dialogue]))

  function handleInteract() {
    const nearby = nearestInteractable(OVERWORLD.entities, playerRef.current.x, playerRef.current.y)
    if (!nearby) return
    if (nearby.type === 'building_entrance') {
      const dest = nearby.data['destination'] as string
      setPosition('llamatown', playerRef.current.x, playerRef.current.y)
      router.push(`/city/${dest}`)
    }
  }

  return (
    <View style={styles.screen}>
      <WorldRenderer
        grid={OVERWORLD.grid}
        player={playerState}
        entities={OVERWORLD.entities}
        tileSize={TILE_SIZE}
        screenWidth={width}
        screenHeight={height}
      />
      <HUD />
      {nearbyLabel && !dialogue && (
        <TouchableOpacity style={styles.interactPrompt} onPress={handleInteract}>
          <Text style={styles.interactText}>{nearbyLabel}</Text>
        </TouchableOpacity>
      )}
      {dialogue && (
        <DialogueBox
          lines={dialogue.lines}
          speakerName={dialogue.speaker}
          onClose={() => setDialogue(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a' },
  interactPrompt: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 2, borderColor: '#c0a060', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  interactText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 13 },
})
```

- [ ] **Step 2: Verify manually**

```bash
npx expo start --web
```

Complete the title screen, start game. Expected: player rectangle visible on the overworld tile grid, WASD movement working, camera following the player, HUD showing name and HP.

- [ ] **Step 3: Commit**

```bash
git add app/overworld.tsx
git commit -m "feat(app): overworld screen with movement, camera, and HUD"
```

---

## Task 13: City Screen — Llamatown Exterior

**Files:**
- Create: `app/city/[id].tsx`

**Interfaces:**
- Consumes: everything from Task 12 plus `LLAMATOWN`, `getCityDef` from `content/world-data.ts`; `markNPCMet` from store

- [ ] **Step 1: Implement `app/city/[id].tsx`**

```tsx
import React, { useCallback, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WorldRenderer } from '../../renderer/WorldRenderer'
import { HUD } from '../../components/HUD'
import { DialogueBox } from '../../components/DialogueBox'
import { useGameLoop } from '../../hooks/useGameLoop'
import { usePlayerInput } from '../../hooks/usePlayerInput'
import { movePlayer } from '../../engine/movement'
import { nearestInteractable, makePlayer } from '../../engine/entity'
import { getCityDef } from '../../content/world-data'
import { useGameStore } from '../../store/game-store'
import type { Entity } from '../../engine/entity'

const TILE_SIZE = 32

export default function CityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { width, height } = useWindowDimensions()
  const router = useRouter()
  const { progression, markNPCMet, setPosition } = useGameStore()

  const cityDef = getCityDef(id as any)
  const spawn = cityDef.playerSpawn

  const playerRef = useRef<Entity>(makePlayer(spawn.x, spawn.y))
  const [playerState, setPlayerState] = useState(playerRef.current)
  const [dialogue, setDialogue] = useState<{ lines: string[]; speaker?: string } | null>(null)
  const [nearbyEntity, setNearbyEntity] = useState<Entity | null>(null)

  const { input } = usePlayerInput()

  useGameLoop(useCallback((dt) => {
    if (dialogue) return
    const moved = movePlayer(playerRef.current, input.current, cityDef.grid, dt)
    playerRef.current = moved
    setPlayerState({ ...moved })
    setNearbyEntity(nearestInteractable(cityDef.entities, moved.x, moved.y))
  }, [dialogue, cityDef]))

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
      if (dest === 'overworld') router.push('/overworld')
      else router.push(`/city/${dest}`)
    }
  }

  const interactLabel = nearbyEntity
    ? nearbyEntity.type === 'npc' ? `[E] Talk to ${nearbyEntity.data['name']}` : '[E] Enter'
    : null

  return (
    <View style={styles.screen}>
      <WorldRenderer
        grid={cityDef.grid}
        player={playerState}
        entities={cityDef.entities}
        tileSize={TILE_SIZE}
        screenWidth={width}
        screenHeight={height}
      />
      <HUD />
      {interactLabel && !dialogue && (
        <TouchableOpacity style={styles.prompt} onPress={handleInteract}>
          <Text style={styles.promptText}>{interactLabel}</Text>
        </TouchableOpacity>
      )}
      {dialogue && (
        <DialogueBox lines={dialogue.lines} speakerName={dialogue.speaker} onClose={() => setDialogue(null)} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a' },
  prompt: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 2, borderColor: '#c0a060', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  promptText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 13 },
})
```

- [ ] **Step 2: Verify manually**

In browser: from overworld, walk to the Llamatown entrance and press E / tap. Expected: transitions to Llamatown, player can walk around, NPCs show dialogue boxes when approached, building entrances are selectable.

- [ ] **Step 3: Commit**

```bash
git add "app/city/[id].tsx"
git commit -m "feat(app): city screen with NPC dialogue and building entrances"
```

---

## Task 14: Content — Act I Lessons & Codex Component

**Files:**
- Create: `content/lessons.ts`, `content/diagrams.ts`, `components/Codex.tsx`
- Create: `app/building/[id].tsx`

**Interfaces:**
- Produces:
  ```typescript
  // content/lessons.ts
  type BlockType = {h2:string} | {p:string} | {ul:string[]} | {code:{lang:string;c:string}} | {tip:string} | {warn:string} | {note:string} | {diagram:string}
  interface Lesson { id: string; act: 1|2|3|4; idx: number; title: string; lede: string; body: BlockType[] }
  const LESSONS: Lesson[]
  function getLessonsForAct(act: number): Lesson[]
  function getLessonById(id: string): Lesson | undefined

  // components/Codex.tsx — renders a single lesson
  interface CodexProps { lesson: Lesson; onBack: () => void }
  function Codex(props): JSX.Element
  ```

- [ ] **Step 1: Implement `content/diagrams.ts`**

Migrate diagram data from `localhost-quest.html`. Create `content/diagrams.ts`:

```typescript
export interface DiagramDef {
  key: string
  caption: string
  svg: string  // raw SVG markup string
}

// Populated by migrating DIAGRAMS from localhost-quest.html
// Minimum: include the first Act I diagram so the Library is non-empty
export const DIAGRAMS: Record<string, DiagramDef> = {
  'ollama-arch': {
    key: 'ollama-arch',
    caption: 'Ollama architecture: client → server → model',
    svg: `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="40" width="100" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="60" y="65" text-anchor="middle" font-size="13" fill="#1a1a2e">Your App</text>
      <line x1="110" y1="60" x2="150" y2="60" stroke="#fff" stroke-width="2" marker-end="url(#arr)"/>
      <rect x="150" y="40" width="100" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="200" y="65" text-anchor="middle" font-size="13" fill="#1a1a2e">Ollama Server</text>
      <line x1="250" y1="60" x2="290" y2="60" stroke="#fff" stroke-width="2" marker-end="url(#arr)"/>
      <rect x="290" y="40" width="100" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="340" y="65" text-anchor="middle" font-size="13" fill="#1a1a2e">LLM Model</text>
      <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fff"/></marker></defs>
    </svg>`,
  },
}
```

- [ ] **Step 2: Migrate Act I lessons from `localhost-quest.html` into `content/lessons.ts`**

Open `localhost-quest.html` and locate the `LESSONS` array. Copy all lessons where `act === 1` into the new file, converting from the original object literal syntax to TypeScript:

```typescript
import type { DiagramDef } from './diagrams'

export type BlockType =
  | { h2: string }
  | { p: string }
  | { ul: string[] }
  | { code: { lang: string; c: string } }
  | { tip: string }
  | { warn: string }
  | { note: string }
  | { diagram: string }

export interface Lesson {
  id: string
  act: 1 | 2 | 3 | 4
  idx: number
  title: string
  lede: string
  body: BlockType[]
}

export const LESSONS: Lesson[] = [
  // ── ACT I ─────────────────────────────────────────────────────────
  {
    id: 'oll-intro',
    act: 1,
    idx: 0,
    title: 'What is Ollama?',
    lede: 'Run large language models on your own machine — no cloud, no API key.',
    body: [
      { h2: 'Local AI, finally easy' },
      { p: 'Ollama is an open-source tool that lets you download and run LLMs like Llama 3, Mistral, and Gemma directly on your laptop or server.' },
      { p: 'No cloud subscription. No API key. Your data never leaves your machine.' },
      { diagram: 'ollama-arch' },
      { tip: 'Think of Ollama as Docker, but for AI models.' },
      { h2: 'Why run locally?' },
      { ul: ['Privacy: data stays on your hardware', 'No per-token costs', 'Works offline', 'Full control over model version'] },
    ],
  },
  // ... (continue migrating remaining Act I lessons from localhost-quest.html)
  // Add all lessons with act: 1 from the original LESSONS array
]

export function getLessonsForAct(act: number): Lesson[] {
  return LESSONS.filter((l) => l.act === act).sort((a, b) => a.idx - b.idx)
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}
```

> **Migration note:** Open `localhost-quest.html`, search for `LESSONS = [` (around line 594), and copy each lesson object where `act:1` into the TypeScript array. Convert property access from JavaScript object literals to typed TypeScript. This is mechanical copy/paste — no logic changes needed.

- [ ] **Step 3: Implement `components/Codex.tsx`**

```tsx
import React from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Lesson, BlockType } from '../content/lessons'

interface CodexProps {
  lesson: Lesson
  onBack: () => void
}

function md(text: string): string {
  // Strip inline markdown for plain text rendering (bold, code, kbd)
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`(.*?)`/g, '$1').replace(/\[\[(.*?)\]\]/g, '[$1]')
}

function renderBlock(block: BlockType, idx: number): React.ReactNode {
  if ('h2' in block) return <Text key={idx} style={styles.h2}>{block.h2}</Text>
  if ('p' in block) return <Text key={idx} style={styles.p}>{md(block.p)}</Text>
  if ('ul' in block) return (
    <View key={idx} style={styles.ul}>
      {block.ul.map((item, i) => (
        <Text key={i} style={styles.li}>{'• '}{md(item)}</Text>
      ))}
    </View>
  )
  if ('code' in block) return (
    <View key={idx} style={styles.codeBlock}>
      <Text style={styles.codeLang}>{block.code.lang}</Text>
      <Text style={styles.codeText}>{block.code.c}</Text>
    </View>
  )
  if ('tip' in block) return <View key={idx} style={[styles.callout, styles.tip]}><Text style={styles.calloutText}>💡 {md(block.tip)}</Text></View>
  if ('warn' in block) return <View key={idx} style={[styles.callout, styles.warn]}><Text style={styles.calloutText}>⚠️ {md(block.warn)}</Text></View>
  if ('note' in block) return <View key={idx} style={[styles.callout, styles.note]}><Text style={styles.calloutText}>{md(block.note)}</Text></View>
  if ('diagram' in block) return <Text key={idx} style={styles.diagramPlaceholder}>[Diagram: {block.diagram}]</Text>
  return null
}

export function Codex({ lesson, onBack }: CodexProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.lede}>{lesson.lede}</Text>
      <View style={styles.divider} />
      {lesson.body.map((block, idx) => renderBlock(block, idx))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  content: { padding: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 13 },
  title: { color: '#f5c518', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  lede: { color: '#aaa', fontFamily: 'monospace', fontSize: 13, fontStyle: 'italic', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#333', marginBottom: 16 },
  h2: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  p: { color: '#ddd', fontFamily: 'monospace', fontSize: 13, lineHeight: 20, marginBottom: 10 },
  ul: { marginBottom: 10 },
  li: { color: '#ddd', fontFamily: 'monospace', fontSize: 13, lineHeight: 20, paddingLeft: 8 },
  codeBlock: { backgroundColor: '#1a1a2e', borderLeftWidth: 3, borderLeftColor: '#c0a060', padding: 12, marginBottom: 12, borderRadius: 4 },
  codeLang: { color: '#c0a060', fontFamily: 'monospace', fontSize: 10, marginBottom: 4 },
  codeText: { color: '#c8f0c8', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  callout: { borderRadius: 4, padding: 12, marginBottom: 12 },
  tip: { backgroundColor: '#1a2e1a', borderLeftWidth: 3, borderLeftColor: '#4caf50' },
  warn: { backgroundColor: '#2e1a0d', borderLeftWidth: 3, borderLeftColor: '#ff9800' },
  note: { backgroundColor: '#1a1a2e', borderLeftWidth: 3, borderLeftColor: '#7ec8e3' },
  calloutText: { color: '#ddd', fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  diagramPlaceholder: { color: '#555', fontFamily: 'monospace', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 16, borderWidth: 1, borderColor: '#333', borderRadius: 4, marginBottom: 12 },
})
```

- [ ] **Step 4: Implement `app/building/[id].tsx`**

```tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Codex } from '../../components/Codex'
import { getLessonsForAct } from '../../content/lessons'
import { useGameStore } from '../../store/game-store'
import type { Lesson } from '../../content/lessons'

// Map building id to act number
const BUILDING_ACT: Record<string, number> = {
  'llamatown-library': 1,
  'forge-library': 2,
  'vale-library': 3,
  'ridge-library': 4,
}

export default function BuildingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { progression, markLessonRead } = useGameStore()
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)

  const act = BUILDING_ACT[id ?? ''] ?? 1
  const lessons = getLessonsForAct(act)

  function openLesson(lesson: Lesson) {
    markLessonRead(lesson.id)
    setActiveLesson(lesson)
  }

  if (activeLesson) {
    return <Codex lesson={activeLesson} onBack={() => setActiveLesson(null)} />
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Exit Building</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>LIBRARY</Text>
      <Text style={styles.sub}>Act {act} Lessons</Text>
      <FlatList
        data={lessons}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => {
          const read = progression.readLessons[item.id]
          return (
            <TouchableOpacity style={[styles.lessonRow, read && styles.lessonRowRead]} onPress={() => openLesson(item)}>
              <Text style={styles.lessonTitle}>{read ? '✓ ' : '  '}{item.title}</Text>
              <Text style={styles.lessonLede}>{item.lede}</Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a', padding: 16 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 13 },
  heading: { color: '#f5c518', fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  sub: { color: '#aaa', fontFamily: 'monospace', fontSize: 12, marginBottom: 16 },
  lessonRow: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#333', borderRadius: 4, padding: 12, marginBottom: 8 },
  lessonRowRead: { borderColor: '#4caf50' },
  lessonTitle: { color: '#fff', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  lessonLede: { color: '#aaa', fontFamily: 'monospace', fontSize: 11 },
})
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all previously passing tests still pass.

- [ ] **Step 6: Verify end-to-end manually**

```bash
npx expo start --web
```

Full flow: Title screen → enter name → START → overworld → walk to Llamatown entrance → E to enter → walk to Library → E to enter → see lesson list → tap a lesson → read it → tap Back → XP increased in HUD.

- [ ] **Step 7: Commit**

```bash
git add content/lessons.ts content/diagrams.ts components/Codex.tsx "app/building/[id].tsx"
git commit -m "feat: codex component, Act I lessons, library building screen"
```

---

## Phase 1 Complete ✓

At this point the following works end-to-end:
- Title screen with name/class selection
- Overworld with WASD movement, camera follow, HUD
- Llamatown city with NPC dialogue (XP awarded on first meeting)
- Library building with Act I lesson list
- Codex reader with all block types rendered
- Lesson read state persisted to AsyncStorage / localStorage
- XP and level tracked, persisted between sessions

---

## What comes next (separate plans)

| Phase | Plan file (to be written) | Unlocks |
|---|---|---|
| **2 — Battle System** | `2026-XX-XX-llama-quest-phase2-battles.md` | Random encounters, PSI moves, rolling HP |
| **3 — Content Migration** | `2026-XX-XX-llama-quest-phase3-content.md` | Acts II–IV lessons, all QBANK questions, 5 sandbox labs, Terminal component |
| **4 — Audio** | `2026-XX-XX-llama-quest-phase4-audio.md` | Tone.js city themes, dynamic layering, SFX |
| **5 — Remaining Cities** | `2026-XX-XX-llama-quest-phase5-cities.md` | Model Forge, Vector Vale, RAG Ridge |
| **6 — Mobile Polish** | `2026-XX-XX-llama-quest-phase6-mobile.md` | Touch joystick, safe areas, haptics |
