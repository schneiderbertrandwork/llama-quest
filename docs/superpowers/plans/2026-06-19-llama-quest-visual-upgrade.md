# Llama Quest — Visual Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every colored-rect placeholder with retro SNES/Earthbound-style pixel-art sprites, tile texture patterns, SNES double-border UI chrome, and llamas throughout — including a title screen llama and six decorative overworld llamas.

**Architecture:** Sprite data lives in `content/sprites.ts` as typed `SpriteGrid` constants defined via a compact `px()` helper. `EntityRenderer` dispatches per entity type/id to call `drawSprite()` which renders a grid of Skia `Rect` calls. `TilemapRenderer` adds a texture layer per tile type using the same Rect-only approach. UI components get SNES double-border treatment via nested Views. A new `PixelArt` component (View grid, not Skia) handles the title screen llama and any future non-canvas pixel art.

**Tech Stack:** `@shopify/react-native-skia` (existing), React Native `View` (PixelArt), TypeScript strict.

## Global Constraints

- **Expo SDK 52** managed workflow; no ejecting
- **TypeScript strict** with `noUncheckedIndexedAccess: true`; all array/object index access uses `??` fallback
- **`--legacy-peer-deps`** required for all `npm install` calls
- **No arbitrary colors** — all sprite colors drawn from this palette: `#c8b89a`, `#8b7355`, `#d4c4a8`, `#c0a060`, `#ffffff`, `#8c6a3f`, `#4a6a8c`, `#aaaaaa`, `#7a4a8c`, `#a0e0ff`, `#f5c518`, `#4a8c6a`, `#ece9ff`, `#6a4a8c`, `#333333`, `#4caf50`, `#888888`, `#0a0826`, `#f44336`
- **TDD**: write failing test → implement minimal code → confirm green → commit
- **Save key** `'llama_quest_v1'` — never change

---

### Task 1: Sprite Data Foundation

**Files:**
- Create: `content/sprites.ts` — `SpriteGrid` interface, `px()` helper, all sprite constants
- Modify: `engine/entity.ts` — add `'decoration'` to `EntityType`, add `makeDecoration`
- Modify: `engine/__tests__/entity.test.ts` — add `makeDecoration` tests

**Interfaces:**
- Produces:
  - `SpriteGrid: { size: number; pixels: string[] }` — exported from `content/sprites.ts`
  - `SPRITE_PLAYER`, `SPRITE_NPC_ELDER`, `SPRITE_NPC_PIP`, `SPRITE_NPC_SMITH`, `SPRITE_NPC_ARTIFICER`, `SPRITE_NPC_ORACLE`, `SPRITE_NPC_VECTOR`, `SPRITE_NPC_ARCHITECT`, `SPRITE_NPC_KEEPER`, `SPRITE_DOOR`, `SPRITE_GATE`, `SPRITE_PORTAL`, `SPRITE_DECO_LLAMA` — all `SpriteGrid`, 8×8
  - `TITLE_LLAMA: SpriteGrid` — 20×20
  - `makeDecoration(id: string, x: number, y: number): Entity` — exported from `engine/entity.ts`
  - `'decoration'` added to `EntityType` union in `engine/entity.ts`

- [ ] **Step 1: Write failing tests for `makeDecoration`**

Open `engine/__tests__/entity.test.ts` and add:

```typescript
import { makePlayer, makeDecoration } from '../entity'

// existing makePlayer test stays unchanged

describe('makeDecoration', () => {
  it('creates a decoration entity at given coordinates', () => {
    const d = makeDecoration('deco-llama-1', 3, 4)
    expect(d.id).toBe('deco-llama-1')
    expect(d.type).toBe('decoration')
    expect(d.x).toBe(3)
    expect(d.y).toBe(4)
    expect(d.interactable).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- engine/__tests__/entity.test.ts --watchAll=false
```

Expected: FAIL — `makeDecoration is not a function`

- [ ] **Step 3: Add `'decoration'` to EntityType and `makeDecoration` in `engine/entity.ts`**

Replace the `EntityType` line and add the factory:

```typescript
export type EntityType = 'player' | 'npc' | 'sign' | 'building_entrance' | 'gate' | 'sandbox_portal' | 'decoration'

// Add after makeSandboxPortal:
export function makeDecoration(id: string, x: number, y: number): Entity {
  return { id, type: 'decoration', x, y, facing: 'down', interactable: false, data: {} }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- engine/__tests__/entity.test.ts --watchAll=false
```

Expected: PASS (2 tests)

- [ ] **Step 5: Create `content/sprites.ts`**

Create the file with all sprite constants. The `px` helper converts a character-grid string to a flat pixel array:

```typescript
export interface SpriteGrid {
  size: number
  pixels: string[]
}

function px(size: number, grid: string, map: Record<string, string>): string[] {
  return grid
    .replace(/\s/g, '')
    .slice(0, size * size)
    .split('')
    .map((c) => (c === '.' ? '' : (map[c] ?? '')))
}

// Color shortcuts
const B = '#c8b89a' // llama body tan
const S = '#8b7355' // shadow / hooves
const H = '#d4c4a8' // highlight
const G = '#c0a060' // gold (hat, accents)
const W = '#ffffff' // white (eye)
const F = '#8c6a3f' // forge brown
const A = '#aaaaaa' // metal / gear
const O = '#7a4a8c' // oracle purple
const C = '#a0e0ff' // crystal blue
const Y = '#f5c518' // yellow star
const Q = '#4a8c6a' // architect teal
const R = '#ece9ff' // scroll/page white
const K = '#6a4a8c' // keeper indigo
const P = '#4a6a8c' // artificer blue
const D = '#8b7355' // door wood (same as S)
const E = '#c0a060' // door arch accent (same as G)
const T = '#333333' // terminal dark
const N = '#4caf50' // terminal green

export const SPRITE_PLAYER: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    ..BB....
    .BBBB...
    .BB.....
    BBBBBB..
    BBBBBBB.
    BBBBBBB.
    B.B..B..
    S.S..S..
  `, { B, S }),
}

export const SPRITE_NPC_ELDER: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    .GGG....
    ..BB....
    .BBBB...
    .BB.....
    BBBBBB..
    BBBBBBB.
    B.B..B..
    S.S..S..
  `, { B, S, G }),
}

export const SPRITE_NPC_PIP: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    ........
    ..HHH...
    .HHHHH..
    HHHHHH..
    HHHHHH..
    H.H.H...
    S.S.S...
    ........
  `, { H, S }),
}

export const SPRITE_NPC_SMITH: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    .FF.....
    FFFF....
    .FF.....
    FFFF.A..
    FFFFAAA.
    FFFF.A..
    F..F....
    F..F....
  `, { F, A }),
}

export const SPRITE_NPC_ARTIFICER: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    .PP.....
    PPPP....
    .PP.....
    PAAP....
    PAPP....
    PPPP....
    P..P....
    P..P....
  `, { P, A }),
}

export const SPRITE_NPC_ORACLE: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    ..C.....
    .OO.....
    OOOO....
    O.O.....
    O.O.....
    O.O.....
    O.O.....
    ........
  `, { O, C }),
}

export const SPRITE_NPC_VECTOR: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    ..Y.....
    .YWY....
    YWWWY...
    .YWY....
    ..Y.....
    ........
    ........
    ........
  `, { Y, W }),
}

export const SPRITE_NPC_ARCHITECT: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    .QQ.....
    QQQQ....
    .QQ..R..
    QQQRR...
    QQQRR...
    QQQQ....
    Q..Q....
    Q..Q....
  `, { Q, R }),
}

export const SPRITE_NPC_KEEPER: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    .KK.....
    KKKK....
    .KK.....
    KWWKWW..
    KWWKWW..
    KWWK....
    K..K....
    K..K....
  `, { K, W }),
}

export const SPRITE_DOOR: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    DDDDDDDD
    DDEEEEDD
    DEDDDDED
    DD....DD
    DD....DD
    DD....DD
    DD....DD
    DDDDDDDD
  `, { D, E }),
}

export const SPRITE_GATE: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    GGGGGGGG
    G.G.G.G.
    G.G.G.G.
    GGGGGGGG
    G.G.G.G.
    G.G.G.G.
    G.G.G.G.
    GGGGGGGG
  `, { G: '#888888' }),
}

export const SPRITE_PORTAL: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    TTTTTTT.
    TNNNNNT.
    TNN.N.T.
    TNNNNNT.
    TTTTTTT.
    ..TTT...
    .TTTTT..
    ........
  `, { T, N }),
}

export const SPRITE_DECO_LLAMA: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    ..BB....
    .BB.....
    BBBBB...
    BBBBB...
    B.B.B...
    S.S.S...
    ........
    ........
  `, { B, S }),
}

// 20×20 title screen llama — rendered via PixelArt component at scale=8 (160×160px)
export const TITLE_LLAMA: SpriteGrid = {
  size: 20,
  pixels: px(20, `
    .............B.B....
    ............BB.BB...
    ............BBBBB...
    ............BW.SB...
    ............BBBBB...
    ...........BBBBB....
    ..........BBBBB.....
    .........BBBBB......
    ......BBBBBBBBBBBB..
    .....HBBBBBBBBBBBBB.
    .....BBBBBBBBBBBBB..
    .....BBBBBBBBBBBBB..
    .....SSBBBBBBBBBBBS.
    ......SSBBBBBBBBBS..
    .....B.B.........B.B
    .....B.B.........B.B
    .....B.B.........B.B
    .....B.B.........B.B
    .....S.S.........S.S
    ....................
  `, { B, S, H, W }),
}
```

- [ ] **Step 6: Run full test suite (no new tests for sprite data — visual verification via Playwright)**

```bash
npm test -- --watchAll=false
```

Expected: All existing tests pass. No new tests needed for sprite constants (pure data, no logic).

- [ ] **Step 7: Commit**

```bash
git add content/sprites.ts engine/entity.ts engine/__tests__/entity.test.ts
git commit -m "feat: sprite data foundation — SpriteGrid constants, px helper, makeDecoration"
```

---

### Task 2: PixelArt Component + Title Screen Llama

**Files:**
- Create: `components/PixelArt.tsx`
- Create: `components/__tests__/PixelArt.test.tsx`
- Modify: `app/index.tsx` — add `<PixelArt>` llama above "LLAMA QUEST" heading

**Interfaces:**
- Consumes: `TITLE_LLAMA` from `content/sprites.ts`
- Produces: `PixelArt({ pixels, size, scale, testID? })` — renders a `size×size` grid of `scale×scale` Views

- [ ] **Step 1: Write failing test**

Create `components/__tests__/PixelArt.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { PixelArt } from '../PixelArt'

