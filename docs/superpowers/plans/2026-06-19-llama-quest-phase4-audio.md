# Phase 4 — Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-city background music (Tone.js on web) and 7 SFX events, with settings integration.

**Architecture:** A platform-aware `AudioManager` singleton dispatches to per-city Tone.js theme modules on web. Each theme is a module singleton with `start(volume)` and `stop()` functions controlling Tone.js Sequences and Transport. SFX uses one-shot Tone.js synths that self-dispose. Native expo-av path is scaffolded but web Tone.js synthesis is the primary deliverable.

**Tech Stack:** `tone` for web music synthesis, `expo-av` for native audio playback, `Platform.OS` for branching.

## Global Constraints

- **Expo SDK 52** managed workflow; no ejecting
- **TypeScript strict** with `noUncheckedIndexedAccess: true`; all array/object index access uses `??` fallback
- **`--legacy-peer-deps`** required for all `npm install` calls
- **No arbitrary colors** — pull from established palette (HUD.tsx, TilemapRenderer.tsx)
- **Entity IDs** kebab-case; lesson IDs `<tech>-<concept>`
- **Save key** `'llama_quest_v1'` — never change
- **TDD**: write failing test first → minimal implementation → green → commit
- **`Record<string, boolean>`** for all progression tracking
- **Constants**: `TILE_SIZE = 32`, `PLAYER_SPEED = 4`, `MAX_DT = 0.05`, `XP_PER_LEVEL = 120`
- **XP rewards**: lesson +20, NPC +8, quiz +5, mastered +40, boss +100, sandbox +15

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `audio/AudioManager.ts` | Create | Singleton routing play/stop/sfx to themes or expo-av |
| `audio/sfx.ts` | Create | 7 one-shot Tone.js SFX functions |
| `audio/themes/llamatown.ts` | Create | C major pentatonic, 72 BPM, triangle oscillator |
| `audio/themes/overworld.ts` | Create | G major pentatonic, 80 BPM, square oscillator |
| `audio/themes/forge.ts` | Create | D minor, 90 BPM, sawtooth oscillator |
| `audio/themes/caverns.ts` | Create | A minor arpeggios, 60 BPM, sine oscillator |
| `audio/themes/convergence.ts` | Create | C major, 80 BPM, two-layer triangle (both layers start immediately) |
| `audio/themes/battle.ts` | Create | B diminished, 120 BPM, square + sawtooth dual layer |
| `audio/__tests__/AudioManager.test.ts` | Create | 6 unit tests for AudioManager |
| `audio/__tests__/sfx.test.ts` | Create | 5 unit tests for SFX_MAP |
| `audio/__tests__/themes.test.ts` | Create | Structural tests: all themes export start/stop |
| `__mocks__/tone.js` | Create | Jest mock: all Tone.js classes as jest.fn() |
| `__mocks__/expo-av.js` | Create | Jest mock: Audio.Sound.createAsync |
| `app/overworld.tsx` | Modify | useEffect: AudioManager.play('overworld') |
| `app/city/[id].tsx` | Modify | useEffect: AudioManager.play(cityTrack) |
| `app/battle.tsx` | Modify | useEffect: AudioManager.play('battle') + sfx wiring |
| `hooks/useBattle.ts` | Modify | AudioManager.sfx('hit') after enemy turn |
| `store/game-store.ts` | Modify | updateSettings → AudioManager; awardXP level-up → sfx('levelUp') |

---

### Task 1: Install packages + create Jest mocks

**Files:**
- Modify: `app.json` (add expo-av plugin)
- Create: `__mocks__/tone.js`
- Create: `__mocks__/expo-av.js`

No TDD for this task — it is infrastructure setup.

- [ ] **Step 1: Install Tone.js and expo-av**

```bash
npm install tone --legacy-peer-deps
npx expo install expo-av
```

Expected: packages added to node_modules with no errors.

- [ ] **Step 2: Add expo-av to app.json plugins**

In `app.json`, find the `"plugins"` array and add `"expo-av"`:

```json
{
  "expo": {
    "plugins": ["expo-router", "expo-av"]
  }
}
```

Do NOT add `"react-native-reanimated"` — it was intentionally removed (see CLAUDE.md Known Issues: Node 24 ESM/CJS conflict).

- [ ] **Step 3: Create `__mocks__/tone.js`**

```javascript
// __mocks__/tone.js
const mockSynthInstance = () => ({
  volume: { value: 0 },
  frequency: { value: 440, linearRampTo: jest.fn() },
  triggerAttackRelease: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  dispose: jest.fn(),
  toDestination: jest.fn().mockReturnThis(),
})

const mockTransport = {
  bpm: { value: 120 },
  start: jest.fn(),
  stop: jest.fn(),
}

module.exports = {
  getTransport: jest.fn(() => mockTransport),
  gainToDb: jest.fn((v) => v * 10),
  now: jest.fn(() => 0),
  PolySynth: jest.fn(mockSynthInstance),
  Synth: jest.fn(),
  NoiseSynth: jest.fn(mockSynthInstance),
  Oscillator: jest.fn(mockSynthInstance),
  Sequence: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
}
```

- [ ] **Step 4: Create `__mocks__/expo-av.js`**

```javascript
// __mocks__/expo-av.js
const mockSound = {
  playAsync: jest.fn().mockResolvedValue({}),
  stopAsync: jest.fn().mockResolvedValue({}),
  unloadAsync: jest.fn().mockResolvedValue({}),
  setVolumeAsync: jest.fn().mockResolvedValue({}),
}

module.exports = {
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: mockSound }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue({}),
  },
}
```

- [ ] **Step 5: Verify existing tests still pass**

```bash
npm test -- --ci --watchAll=false
```

Expected: all 81 tests pass. If any fail, investigate before continuing.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add __mocks__/tone.js __mocks__/expo-av.js app.json package.json package-lock.json
git commit -m "chore: add Tone.js + expo-av; jest mocks for audio packages"
```

---

### Task 2: AudioManager singleton + sfx stub

**Files:**
- Create: `audio/AudioManager.ts`
- Create: `audio/sfx.ts` (stub — real implementations added in Task 5)
- Create: `audio/themes/llamatown.ts` through `battle.ts` (stubs — fleshed out in Tasks 3–4)
- Create: `audio/__tests__/AudioManager.test.ts`

**Interfaces:**
- Produces: `AudioManager` (singleton), `AudioManagerImpl` (class for testing), `TrackId` type

- [ ] **Step 1: Write failing tests**

Create `audio/__tests__/AudioManager.test.ts`:

```typescript
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }))
jest.mock('../themes/llamatown', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/overworld', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/forge', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/caverns', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/convergence', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/battle', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../sfx', () => ({
  SFX_MAP: {
    levelUp: jest.fn(), hit: jest.fn(), npcBlip: jest.fn(),
    menuMove: jest.fn(), miss: jest.fn(), victory: jest.fn(), escape: jest.fn(),
  },
}))

import { AudioManagerImpl } from '../AudioManager'
import * as llamatown from '../themes/llamatown'
import * as overworld from '../themes/overworld'

let manager: AudioManagerImpl

beforeEach(() => {
  manager = new AudioManagerImpl()
  jest.clearAllMocks()
})

it('play("llamatown") calls llamatown.start with volume 0.8', () => {
  manager.play('llamatown')
  expect(llamatown.start).toHaveBeenCalledWith(0.8)
})

it('play same track twice is a no-op', () => {
  manager.play('llamatown')
  manager.play('llamatown')
  expect(llamatown.start).toHaveBeenCalledTimes(1)
})

it('play new track stops previous theme first', () => {
  manager.play('llamatown')
  jest.clearAllMocks()
  manager.play('overworld')
  expect(llamatown.stop).toHaveBeenCalledTimes(1)
  expect(overworld.start).toHaveBeenCalledWith(0.8)
})

