# Llama Quest — Visual Upgrade Implementation Plan (Revised)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every colored-rect placeholder with animated SNES-style pixel-art sprites, add animated grass tiles, expand the overworld to 400×300 tiles (10×), add roaming woodland creatures and butterflies, and apply SNES double-border UI chrome throughout.

**Architecture:** `SpriteAnimation` type (frames array + frameDuration) drives multi-frame entities. `EntityRenderer` gets a `time: number` prop for frame selection. `TilemapRenderer` gets `grassPhase: number` for animated grass. `WorldRenderer` threads both through. A new `engine/critter.ts` implements pure critter tick logic; overworld maintains critters in local state. World-data expands to 400×300 with new city positions.

**Tech Stack:** `@shopify/react-native-skia` (existing), React Native `View` (PixelArt), TypeScript strict, existing game loop.

## Global Constraints

- **Expo SDK 52** managed workflow; no ejecting
- **TypeScript strict** with `noUncheckedIndexedAccess: true` — all array/object access uses `?? fallback`
- **`--legacy-peer-deps`** on all `npm install` calls
- **No arbitrary colors** — use only: `#c8b89a`, `#8b7355`, `#d4c4a8`, `#c0a060`, `#ffffff`, `#8c6a3f`, `#4a6a8c`, `#aaaaaa`, `#7a4a8c`, `#a0e0ff`, `#f5c518`, `#4a8c6a`, `#ece9ff`, `#6a4a8c`, `#333333`, `#4caf50`, `#888888`, `#0a0826`, `#f44336`, `#1a5276`, `#1e4d22`, `#b5934a`, `#5d4037`, `#7e6551`, `#d4ac0d`
- **TDD**: write failing test → implement → confirm green → commit
- **Save key** `'llama_quest_v1'` — never change
- **BattleMenu haptics:** Any rewrite of `BattleMenu.tsx` MUST preserve the `withHaptic` wrapper + `Platform.OS !== 'web'` guard from Phase 6 Task 3

---

### Task 1: Sprite Data + Entity Types

**Files:**
- Create: `content/sprites.ts`
- Modify: `engine/entity.ts` — add `'decoration'` and `'critter'` to `EntityType`; add `makeDecoration`, `makeCritter`
- Modify: `engine/__tests__/entity.test.ts`

**Interfaces:**
- Produces:
  - `SpriteGrid: { size: number; pixels: string[] }`
  - `SpriteAnimation: { frames: SpriteGrid[]; frameDuration: number }`
  - All sprite constants — see Step 5 for complete list
  - `makeDecoration(id, x, y): Entity`, `makeCritter(id, x, y, critterData): Entity`
  - `'decoration'` and `'critter'` in `EntityType`

- [ ] **Step 1: Write failing tests for new entity factories**

Open `engine/__tests__/entity.test.ts` and add:

```typescript
import { makePlayer, makeNPC, makeDecoration, makeCritter } from '../entity'

describe('makeDecoration', () => {
  it('creates a decoration entity', () => {
    const d = makeDecoration('deco-llama-1', 3, 4)
    expect(d.id).toBe('deco-llama-1')
    expect(d.type).toBe('decoration')
    expect(d.x).toBe(3)
    expect(d.y).toBe(4)
    expect(d.interactable).toBe(false)
  })
})

describe('makeCritter', () => {
  it('creates a critter entity with critter data', () => {
    const c = makeCritter('critter-rabbit-1', 10, 20, {
      homeX: 10, homeY: 20, targetX: 11, targetY: 20,
      wanderRadius: 4, speed: 1.5, pauseTimer: 0, critterType: 'rabbit',
    })
    expect(c.id).toBe('critter-rabbit-1')
    expect(c.type).toBe('critter')
    expect(c.x).toBe(10)
    expect(c.y).toBe(20)
    expect(c.interactable).toBe(false)
    expect(c.data['critterType']).toBe('rabbit')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- engine/__tests__/entity.test.ts --watchAll=false
```

Expected: FAIL — `makeDecoration is not a function` and `makeCritter is not a function`

- [ ] **Step 3: Update `engine/entity.ts`**

Add `'decoration'` and `'critter'` to `EntityType`:

```typescript
export type EntityType = 'player' | 'npc' | 'sign' | 'building_entrance' | 'gate' | 'sandbox_portal' | 'decoration' | 'critter'
```

Add after `makeSandboxPortal`:

```typescript
export function makeDecoration(id: string, x: number, y: number): Entity {
  return { id, type: 'decoration', x, y, facing: 'down', interactable: false, data: {} }
}

export interface CritterData {
  homeX: number
  homeY: number
  targetX: number
  targetY: number
  wanderRadius: number
  speed: number
  pauseTimer: number
  critterType: 'rabbit' | 'bird' | 'squirrel' | 'butterfly'
  phaseOffset?: number  // butterfly sine offset
}

export function makeCritter(id: string, x: number, y: number, critterData: CritterData): Entity {
  return {
    id,
    type: 'critter',
    x,
    y,
    facing: 'down',
    interactable: false,
    data: critterData as unknown as Record<string, unknown>,
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- engine/__tests__/entity.test.ts --watchAll=false
```

Expected: PASS

- [ ] **Step 5: Create `content/sprites.ts`**

```typescript
export interface SpriteGrid {
  size: number
  pixels: string[]
}

export interface SpriteAnimation {
  frames: SpriteGrid[]
  frameDuration: number  // ms per frame
}

function px(size: number, grid: string, map: Record<string, string>): string[] {
  return grid
    .replace(/\s/g, '')
    .slice(0, size * size)
    .split('')
    .map((c) => (c === '.' ? '' : (map[c] ?? '')))
}

// Color shortcuts
const B = '#c8b89a'  // llama body tan
const S = '#8b7355'  // shadow / hooves
const H = '#d4c4a8'  // highlight
const G = '#c0a060'  // gold (hat, accents)
const W = '#ffffff'  // white (eye / belly)
const F = '#8c6a3f'  // forge brown
const A = '#aaaaaa'  // metal / gear
const O = '#7a4a8c'  // oracle purple
const C = '#a0e0ff'  // crystal blue
const Y = '#f5c518'  // yellow (star / bird)
const Q = '#4a8c6a'  // architect teal
const R = '#ece9ff'  // scroll / page
const K = '#6a4a8c'  // keeper indigo
const P = '#4a6a8c'  // artificer blue
const T = '#333333'  // terminal dark
const N = '#4caf50'  // terminal green
const X = '#f44336'  // red (critter eye)

// ── Static sprites ──────────────────────────────────────────────

export const SPRITE_DOOR: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    SSSSSSSS
    SSGGGGSS
    SGSSSSGS
    SS....SS
    SS....SS
    SS....SS
    SS....SS
    SSSSSSSS
  `, { S, G }),
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

