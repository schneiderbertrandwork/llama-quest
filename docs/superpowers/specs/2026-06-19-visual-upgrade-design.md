# Llama Quest — Visual Upgrade Design Spec (Revised)

## Goal

Replace colored-rect placeholders with a retro SNES/Earthbound-style visual layer:
- Multi-frame pixel-art sprites with walk/idle animation for all entities
- Animated grass tiles (wind ripple effect)
- A 10× larger overworld (400×300 tiles) with rivers, forest biomes, and meandering roads
- Roaming woodland creatures (rabbits, birds, squirrels) and butterflies
- SNES double-border UI chrome
- A 20×20 pixel-art llama on the title screen
- Decorative llamas and critters scattered throughout the world

Zero external assets. All art is TypeScript color-grid constants rendered via Skia `Rect` calls (in-game) or React Native `View` grids (title screen).

---

## Architecture

### Animation System

Two types live in `content/sprites.ts`:

```typescript
interface SpriteGrid {
  size: number        // grid is size × size pixels
  pixels: string[]   // hex strings, '' = transparent; length = size*size
}

interface SpriteAnimation {
  frames: SpriteGrid[]   // all frames same size
  frameDuration: number  // ms per frame
}
```

`EntityRenderer` gains a required `time: number` prop (elapsed ms from game loop accumulator). Frame selection:

```typescript
const frameIdx = Math.floor(time / anim.frameDuration) % anim.frames.length
```

Static sprites (SpriteGrid) are wrapped at the dispatch site: `{ frames: [sprite], frameDuration: 1000 }`.

`WorldRenderer` gains a `time: number` prop and threads it through to both `EntityRenderer` and `TilemapRenderer`. Screens compute `time` via a `useRef` accumulator in `useGameLoop`.

### Grass Animation

`TilemapRenderer` gains a `grassPhase: number` prop (integer, advances every 600ms). The calling screen computes `grassPhase = Math.floor(time / 600)`. `useMemo` in TilemapRenderer takes `grassPhase` as a dependency, so it only recomputes twice per second instead of every frame.

Grass phase 0: dots at (dx, dy) where dx and dy are multiples of 8.
Grass phase 1: dots shifted +1px east — creates a subtle lateral wind shimmer.

### Critter AI

`engine/critter.ts` exports a pure function:

```typescript
interface CritterData {
  homeX: number; homeY: number      // starting position
  targetX: number; targetY: number  // current movement target
  wanderRadius: number              // max tiles from home
  speed: number                     // tiles per second
  pauseTimer: number                // countdown in seconds; critter pauses when > 0
}

function tickCritter(entity: Entity, dt: number): Entity
```

Behavior:
- If `pauseTimer > 0`: decrement by dt, return unchanged position.
- Move toward `(targetX, targetY)` at `speed` tiles/sec.
- When within 0.1 tiles of target: pick new random target within `wanderRadius` of home; set `pauseTimer` to 0.5–1.5s random pause.
- If more than `wanderRadius * 1.5` from home: set target back to home.

Butterfly entities get an extra `phaseOffset: number` in data. `EntityRenderer` applies a vertical sine offset when drawing: `sineY = Math.sin(time / 400 + phaseOffset) * 0.3 * tileSize`. This is applied only for the butterfly sprite.

Overworld screen maintains critter entities as local `useState`, initialized from world-data's critter list. Each game loop tick calls `tickCritter` on each critter and updates state.

### PixelArt Component

Unchanged from original design — View-grid renderer for non-Skia contexts (title screen).

---

## Files

**Create:**
- `content/sprites.ts` — `SpriteGrid`, `SpriteAnimation`, all constants
- `engine/critter.ts` — `CritterData`, `tickCritter`
- `components/PixelArt.tsx`
- `components/__tests__/PixelArt.test.tsx`
- `engine/__tests__/critter.test.ts`

**Modify:**
- `engine/entity.ts` — add `'decoration'` and `'critter'` to `EntityType`; add `makeDecoration`, `makeCritter`
- `engine/__tests__/entity.test.ts` — tests for new factories
- `renderer/EntityRenderer.tsx` — `time` prop, animation frame selection, critter/butterfly dispatch
- `renderer/TilemapRenderer.tsx` — `grassPhase` prop, animated grass texture
- `renderer/WorldRenderer.tsx` — thread `time` and `grassPhase` through
- `components/DialogueBox.tsx` — SNES double-border
- `components/HUD.tsx` — double-border, pixel HP bar
- `components/BattleMenu.tsx` — square corners, bevel (**MUST preserve P6T3 haptic code**)
- `app/battle.tsx` — scanlines, enemy pixel border
- `app/index.tsx` — add PixelArt title llama
- `app/overworld.tsx` — critter local state, game loop time accumulator, grassPhase
- `app/city/[id].tsx` — grassPhase (for city floor tiles)
- `content/world-data.ts` — 10× overworld (400×300), new city positions, decorative llamas + critters