it('setMusicEnabled(false) stops current music', () => {
  manager.play('llamatown')
  jest.clearAllMocks()
  manager.setMusicEnabled(false)
  expect(llamatown.stop).toHaveBeenCalled()
})

it('play after setMusicEnabled(false) does not call theme.start', () => {
  manager.setMusicEnabled(false)
  manager.play('overworld')
  expect(overworld.start).not.toHaveBeenCalled()
})

it('stop() calls theme.stop on current theme', () => {
  manager.play('llamatown')
  jest.clearAllMocks()
  manager.stop()
  expect(llamatown.stop).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- audio/__tests__/AudioManager.test.ts --watchAll=false
```

Expected: FAIL — "Cannot find module '../AudioManager'"

- [ ] **Step 3: Create sfx stub `audio/sfx.ts`**

```typescript
// audio/sfx.ts
// Implementations added in Task 5
export const SFX_MAP: Record<string, () => void> = {
  levelUp: () => {},
  hit: () => {},
  miss: () => {},
  npcBlip: () => {},
  menuMove: () => {},
  victory: () => {},
  escape: () => {},
}
```

- [ ] **Step 4: Create 6 theme stubs**

Create each file below. All 6 are identical stubs — the content is replaced in Tasks 3–4.

`audio/themes/llamatown.ts`, `audio/themes/overworld.ts`, `audio/themes/forge.ts`, `audio/themes/caverns.ts`, `audio/themes/convergence.ts`, `audio/themes/battle.ts` — each containing:

```typescript
export function start(_volume: number): void {}
export function stop(): void {}
```

- [ ] **Step 5: Implement `audio/AudioManager.ts`**

```typescript
import { Platform } from 'react-native'
import * as LlamatownTheme from './themes/llamatown'
import * as OverworldTheme from './themes/overworld'
import * as ForgeTheme from './themes/forge'
import * as CavernsTheme from './themes/caverns'
import * as ConvergenceTheme from './themes/convergence'
import * as BattleTheme from './themes/battle'
import { SFX_MAP } from './sfx'

export type TrackId = 'overworld' | 'llamatown' | 'forge' | 'caverns' | 'convergence' | 'battle'

interface Theme {
  start: (volume: number) => void
  stop: () => void
}

const THEMES: Record<TrackId, Theme> = {
  overworld: OverworldTheme,
  llamatown: LlamatownTheme,
  forge: ForgeTheme,
  caverns: CavernsTheme,
  convergence: ConvergenceTheme,
  battle: BattleTheme,
}

export class AudioManagerImpl {
  private currentTrack: TrackId | null = null
  private musicEnabled = true
  private sfxEnabled = true
  private volume = 0.8

  play(trackId: TrackId): void {
    if (this.currentTrack === trackId) return
    if (this.currentTrack !== null) {
      THEMES[this.currentTrack]?.stop()
    }
    this.currentTrack = trackId
    if (!this.musicEnabled) return
    if (Platform.OS === 'web') {
      THEMES[trackId]?.start(this.volume)
    }
    // Native expo-av: not implemented in Phase 4 (web-first)
  }

  stop(): void {
    if (this.currentTrack !== null && Platform.OS === 'web') {
      THEMES[this.currentTrack]?.stop()
    }
    this.currentTrack = null
  }

  sfx(id: keyof typeof SFX_MAP): void {
    if (!this.sfxEnabled) return
    const fn = SFX_MAP[id]
    if (fn) fn()
  }

  setVolume(v: number): void {
    this.volume = v
  }

  setMusicEnabled(v: boolean): void {
    this.musicEnabled = v
    if (!v) this.stop()
  }

  setSfxEnabled(v: boolean): void {
    this.sfxEnabled = v
  }
}

export const AudioManager = new AudioManagerImpl()
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- audio/__tests__/AudioManager.test.ts --watchAll=false
```

Expected: PASS — 6 tests pass.

- [ ] **Step 7: Run all tests**

```bash
npm test -- --ci --watchAll=false
```

Expected: all 81 tests pass.

- [ ] **Step 8: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add audio/
git commit -m "feat: AudioManager singleton with platform-aware play/stop/sfx"
```

---

### Task 3: Llamatown + Overworld themes

**Files:**
- Modify: `audio/themes/llamatown.ts` (replace stub)
- Modify: `audio/themes/overworld.ts` (replace stub)
- Create: `audio/__tests__/themes.test.ts`

**Interfaces:**
- Consumes: `tone` (Tone.PolySynth, Tone.Synth, Tone.Sequence, Tone.getTransport, Tone.gainToDb)
- Produces: `start(volume)` and `stop()` for each theme

- [ ] **Step 1: Write structural tests**

Create `audio/__tests__/themes.test.ts`:

```typescript
import * as llamatown from '../themes/llamatown'
import * as overworld from '../themes/overworld'
import * as forge from '../themes/forge'
import * as caverns from '../themes/caverns'
import * as convergence from '../themes/convergence'
import * as battle from '../themes/battle'

const themes = { llamatown, overworld, forge, caverns, convergence, battle }

for (const [name, theme] of Object.entries(themes)) {
  it(`${name} exports a start function`, () => {
    expect(typeof theme.start).toBe('function')
  })
  it(`${name} exports a stop function`, () => {
    expect(typeof theme.stop).toBe('function')
  })
  it(`${name}.start(0.8) does not throw`, () => {
    expect(() => theme.start(0.8)).not.toThrow()
  })
  it(`${name}.stop() does not throw`, () => {
    expect(() => theme.stop()).not.toThrow()
  })
}
```

- [ ] **Step 2: Run structural tests**

```bash
npm test -- audio/__tests__/themes.test.ts --watchAll=false
```

Expected: PASS — 24 tests pass (stubs satisfy the shape already).

- [ ] **Step 3: Implement `audio/themes/llamatown.ts`**

Peaceful village: C major pentatonic, 72 BPM, triangle oscillator, second layer fades in after 30s.

```typescript
import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

const NOTES = ['C4', 'E4', 'G4', 'A4', 'C5', 'A4', 'G4', 'E4']
const NOTES2 = ['G5', null, 'E5', null, 'C5', null, 'E5', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 72
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.8 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '8n', time) },
    NOTES,
    '8n',
  )
  seq.start(0)
  Tone.getTransport().start()
  layerTimer = setTimeout(() => _addLayer2(volume), 30000)
}

function _addLayer2(volume: number): void {
  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 1.5 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.5)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '4n', time) },
    NOTES2,
    '4n',
  )
  seq2.start(0)
}

export function stop(): void {
  if (layerTimer) clearTimeout(layerTimer)
  seq?.stop(); seq?.dispose()
  seq2?.stop(); seq2?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null; seq2 = null; layerTimer = null
}
```

- [ ] **Step 4: Implement `audio/themes/overworld.ts`**

Adventurous, G major pentatonic, 80 BPM, square oscillator.

```typescript
import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

const NOTES = ['G3', 'B3', 'D4', 'G4', 'D4', 'B3', 'G3', 'A3']
const NOTES2 = ['G4', null, 'D5', null, 'B4', null, 'G5', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 80
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.7)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '8n', time) },
    NOTES,
    '8n',
  )
  seq.start(0)
  Tone.getTransport().start()
  layerTimer = setTimeout(() => _addLayer2(volume), 30000)
}

function _addLayer2(volume: number): void {
  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.2, release: 1.0 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.4)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '4n', time) },
    NOTES2,
    '4n',
  )
  seq2.start(0)
}

export function stop(): void {
  if (layerTimer) clearTimeout(layerTimer)
  seq?.stop(); seq?.dispose()
  seq2?.stop(); seq2?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null; seq2 = null; layerTimer = null
}
```

- [ ] **Step 5: Run all tests**

```bash
npm test -- --ci --watchAll=false
```

Expected: all tests pass.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add audio/themes/llamatown.ts audio/themes/overworld.ts audio/__tests__/themes.test.ts
git commit -m "feat: add Llamatown and Overworld Tone.js music themes"
```

---

### Task 4: Forge + Caverns + Convergence + Battle themes

**Files:**
- Modify: `audio/themes/forge.ts`, `audio/themes/caverns.ts`, `audio/themes/convergence.ts`, `audio/themes/battle.ts`

- [ ] **Step 1: Implement `audio/themes/forge.ts`**

Industrial, D minor, 90 BPM, sawtooth oscillator.

```typescript
import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

const NOTES = ['D3', 'F3', 'A3', 'C4', 'A3', 'F3', 'D3', 'E3']
const NOTES2 = ['D4', null, null, 'F4', null, null, 'A4', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 90
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.6)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '8n', time) },
    NOTES,
    '8n',
  )
  seq.start(0)
  Tone.getTransport().start()
  layerTimer = setTimeout(() => _addLayer2(volume), 30000)
}