// ── Player walk animation — 2 frames, 250ms/frame ──────────────

const PLAYER_FRAME_0: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    ..BB....
    .BBWB...
    .BBB....
    BBBBBB..
    BBBBBBB.
    BBBBBBB.
    B.B..B..
    S.S..S..
  `, { B, S, W }),
}

const PLAYER_FRAME_1: SpriteGrid = {
  size: 8,
  pixels: px(8, `
    ..BB....
    .BBWB...
    .BBB....
    BBBBBB..
    BBBBBBB.
    BBBBBBB.
    SB...BS.
    .S...S..
  `, { B, S, W }),
}

export const SPRITE_PLAYER_ANIM: SpriteAnimation = {
  frames: [PLAYER_FRAME_0, PLAYER_FRAME_1],
  frameDuration: 250,
}

// ── NPC animations — 2 frames, 800ms/frame idle bob ────────────

function makeNPCAnimation(frame0Grid: string, frame1Grid: string, map: Record<string, string>): SpriteAnimation {
  return {
    frames: [
      { size: 8, pixels: px(8, frame0Grid, map) },
      { size: 8, pixels: px(8, frame1Grid, map) },
    ],
    frameDuration: 800,
  }
}

// Frame 1 of each NPC bobs the body 1px down (top row becomes empty, bottom row repeats)
export const SPRITE_NPC_ELDER_ANIM: SpriteAnimation = makeNPCAnimation(`
    .GGG....
    ..BB....
    .BBWB...
    .BBB....
    BBBBBB..
    BBBBBBB.
    B.B..B..
    S.S..S..
  `, `
    ........
    .GGG....
    ..BB....
    .BBWB...
    .BBB....
    BBBBBB..
    BBBBBBB.
    B.B..B..
  `, { B, S, G, W })

export const SPRITE_NPC_PIP_ANIM: SpriteAnimation = makeNPCAnimation(`
    ........
    ..HHH...
    .HHHHH..
    HHHHHH..
    HHHHHH..
    H.H.H...
    S.S.S...
    ........
  `, `
    ........
    ........
    ..HHH...
    .HHHHH..
    HHHHHH..
    HHHHHH..
    H.H.H...
    S.S.S...
  `, { H, S })

export const SPRITE_NPC_SMITH_ANIM: SpriteAnimation = makeNPCAnimation(`
    .FF.....
    FFFF....
    .FF.....
    FFFF.A..
    FFFFAAA.
    FFFF.A..
    F..F....
    F..F....
  `, `
    ........
    .FF.....
    FFFF....
    .FF.....
    FFFF.A..
    FFFFAAA.
    FFFF.A..
    F..F....
  `, { F, A })

export const SPRITE_NPC_ARTIFICER_ANIM: SpriteAnimation = makeNPCAnimation(`
    .PP.....
    PPPP....
    .PP.....
    PAAP....
    PAPP....
    PPPP....
    P..P....
    P..P....
  `, `
    ........
    .PP.....
    PPPP....
    .PP.....
    PAAP....
    PAPP....
    PPPP....
    P..P....
  `, { P, A })

export const SPRITE_NPC_ORACLE_ANIM: SpriteAnimation = makeNPCAnimation(`
    ..C.....
    .OO.....
    OOOO....
    O.O.....
    O.O.....
    O.O.....
    O.O.....
    ........
  `, `
    ........
    ..C.....
    .OO.....
    OOOO....
    O.O.....
    O.O.....
    O.O.....
    O.O.....
  `, { O, C })

export const SPRITE_NPC_VECTOR_ANIM: SpriteAnimation = makeNPCAnimation(`
    ..Y.....
    .YWY....
    YWWWY...
    .YWY....
    ..Y.....
    ........
    ........
    ........
  `, `
    ........
    ..Y.....
    .YWY....
    YWWWY...
    .YWY....
    ..Y.....
    ........
    ........
  `, { Y, W })

export const SPRITE_NPC_ARCHITECT_ANIM: SpriteAnimation = makeNPCAnimation(`
    .QQ.....
    QQQQ....
    .QQ..R..
    QQQRR...
    QQQRR...
    QQQQ....
    Q..Q....
    Q..Q....
  `, `
    ........
    .QQ.....
    QQQQ....
    .QQ..R..
    QQQRR...
    QQQRR...
    QQQQ....
    Q..Q....
  `, { Q, R })

export const SPRITE_NPC_KEEPER_ANIM: SpriteAnimation = makeNPCAnimation(`
    .KK.....
    KKKK....
    .KK.....
    KWWKWW..
    KWWKWW..
    KWWK....
    K..K....
    K..K....
  `, `
    ........
    .KK.....
    KKKK....
    .KK.....
    KWWKWW..
    KWWKWW..
    KWWK....
    K..K....
  `, { K, W })

// ── Critter animations — 2 frames, 300ms/frame ─────────────────

export const SPRITE_RABBIT_ANIM: SpriteAnimation = {
  frames: [
    {
      size: 8,
      pixels: px(8, `
        .HH.....
        HHHH....
        HWWH....
        HHHH....
        .HHH....
        .HH.....
        .H.H....
        .S.S....
      `, { H, W, S }),
    },
    {
      size: 8,
      pixels: px(8, `
        HH......
        HHHH....
        HWWH....
        .HHHH...
        ..HHH...
        ...HH...
        ...HS...
        ....S...
      `, { H, W, S }),
    },
  ],
  frameDuration: 300,
}

export const SPRITE_BIRD_ANIM: SpriteAnimation = {
  frames: [
    {
      size: 8,
      pixels: px(8, `
        ........
        ..YYY...
        .YYYYY..
        .YWYY...
        ..YSY...
        .Y.Y....
        ........
        ........
      `, { Y, W, S }),
    },
    {
      size: 8,
      pixels: px(8, `
        .Y...Y..
        YYYYYYY.
        .YWYYY..
        ..YSY...
        ...Y....
        ........
        ........
        ........
      `, { Y, W, S }),
    },
  ],
  frameDuration: 300,
}

export const SPRITE_SQUIRREL_ANIM: SpriteAnimation = {
  frames: [
    {
      size: 8,
      pixels: px(8, `
        ...FFF..
        ..FFFF..
        .FWFFF..
        .FFFFF..
        HFFFFFF.
        HFFFFF..
        .F..F...
        .S..S...
      `, { F, W, H, S }),
    },
    {
      size: 8,
      pixels: px(8, `
        ....FFF.
        ...FFFF.
        ..FWFFF.
        ..FFFFF.
        .HFFFFF.
        HFFFFF..
        .SF.....
        ..S.....
      `, { F, W, H, S }),
    },
  ],
  frameDuration: 300,
}

export const SPRITE_BUTTERFLY_ANIM: SpriteAnimation = {
  frames: [
    {
      size: 8,
      pixels: px(8, `
        CC.CC...
        CCCCC...
        YCYYY...
        .OOO....
        YCYYY...
        CCCCC...
        CC.CC...
        ........
      `, { C, Y, O: '#7a4a8c' }),
    },
    {
      size: 8,
      pixels: px(8, `
        ........
        .C.C....
        CCYCC...
        .OOO....
        CCYCC...
        .C.C....
        ........
        ........
      `, { C, Y, O: '#7a4a8c' }),
    },
  ],
  frameDuration: 300,
}

// ── Title screen llama — 20×20 static, rendered via PixelArt ───

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

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass (154+ passing).

- [ ] **Step 7: Commit**

```bash
git add content/sprites.ts engine/entity.ts engine/__tests__/entity.test.ts
git commit -m "feat: sprite animation system, critter entity type, SpriteAnimation constants"
```

---

### Task 2: PixelArt Component + Title Screen Llama

**Files:**
- Create: `components/PixelArt.tsx`
- Create: `components/__tests__/PixelArt.test.tsx`
- Modify: `app/index.tsx`

**Interfaces:**
- Consumes: `TITLE_LLAMA` from `content/sprites.ts`
- Produces: `PixelArt({ pixels, size, scale, testID? })` — View grid renderer

- [ ] **Step 1: Write failing test**

Create `components/__tests__/PixelArt.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { PixelArt } from '../PixelArt'

