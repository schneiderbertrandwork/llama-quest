# Llama Quest — Visual Upgrade Design Spec

## Goal

Replace colored-rect placeholders with a retro SNES/Earthbound-style visual layer: 8×8 pixel-art sprites for all entities, tile texture patterns, SNES double-border UI chrome, and llamas throughout the world — including a 160×160px pixel-art llama on the title screen and six decorative llamas scattered across the overworld.

Zero external assets. All art defined as TypeScript color-grid constants rendered via Skia `Rect` calls (in-game) or React Native `View` grids (title screen).

---

## Architecture

### Sprite System

Sprites are defined as `SpriteGrid` constants in `content/sprites.ts`:

```typescript
interface SpriteGrid {
  size: number        // grid is size × size pixels
  pixels: string[]   // hex strings, '' = transparent; length must equal size*size
}
```

`EntityRenderer` gains an internal `drawSprite(canvas, sprite, cx, cy, pixelSize)` function that loops over `pixels` and draws a `Rect` for each non-empty entry. `pixelSize = tileSize / sprite.size` (e.g. 32/8 = 4px per sprite pixel).

Entities with no sprite defined fall back to the existing solid-rect rendering — so future entity types don't break.

Gate sprite color is chosen at draw time: if `entity.data['locked'] === true` use a red tint (`#f44336`), otherwise green (`#4caf50`).

### PixelArt Component

`components/PixelArt.tsx` renders pixel-art outside Skia (title screen):

```typescript
interface PixelArtProps {
  pixels: string[]   // same format as SpriteGrid.pixels
  size: number       // grid dimension
  scale: number      // px per pixel (e.g. 8 → scale*scale View per pixel)
}
```

Renders as a `size`-wide grid of square `View`s. Transparent pixels (`''`) render as `backgroundColor: 'transparent'`. No `FlatList` — flat `Array.map` over rows then columns.

### Decoration Entity

New entity type `'decoration'` added to `EntityType` union in `engine/entity.ts`. Non-interactable by definition (`interactable: false`). Factory: `makeDecoration(id, x, y)`. `nearestInteractable` already filters by `interactable` flag — no engine logic changes.

---

## Files

**Create:**
- `content/sprites.ts` — all `SpriteGrid` constants
- `components/PixelArt.tsx` — pixel grid renderer for non-Skia contexts

**Modify:**
- `engine/entity.ts` — add `'decoration'` to `EntityType`; add `makeDecoration`
- `renderer/EntityRenderer.tsx` — add `drawSprite`; dispatch by entity type + id; skip interaction label for `decoration`
- `renderer/TilemapRenderer.tsx` — add texture layer per tile type
- `components/DialogueBox.tsx` — SNES double-border, corner accents, `#0a0826` background
- `components/HUD.tsx` — double-border, pixel HP bar
- `components/BattleMenu.tsx` — square corners, beveled button style
- `app/battle.tsx` — scanline pattern on Skia canvas, pixel border on enemy rect
- `app/index.tsx` — add `PixelArt` llama above title
- `content/world-data.ts` — add 6 decorative llama entities to `OVERWORLD.entities`

---

## Sprite Roster

All sprites are 8×8 grids (64 pixel entries). Pixel size in-game: 4×4px per sprite pixel at 32px tile size.

| Constant | Entity | Design | Key Colors |
|----------|--------|--------|------------|
| `SPRITE_PLAYER` | Player | Llama profile: long neck, body, 4 legs, facing right | `#c8b89a`, `#8b7355`, `#ffffff` (eye) |
| `SPRITE_NPC_ELDER` | `npc-llama-elder` | Llama with gold pixel hat | `#c8b89a`, `#c0a060` (hat) |
| `SPRITE_NPC_PIP` | `npc-pip` | Rounder, shorter llama | `#d4c4a8`, `#8b7355` |
| `SPRITE_NPC_SMITH` | `npc-smith` | Stout figure, hammer pixel on right | `#8c6a3f`, `#888` (hammer) |
| `SPRITE_NPC_ARTIFICER` | `npc-api-artificer` | Figure with gear pixel on chest | `#4a6a8c`, `#aaa` (gear) |
| `SPRITE_NPC_ORACLE` | `npc-prism-oracle` | Robed figure, crystal pixel above head | `#7a4a8c`, `#a0e0ff` (crystal) |
| `SPRITE_NPC_VECTOR` | `npc-vector-sprite` | Star/sparkle shape | `#f5c518`, `#ffffff` (core) |
| `SPRITE_NPC_ARCHITECT` | `npc-architect` | Figure holding scroll pixel | `#4a8c6a`, `#ece9ff` (scroll) |
| `SPRITE_NPC_KEEPER` | `npc-keeper` | Figure holding open book pixel | `#6a4a8c`, `#ffffff` (pages) |
| `SPRITE_DOOR` | `building_entrance` | Arched doorway, 2-pixel columns | `#8b7355`, `#c0a060` (arch) |
| `SPRITE_GATE` | `gate` | Portcullis bars; tinted red/green at draw time | `#888888` base |
| `SPRITE_PORTAL` | `sandbox_portal` | CRT outline with `>_` pixels on screen | `#333333`, `#4caf50` (phosphor) |
| `SPRITE_DECO_LLAMA` | `decoration` | Simpler 8×8 llama silhouette | `#c8b89a`, `#8b7355` |