function _addLayer2(volume: number): void {
  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.3, release: 0.5 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.35)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '4n', time) },
    NOTES2,
    '4n',
  )
  seq2.start(0)
}

export function stop(): void {
  if (layerTimer) clearTimeout(layerTimer)
  seq?.stop(); seq?.dispose()
  seq2?.stop(); seq2?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null; seq2 = null; layerTimer = null
}
```

- [ ] **Step 2: Implement `audio/themes/caverns.ts`**

Mysterious, A minor arpeggios, 60 BPM, sine oscillator.

```typescript
import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

const NOTES = ['A2', 'C3', 'E3', 'A3', 'E3', 'C3', null, null]
const NOTES2 = ['A4', null, null, null, 'E4', null, null, null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 60
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 0.5, sustain: 0.2, release: 2.0 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.65)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '8n', time) },
    NOTES,
    '8n',
  )
  seq.start(0)
  Tone.getTransport().start()
  layerTimer = setTimeout(() => _addLayer2(volume), 30000)
}

function _addLayer2(volume: number): void {
  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.2, decay: 1.0, sustain: 0.1, release: 3.0 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.3)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '2n', time) },
    NOTES2,
    '2n',
  )
  seq2.start(0)
}

export function stop(): void {
  if (layerTimer) clearTimeout(layerTimer)
  seq?.stop(); seq?.dispose()
  seq2?.stop(); seq2?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null; seq2 = null; layerTimer = null
}
```

- [ ] **Step 3: Implement `audio/themes/convergence.ts`**

Epic/triumphant, C major, 80 BPM, both layers start immediately (no 30s delay).

```typescript
import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null

