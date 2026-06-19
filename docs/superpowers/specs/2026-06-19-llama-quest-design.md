# Llama Quest — Design Spec

**Date:** 2026-06-19
**Status:** Approved
**Scope:** Complete revamp of Localhost Quest into a cross-platform SNES-style RPG

---

## Overview

Llama Quest is a complete rewrite of Localhost Quest — a browser/mobile RPG that teaches local AI fundamentals (Ollama, ChromaDB, RAG) through exploration, battles, and hands-on sandbox labs. The new version adopts an Earthbound-inspired SNES aesthetic, city-to-city overworld travel, real turn-based battles with PSI moves tied to quiz questions, and Secret of Mana–style procedural music. It ships as a single Expo codebase targeting iOS, Android, and Web.

All existing content (25 lessons, 100+ quiz questions, 5 sandbox labs) is migrated into the new architecture.

---

## Section 1: Architecture & Tech Stack

### Runtime

Expo SDK 52, managed workflow. One codebase compiles to iOS, Android, and Web.

### Core Libraries

| Layer | Library | Notes |
|---|---|---|
| Navigation | `expo-router` | File-based routing, works on all 3 targets |
| Game rendering | `@shopify/react-native-skia` | GPU-accelerated 2D canvas, web via CanvasKit/WASM |
| Game loop | `react-native-reanimated` `useFrameCallback` | Runs on UI thread at 60 fps, decoupled from React render |
| State | `zustand` + `expo-secure-store` / `AsyncStorage` | Persisted game state |
| Music | `tone` (Tone.js) + `expo-av` bridge | Tone.js on web; pre-rendered loops for native |
| Input | `react-native-gesture-handler` + keyboard events | Touch on mobile, WASD/arrows on web |
| Sprites | Royalty-free packs from Itch.io / OpenGameArt | Loaded as Skia `Image` resources |

### Folder Structure

```
llama-quest/
├── app/                          # Expo Router screens
│   ├── index.tsx                 # Title / character select screen
│   ├── overworld.tsx             # Scrollable overworld map
│   ├── city/[id].tsx             # City exterior (llamatown | forge | vale | ridge)
│   ├── building/[id].tsx         # Interior rooms (library | dojo | workshop per city)
│   └── battle.tsx                # Battle screen (modal-style overlay)
│
├── engine/                       # Pure TypeScript — zero React/React Native imports
│   ├── tilemap.ts                # Tile grid, walkability, region definitions
│   ├── entity.ts                 # Entity system (player, NPCs, interactables)
│   ├── camera.ts                 # Camera follow + world-bounds clamping
│   ├── movement.ts               # Player input handling + collision response
│   └── battle/
│       ├── battle-engine.ts      # Turn logic, HP, PSI resolution
│       ├── encounter.ts          # Random encounter rate + trigger logic
│       └── psi-moves.ts          # Maps QBANK questions to named PSI moves
│
├── renderer/                     # Skia rendering components
│   ├── TilemapRenderer.tsx       # Draws tile grid from a Skia canvas
│   ├── SpriteRenderer.tsx        # Sprite sheet slicing + animation
│   ├── WorldRenderer.tsx         # Composes tilemap + entity layer
│   └── BattleRenderer.tsx        # Earthbound battle UI (enemy, HP bars, menu)
│
├── audio/
│   ├── music-engine.ts           # Tone.js city themes, dynamic layering
│   └── sfx.ts                    # Procedural one-shot sound effects
│
├── content/                      # Migrated from original game — data only
│   ├── lessons.ts                # All 25 lessons (same block schema)
│   ├── questions.ts              # 100+ QBANK questions
│   ├── sandboxes.ts              # 5 sandbox projects with objectives
│   ├── world-data.ts             # City + building definitions, NPC lines
│   └── diagrams.ts               # SVG diagram definitions
│
├── store/
│   ├── game-store.ts             # Player stats, progression, XP, persistence
│   └── battle-store.ts           # Active battle state (ephemeral)
│
├── components/                   # Shared React Native UI components
│   ├── DialogueBox.tsx           # Earthbound-style bordered text window
│   ├── HUD.tsx                   # HP (rolling counter), XP, level overlay
│   ├── BattleMenu.tsx            # PSI move selection + answer reveal
│   ├── Codex.tsx                 # Lesson viewer (block renderer)
│   ├── Terminal.tsx              # Sandbox virtual terminal
│   └── Menu.tsx                  # Earthbound-style action menu
│
├── hooks/
│   ├── useGameLoop.ts            # useFrameCallback wrapper with delta time
│   ├── usePlayerInput.ts         # WASD + touch joystick unified input
│   └── useBattleSequence.ts      # Battle flow orchestration hook
│
└── assets/
    ├── sprites/                  # Downloaded royalty-free sprite packs
    └── fonts/                    # Press Start 2P, JetBrains Mono
```