---

## Sprite Roster

### Static Sprites (8×8)

| Constant | Entity | Key Colors |
|----------|--------|------------|
| `SPRITE_DOOR` | `building_entrance` | `#8b7355` wood, `#c0a060` arch |
| `SPRITE_GATE` | `gate` | `#888888` base; tinted red/green at draw time |
| `SPRITE_PORTAL` | `sandbox_portal` | `#333333` frame, `#4caf50` phosphor |
| `SPRITE_DECO_LLAMA` | `decoration` | `#c8b89a`, `#8b7355` |

### Animated Sprites — Player (3 frames, 8×8, 200ms/frame)

`SPRITE_PLAYER_ANIM: SpriteAnimation`

- Frame 0 (idle): long neck, 4 legs down, facing right
- Frame 1 (step A): front-left and back-right legs forward
- Frame 2 (step B): front-right and back-left legs forward

Colors: `#c8b89a` (body), `#8b7355` (hooves/shadow), `#ffffff` (eye dot)

### Animated Sprites — NPCs (2 frames, 8×8, 800ms/frame idle bob)

| Constant | Entity | Colors |
|----------|--------|--------|
| `SPRITE_NPC_ELDER_ANIM` | `npc-llama-elder` | `#c8b89a`, `#8b7355`, `#c0a060` hat |
| `SPRITE_NPC_PIP_ANIM` | `npc-pip` | `#d4c4a8`, `#8b7355` |
| `SPRITE_NPC_SMITH_ANIM` | `npc-smith` | `#8c6a3f`, `#aaaaaa` hammer |
| `SPRITE_NPC_ARTIFICER_ANIM` | `npc-api-artificer` | `#4a6a8c`, `#aaaaaa` gear |
| `SPRITE_NPC_ORACLE_ANIM` | `npc-prism-oracle` | `#7a4a8c`, `#a0e0ff` crystal |
| `SPRITE_NPC_VECTOR_ANIM` | `npc-vector-sprite` | `#f5c518`, `#ffffff` |
| `SPRITE_NPC_ARCHITECT_ANIM` | `npc-architect` | `#4a8c6a`, `#ece9ff` scroll |
| `SPRITE_NPC_KEEPER_ANIM` | `npc-keeper` | `#6a4a8c`, `#ffffff` book |

Frame 0 = normal pose. Frame 1 = 1-pixel vertical shift on the head row (creates a subtle nod/bob).

### Animated Critter Sprites (2 frames, 8×8, 300ms/frame)

| Constant | Critter | Key Colors |
|----------|---------|------------|
| `SPRITE_RABBIT_ANIM` | rabbit critter | `#d4c4a8` fur, `#ece9ff` belly, `#f44336` eye |
| `SPRITE_BIRD_ANIM` | bird critter | `#f5c518` body, `#8b7355` beak, `#ffffff` wing |
| `SPRITE_SQUIRREL_ANIM` | squirrel critter | `#8c6a3f` body, `#d4c4a8` belly, `#8b7355` tail |
| `SPRITE_BUTTERFLY_ANIM` | butterfly | `#a0e0ff` wings, `#7a4a8c` body, `#f5c518` spots |

Frame 0 = still/perched. Frame 1 = motion (wings spread, legs mid-hop).

### Title Screen Llama

`TITLE_LLAMA: SpriteGrid` — 20×20 pixels, `scale=8` → 160×160px rendered. Static (not animated). Colors: `#c8b89a`, `#8b7355`, `#d4c4a8`, `#ffffff` eye, transparent background.

---

## Tile Animation

`TilemapRenderer` props:

```typescript
interface TilemapRendererProps {
  grid: TileGrid
  camera: Camera
  tileSize: number
  width: number
  height: number
  grassPhase: number   // NEW: integer phase for grass animation
}
```

Grass phase 0: dot at `(sx + dx, sy + dy)` for dx, dy in {0, 8, 16, 24} (standard grid).
Grass phase 1: same dots but at `(sx + dx + 1, sy + dy)` — shifted 1px east.

All other tile textures are static (no phase dependency).

---

## 10× World Layout (400×300)

```
Grid: 400 wide × 300 tall tiles
Player spawn: (52, 148)
```

### Terrain