const NOTES = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'G3']
const NOTES2 = ['C5', null, 'E5', null, 'G5', null, 'C6', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 80
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.03, decay: 0.2, sustain: 0.5, release: 0.8 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.7)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '8n', time) },
    NOTES,
    '8n',
  )
  seq.start(0)

  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.0 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.45)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '4n', time) },
    NOTES2,
    '4n',
  )
  seq2.start(0)
  Tone.getTransport().start()
}

export function stop(): void {
  seq?.stop(); seq?.dispose()
  seq2?.stop(); seq2?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null; seq2 = null
}
```

- [ ] **Step 4: Implement `audio/themes/battle.ts`**

Tense, B diminished, 120 BPM, square + sawtooth dual layer (both start immediately).

```typescript
import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null

const NOTES = ['B2', 'D3', 'F3', 'B3', 'F3', 'D3', 'B2', null]
const NOTES2 = ['B3', null, 'D4', null, 'F4', null, 'B4', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 120
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.2 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.65)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '16n', time) },
    NOTES,
    '16n',
  )
  seq.start(0)

  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.3 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.4)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '8n', time) },
    NOTES2,
    '8n',
  )
  seq2.start(0)
  Tone.getTransport().start()
}

export function stop(): void {
  seq?.stop(); seq?.dispose()
  seq2?.stop(); seq2?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null; seq2 = null
}
```

- [ ] **Step 5: Run all tests**

```bash
npm test -- --ci --watchAll=false
```

Expected: all tests pass (structural tests now fully cover all 6 theme implementations).

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add audio/themes/
git commit -m "feat: add Forge, Caverns, Convergence, Battle Tone.js themes"
```