**Key architectural principle:** The `engine/` directory is a pure TypeScript library with no platform imports. It can be unit-tested with Node.js. All React Native and Skia code lives in `renderer/` and `components/`.

---

## Section 2: World & City Design

### Overworld Map

A scrollable tile map showing all 4 cities connected by winding paths. Random encounters trigger on designated tiles (tall grass, dark mountain passes). The player spawns in Llamatown. Each city's far gate is locked until all Dojo battles in that city are won.

### The 4 Cities

Each city is a full exterior screen (`city/[id].tsx`) with 3 interior buildings accessible by walking into them.

| City | Act | Tile Palette | Vibe | Sprite Pack Suggestion |
|---|---|---|---|---|
| **Llamatown** | I — Ollama basics | Warm greens, cream, wood | Friendly starter village | LPC Base Assets |
| **Model Forge** | II — Advanced Ollama | Bronze, forge-orange, smoke | Industrial craftsmen town | LPC Industrial |
| **Vector Vale** | III — ChromaDB | Deep purple, glowing crystals | Mystical wizard valley | LPC Magic / RPG Nature |
| **RAG Ridge** | IV — RAG pipelines | Electric blue, steel, neon | Futuristic clifftop city | LPC Sci-Fi |

### Interior Buildings (per city)

| Building | Route | Purpose |
|---|---|---|
| **Library** | `building/[city]-library` | Codex viewer for that act's lessons; NPC hints |
| **Dojo** | `building/[city]-dojo` | Battle arena; defeat all enemies to master the act |
| **Workshop** | `building/[city]-workshop` | Sandbox terminal; one lab project per city |

### City Bosses

Fought in the Dojo after all regular battles are cleared:

| City | Boss Name | Concept |
|---|---|---|
| Llamatown | The Frozen Boot | First-time setup confusion |
| Model Forge | The Rate Limiter | API throttling & resource limits |
| Vector Vale | The Dimensionless Beast | High-dimensional embedding confusion |
| RAG Ridge | The Hallucinator | LLM hallucination in retrieval pipelines |

### Travel Flow

```
Overworld → walk to city entrance → city exterior → walk into building →
complete activity → exit building → walk to far gate →
(gate opens when all Dojo battles won) → short overworld path → next city
```

Gate blockage is surfaced via a gatekeeper NPC dialogue, not a silent UI lock.

---

## Section 3: Battle System

### Encounter Trigger

- **Random encounters:** ~15% chance per tile entered on designated overworld/city tiles. Rate configurable per area in `world-data.ts`.
- **Boss encounters:** Triggered by interacting with the Dojo's final door. Not random.

### Battle Screen Layout

```
┌─────────────────────────────────────────┐
│                                         │
│           [Enemy Sprite]                │
│        "The Frozen Boot"                │
│          HP: ████████░░  80/100         │
│                                         │
├────────────────┬────────────────────────┤
│ LLAMA      HP  ████░░  48/60 (rolling)  │
│                                         │
│  ► PSI Moves                            │
│    Items                                │
│    Check                                │
│    Run                                  │
└────────────────┴────────────────────────┘
```