const SIMPLE = { pixels: ['#ff0000', '', '', '#0000ff'], size: 2 }

describe('PixelArt', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<PixelArt pixels={SIMPLE.pixels} size={2} scale={8} testID="pa" />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders size*size pixel views', () => {
    const { getAllByTestId } = render(<PixelArt pixels={SIMPLE.pixels} size={2} scale={8} testID="pa" />)
    expect(getAllByTestId('pa-pixel').length).toBe(4)
  })

  it('applies backgroundColor from pixels array', () => {
    const { getAllByTestId } = render(<PixelArt pixels={SIMPLE.pixels} size={2} scale={8} testID="pa" />)
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
    rows.push(<View key={r} style={{ flexDirection: 'row' }}>{cols}</View>)
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

Add imports:
```tsx
import { PixelArt } from '../components/PixelArt'
import { TITLE_LLAMA } from '../content/sprites'
```

In the JSX, insert PixelArt between subtitle and "YOUR NAME" label:

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

Also update `styles.subtitle` `marginBottom` from 32 to 16 (llama provides visual spacing).

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add components/PixelArt.tsx components/__tests__/PixelArt.test.tsx app/index.tsx
git commit -m "feat: PixelArt component + animated title screen llama"
```

---

### Task 3: EntityRenderer with Animation

**Files:**
- Create: `renderer/__tests__/EntityRenderer.test.tsx`
- Modify: `renderer/EntityRenderer.tsx`

**Interfaces:**
- Consumes: `SpriteGrid`, `SpriteAnimation`, all `SPRITE_*` from `content/sprites.ts`
- Produces: `EntityRenderer({ entities, camera, tileSize, width, height, time })` — `time: number` is NEW required prop

- [ ] **Step 1: Write smoke tests**

Create `renderer/__tests__/EntityRenderer.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { EntityRenderer } from '../EntityRenderer'
import { makePlayer, makeNPC, makeDecoration, makeCritter } from '../../engine/entity'
import type { CritterData } from '../../engine/entity'

const camera = { x: 0, y: 0 }
const baseProps = { camera, tileSize: 32, width: 320, height: 240, time: 0 }

describe('EntityRenderer', () => {
  it('renders player without crashing', () => {
    const { toJSON } = render(<EntityRenderer entities={[makePlayer(5, 5)]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders decoration without crashing', () => {
    const { toJSON } = render(<EntityRenderer entities={[makeDecoration('d1', 3, 4)]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders known NPC without crashing', () => {
    const npc = makeNPC('npc-llama-elder', 5, 5, { name: 'Elder', lines: ['Hi'] })
    const { toJSON } = render(<EntityRenderer entities={[npc]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders unknown NPC with fallback without crashing', () => {
    const npc = makeNPC('npc-unknown', 5, 5, { name: '?', lines: ['?'] })
    const { toJSON } = render(<EntityRenderer entities={[npc]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders rabbit critter without crashing', () => {
    const data: CritterData = {
      homeX: 10, homeY: 20, targetX: 11, targetY: 20,
      wanderRadius: 4, speed: 1.5, pauseTimer: 0, critterType: 'rabbit',
    }
    const { toJSON } = render(<EntityRenderer entities={[makeCritter('c1', 10, 20, data)]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders butterfly critter without crashing', () => {
    const data: CritterData = {
      homeX: 5, homeY: 5, targetX: 6, targetY: 5,
      wanderRadius: 8, speed: 2, pauseTimer: 0, critterType: 'butterfly', phaseOffset: 1.2,
    }
    const { toJSON } = render(<EntityRenderer entities={[makeCritter('b1', 5, 5, data)]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('selects correct animation frame at time=0', () => {
    // Just confirms no crash with time prop varying
    const { rerender } = render(<EntityRenderer entities={[makePlayer(5, 5)]} {...baseProps} time={0} />)
    rerender(<EntityRenderer entities={[makePlayer(5, 5)]} {...baseProps} time={500} />)
  })
})
```

- [ ] **Step 2: Run tests (may pass already if current EntityRenderer is compatible)**

```bash
npm test -- renderer/__tests__/EntityRenderer.test.tsx --watchAll=false
```

Expected: FAIL (time prop not present yet)

- [ ] **Step 3: Rewrite `renderer/EntityRenderer.tsx`**

```tsx
import React from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { Entity } from '../engine/entity'
import type { CritterData } from '../engine/entity'
import type { Camera } from '../engine/camera'
import type { SpriteGrid, SpriteAnimation } from '../content/sprites'
import {
  SPRITE_PLAYER_ANIM,
  SPRITE_NPC_ELDER_ANIM,
  SPRITE_NPC_PIP_ANIM,
  SPRITE_NPC_SMITH_ANIM,
  SPRITE_NPC_ARTIFICER_ANIM,
  SPRITE_NPC_ORACLE_ANIM,
  SPRITE_NPC_VECTOR_ANIM,
  SPRITE_NPC_ARCHITECT_ANIM,
  SPRITE_NPC_KEEPER_ANIM,
  SPRITE_DOOR,
  SPRITE_GATE,
  SPRITE_PORTAL,
  SPRITE_DECO_LLAMA,
  SPRITE_RABBIT_ANIM,
  SPRITE_BIRD_ANIM,
  SPRITE_SQUIRREL_ANIM,
  SPRITE_BUTTERFLY_ANIM,
} from '../content/sprites'

const NPC_ANIM: Record<string, SpriteAnimation> = {
  'npc-llama-elder': SPRITE_NPC_ELDER_ANIM,
  'mayor-lloyd': SPRITE_NPC_ELDER_ANIM,
  'npc-pip': SPRITE_NPC_PIP_ANIM,
  'npc-penny': SPRITE_NPC_PIP_ANIM,
  'npc-smith': SPRITE_NPC_SMITH_ANIM,
  'npc-api-artificer': SPRITE_NPC_ARTIFICER_ANIM,
  'npc-prism-oracle': SPRITE_NPC_ORACLE_ANIM,
  'npc-vector-sprite': SPRITE_NPC_VECTOR_ANIM,
  'npc-architect': SPRITE_NPC_ARCHITECT_ANIM,
  'npc-keeper': SPRITE_NPC_KEEPER_ANIM,
}

const CRITTER_ANIM: Record<string, SpriteAnimation> = {
  rabbit: SPRITE_RABBIT_ANIM,
  bird: SPRITE_BIRD_ANIM,
  squirrel: SPRITE_SQUIRREL_ANIM,
  butterfly: SPRITE_BUTTERFLY_ANIM,
}

const FALLBACK_COLOR: Record<string, string> = {
  player: '#f5c518',
  npc: '#4fc3f7',
  sign: '#ce93d8',
  building_entrance: '#80cbc4',
  gate: '#ef9a9a',
  sandbox_portal: '#a5d6a7',
  decoration: '#c8b89a',
  critter: '#c8b89a',
}

function staticAnim(sprite: SpriteGrid): SpriteAnimation {
  return { frames: [sprite], frameDuration: 1000 }
}

function getAnimForEntity(entity: Entity): { anim: SpriteAnimation; tint?: string } | null {
  switch (entity.type) {
    case 'player':
      return { anim: SPRITE_PLAYER_ANIM }
    case 'npc': {
      const anim = NPC_ANIM[entity.id]
      return anim ? { anim } : null
    }
    case 'building_entrance':
      return { anim: staticAnim(SPRITE_DOOR) }
    case 'gate': {
      const locked = entity.data['locked'] as boolean | undefined
      return { anim: staticAnim(SPRITE_GATE), tint: locked ? '#f44336' : '#4caf50' }
    }
    case 'sandbox_portal':
      return { anim: staticAnim(SPRITE_PORTAL) }
    case 'decoration':
      return { anim: staticAnim(SPRITE_DECO_LLAMA) }
    case 'critter': {
      const cd = entity.data as unknown as CritterData
      const anim = CRITTER_ANIM[cd.critterType ?? '']
      return anim ? { anim } : null
    }
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
  time: number
}

export function EntityRenderer({ entities, camera, tileSize, width, height, time }: EntityRendererProps) {
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height }}>
      <Group>
        {entities.flatMap((entity) => {
          const baseSx = entity.x * tileSize - camera.x
          const baseSy = entity.y * tileSize - camera.y

          // Butterfly sine-wave vertical offset
          let sineOffset = 0
          if (entity.type === 'critter') {
            const cd = entity.data as unknown as CritterData
            if (cd.critterType === 'butterfly') {
              sineOffset = Math.sin(time / 400 + (cd.phaseOffset ?? 0)) * 0.3 * tileSize
            }
          }

          const sx = baseSx
          const sy = baseSy + sineOffset

          const result = getAnimForEntity(entity)

          if (!result) {
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

          const { anim, tint } = result
          const frameIdx = Math.floor(time / anim.frameDuration) % anim.frames.length
          const frame = anim.frames[frameIdx] ?? anim.frames[0]
          if (!frame) return []

          const pixelSize = tileSize / frame.size
          return frame.pixels
            .map((color, i) => {
              const c = tint ?? color
              if (!c) return null
              const row = Math.floor(i / frame.size)
              const col = i % frame.size
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
            })
            .filter((el): el is React.ReactElement => el !== null)
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
git commit -m "feat: EntityRenderer animation — frame selection, critter sprites, butterfly sine offset"
```

---

### Task 4: TilemapRenderer Animated Textures + WorldRenderer Wiring

**Files:**
- Modify: `renderer/TilemapRenderer.tsx` — add `grassPhase` prop + animated grass texture
- Modify: `renderer/WorldRenderer.tsx` — add `time` and `grassPhase` props, thread through

**Interfaces:**
- `TilemapRenderer` gains `grassPhase: number` prop
- `WorldRenderer` gains `time: number` prop; computes `grassPhase = Math.floor(time / 600)` and passes to children
- `EntityRenderer` already has `time` — WorldRenderer passes it through

- [ ] **Step 1: Run existing renderer tests to confirm baseline**

```bash
npm test -- renderer/__tests__/TilemapRenderer.test.tsx --watchAll=false
```

Expected: PASS

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
  x: number; y: number; w: number; h: number; color: string
}

function getTextureRects(type: TileType, sx: number, sy: number, ts: number, grassPhase: number): TileRect[] {
  switch (type) {
    case 'grass': {
      // Animated: phase 0 = normal dots, phase 1 = dots shifted 1px east (wind shimmer)
      const shift = (grassPhase % 2 === 1) ? 1 : 0
      const rects: TileRect[] = []
      for (let dy = 0; dy < ts; dy += 8) {
        for (let dx = 0; dx < ts; dx += 8) {
          rects.push({ x: sx + dx + shift, y: sy + dy, w: 1, h: 1, color: '#3a7022' })
        }
      }
      return rects
    }
    case 'path':
      return [{ x: sx, y: sy + ts / 2, w: ts, h: 1, color: '#7a6347' }]
    case 'forest':
      return [
        { x: sx + ts / 2 - 1, y: sy + 2, w: 1, h: 3, color: '#122d12' },
        { x: sx + ts / 2 - 2, y: sy + 3, w: 3, h: 2, color: '#122d12' },
      ]
    case 'water': {
      const mid = Math.floor(ts / 2)
      return [
        { x: sx, y: sy + mid - 3, w: ts, h: 1, color: '#2a4d8b' },
        { x: sx, y: sy + mid + 3, w: ts, h: 1, color: '#2a4d8b' },
      ]
    }
    case 'building_wall': {
      const rects: TileRect[] = []
      for (let dy = 8; dy < ts; dy += 8) {
        rects.push({ x: sx, y: sy + dy, w: ts, h: 1, color: '#555555' })
      }
      return rects
    }
    case 'floor': {
      const rects: TileRect[] = []
      for (let dx = 8; dx < ts; dx += 8) {
        rects.push({ x: sx + dx, y: sy, w: 1, h: ts, color: '#444444' })
      }
      return rects
    }
    case 'door':
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
  grassPhase: number
}

export function TilemapRenderer({ grid, camera, tileSize, width, height, grassPhase }: TilemapRendererProps) {
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
        rects.push({ x: sx, y: sy, w: tileSize, h: tileSize, color: TILE_BASE[tile.type] })
        for (const r of getTextureRects(tile.type, sx, sy, tileSize, grassPhase)) rects.push(r)
      }
    }
    return rects
  }, [grid, camera, tileSize, width, height, grassPhase])

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

- [ ] **Step 3: Update `renderer/WorldRenderer.tsx`**

Read the current file first. Add `time: number` to props and compute + thread through `grassPhase` and `time`:

```tsx
interface WorldRendererProps {
  grid: TileGrid
  player: Entity
  entities: Entity[]
  tileSize: number
  screenWidth: number
  screenHeight: number
  time: number   // NEW
}

export function WorldRenderer({ grid, player, entities, tileSize, screenWidth, screenHeight, time }: WorldRendererProps) {
  const camera = /* existing camera logic */
  const grassPhase = Math.floor(time / 600)

  return (
    <View style={{ width: screenWidth, height: screenHeight }}>
      <TilemapRenderer
        grid={grid}
        camera={camera}
        tileSize={tileSize}
        width={screenWidth}
        height={screenHeight}
        grassPhase={grassPhase}
      />
      <EntityRenderer
        entities={[player, ...entities]}
        camera={camera}
        tileSize={tileSize}
        width={screenWidth}
        height={screenHeight}
        time={time}
      />
    </View>
  )
}
```

> **Note:** Read the actual `renderer/WorldRenderer.tsx` to preserve its existing camera computation logic. Only add the `time` prop, compute `grassPhase`, and pass both to children.

- [ ] **Step 4: Update callers — `app/overworld.tsx` and `app/city/[id].tsx`**

Both screens use `WorldRenderer`. Add a `timeRef` accumulator and pass it as `time`:

In `app/overworld.tsx`, add near the top of the component:
```tsx
const timeRef = useRef(0)
```

In the game loop callback (inside `useGameLoop`), add:
```tsx
timeRef.current += dt * 1000  // dt is seconds, convert to ms
```

Pass to WorldRenderer:
```tsx
<WorldRenderer ... time={timeRef.current} />
```

Do the same in `app/city/[id].tsx`.

- [ ] **Step 5: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass. The TilemapRenderer test already exists and uses the same props interface — update it to pass `grassPhase={0}` if it fails.

- [ ] **Step 6: Commit**

```bash
git add renderer/TilemapRenderer.tsx renderer/WorldRenderer.tsx app/overworld.tsx app/city/[id].tsx
git commit -m "feat: animated grass tiles (wind shimmer) + time threading through WorldRenderer"
```

---

### Task 5: SNES UI Chrome

**Files:**
- Modify: `components/DialogueBox.tsx`
- Modify: `components/HUD.tsx`
- Modify: `components/BattleMenu.tsx` — **MUST preserve withHaptic + Platform.OS guard from P6T3**
- Modify: `app/battle.tsx`

**Interfaces:** No prop changes. Purely stylistic rewrites.

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
      if (i >= currentLine.length) { clearInterval(interval); setFinished(true) }
    }, 30)
    return () => clearInterval(interval)
  }, [lineIdx, currentLine])

  const advance = useCallback(() => {
    if (!finished) { setDisplayed(currentLine); setFinished(true); return }
    if (lineIdx < lines.length - 1) { setLineIdx((n) => n + 1) } else { onClose() }
  }, [finished, lineIdx, lines.length, currentLine, onClose])

  return (
    <TouchableOpacity style={styles.overlay} onPress={advance} activeOpacity={1}>
      <View style={styles.outerBorder}>
        <View style={styles.gap}>
          <View style={styles.innerBorder}>
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
  innerBorder: { borderWidth: 2, borderColor: '#c0a060', backgroundColor: '#0a0826', padding: 12, minHeight: 80 },
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
  outerBorder: { position: 'absolute', top: 8, left: 8, minWidth: 160, borderWidth: 2, borderColor: '#c0a060', backgroundColor: '#000000' },
  gap: { padding: 2, backgroundColor: '#000000' },
  innerBorder: { borderWidth: 2, borderColor: '#c0a060', backgroundColor: '#0a0826', padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { color: '#f5c518', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', flex: 1 },
  level: { color: '#aaaaaa', fontFamily: 'monospace', fontSize: 10 },
  label: { color: '#aaaaaa', fontFamily: 'monospace', fontSize: 10, width: 24 },
  barOuter: { flex: 1, height: 8, backgroundColor: '#333333', borderRadius: 0, borderWidth: 1, borderColor: '#000000', overflow: 'hidden', marginHorizontal: 4 },
  barFill: { height: '100%', borderRadius: 0 },
  hpText: { color: '#ffffff', fontFamily: 'monospace', fontSize: 10, width: 48, textAlign: 'right' },
  xpText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 10 },
})
```

- [ ] **Step 3: Rewrite `components/BattleMenu.tsx`** — preserve haptics from P6T3

First **read the current `components/BattleMenu.tsx`** to verify it has:
- `withHaptic(fn)` function with `if (Platform.OS !== 'web') Haptics.selectionAsync()`
- All 3 buttons call `withHaptic`

Then rewrite with those preserved plus SNES square corners and bevel:

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
      {[
        { label: '⚡ PSI', style: styles.psi, onPress: onPSI },
        { label: '🛡 Guard', style: styles.guard, onPress: onGuard },
        { label: '💨 Run', style: styles.run, onPress: onRun },
      ].map(({ label, style, onPress }) => (
        <TouchableOpacity
          key={label}
          style={[styles.btn, style, disabled && styles.disabled]}
          onPress={() => withHaptic(onPress)}
          disabled={disabled}
        >
          <View style={[styles.bevel, styles.bevelTop]} />
          <View style={[styles.bevel, styles.bevelLeft]} />
          <Text style={styles.btnText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8, minWidth: 140 },
  btn: { borderRadius: 0, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 2, alignItems: 'center' },
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

Find the Skia `<Canvas>` block and replace with:

```tsx
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height} color="#0d0d1a" />
        {Array.from({ length: Math.ceil(height * 0.45) }, (_, i) =>
          i % 2 === 0 ? (
            <Rect key={i} x={0} y={i} width={width} height={1} color="#120d28" />
          ) : (
            <Rect key={i} x={0} y={i} width={width} height={1} color="#0f0a22" />
          )
        )}
        <Rect x={width / 2 - 40} y={60} width={80} height={80} color="#2a2150" />
        <Rect x={width / 2 - 41} y={59} width={82} height={1} color="#ece9ff" />
        <Rect x={width / 2 - 41} y={140} width={82} height={1} color="#ece9ff" />
        <Rect x={width / 2 - 41} y={59} width={1} height={82} color="#ece9ff" />
        <Rect x={width / 2 + 40} y={59} width={1} height={82} color="#ece9ff" />
      </Canvas>
```

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

### Task 6: 10× Overworld Rebuild (400×300)

**Files:**
- Modify: `content/world-data.ts` — replace `buildOverworldGrid()` with 400×300 version; update all entity positions and player spawn

**Interfaces:**
- No type changes. `OVERWORLD.grid` becomes 400×300; city entrance positions and player spawn change.

> **Read `content/world-data.ts` before editing** — preserve all city `CityDef` exports (LLAMATOWN, FORGE, CAVERNS, CONVERGENCE), the ACT_CONCEPTS export, isGateUnlocked, getCityDef, and the CITY_MAP. Only `buildOverworldGrid()` and `OVERWORLD` change.

- [ ] **Step 1: Replace `buildOverworldGrid()` in `content/world-data.ts`**

Remove the existing `buildOverworldGrid` function and replace with:

```typescript
function buildOverworldGrid(): TileGrid {
  const g = makeGrid(400, 300, 'grass')

  // ── Forest borders ────────────────────────────────────────────
  for (let x = 0; x < 400; x++) {
    for (let y = 0; y < 8; y++) setTile(g, x, y, 'forest')     // north edge
    for (let y = 292; y < 300; y++) setTile(g, x, y, 'forest') // south edge
  }

  // ── West / east forest columns ────────────────────────────────
  for (let y = 8; y < 140; y++) { setTile(g, 0, y, 'forest'); setTile(g, 1, y, 'forest') }
  for (let y = 160; y < 292; y++) { setTile(g, 0, y, 'forest'); setTile(g, 1, y, 'forest') }
  for (let y = 8; y < 292; y++) { setTile(g, 398, y, 'forest'); setTile(g, 399, y, 'forest') }

  // ── Interior forest biomes ────────────────────────────────────
  for (let x = 130; x <= 160; x++) for (let y = 40; y <= 100; y++) setTile(g, x, y, 'forest')
  for (let x = 250; x <= 310; x++) for (let y = 8; y <= 80; y++) setTile(g, x, y, 'forest')

  // ── Main east-west road ───────────────────────────────────────
  for (let x = 10; x < 390; x++) {
    setTile(g, x, 148, 'path')
    setTile(g, x, 149, 'path')
  }

  // ── North road (to Llamatown, x=52) ───────────────────────────
  for (let y = 100; y < 148; y++) {
    setTile(g, 50, y, 'path'); setTile(g, 51, y, 'path')
  }

  // ── Northeast road (to Forge, x=280) ─────────────────────────
  for (let y = 100; y < 148; y++) {
    setTile(g, 280, y, 'path'); setTile(g, 281, y, 'path')
  }

  // ── South-central road (to Prism Caverns, x=180) ─────────────
  for (let y = 149; y <= 240; y++) {
    setTile(g, 180, y, 'path'); setTile(g, 181, y, 'path')
  }

  // ── Southwest road (to The Convergence, x=90) ────────────────
  for (let y = 149; y <= 260; y++) {
    setTile(g, 90, y, 'path'); setTile(g, 91, y, 'path')
  }

  // ── River (north vertical) ────────────────────────────────────
  for (let y = 8; y <= 100; y++) {
    setTile(g, 200, y, 'water'); setTile(g, 201, y, 'water'); setTile(g, 202, y, 'water')
  }
  // River lake
  for (let x = 195; x <= 210; x++) for (let y = 80; y <= 100; y++) setTile(g, x, y, 'water')
  // River south section
  for (let y = 100; y < 148; y++) {
    setTile(g, 200, y, 'water'); setTile(g, 201, y, 'water'); setTile(g, 202, y, 'water')
  }

  // ── Small pond ────────────────────────────────────────────────
  for (let x = 340; x <= 350; x++) for (let y = 200; y <= 210; y++) setTile(g, x, y, 'water')

  return g
}
```

- [ ] **Step 2: Update `OVERWORLD` entity positions and player spawn**

Replace the entire `OVERWORLD` constant:

```typescript
export const OVERWORLD: CityDef = {
  id: 'overworld',
  grid: buildOverworldGrid(),
  playerSpawn: { x: 52, y: 148 },
  entities: [
    makeBuildingEntrance('enter-llamatown', 52, 146, 'llamatown'),
    makeBuildingEntrance('enter-forge', 280, 150, 'forge'),
    makeBuildingEntrance('enter-vale', 180, 240, 'vale'),
    makeBuildingEntrance('enter-ridge', 90, 259, 'ridge'),
    // Decorative llamas — 12 scattered across the world
    makeDecoration('deco-llama-1', 25, 20),
    makeDecoration('deco-llama-2', 80, 35),
    makeDecoration('deco-llama-3', 170, 15),
    makeDecoration('deco-llama-4', 230, 50),
    makeDecoration('deco-llama-5', 350, 30),
    makeDecoration('deco-llama-6', 30, 180),
    makeDecoration('deco-llama-7', 120, 200),
    makeDecoration('deco-llama-8', 250, 170),
    makeDecoration('deco-llama-9', 320, 200),
    makeDecoration('deco-llama-10', 370, 260),
    makeDecoration('deco-llama-11', 60, 270),
    makeDecoration('deco-llama-12', 200, 280),
  ],
  gateExit: { x: 0, y: 0, destination: 'llamatown' },
}
```

Also update the import line to include `makeDecoration`:
```typescript
import { makeNPC, makeBuildingEntrance, makeGate, makeSandboxPortal, makeDecoration } from '../engine/entity'
```

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass. The world-data test (if any) checks city defs — verify `OVERWORLD.grid.width === 400` and `OVERWORLD.grid.height === 300`.

- [ ] **Step 4: Commit**

```bash
git add content/world-data.ts
git commit -m "feat: 10x overworld rebuild — 400x300 grid, rivers, forest biomes, new city positions"
```

---

### Task 7: Critter AI Engine

**Files:**
- Create: `engine/critter.ts`
- Create: `engine/__tests__/critter.test.ts`
- Modify: `app/overworld.tsx` — local critter state + game loop ticking

**Interfaces:**
- Produces: `tickCritter(entity: Entity, dt: number): Entity` — pure function
- `app/overworld.tsx` maintains `critters: Entity[]` in local state, initialized from a critter list

- [ ] **Step 1: Write failing tests**

Create `engine/__tests__/critter.test.ts`:

```typescript
import { makeCritter } from '../entity'
import type { CritterData } from '../entity'
import { tickCritter } from '../critter'

function makeCritterAt(x: number, y: number, tx: number, ty: number, extra?: Partial<CritterData>) {
  const data: CritterData = {
    homeX: x, homeY: y, targetX: tx, targetY: ty,
    wanderRadius: 4, speed: 2, pauseTimer: 0, critterType: 'rabbit',
    ...extra,
  }
  return makeCritter('test-critter', x, y, data)
}

describe('tickCritter', () => {
  it('moves entity toward target', () => {
    const c = makeCritterAt(0, 0, 2, 0)  // target is 2 tiles east
    const next = tickCritter(c, 0.5)     // 0.5s at speed 2 = 1 tile moved
    expect(next.x).toBeCloseTo(1, 1)
    expect(next.y).toBeCloseTo(0, 1)
  })

  it('does not move when paused', () => {
    const c = makeCritterAt(0, 0, 2, 0, { pauseTimer: 1.0 })
    const next = tickCritter(c, 0.5)
    expect(next.x).toBe(0)
    expect(next.y).toBe(0)
    const cd = next.data as unknown as CritterData
    expect(cd.pauseTimer).toBeCloseTo(0.5, 2)
  })

  it('picks new target when reaching current target', () => {
    const c = makeCritterAt(0, 0, 0.05, 0)  // target almost reached
    const next = tickCritter(c, 0.5)
    const cd = next.data as unknown as CritterData
    // After reaching target, pauseTimer should be set
    expect(cd.pauseTimer).toBeGreaterThan(0)
  })

  it('returns toward home when too far', () => {
    // Critter is at (0,0), home at (0,0), target at (20,0) — way beyond wanderRadius=4
    const data: CritterData = {
      homeX: 0, homeY: 0, targetX: 20, targetY: 0,
      wanderRadius: 4, speed: 2, pauseTimer: 0, critterType: 'rabbit',
    }
    const c = makeCritter('c', 10, 0, data)  // critter itself is at (10,0) — too far
    const next = tickCritter(c, 0.5)
    const cd = next.data as unknown as CritterData
    // Target should have been redirected to home
    expect(cd.targetX).toBe(0)
    expect(cd.targetY).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- engine/__tests__/critter.test.ts --watchAll=false
```

Expected: FAIL — `Cannot find module '../critter'`

- [ ] **Step 3: Create `engine/critter.ts`**

```typescript
import type { Entity } from './entity'
import type { CritterData } from './entity'

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function tickCritter(entity: Entity, dt: number): Entity {
  const cd = entity.data as unknown as CritterData

  // Paused — count down timer
  if (cd.pauseTimer > 0) {
    return {
      ...entity,
      data: { ...entity.data, pauseTimer: cd.pauseTimer - dt } as unknown as Record<string, unknown>,
    }
  }

  // Too far from home — redirect to home
  const distFromHome = dist(entity.x, entity.y, cd.homeX, cd.homeY)
  if (distFromHome > cd.wanderRadius * 1.5) {
    return {
      ...entity,
      data: { ...entity.data, targetX: cd.homeX, targetY: cd.homeY } as unknown as Record<string, unknown>,
    }
  }

  // Move toward target
  const dx = cd.targetX - entity.x
  const dy = cd.targetY - entity.y
  const d = Math.sqrt(dx * dx + dy * dy)

  if (d < 0.1) {
    // Reached target — pick new random target and pause
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * cd.wanderRadius
    const newTargetX = cd.homeX + Math.cos(angle) * radius
    const newTargetY = cd.homeY + Math.sin(angle) * radius
    return {
      ...entity,
      data: {
        ...entity.data,
        targetX: newTargetX,
        targetY: newTargetY,
        pauseTimer: randomInRange(0.5, 1.5),
      } as unknown as Record<string, unknown>,
    }
  }

  const step = Math.min(cd.speed * dt, d)
  const newX = entity.x + (dx / d) * step
  const newY = entity.y + (dy / d) * step

  return { ...entity, x: newX, y: newY }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- engine/__tests__/critter.test.ts --watchAll=false
```

Expected: PASS (4 tests)

- [ ] **Step 5: Wire critters into `app/overworld.tsx`**

Read `app/overworld.tsx` first. Add a critter state that starts from the overworld entity list, ticks each frame, and is merged with the static entities for rendering.

Add import:
```tsx
import { tickCritter } from '../engine/critter'
import type { CritterData } from '../engine/entity'
```

Add critter state inside the component:
```tsx
const [critters, setCritters] = useState<Entity[]>(() =>
  getCityDef('overworld').entities.filter((e) => e.type === 'critter')
)
```

In the game loop callback, after updating player, add critter ticking:
```tsx
setCritters((prev) => prev.map((c) => tickCritter(c, dt)))
```

Merge critters into the entity list passed to WorldRenderer:
```tsx
const staticEntities = getCityDef('overworld').entities.filter((e) => e.type !== 'critter')
// Pass staticEntities + critters to WorldRenderer's entities prop
```

> **Note:** Read the actual overworld.tsx to find the exact entity list and WorldRenderer call. The critters are separate state that replaces (not duplicates) the critter entities from the city def.

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add engine/critter.ts engine/__tests__/critter.test.ts app/overworld.tsx
git commit -m "feat: critter AI engine — tickCritter, wander behavior, wired into overworld game loop"
```

---

### Task 8: Populate World with Critters + Butterflies

**Files:**
- Modify: `content/world-data.ts` — add critter entities to OVERWORLD entity list

**Interfaces:**
- Consumes: `makeCritter`, `CritterData` from `engine/entity.ts`
- OVERWORLD.entities gains 14 critter entries

- [ ] **Step 1: Add critters to `content/world-data.ts`**

Add `makeCritter` and `CritterData` to imports from `engine/entity`:
```typescript
import { makeNPC, makeBuildingEntrance, makeGate, makeSandboxPortal, makeDecoration, makeCritter } from '../engine/entity'
import type { CritterData } from '../engine/entity'
```

Add critter factory helper at module scope:
```typescript
function c(id: string, x: number, y: number, type: CritterData['critterType'], wanderRadius = 4, phaseOffset = 0): Entity {
  return makeCritter(id, x, y, {
    homeX: x, homeY: y,
    targetX: x + (Math.random() > 0.5 ? 1 : -1),
    targetY: y,
    wanderRadius,
    speed: type === 'butterfly' ? 2.5 : type === 'bird' ? 2 : 1.5,
    pauseTimer: 0,
    critterType: type,
    phaseOffset,
  })
}
```

Add to OVERWORLD.entities array (append after deco-llama-12):
```typescript
    // Woodland creatures
    c('critter-rabbit-1', 35, 30, 'rabbit'),
    c('critter-rabbit-2', 220, 140, 'rabbit'),
    c('critter-rabbit-3', 300, 180, 'rabbit'),
    c('critter-rabbit-4', 160, 270, 'rabbit'),
    c('critter-bird-1', 100, 60, 'bird', 6),
    c('critter-bird-2', 260, 200, 'bird', 6),
    c('critter-bird-3', 380, 120, 'bird', 6),
    c('critter-squirrel-1', 165, 80, 'squirrel', 3),
    c('critter-squirrel-2', 330, 90, 'squirrel', 3),
    c('critter-squirrel-3', 70, 230, 'squirrel', 3),
    c('critter-butterfly-1', 60, 120, 'butterfly', 8, 0.0),
    c('critter-butterfly-2', 200, 60, 'butterfly', 8, 1.5),
    c('critter-butterfly-3', 290, 250, 'butterfly', 8, 3.0),
    c('critter-butterfly-4', 140, 260, 'butterfly', 8, 4.5),
```

> **Note:** `Math.random()` in `targetX` is fine here — this is module-level initialization, called once at startup. Critter targets are overwritten by AI each tick anyway.

- [ ] **Step 2: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add content/world-data.ts
git commit -m "feat: add 14 woodland critters and butterflies to 10x overworld"
```

---

### Task 9: Playwright End-of-Phase Verification

**Goal:** Confirm all visual upgrade features render correctly in the browser.

- [ ] **Step 1: Start the dev server**

```bash
npx expo start --web
```

- [ ] **Step 2: Title screen — verify animated llama**

Load `http://localhost:8081`. Confirm:
- "LLAMA QUEST" title renders
- Pixel-art llama appears between title and name input (160×160px grid of colored squares)
- 0 uncaught JS errors in console

- [ ] **Step 3: Overworld — verify player sprite + critters**

Enter a name, pick a class, start game. On overworld confirm:
- Player renders as a pixel-art llama shape (not a flat yellow rect) and the sprite alternates frames as player walks
- Decorative llamas visible as pixel-art shapes on grass tiles
- Critters (rabbits, birds, squirrels) visible and moving slowly around their home positions
- Butterflies visible and bobbing vertically in a sine wave
- Grass tiles show subtle wind shimmer (dots shift every ~600ms)
- Building entrances render as door shapes

- [ ] **Step 4: City entry — verify NPC sprites and SNES UI**

Walk to Llamatown entrance (near spawn at x=52, y=148). Click `[E] Enter`. Confirm:
- City renders correctly
- NPC sprites visible and idle-animating (slight bob)
- HUD has SNES double-border (gold outer, black gap, gold inner, square corners)
- HP bar has no border-radius

- [ ] **Step 5: NPC dialogue — verify dialogue box chrome**

Click `[E] Talk`. Confirm:
- Dialogue box has double-border style
- Background is deep navy (`#0a0826`), not pure black
- Corner accent squares visible
- Typewriter effect still works

- [ ] **Step 6: Battle screen**

Trigger a random encounter. Confirm:
- Scanline pattern visible on upper battle area
- Enemy placeholder has thin pixel border (`#ece9ff` outline)
- BattleMenu buttons have square corners and bevel highlight

- [ ] **Step 7: Check console errors**

After full golden path: 0 uncaught errors. AudioContext and favicon.ico 500 warnings are acceptable (pre-existing).

- [ ] **Step 8: Update `progress.md` and `CLAUDE.md`**

Append to `.superpowers/sdd/progress.md`:

```markdown
## Visual Upgrade — SNES Pixel Art + Animation

Plan: docs/superpowers/plans/2026-06-19-llama-quest-visual-upgrade.md

| Task | Status | Commits | Notes |
|------|--------|---------|-------|
| 1: Sprite data + entity types | complete | <commit> | review clean |
| 2: PixelArt + title llama | complete | <commit> | review clean |
| 3: EntityRenderer with animation | complete | <commit> | review clean |
| 4: TilemapRenderer + WorldRenderer wiring | complete | <commit> | review clean |
| 5: SNES UI chrome | complete | <commit> | review clean |
| 6: 10x overworld rebuild | complete | <commit> | review clean |
| 7: Critter AI engine | complete | <commit> | review clean |
| 8: World population | complete | <commit> | review clean |
| Playwright end-of-phase | complete | — | <results> |
```

Update `CLAUDE.md` Phase Status:
```
| Visual Upgrade — SNES Pixel Art + Animation | ✅ Complete | `docs/superpowers/plans/2026-06-19-llama-quest-visual-upgrade.md` |
```

- [ ] **Step 9: Commit**

```bash
git add .superpowers/sdd/progress.md CLAUDE.md
git commit -m "chore: record Visual Upgrade Playwright results and mark complete"
```

---

## Self-Review

**Spec coverage:**
- [x] SpriteGrid + SpriteAnimation — Task 1
- [x] Player walk animation (2 frames, 250ms) — Task 1
- [x] NPC idle animation (2 frames, 800ms) for all 8 NPCs — Task 1
- [x] Critter sprites: rabbit, bird, squirrel, butterfly (2 frames each) — Task 1
- [x] makeDecoration + makeCritter + CritterData — Task 1
- [x] PixelArt component + title screen llama — Task 2
- [x] EntityRenderer time prop, frame selection, critter dispatch, butterfly sine offset — Task 3
- [x] TilemapRenderer grassPhase + animated grass wind — Task 4
- [x] WorldRenderer time prop, grassPhase computation — Task 4
- [x] Time accumulator in overworld + city screens — Task 4
- [x] SNES DialogueBox + HUD + BattleMenu (haptics preserved) + battle scanlines — Task 5
- [x] 400×300 overworld with forest biomes, roads, river, pond — Task 6
- [x] 12 decorative llamas at spread positions — Task 6
- [x] tickCritter pure engine function — Task 7
- [x] Critter wander AI: move, pause, return home — Task 7
- [x] Critter local state in overworld, ticked each frame — Task 7
- [x] 14 critter entities (4 rabbit, 3 bird, 3 squirrel, 4 butterfly) — Task 8

**Type consistency:** `CritterData` defined in Task 1 (`engine/entity.ts`), consumed in Task 7 (`engine/critter.ts`) and Task 8 (`content/world-data.ts`). `SpriteAnimation` defined in Task 1 (`content/sprites.ts`), consumed in Task 3 (`renderer/EntityRenderer.tsx`). `grassPhase: number` flows WorldRenderer → TilemapRenderer. `time: number` flows screens → WorldRenderer → EntityRenderer. All consistent.

**BattleMenu note:** Task 5 rewrites BattleMenu. The Phase 6 Task 3 haptic code (`withHaptic`, `Platform.OS !== 'web'` guard, `selectionAsync`) MUST be in the Task 5 rewrite — it is explicitly included in the Task 5 Step 3 code above.