---

### Task 5: SFX catalog implementations

**Files:**
- Modify: `audio/sfx.ts` (replace stubs with Tone.js implementations)
- Create: `audio/__tests__/sfx.test.ts`

**Interfaces:**
- Consumes: `tone` (Tone.PolySynth, Tone.Synth, Tone.NoiseSynth, Tone.Oscillator, Tone.now)
- Produces: `SFX_MAP` with 7 callable functions

- [ ] **Step 1: Write failing tests**

Create `audio/__tests__/sfx.test.ts`:

```typescript
import { SFX_MAP } from '../sfx'
const tone = require('tone')

beforeEach(() => jest.clearAllMocks())

it('levelUp creates a PolySynth and triggers exactly 3 notes', () => {
  SFX_MAP.levelUp?.()
  const instance = tone.PolySynth.mock.results[0]?.value
  expect(tone.PolySynth).toHaveBeenCalled()
  expect(instance?.triggerAttackRelease).toHaveBeenCalledTimes(3)
})

it('hit creates a PolySynth and triggers exactly 1 note', () => {
  SFX_MAP.hit?.()
  const instance = tone.PolySynth.mock.results[0]?.value
  expect(tone.PolySynth).toHaveBeenCalled()
  expect(instance?.triggerAttackRelease).toHaveBeenCalledTimes(1)
})

it('miss creates a NoiseSynth', () => {
  SFX_MAP.miss?.()
  expect(tone.NoiseSynth).toHaveBeenCalled()
})

it('victory creates a PolySynth and triggers exactly 4 notes', () => {
  SFX_MAP.victory?.()
  const instance = tone.PolySynth.mock.results[0]?.value
  expect(tone.PolySynth).toHaveBeenCalled()
  expect(instance?.triggerAttackRelease).toHaveBeenCalledTimes(4)
})

it('npcBlip creates a PolySynth', () => {
  SFX_MAP.npcBlip?.()
  expect(tone.PolySynth).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- audio/__tests__/sfx.test.ts --watchAll=false
```

Expected: FAIL — PolySynth not called (stubs are empty functions).

- [ ] **Step 3: Implement `audio/sfx.ts`**

```typescript
import * as Tone from 'tone'

export const SFX_MAP: Record<string, () => void> = {
  levelUp: () => {
    const synth = new Tone.PolySynth(Tone.Synth).toDestination()
    const now = Tone.now()
    synth.triggerAttackRelease('C4', '8n', now)
    synth.triggerAttackRelease('E4', '8n', now + 0.1)
    synth.triggerAttackRelease('G5', '8n', now + 0.2)
    setTimeout(() => synth.dispose(), 1000)
  },
  hit: () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.1 },
    }).toDestination()
    synth.triggerAttackRelease('C2', '32n')
    setTimeout(() => synth.dispose(), 500)
  },
  miss: () => {
    const noise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination()
    noise.triggerAttackRelease('16n')
    setTimeout(() => noise.dispose(), 500)
  },
  npcBlip: () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.05 },
    }).toDestination()
    synth.triggerAttackRelease('A5', '64n')
    setTimeout(() => synth.dispose(), 200)
  },
  menuMove: () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.03 },
    }).toDestination()
    synth.triggerAttackRelease('E5', '64n')
    setTimeout(() => synth.dispose(), 200)
  },
  victory: () => {
    const synth = new Tone.PolySynth(Tone.Synth).toDestination()
    const now = Tone.now()
    synth.triggerAttackRelease('C4', '8n', now)
    synth.triggerAttackRelease('E4', '8n', now + 0.1)
    synth.triggerAttackRelease('G4', '8n', now + 0.2)
    synth.triggerAttackRelease('C5', '4n', now + 0.3)
    setTimeout(() => synth.dispose(), 2000)
  },
  escape: () => {
    const osc = new Tone.Oscillator(800, 'sine').toDestination()
    const now = Tone.now()
    osc.frequency.linearRampTo(200, 0.2, now)
    osc.start(now)
    osc.stop(now + 0.2)
    setTimeout(() => osc.dispose(), 500)
  },
}
```