| Feature | Tile Type | Coordinates |
|---------|-----------|-------------|
| Forest border (N) | `forest` | y = 0..7, full width |
| Forest border (S) | `forest` | y = 292..299, full width |
| West forest biome | `forest` | x = 0..15, y = 8..140 and y = 160..291 |
| East forest biome | `forest` | x = 385..399, y = 8..291 |
| Central forest | `forest` | x = 130..160, y = 40..100 |
| Northern forest | `forest` | x = 250..310, y = 8..80 |
| Main E-W road | `path` | y = 148..149, x = 10..390 |
| N road (Llamatown) | `path` | x = 50..51, y = 100..148 |
| NE road (Forge) | `path` | x = 280..281, y = 100..148 |
| S road (Caverns) | `path` | x = 180..181, y = 148..240 |
| SW road (Convergence) | `path` | x = 90..91, y = 148..260 |
| River (N vertical) | `water` | x = 200..202, y = 8..80 |
| River (lake) | `water` | x = 195..210, y = 80..100 |
| River (S bend) | `water` | x = 200..202, y = 100..148 (east of N road) |
| Small pond | `water` | x = 340..350, y = 200..210 |

### City Entrance Positions

| City | Entrance Entity | Position |
|------|-----------------|----------|
| Llamatown | `enter-llamatown` | (52, 146) |
| Model Forge | `enter-forge` | (280, 150) |
| Prism Caverns | `enter-vale` | (180, 240) |
| The Convergence | `enter-ridge` | (90, 259) |

### Decorative Llamas (12 total, on grass tiles)

| ID | Position |
|----|----------|
| `deco-llama-1` | (25, 20) |
| `deco-llama-2` | (80, 35) |
| `deco-llama-3` | (170, 15) |
| `deco-llama-4` | (230, 50) |
| `deco-llama-5` | (350, 30) |
| `deco-llama-6` | (30, 180) |
| `deco-llama-7` | (120, 200) |
| `deco-llama-8` | (250, 170) |
| `deco-llama-9` | (320, 200) |
| `deco-llama-10` | (370, 260) |
| `deco-llama-11` | (60, 270) |
| `deco-llama-12` | (200, 280) |

### Critters (on grass tiles, away from roads and entrances)

| ID | Type | Position | Wander radius |
|----|------|----------|---------------|
| `critter-rabbit-1` | rabbit | (35, 30) | 4 |
| `critter-rabbit-2` | rabbit | (220, 140) | 4 |
| `critter-rabbit-3` | rabbit | (300, 180) | 4 |
| `critter-rabbit-4` | rabbit | (160, 270) | 4 |
| `critter-bird-1` | bird | (100, 60) | 6 |
| `critter-bird-2` | bird | (260, 200) | 6 |
| `critter-bird-3` | bird | (380, 120) | 6 |
| `critter-squirrel-1` | squirrel | (165, 80) | 3 |
| `critter-squirrel-2` | squirrel | (330, 90) | 3 |
| `critter-squirrel-3` | squirrel | (70, 230) | 3 |
| `critter-butterfly-1` | butterfly | (60, 120) | 8 |
| `critter-butterfly-2` | butterfly | (200, 60) | 8 |
| `critter-butterfly-3` | butterfly | (290, 250) | 8 |
| `critter-butterfly-4` | butterfly | (140, 260) | 8 |

---

## UI Chrome — SNES Double-Border

**DialogueBox:**
- Background: `#0a0826` (deep navy)
- Border: 2px outer `#c0a060` → 2px black gap → 2px inner `#c0a060` via nested Views
- Corners: 4×4px absolute View squares in `#c0a060`
- `borderRadius: 0` everywhere

**HUD:**
- Same double-border treatment
- HP bar: `height: 8`, `borderRadius: 0`, 1px `#000000` border around fill

**BattleMenu:**
- `borderRadius: 0`
- Top and left 1px bevel highlight Views
- **MUST preserve withHaptic wrapper and Platform.OS guard from P6T3**

**Battle screen:**
- Alternating 1px scanline rows covering top 45% of canvas
- Enemy rect: 4 thin rects forming a `#ece9ff` pixel border

---

## Testing

**New tests:**
- `engine/__tests__/entity.test.ts` — `makeDecoration`, `makeCritter` factories
- `engine/__tests__/critter.test.ts` — `tickCritter`: moves toward target, pauses at target, returns home when out of range
- `components/__tests__/PixelArt.test.tsx` — renders size*size pixel Views, backgroundColor correct, transparent pixels handled
- `renderer/__tests__/EntityRenderer.test.tsx` — player, NPC, decoration, critter, butterfly render without crash

No tests for sprite pixel data or tile textures (visually verified via Playwright).

---

## Out of Scope

- Directional sprites for player facing (always faces right — future enhancement)
- Critters inside city maps (overworld only)
- Physics-based critter collision
- Sound changes
- External image assets
- Font changes