### Rolling HP Counter

Earthbound's iconic mechanic. When damage is taken:
- `playerTrueHp` updates instantly
- `playerDisplayHp` ticks toward `playerTrueHp` at ~10 HP/second
- Implemented as a Reanimated `SharedValue` driving the displayed number
- Player can still act while HP is rolling — creating tension and the possibility of last-second wins

### PSI Move Resolution

1. Player selects "PSI Moves" → sees list of 2–4 moves drawn from current city's question bank
2. Each move has a name, tier (α/β/γ/Ω), and a one-line teaser
3. Selecting a move reveals the full question with 4 answer choices
4. **Correct answer:** full damage, +5 XP, "It's super effective!" flash
5. **Wrong answer:** half damage, `why` explanation shown, no XP
6. **3 correct in a row on same concept:** concept mastered, +40 XP, move upgrades to Ω tier

### PSI Move Naming Convention

Tier is derived from lesson act number (no manual mapping):

| Act | Tier | Example |
|---|---|---|
| I | α | PSI Boot α |
| II | β | PSI Manifest β |
| III | γ | PSI Vectorize γ |
| IV | Ω | PSI Retrieve Ω |

### Enemy Attacks

After player's turn, enemy deals a fixed damage range with a flavour line. Damage is tuned low enough that the rolling HP counter gives time to respond.

### Victory / Defeat

- **Win:** XP awarded, `battle-store` cleared, fade back to city. All Dojo enemies beaten → gate unlocks.
- **Defeat:** "You got homesick." → respawn at city entrance, 1 HP, no XP loss, encounter available again.

### Battle Store Schema

```typescript
interface BattleState {
  enemy: Enemy
  enemyHp: number
  playerDisplayHp: number   // rolling counter (Reanimated SharedValue source)
  playerTrueHp: number      // actual value the counter ticks toward
  turn: 'player' | 'enemy'
  activeQuestion: Question | null
  streak: Record<LessonId, number>
}
```

---

## Section 4: Audio System

### Platform Strategy

- **Web:** Tone.js runs natively in the browser via the Web Audio API.
- **Native (iOS/Android):** During a build step, the same Tone.js patches render short looping `.ogg` clips that are bundled and played via `expo-av`. Musical identity is identical across platforms.

### Per-City Musical DNA

| City | Key | Tempo | Scale | Synth Palette |
|---|---|---|---|---|
| Llamatown | C major | 88 bpm | Pentatonic | Warm triangle waves, light pads |
| Model Forge | E minor | 112 bpm | Dorian | Sawtooth lead, rhythmic bass |
| Vector Vale | F# minor | 72 bpm | Phrygian | Sine pads + reverb, arpeggios |
| RAG Ridge | A major | 128 bpm | Lydian | Square wave melody, driving pulse |

### Dynamic Layering (Secret of Mana style)

Each city theme has 3 looping layers that crossfade independently:

1. **Bass layer** — root drone + walking bass. Always playing.
2. **Harmony layer** — chord pads. Fades in when entering a building.
3. **Melody layer** — arpeggiated lead. Fades in during battle.

Entering the Dojo causes the music to swell (harmony + melody fade in). Starting a battle crossfades to a faster, minor-shifted battle variant.

### Sound Effects (all procedural, no audio files)

| Event | Description |
|---|---|
| Footstep | Short low sine blip, 20 ms |
| Dialogue advance | High sine chirp, 40 ms |
| Correct answer | Rising major third, 80 ms |
| Wrong answer | Descending minor second, 100 ms |
| Level up | Ascending arpeggio, 400 ms |
| HP tick | Soft pulse, rate tied to rolling counter speed |
| Boss defeated | Triumphant 4-note fanfare, 600 ms |

### Audio Store

`audio-store.ts` persists `musicEnabled`, `sfxEnabled`, and `masterVolume` to `AsyncStorage`.

---

## Section 5: Content Migration & Progression