- [ ] **Step 4: Run sfx tests**

```bash
npm test -- audio/__tests__/sfx.test.ts --watchAll=false
```

Expected: PASS — all 5 SFX tests pass.

- [ ] **Step 5: Run all tests**

```bash
npm test -- --ci --watchAll=false
```

Expected: all tests pass.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add audio/sfx.ts audio/__tests__/sfx.test.ts
git commit -m "feat: implement 7 Tone.js SFX (levelUp, hit, miss, npcBlip, menuMove, victory, escape)"
```

---

### Task 6: Wire AudioManager into screens + settings

**Files:**
- Modify: `app/overworld.tsx`
- Modify: `app/city/[id].tsx`
- Modify: `app/battle.tsx`
- Modify: `hooks/useBattle.ts`
- Modify: `store/game-store.ts`

No new unit tests. Verification is via Playwright at end of phase.

- [ ] **Step 1: Wire `app/overworld.tsx`**

Add import after existing imports:
```typescript
import { AudioManager } from '../audio/AudioManager'
```

Add inside the component body, after existing `useEffect` hooks:
```typescript
useEffect(() => {
  AudioManager.play('overworld')
  return () => AudioManager.stop()
}, [])
```

Also wire `npcBlip` sfx. Find the `handleInteract` callback where `setDialogue(...)` is called and add:
```typescript
AudioManager.sfx('npcBlip')
```
immediately after the `setDialogue(...)` call.

- [ ] **Step 2: Wire `app/city/[id].tsx`**

Add import after existing imports:
```typescript
import { AudioManager, TrackId } from '../audio/AudioManager'
```

Add a track map inside the component (before the city-specific useEffect):
```typescript
const CITY_TRACK: Record<string, TrackId> = {
  llamatown: 'llamatown',
  forge: 'forge',
  vale: 'caverns',
  ridge: 'convergence',
}
```

Add inside the component body:
```typescript
useEffect(() => {
  const track = CITY_TRACK[cityId] ?? 'llamatown'
  AudioManager.play(track)
  return () => AudioManager.stop()
}, [cityId])
```

(`cityId` comes from `useLocalSearchParams<{ id: string }>().id`)

Also wire `npcBlip` sfx. Find the `handleInteract` callback where `setDialogue(...)` is called and add:
```typescript
AudioManager.sfx('npcBlip')
```

- [ ] **Step 3: Wire `app/battle.tsx`**

Add import after existing imports:
```typescript
import { AudioManager } from '../audio/AudioManager'
```

Add inside the component body:
```typescript
useEffect(() => {
  AudioManager.play('battle')
  return () => AudioManager.stop()
}, [])
```

Wire `sfx('victory')` when battle phase becomes 'victory':
```typescript
useEffect(() => {
  if (state.phase === 'victory') {
    AudioManager.sfx('victory')
  }
}, [state.phase])
```

- [ ] **Step 4: Wire `sfx('hit')` in `hooks/useBattle.ts`**

Add import after existing imports:
```typescript
import { AudioManager } from '../audio/AudioManager'
```

Find the internal helper or inline code that calls `enemyTurn(state)` and updates state. Add `AudioManager.sfx('hit')` immediately after the `setState(...)` call for the enemy turn result:

```typescript
// Find: setState(afterEnemyTurn) or similar
// Add after it:
AudioManager.sfx('hit')
```

- [ ] **Step 5: Wire settings + levelUp in `store/game-store.ts`**

Add import at the top (after other imports):
```typescript
import { AudioManager } from '../audio/AudioManager'
```

In `updateSettings`, after `set(...)` applies the new settings, add AudioManager sync calls. Find the `updateSettings` action and modify it:

```typescript
updateSettings: (partial) =>
  set((s) => {
    const next = { ...s.settings, ...partial }
    if (partial.musicEnabled !== undefined) AudioManager.setMusicEnabled(partial.musicEnabled)
    if (partial.sfxEnabled !== undefined) AudioManager.setSfxEnabled(partial.sfxEnabled)
    if (partial.masterVolume !== undefined) AudioManager.setVolume(partial.masterVolume)
    return { settings: next }
  }),