NPC sprite lookup: `EntityRenderer` maps `entity.id` → sprite constant. Unknown NPC IDs fall back to a generic humanoid rect.

---

## Tile Texture Pass

Each tile draws its base rect, then a second Skia `Rect` (or rects) for texture. Both draws happen inside the existing tile loop in `TilemapRenderer` — no props change.

| Tile | Base | Texture |
|------|------|---------|
| `grass` | `#2d5a1b` | 1×1px `#3a7022` dots at every 8px grid intersection — dithered meadow |
| `path` | `#8b7355` | 1px-tall `#7a6347` stripe centered horizontally — worn track |
| `forest` | `#1a3d1a` | 3×3px `#122d12` triangle in top-center — tree canopy silhouette |
| `water` | `#1a3d6b` | Two 1px-tall `#2a4d8b` stripes, spaced 4px apart — wave shimmer |
| `building_wall` | `#4a4a4a` | `#555555` horizontal lines every 8px, 1px tall — brick courses |
| `floor` | `#3d3d3d` | `#444444` vertical lines every 8px, 1px wide — wooden planks |
| `door` | `#8b6914` | `#a07820` center panel at half-width — door frame inset |

---

## UI Chrome — SNES Double-Border

**DialogueBox:**
- Background: `#0a0826` (deep navy)
- Border: 2px outer `#c0a060` → 2px black gap → 2px inner `#c0a060` via nested Views
- Corners: 4×4px absolute `View` squares in `#c0a060` at all four corners
- `borderRadius: 0` everywhere — no rounding

**HUD:**
- Same double-border treatment as DialogueBox
- HP bar: `height: 8`, `borderRadius: 0`, 1px `#000000` border around fill rect

**BattleMenu buttons:**
- `borderRadius: 0` (square corners)
- Top and left edges: 1px absolute `View` in a lighter shade of the button border color — beveled highlight

**Battle screen (Skia canvas):**
- Top battle area: alternating 1px rows of `#120d28` / `#0f0a22` across full width — CRT scanline effect
- Enemy placeholder rect: gains a 1px `#ece9ff` border (drawn as four thin rects around the enemy rect)

---

## Title Screen Llama

**Component:** `PixelArt` with a 20×20 pixel grid, `scale=8` → 160×160px rendered size.

**Placement:** Centered, between the "LLAMA QUEST" heading and the "YOUR NAME" label.

**Colors:** `#c8b89a` (body), `#8b7355` (shadow, hooves), `#d4c4a8` (highlights), `#ffffff` (eye), `#1a1a2e` / `''` (transparent background).

The llama faces right, standing — long neck, two visible ears, body, four legs. Detailed pixel layout defined as the `TITLE_LLAMA` constant in `content/sprites.ts` (separate from the 8×8 in-game sprites; size=20).

---

## Decorative Overworld Llamas

Six `makeDecoration('deco-llama-N', x, y)` entities added to `OVERWORLD.entities` in `content/world-data.ts`. Positions are on walkable `grass` tiles, away from city entrances and the player spawn path:

| ID | Position |
|----|----------|
| `deco-llama-1` | (3, 4) |
| `deco-llama-2` | (12, 6) |
| `deco-llama-3` | (28, 8) |
| `deco-llama-4` | (7, 22) |
| `deco-llama-5` | (22, 18) |
| `deco-llama-6` | (35, 25) |

These are stationary, non-interactable, rendered with `SPRITE_DECO_LLAMA`.

---

## Testing

- `engine/__tests__/entity.test.ts` — add tests for `makeDecoration` factory and `'decoration'` EntityType
- `renderer/__tests__/EntityRenderer.test.tsx` — smoke test that decoration entities render without error
- `components/__tests__/PixelArt.test.tsx` — renders correct number of pixel Views; transparent pixels have no background color

No tests for sprite pixel data (the data is visually verified via Playwright). No tests for tile texture (purely additive rendering, can't break existing tiles).

---

## Out of Scope

- Animated sprites (no frame sequences)
- Player-facing direction changes (sprite always faces right — directional sprites are a future enhancement)
- Sound changes
- Any external image assets
- Font changes (monospace stays)