### Lessons → Library Buildings

All 25 lessons migrate to `content/lessons.ts` with the same block schema (h2, p, ul, code, tip, warn, note, diagram). The Codex viewer in each Library building renders them using React Native components. Inline markdown parsing (`**bold**`, `` `code` ``, `[[kbd]]`) is ported from the original vanilla JS. Reading a lesson: **+20 XP**.

### QBANK → PSI Moves

All 100+ questions migrate to `content/questions.ts` unchanged. `psi-moves.ts` maps them to PSI move names at runtime using the act-to-tier table above. The `why` field surfaces as the post-answer explanation in battle.

### Sandboxes → Workshop Buildings

All 5 sandbox projects migrate to `content/sandboxes.ts`. The Workshop building renders the virtual terminal as a React Native `TextInput` + scrollable output log. Command validation regex is ported unchanged. Completing a sandbox objective: **+15 XP**.

### Progression & XP

| Action | XP |
|---|---|
| Read a lesson | +20 |
| Correct PSI answer in battle | +5 |
| Master a concept (3-streak) | +40 |
| Meet an NPC | +8 |
| Complete a sandbox objective | +15 |
| Defeat a city boss | +100 |

XP per level: 120. Level-ups trigger a toast + musical fanfare SFX.

### Act Gating

Each city's far gate unlocks when all concepts for that act are mastered. This is checked by `game-store.ts` against the `masteredConcepts` map. The gate state is reflected in the tilemap's walkability grid so the Skia renderer shows it as passable/blocked without a UI overlay.

### Persistence

Zustand `persist` middleware writes to:
- **Native:** `expo-secure-store` (encrypted)
- **Web:** `localStorage`

Save key: `llama_quest_v1`. A migration function handles saves from the original `localhost_quest_save_v1` key.

### Game Store Schema

```typescript
interface GameState {
  player: {
    name: string
    class: 'Tinkerer' | 'Scholar' | 'Architect'
    hp: number
    maxHp: number
    level: number
    xp: number
  }
  progression: {
    currentCity: 'llamatown' | 'forge' | 'vale' | 'ridge'
    position: { x: number; y: number }
    masteredConcepts: Record<LessonId, boolean>
    readLessons: Record<LessonId, boolean>
    metNPCs: Record<string, boolean>
    completedSandboxes: Record<string, boolean>
    defeatedBosses: Record<string, boolean>
  }
  settings: {
    musicEnabled: boolean
    sfxEnabled: boolean
    masterVolume: number
  }
}
```

---

## Phasing

This project is large. The recommended build order:

| Phase | Scope |
|---|---|
| **1 — Foundation** | Expo project scaffold, Skia tilemap renderer, player movement, overworld, Llamatown exterior + one building |
| **2 — Battle system** | Encounter trigger, battle screen, PSI moves, rolling HP, victory/defeat |
| **3 — Content migration** | Port all 25 lessons, questions, sandboxes into new content files; wire Library + Workshop |
| **4 — Audio** | Tone.js music engine, per-city themes, dynamic layering, SFX |
| **5 — Remaining cities** | Model Forge, Vector Vale, RAG Ridge with full content |
| **6 — Mobile polish** | Touch joystick, safe areas, haptics, performance profiling on device |

Each phase produces a shippable build.

---

## Open Questions / Constraints

- **Sprite pack selection:** Specific packs from Itch.io/OpenGameArt need to be chosen before Phase 1 begins. LPC (Liberated Pixel Cup) assets are the strongest candidate — CC-BY licensed, consistent style, large tileset library.
- **Tone.js native audio rendering:** The build step that pre-renders Tone.js patches to `.ogg` loops needs tooling (likely a Node.js script run before `expo build`). This is a Phase 4 task but should be designed in Phase 1.
- **Screen size variance:** The Skia canvas must handle everything from an iPhone SE (375×667 pt) to a 4K web browser. The camera zoom level should be calculated from screen dimensions at runtime.