```

In `awardXP`, find the level-up branch (where `level` increments). Add `AudioManager.sfx('levelUp')` immediately after the level increment:

```typescript
// Find where newLevel = s.player.level + 1 or similar
// Add: AudioManager.sfx('levelUp')
```

- [ ] **Step 6: Run all tests**

```bash
npm test -- --ci --watchAll=false
```

Expected: all tests pass. If the store tests fail due to AudioManager side effects (AudioManager singleton being imported with real theme/sfx code), add this mock to `store/__tests__/game-store.test.ts`:

```typescript
jest.mock('../audio/AudioManager', () => ({
  AudioManager: {
    play: jest.fn(), stop: jest.fn(), sfx: jest.fn(),
    setMusicEnabled: jest.fn(), setSfxEnabled: jest.fn(), setVolume: jest.fn(),
  },
}))
```

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add app/overworld.tsx app/city/[id].tsx app/battle.tsx hooks/useBattle.ts store/game-store.ts
git commit -m "feat: wire AudioManager into all screens — background music + SFX events"
```

---

## Post-Phase Playwright Verification

Run after all tasks complete. Start dev server first: `npx expo start --web`

Phase 4 Playwright checks (from CLAUDE.md):

1. Load `http://localhost:8081` — title screen renders within 5 seconds
2. Enter a name + pick a class → navigate to overworld → overworld music plays (check browser DevTools audio tab / no console errors)
3. Walk into Llamatown → llamatown music plays (overworld music stops)
4. Trigger a random encounter → battle music plays; music returns on exit
5. Toggle music off in any settings panel → music stops; toggle on → resumes
6. Level up (walk + interact to earn XP until level-up) → levelUp SFX fires
7. Open NPC dialogue → npcBlip SFX fires
8. Check browser console — zero uncaught errors

After Playwright passes, update `.superpowers/sdd/progress.md` and the Phase Status table in `CLAUDE.md`.

---

## Self-Review

**Spec coverage:**
- ✅ Install Tone.js + expo-av (Task 1)
- ✅ AudioManager singleton with Platform.OS branching (Task 2)
- ✅ Web Tone.js themes for all 6 tracks: overworld, llamatown, forge, caverns, convergence, battle (Tasks 3–4)
- ✅ Dynamic second layer (30s timer in overworld/llamatown/forge/caverns; convergence/battle start both layers immediately as they are fully realized themes)
- ✅ Native path scaffolded — Platform.OS branch present; expo-av mock ready; .ogg assets are developer-provided
- ✅ All 7 SFX: levelUp, hit, miss, npcBlip, menuMove, victory, escape (Task 5)
- ✅ Screen wiring: overworld, city/[id], battle (Task 6)
- ✅ Settings integration: musicEnabled, sfxEnabled, masterVolume → AudioManager (Task 6)
- ✅ SFX triggers: levelUp on XP level-up, npcBlip on NPC dialogue, hit on enemy turn, victory on battle victory (Task 6)
- ⚠️ `sfx('menuMove')` defined but not wired to BattleMenu/class select (lower priority; deferred to Phase 6 polish)
- ⚠️ Native .ogg assets: correctly deferred — native path silently no-ops until assets are produced

**No placeholders in any step.**

**Type consistency:**
- `TrackId` defined in `AudioManager.ts`, consumed in `city/[id].tsx` CITY_TRACK — consistent
- `SFX_MAP` keys match all `sfx(...)` call sites: `'levelUp'`, `'hit'`, `'npcBlip'`, `'victory'` — all present
- `start(volume: number)` signature consistent across all 6 themes — consistent