const SIMPLE_SPRITE = {
  // 2×2 grid: red, transparent, transparent, blue
  pixels: ['#ff0000', '', '', '#0000ff'],
  size: 2,
}

describe('PixelArt', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <PixelArt pixels={SIMPLE_SPRITE.pixels} size={SIMPLE_SPRITE.size} scale={8} testID="pa" />
    )
    expect(toJSON()).not.toBeNull()
  })

  it('renders size*size pixel views', () => {
    const { getAllByTestId } = render(
      <PixelArt pixels={SIMPLE_SPRITE.pixels} size={SIMPLE_SPRITE.size} scale={8} testID="pa" />
    )
    // 2×2 = 4 pixel views
    expect(getAllByTestId('pa-pixel').length).toBe(4)
  })

  it('applies backgroundColor from pixels array', () => {
    const { getAllByTestId } = render(
      <PixelArt pixels={SIMPLE_SPRITE.pixels} size={SIMPLE_SPRITE.size} scale={8} testID="pa" />
    )
    const pixelViews = getAllByTestId('pa-pixel')
    expect(pixelViews[0]?.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#ff0000' })
    )
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- components/__tests__/PixelArt.test.tsx --watchAll=false
```

Expected: FAIL — `Cannot find module '../PixelArt'`

- [ ] **Step 3: Create `components/PixelArt.tsx`**

```tsx
import React from 'react'
import { View } from 'react-native'

interface PixelArtProps {
  pixels: string[]
  size: number
  scale: number
  testID?: string
}

export function PixelArt({ pixels, size, scale, testID }: PixelArtProps) {
  const rows: React.ReactElement[] = []
  for (let r = 0; r < size; r++) {
    const cols: React.ReactElement[] = []
    for (let c = 0; c < size; c++) {
      const color = pixels[r * size + c] ?? ''
      cols.push(
        <View
          key={c}
          testID={testID ? 'pa-pixel' : undefined}
          style={{ width: scale, height: scale, backgroundColor: color || 'transparent' }}
        />
      )
    }
    rows.push(
      <View key={r} style={{ flexDirection: 'row' }}>
        {cols}
      </View>
    )
  }
  return <View testID={testID}>{rows}</View>
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- components/__tests__/PixelArt.test.tsx --watchAll=false
```

Expected: PASS (3 tests)

- [ ] **Step 5: Add llama to `app/index.tsx`**

Add imports at top:
```tsx
import { PixelArt } from '../components/PixelArt'
import { TITLE_LLAMA } from '../content/sprites'
```

In the return JSX, add the `PixelArt` llama between the subtitle and the "YOUR NAME" label. Find the `<Text style={styles.subtitle}>` and `<Text style={styles.label}>YOUR NAME</Text>` lines and insert between them:

```tsx
      <Text style={styles.subtitle}>A Learning RPG</Text>

      <PixelArt
        pixels={TITLE_LLAMA.pixels}
        size={TITLE_LLAMA.size}
        scale={8}
        testID="title-llama"
      />

      <Text style={styles.label}>YOUR NAME</Text>
```

Also update `styles.subtitle` to reduce bottom margin (the llama provides spacing):
```tsx
  subtitle: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 13, marginBottom: 16 },
```

(Previously `marginBottom: 32` — reduce to 16 since the llama adds visual spacing.)

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add components/PixelArt.tsx components/__tests__/PixelArt.test.tsx app/index.tsx
git commit -m "feat: PixelArt component + title screen llama"
```

---

### Task 3: EntityRenderer — Pixel-Art Sprites

**Files:**
- Modify: `renderer/EntityRenderer.tsx` — replace solid rects with sprite-based rendering
- Modify: `renderer/__tests__/TilemapRenderer.test.tsx` — no changes needed; add a smoke test to `EntityRenderer` if one doesn't exist

**Interfaces:**
- Consumes:
  - `SpriteGrid` from `content/sprites.ts`
  - All `SPRITE_*` constants from `content/sprites.ts`
  - `Entity`, `EntityType` from `engine/entity.ts`
- Produces: `EntityRenderer` (same props interface, no changes) — now renders pixel-art sprites instead of solid rects

- [ ] **Step 1: Write smoke test for EntityRenderer**

Create `renderer/__tests__/EntityRenderer.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { EntityRenderer } from '../EntityRenderer'
import { makePlayer, makeNPC, makeDecoration } from '../../engine/entity'

describe('EntityRenderer', () => {
  const camera = { x: 0, y: 0 }
  const baseProps = { camera, tileSize: 32, width: 320, height: 240 }

  it('renders player entity without crashing', () => {
    const player = makePlayer(5, 5)
    const { toJSON } = render(<EntityRenderer entities={[player]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders decoration entity without crashing', () => {
    const deco = makeDecoration('deco-llama-1', 3, 4)
    const { toJSON } = render(<EntityRenderer entities={[deco]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders known NPC entity without crashing', () => {
    const npc = makeNPC('npc-llama-elder', 5, 5, { name: 'Elder', lines: ['Hi'] })
    const { toJSON } = render(<EntityRenderer entities={[npc]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders unknown NPC entity without crashing (fallback rect)', () => {
    const npc = makeNPC('npc-unknown', 5, 5, { name: 'Mystery', lines: ['?'] })
    const { toJSON } = render(<EntityRenderer entities={[npc]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm the file compiles but snapshot may differ**

```bash
npm test -- renderer/__tests__/EntityRenderer.test.tsx --watchAll=false
```

Expected: PASS (smoke tests don't assert visual output, just no crash)

- [ ] **Step 3: Rewrite `renderer/EntityRenderer.tsx`**

```tsx
import React from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { Entity } from '../engine/entity'
import type { Camera } from '../engine/camera'
import type { SpriteGrid } from '../content/sprites'
import {
  SPRITE_PLAYER,
  SPRITE_NPC_ELDER,
  SPRITE_NPC_PIP,
  SPRITE_NPC_SMITH,
  SPRITE_NPC_ARTIFICER,
  SPRITE_NPC_ORACLE,
  SPRITE_NPC_VECTOR,
  SPRITE_NPC_ARCHITECT,
  SPRITE_NPC_KEEPER,
  SPRITE_DOOR,
  SPRITE_GATE,
  SPRITE_PORTAL,
  SPRITE_DECO_LLAMA,
} from '../content/sprites'

const NPC_SPRITE: Record<string, SpriteGrid> = {
  'npc-llama-elder': SPRITE_NPC_ELDER,
  'npc-pip': SPRITE_NPC_PIP,
  'npc-smith': SPRITE_NPC_SMITH,
  'npc-api-artificer': SPRITE_NPC_ARTIFICER,
  'npc-prism-oracle': SPRITE_NPC_ORACLE,
  'npc-vector-sprite': SPRITE_NPC_VECTOR,
  'npc-architect': SPRITE_NPC_ARCHITECT,
  'npc-keeper': SPRITE_NPC_KEEPER,
}

const FALLBACK_COLOR: Record<string, string> = {
  player: '#f5c518',
  npc: '#4fc3f7',
  sign: '#ce93d8',
  building_entrance: '#80cbc4',
  gate: '#ef9a9a',
  sandbox_portal: '#a5d6a7',
  decoration: '#c8b89a',
}

interface SpriteResult {
  sprite: SpriteGrid
  tint?: string
}

function getSpriteForEntity(entity: Entity): SpriteResult | null {
  switch (entity.type) {
    case 'player':
      return { sprite: SPRITE_PLAYER }
    case 'npc': {
      const sprite = NPC_SPRITE[entity.id]
      return sprite ? { sprite } : null
    }
    case 'building_entrance':
      return { sprite: SPRITE_DOOR }
    case 'gate': {
      const locked = entity.data['locked'] as boolean | undefined
      return { sprite: SPRITE_GATE, tint: locked ? '#f44336' : '#4caf50' }
    }
    case 'sandbox_portal':
      return { sprite: SPRITE_PORTAL }
    case 'decoration':
      return { sprite: SPRITE_DECO_LLAMA }
    default:
      return null
  }
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
        {entities.flatMap((entity) => {
          const sx = entity.x * tileSize - camera.x
          const sy = entity.y * tileSize - camera.y
          const spriteResult = getSpriteForEntity(entity)

          if (!spriteResult) {
            // Fallback: solid rect for unknown types
            const size = tileSize * 0.8
            const offset = tileSize * 0.1
            return [
              <Rect
                key={entity.id}
                x={sx + offset}
                y={sy + offset}
                width={size}
                height={size}
                color={FALLBACK_COLOR[entity.type] ?? '#ffffff'}
              />,
            ]
          }

          const { sprite, tint } = spriteResult
          const pixelSize = tileSize / sprite.size
          return sprite.pixels.map((color, i) => {
            const c = tint ?? color
            if (!c) return null
            const row = Math.floor(i / sprite.size)
            const col = i % sprite.size
            return (
              <Rect
                key={`${entity.id}-${i}`}
                x={sx + col * pixelSize}
                y={sy + row * pixelSize}
                width={pixelSize}
                height={pixelSize}
                color={c}
              />
            )
          }).filter((el): el is React.ReactElement => el !== null)
        })}
      </Group>
    </Canvas>
  )
}
```

- [ ] **Step 4: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add renderer/EntityRenderer.tsx renderer/__tests__/EntityRenderer.test.tsx
git commit -m "feat: EntityRenderer — pixel-art sprite rendering, NPC ID lookup, decoration support"
```

---

### Task 4: TilemapRenderer — Tile Texture Pass

**Files:**
- Modify: `renderer/TilemapRenderer.tsx` — add texture layer per tile type

**Interfaces:**
- No API changes. Same props. Purely additive rendering — adds texture rects on top of base color rects.

- [ ] **Step 1: Run existing TilemapRenderer test to confirm baseline**

```bash
npm test -- renderer/__tests__/TilemapRenderer.test.tsx --watchAll=false
```

Expected: PASS (1 test — smoke test that it renders without crashing)

- [ ] **Step 2: Rewrite `renderer/TilemapRenderer.tsx`**

```tsx
import React, { useMemo } from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { TileGrid, TileType } from '../engine/tilemap'
import { tileAt } from '../engine/tilemap'
import type { Camera } from '../engine/camera'

const TILE_BASE: Record<TileType, string> = {
  grass: '#2d5a1b',
  forest: '#1e4d22',
  path: '#b5934a',
  water: '#1a5276',
  building_wall: '#5d4037',
  floor: '#7e6551',
  door: '#d4ac0d',
}

interface TileRect {
  x: number
  y: number
  w: number
  h: number
  color: string
}

function getTextureRects(type: TileType, sx: number, sy: number, ts: number): TileRect[] {
  switch (type) {
    case 'grass': {
      // 1×1 lighter dots every 8px
      const rects: TileRect[] = []
      for (let dy = 0; dy < ts; dy += 8) {
        for (let dx = 0; dx < ts; dx += 8) {
          rects.push({ x: sx + dx, y: sy + dy, w: 1, h: 1, color: '#3a7022' })
        }
      }
      return rects
    }
    case 'path':
      // Centered 1px horizontal stripe
      return [{ x: sx, y: sy + ts / 2, w: ts, h: 1, color: '#7a6347' }]
    case 'forest':
      // 3×3 dark triangle shape in top-center
      return [
        { x: sx + ts / 2 - 1, y: sy + 2, w: 1, h: 3, color: '#122d12' },
        { x: sx + ts / 2 - 2, y: sy + 3, w: 3, h: 2, color: '#122d12' },
      ]
    case 'water': {
      // Two 1px horizontal stripes
      const mid = Math.floor(ts / 2)
      return [
        { x: sx, y: sy + mid - 3, w: ts, h: 1, color: '#2a4d8b' },
        { x: sx, y: sy + mid + 3, w: ts, h: 1, color: '#2a4d8b' },
      ]
    }
    case 'building_wall': {
      // Horizontal lines every 8px (brick courses)
      const rects: TileRect[] = []
      for (let dy = 8; dy < ts; dy += 8) {
        rects.push({ x: sx, y: sy + dy, w: ts, h: 1, color: '#555555' })
      }
      return rects
    }
    case 'floor': {
      // Vertical lines every 8px (plank joints)
      const rects: TileRect[] = []
      for (let dx = 8; dx < ts; dx += 8) {
        rects.push({ x: sx + dx, y: sy, w: 1, h: ts, color: '#444444' })
      }
      return rects
    }
    case 'door':
      // Center panel (half-width door inset)
      return [{ x: sx + ts / 4, y: sy + 4, w: ts / 2, h: ts - 8, color: '#a07820' }]
    default:
      return []
  }
}

interface TilemapRendererProps {
  grid: TileGrid
  camera: Camera
  tileSize: number
  width: number
  height: number
}

export function TilemapRenderer({ grid, camera, tileSize, width, height }: TilemapRendererProps) {
  const allRects = useMemo(() => {
    const startX = Math.max(0, Math.floor(camera.x / tileSize))
    const startY = Math.max(0, Math.floor(camera.y / tileSize))
    const endX = Math.min(grid.width, startX + Math.ceil(width / tileSize) + 2)
    const endY = Math.min(grid.height, startY + Math.ceil(height / tileSize) + 2)
    const rects: TileRect[] = []
    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = tileAt(grid, tx, ty)
        if (!tile) continue
        const sx = tx * tileSize - camera.x
        const sy = ty * tileSize - camera.y
        // Base rect
        rects.push({ x: sx, y: sy, w: tileSize, h: tileSize, color: TILE_BASE[tile.type] })
        // Texture rects
        for (const r of getTextureRects(tile.type, sx, sy, tileSize)) {
          rects.push(r)
        }
      }
    }
    return rects
  }, [grid, camera, tileSize, width, height])

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {allRects.map((r, i) => (
          <Rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} color={r.color} />
        ))}
      </Group>
    </Canvas>
  )
}
```

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass. The existing TilemapRenderer smoke test still passes (same props interface).

- [ ] **Step 4: Commit**

```bash
git add renderer/TilemapRenderer.tsx
git commit -m "feat: tile texture pass — dithered grass, brick walls, plank floors, water shimmer"
```

---

### Task 5: SNES UI Chrome

**Files:**
- Modify: `components/DialogueBox.tsx` — double-border, corner accents, `#0a0826` background
- Modify: `components/HUD.tsx` — double-border, pixel HP bar (no border-radius)
- Modify: `components/BattleMenu.tsx` — square corners, beveled button highlight
- Modify: `app/battle.tsx` — scanline pattern on Skia canvas, pixel border on enemy rect

**Interfaces:**
- No prop changes to any component. All changes are purely stylistic.

- [ ] **Step 1: Rewrite `components/DialogueBox.tsx`**

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
      {/* SNES double-border: outer gold → black gap → inner gold → dark content */}
      <View style={styles.outerBorder}>
        <View style={styles.gap}>
          <View style={styles.innerBorder}>
            {/* Corner accents */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {speakerName ? <Text style={styles.speaker}>{speakerName}</Text> : null}
            <Text style={styles.text}>{displayed}</Text>
            {finished && <Text style={styles.arrow}>▼</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 },
  outerBorder: { borderWidth: 2, borderColor: '#c0a060', backgroundColor: '#000000' },
  gap: { padding: 2, backgroundColor: '#000000' },
  innerBorder: {
    borderWidth: 2,
    borderColor: '#c0a060',
    backgroundColor: '#0a0826',
    padding: 12,
    minHeight: 80,
  },
  corner: { position: 'absolute', width: 4, height: 4, backgroundColor: '#c0a060' },
  cornerTL: { top: -1, left: -1 },
  cornerTR: { top: -1, right: -1 },
  cornerBL: { bottom: -1, left: -1 },
  cornerBR: { bottom: -1, right: -1 },
  speaker: { color: '#f5c518', fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  text: { color: '#ffffff', fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  arrow: { color: '#c0a060', alignSelf: 'flex-end', fontSize: 12 },
})
```

- [ ] **Step 2: Rewrite `components/HUD.tsx`**

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useGameStore } from '../store/game-store'

export function HUD() {
  const { player } = useGameStore()
  const hpPercent = player.hp / player.maxHp
  const hpBarColor = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336'

  return (
    <View style={styles.outerBorder} pointerEvents="none">
      <View style={styles.gap}>
        <View style={styles.innerBorder}>
          <View style={styles.row}>
            <Text style={styles.name}>{player.name || 'LLAMA'}</Text>
            <Text style={styles.level}>Lv.{player.level}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>HP</Text>
            <View style={styles.barOuter}>
              <View style={[styles.barFill, { width: `${hpPercent * 100}%` as any, backgroundColor: hpBarColor }]} />
            </View>
            <Text style={styles.hpText}>{player.hp}/{player.maxHp}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>XP</Text>
            <Text style={styles.xpText}>{player.xp}/120</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outerBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    minWidth: 160,
    borderWidth: 2,
    borderColor: '#c0a060',
    backgroundColor: '#000000',
  },
  gap: { padding: 2, backgroundColor: '#000000' },
  innerBorder: {
    borderWidth: 2,
    borderColor: '#c0a060',
    backgroundColor: '#0a0826',
    padding: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { color: '#f5c518', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', flex: 1 },
  level: { color: '#aaaaaa', fontFamily: 'monospace', fontSize: 10 },
  label: { color: '#aaaaaa', fontFamily: 'monospace', fontSize: 10, width: 24 },
  // Pixel-style HP bar: borderRadius:0, border around it
  barOuter: {
    flex: 1,
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  barFill: { height: '100%', borderRadius: 0 },
  hpText: { color: '#ffffff', fontFamily: 'monospace', fontSize: 10, width: 48, textAlign: 'right' },
  xpText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 10 },
})
```

- [ ] **Step 3: Rewrite `components/BattleMenu.tsx`**

```tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

interface BattleMenuProps {
  onPSI: () => void
  onGuard: () => void
  onRun: () => void
  disabled: boolean
}

export function BattleMenu({ onPSI, onGuard, onRun, disabled }: BattleMenuProps) {
  function withHaptic(fn: () => void) {
    if (Platform.OS !== 'web') Haptics.selectionAsync()
    fn()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, styles.psi, disabled && styles.disabled]}
        onPress={() => withHaptic(onPSI)}
        disabled={disabled}
      >
        {/* Bevel highlight: top-left 1px lighter edge */}
        <View style={[styles.bevel, styles.bevelTop]} />
        <View style={[styles.bevel, styles.bevelLeft]} />
        <Text style={styles.btnText}>⚡ PSI</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.guard, disabled && styles.disabled]}
        onPress={() => withHaptic(onGuard)}
        disabled={disabled}
      >
        <View style={[styles.bevel, styles.bevelTop]} />
        <View style={[styles.bevel, styles.bevelLeft]} />
        <Text style={styles.btnText}>🛡 Guard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.run, disabled && styles.disabled]}
        onPress={() => withHaptic(onRun)}
        disabled={disabled}
      >
        <View style={[styles.bevel, styles.bevelTop]} />
        <View style={[styles.bevel, styles.bevelLeft]} />
        <Text style={styles.btnText}>💨 Run</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8, minWidth: 140 },
  btn: {
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  psi: { backgroundColor: '#1a1240', borderColor: '#a06bff' },
  guard: { backgroundColor: '#0d1f2d', borderColor: '#4fe0cf' },
  run: { backgroundColor: '#1f1208', borderColor: '#c0a060' },
  disabled: { opacity: 0.4 },
  btnText: { color: '#ffffff', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
  bevel: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.18)' },
  bevelTop: { top: 0, left: 0, right: 0, height: 1 },
  bevelLeft: { top: 0, left: 0, bottom: 0, width: 1 },
})
```

- [ ] **Step 4: Add scanlines + enemy border to `app/battle.tsx`**

In `app/battle.tsx`, find the Skia `<Canvas>` block. Replace it with a version that draws scanlines on the battle area and a pixel border around the enemy rect:

```tsx
      {/* Skia background */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height} color="#0d0d1a" />
        {/* Scanlines on top battle area — alternating 1px rows */}
        {Array.from({ length: Math.ceil(height * 0.45) }, (_, i) =>
          i % 2 === 0 ? (
            <Rect key={i} x={0} y={i} width={width} height={1} color="#120d28" />
          ) : (
            <Rect key={i} x={0} y={i} width={width} height={1} color="#0f0a22" />
          )
        )}
        {/* Enemy placeholder with pixel border */}
        <Rect x={width / 2 - 40} y={60} width={80} height={80} color="#2a2150" />
        <Rect x={width / 2 - 41} y={59} width={82} height={1} color="#ece9ff" />
        <Rect x={width / 2 - 41} y={140} width={82} height={1} color="#ece9ff" />
        <Rect x={width / 2 - 41} y={59} width={1} height={82} color="#ece9ff" />
        <Rect x={width / 2 + 40} y={59} width={1} height={82} color="#ece9ff" />
      </Canvas>
```

> **Note:** `Array.from` creates `Math.ceil(height * 0.45)` scanline rects. On a typical 844px tall phone screen, that's ~380 rects. This is acceptable for Skia. On web at 800px it's ~360 rects. If performance is a concern, increase step to every 2px.

- [ ] **Step 5: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/DialogueBox.tsx components/HUD.tsx components/BattleMenu.tsx app/battle.tsx
git commit -m "feat: SNES UI chrome — double-border dialogs/HUD, beveled battle menu, scanlines"
```

---

### Task 6: Decorative Overworld Llamas

**Files:**
- Modify: `content/world-data.ts` — import `makeDecoration`, add 6 decoration entities to `OVERWORLD.entities`

**Interfaces:**
- Consumes: `makeDecoration` from `engine/entity.ts`
- No new exports. Purely additive to the OVERWORLD entity list.

- [ ] **Step 1: Add decorative llamas to `content/world-data.ts`**

Add `makeDecoration` to the existing import from `engine/entity`:

```typescript
import { makeNPC, makeBuildingEntrance, makeGate, makeSandboxPortal, makeDecoration } from '../engine/entity'
```

In the `OVERWORLD` constant, add 6 decoration entities to the `entities` array:

```typescript
export const OVERWORLD: CityDef = {
  id: 'overworld',
  grid: buildOverworldGrid(),
  playerSpawn: { x: 6, y: 14 },
  entities: [
    makeBuildingEntrance('enter-llamatown', 7, 13, 'llamatown'),
    makeBuildingEntrance('enter-forge', 33, 14, 'forge'),
    makeBuildingEntrance('enter-vale', 25, 22, 'vale'),
    makeBuildingEntrance('enter-ridge', 10, 22, 'ridge'),
    // Decorative llamas scattered across grass tiles
    makeDecoration('deco-llama-1', 3, 4),
    makeDecoration('deco-llama-2', 12, 6),
    makeDecoration('deco-llama-3', 28, 8),
    makeDecoration('deco-llama-4', 7, 22),
    makeDecoration('deco-llama-5', 22, 18),
    makeDecoration('deco-llama-6', 35, 25),
  ],
  gateExit: { x: 0, y: 0, destination: 'llamatown' },
}
```

> **Positions verified:** All 6 positions are within the 40×30 OVERWORLD grid and on grass tiles (not forest rows 0-1/28-29, not the path at rows 14-15, not near city entrances).

- [ ] **Step 2: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add content/world-data.ts
git commit -m "feat: add 6 decorative llamas to overworld grass"
```

---

### Task 7: Playwright End-of-Phase Verification

**Goal:** Confirm all visual upgrade features render correctly in the browser and no regressions from Phases 1–5 exist.

- [ ] **Step 1: Start the dev server**

```bash
npx expo start --web
```

Wait for Metro to finish bundling.

- [ ] **Step 2: Load title screen — verify llama renders**

Navigate to `http://localhost:8081`. Confirm:
- "LLAMA QUEST" title renders
- Pixel-art llama appears between title and name input
- Llama is visible as a grid of colored squares (160×160px approx)
- No React errors in console

- [ ] **Step 3: Enter game — verify overworld sprites**

Enter a name, pick a class, start game. On the overworld confirm:
- Player renders as a pixel-art llama shape (not a flat yellow rect)
- Decorative llamas visible as small llama shapes on grass tiles around the map
- Building entrances render as door shapes (not flat teal rects)
- Tiles have visible texture (grass dots, path stripe)

- [ ] **Step 4: Enter Llamatown — verify NPC sprites and UI**

Walk into Llamatown. Confirm:
- Llama Elder NPC renders as a llama with a gold hat (not a flat blue rect)
- HUD has SNES double-border (gold outer, black gap, gold inner — no rounded corners)
- HP bar has no border-radius (square pixel style)

- [ ] **Step 5: Open NPC dialogue — verify dialogue box chrome**

Press E to talk to Llama Elder. Confirm:
- Dialogue box has SNES double-border style
- Background is deep navy (#0a0826), not pure black
- Corner accent squares visible at all 4 corners
- Dialogue text typewriter effect still works

- [ ] **Step 6: Enter a battle — verify battle screen**

Trigger a random encounter. Confirm:
- Battle background has visible scanline pattern (subtle alternating dark rows)
- Enemy placeholder rect has a pixel border (thin white outline)
- BattleMenu buttons have square corners (no border-radius) and bevel highlight

- [ ] **Step 7: Navigate to Forge — verify forge NPC sprites**

Enter The Forge city. Confirm:
- Smith NPC renders as a brown figure with hammer pixels
- Gate entity renders with colored portcullis bars

- [ ] **Step 8: Check console for errors**

After full golden path: 0 uncaught errors in browser DevTools console. AudioContext warnings are acceptable (pre-existing).

- [ ] **Step 9: Update `progress.md`**

Open `.superpowers/sdd/progress.md` and append:

```markdown
## Visual Upgrade — SNES Pixel Art

Plan: docs/superpowers/plans/2026-06-19-llama-quest-visual-upgrade.md

| Task | Status | Commits | Notes |
|------|--------|---------|-------|
| 1: Sprite data foundation | complete | <commit> | review clean |
| 2: PixelArt component + title llama | complete | <commit> | review clean |
| 3: EntityRenderer pixel-art | complete | <commit> | review clean |
| 4: TilemapRenderer tile textures | complete | <commit> | review clean |
| 5: SNES UI chrome | complete | <commit> | review clean |
| 6: Decorative overworld llamas | complete | <commit> | review clean |
| Playwright end-of-phase | complete | — | <results> |
```

- [ ] **Step 10: Update CLAUDE.md**

Add the Visual Upgrade to the Phase Status table:
```
| Visual Upgrade — SNES Pixel Art | ✅ Complete | `docs/superpowers/plans/2026-06-19-llama-quest-visual-upgrade.md` |
```

- [ ] **Step 11: Final commit**

```bash
git add .superpowers/sdd/progress.md CLAUDE.md
git commit -m "chore: record Visual Upgrade Playwright results and mark complete"
```

---

## Self-Review

**Spec coverage:**
- [x] `SpriteGrid` interface + `px()` helper — Task 1
- [x] All 13 entity sprite constants (8×8) + TITLE_LLAMA (20×20) — Task 1
- [x] `makeDecoration` + `'decoration'` EntityType — Task 1
- [x] `PixelArt` component — Task 2
- [x] Title screen llama — Task 2
- [x] EntityRenderer sprite dispatch by type + NPC id lookup — Task 3
- [x] Gate locked/unlocked tint at draw time — Task 3
- [x] Tile texture patterns (all 7 tile types) — Task 4
- [x] DialogueBox SNES double-border + corner accents + `#0a0826` background — Task 5
- [x] HUD double-border + pixel HP bar (borderRadius 0) — Task 5
- [x] BattleMenu square corners + bevel highlight — Task 5
- [x] Battle screen scanlines + enemy pixel border — Task 5
- [x] 6 decorative llamas at specified positions in OVERWORLD — Task 6

**Type consistency:** `SpriteGrid` defined in Task 1, consumed identically in Tasks 2 and 3. `makeDecoration` defined in Task 1, consumed in Task 6. `EntityType | 'decoration'` added in Task 1; `EntityRenderer` in Task 3 handles it via `case 'decoration'`. All consistent.

**Note on BattleMenu:** Task 5's BattleMenu includes the `withHaptic` wrapper from Phase 6 Task 3. If Phase 6 executes before the Visual Upgrade, the Phase 6 BattleMenu already has haptics and Task 5 here must preserve it. If Visual Upgrade runs before Phase 6, the Phase 6 BattleMenu task will overwrite this file — that's fine since Phase 6 Task 3 Step 8 rewrites BattleMenu entirely, and the implementer should incorporate the bevel style from this plan into that step. **Whichever plan runs second must merge both sets of changes.**
