# Phase 6 — Mobile Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add touch D-pad, safe area handling, haptic feedback, performance optimizations, and app store metadata so Llama Quest is production-ready for iOS/Android.

**Architecture:** Five independent tasks — each self-contained. Safe area (Task 1) and TouchDpad (Task 2) both touch the game screens; apply safe area first so the D-pad automatically sits within insets. Haptics (Task 3) touches the store, a hook, and two screens. Performance (Task 4) is a single file change. App store metadata (Task 5) is config-only.

**Tech Stack:** `expo-safe-area-context` (already installed via expo-router), `expo-haptics` (new install), React Native `Pressable`, `useMemo`, `useCallback`.

## Global Constraints

- **Expo SDK 52** managed workflow; no ejecting
- **TypeScript strict** with `noUncheckedIndexedAccess: true`; all array/object index access uses `??` fallback
- **`--legacy-peer-deps`** required for all `npm install` calls; Expo-native packages use `npx expo install` (no flag)
- **No arbitrary colors** — pull from the established palette (`#0d0d1a`, `#1a1a2e`, `#c0a060`, `#f5c518`, `#7ec8e3`, `#ece9ff`, `#4caf50`, `#f44336`, `#a06bff`, `#4fe0cf`)
- **TDD**: write failing test → implement minimal code → confirm green → commit
- **`Record<string, boolean>`** for all progression tracking (not `Set<string>`)
- **Constants**: `TILE_SIZE = 32`, `PLAYER_SPEED = 4` tiles/sec, `MAX_DT = 0.05`
- **Save key** `'llama_quest_v1'` — never change

---

### Task 1: Safe Area Integration

**Files:**
- Create: `components/SafeAreaWrapper.tsx`
- Create: `__mocks__/react-native-safe-area-context.js` (Jest mock)
- Modify: `app/_layout.tsx` — add `SafeAreaProvider` around `GestureHandlerRootView`
- Modify: `app/overworld.tsx` — replace root `<View style={styles.screen}>` with `<SafeAreaWrapper style={styles.screen}>`
- Modify: `app/city/[id].tsx` — same replacement
- Modify: `app/battle.tsx` — same replacement
- Modify: `app/building/[id].tsx` — same replacement
- Modify: `app/sandbox/[id].tsx` — same replacement
- Test: `components/__tests__/SafeAreaWrapper.test.tsx`

**Interfaces:**
- Produces: `SafeAreaWrapper({ children, style? })` — applies `paddingTop: insets.top, paddingBottom: insets.bottom` to a flex-1 View; exported named from `components/SafeAreaWrapper.tsx`

- [ ] **Step 1: Verify package is installed**

```bash
npx expo install expo-safe-area-context
```

Expected: Either installs or prints "already installed". `react-native-safe-area-context` is the underlying package already present from expo-router.

- [ ] **Step 2: Create Jest mock for safe-area-context**

The Jest Expo preset does not auto-mock `react-native-safe-area-context`. Create the manual mock so component tests don't fail:

Create `__mocks__/react-native-safe-area-context.js`:
```js
const React = require('react')
module.exports = {
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}
```

- [ ] **Step 3: Write the failing test**

Create `components/__tests__/SafeAreaWrapper.test.tsx`:
```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { SafeAreaWrapper } from '../SafeAreaWrapper'

describe('SafeAreaWrapper', () => {
  it('renders children', () => {
    const { getByText } = render(
      <SafeAreaWrapper>
        <Text>hello</Text>
      </SafeAreaWrapper>
    )
    expect(getByText('hello')).toBeTruthy()
  })

  it('applies inset padding from useSafeAreaInsets', () => {
    const { getByTestId } = render(
      <SafeAreaWrapper testID="wrapper">
        <Text>child</Text>
      </SafeAreaWrapper>
    )
    const wrapper = getByTestId('wrapper')
    // Mock returns top:44, bottom:34
    expect(wrapper.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingTop: 44, paddingBottom: 34 }),
      ])
    )
  })
})
```

- [ ] **Step 4: Run test to confirm it fails**

```bash
npm test -- components/__tests__/SafeAreaWrapper.test.tsx --watchAll=false
```

Expected: FAIL — `Cannot find module '../SafeAreaWrapper'`

- [ ] **Step 5: Create `components/SafeAreaWrapper.tsx`**

```tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  children: React.ReactNode
  style?: object
  testID?: string
}

export function SafeAreaWrapper({ children, style, testID }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View
      testID={testID}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
```

- [ ] **Step 6: Run test to confirm it passes**

```bash
npm test -- components/__tests__/SafeAreaWrapper.test.tsx --watchAll=false
```

Expected: PASS (2 tests)

- [ ] **Step 7: Add `SafeAreaProvider` to `app/_layout.tsx`**

Current `_layout.tsx` wraps everything in `GestureHandlerRootView`. Add `SafeAreaProvider` inside it:

```tsx
import { useEffect, useState } from 'react'
import { Platform, View, Text, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'

export default function RootLayout() {
  const [skiaReady, setSkiaReady] = useState(Platform.OS !== 'web')

  useEffect(() => {
    if (Platform.OS !== 'web') return
    import('@shopify/react-native-skia/lib/module/web/LoadSkiaWeb').then(
      ({ LoadSkiaWeb }) => LoadSkiaWeb().then(() => setSkiaReady(true)),
    )
  }, [])

  if (!skiaReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  loading: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 14 },
})
```

- [ ] **Step 8: Apply SafeAreaWrapper to `app/overworld.tsx`**

Add import, replace root View:

```tsx
// Add import at top:
import { SafeAreaWrapper } from '../components/SafeAreaWrapper'

// Replace:
//   <View style={styles.screen}>
// With:
//   <SafeAreaWrapper style={styles.screen}>
// And close tag:
//   </SafeAreaWrapper>

// Remove `backgroundColor` from styles.screen (SafeAreaWrapper's container handles flex:1; screen background still shows through):
// Keep styles.screen as-is (backgroundColor: '#0d0d1a' still applies via style prop)
```

Full replacement in `app/overworld.tsx` — find the return statement and change it:
```tsx
  return (
    <SafeAreaWrapper style={styles.screen}>
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
    </SafeAreaWrapper>
  )
```

Add the import: `import { SafeAreaWrapper } from '../components/SafeAreaWrapper'`

- [ ] **Step 9: Apply SafeAreaWrapper to `app/city/[id].tsx`**

Add import: `import { SafeAreaWrapper } from '../../components/SafeAreaWrapper'`

Replace root `<View style={styles.screen}>` with `<SafeAreaWrapper style={styles.screen}>` and closing `</View>` with `</SafeAreaWrapper>`.

Full return statement:
```tsx
  return (
    <SafeAreaWrapper style={styles.screen}>
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
    </SafeAreaWrapper>
  )
```

- [ ] **Step 10: Apply SafeAreaWrapper to `app/battle.tsx`**

Add import: `import { SafeAreaWrapper } from '../components/SafeAreaWrapper'`

Replace root `<View style={styles.screen}>` with `<SafeAreaWrapper style={styles.screen}>` and closing tag.

- [ ] **Step 11: Apply SafeAreaWrapper to `app/building/[id].tsx`**

Add import: `import { SafeAreaWrapper } from '../../components/SafeAreaWrapper'`

Replace root `<View style={styles.screen}>` with `<SafeAreaWrapper style={styles.screen}>` and closing tag.

- [ ] **Step 12: Apply SafeAreaWrapper to `app/sandbox/[id].tsx`**

Add import: `import { SafeAreaWrapper } from '../../components/SafeAreaWrapper'`

Replace root `<View style={styles.screen}>` with `<SafeAreaWrapper style={styles.screen}>` and closing tag.

- [ ] **Step 13: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All existing tests pass (81+), plus the 2 new SafeAreaWrapper tests.

- [ ] **Step 14: Commit**

```bash
git add components/SafeAreaWrapper.tsx components/__tests__/SafeAreaWrapper.test.tsx __mocks__/react-native-safe-area-context.js app/_layout.tsx app/overworld.tsx "app/city/[id].tsx" app/battle.tsx "app/building/[id].tsx" "app/sandbox/[id].tsx"
git commit -m "feat: safe area integration — SafeAreaWrapper + SafeAreaProvider across all screens"
```

---

### Task 2: TouchDpad Component

**Files:**
- Create: `components/TouchDpad.tsx`
- Create: `components/__tests__/TouchDpad.test.tsx`
- Modify: `app/overworld.tsx` — render `<TouchDpad>` inside safe area
- Modify: `app/city/[id].tsx` — render `<TouchDpad>` inside safe area

**Interfaces:**
- Consumes: `InputState` ref from `usePlayerInput()`, `handleInteract` function already in both screens
- Produces: `TouchDpad({ onInput, onInteract })` — renders null on web; 5-button D-pad on native; calls `onInput(dx, dy)` on pressIn, `onInput(0, 0)` on pressOut

> **Note:** `hooks/usePlayerInput.ts` does NOT need modification. The D-pad calls `onInput` which directly mutates `input.current.dx/dy`. The keyboard listener in the hook only runs on web (guarded by `if (Platform.OS !== 'web') return`), so there is no conflict.

- [ ] **Step 1: Create Jest mock for expo-haptics (needed by later tasks, add now)**

Create `__mocks__/expo-haptics.js`:
```js
module.exports = {
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}
```

- [ ] **Step 2: Write the failing test**

Create `components/__tests__/TouchDpad.test.tsx`:
```tsx
import React from 'react'
import { Platform } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { TouchDpad } from '../TouchDpad'

describe('TouchDpad', () => {
  const onInput = jest.fn()
  const onInteract = jest.fn()

  beforeEach(() => {
    onInput.mockClear()
    onInteract.mockClear()
  })

  it('returns null on web', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true })
    const { toJSON } = render(<TouchDpad onInput={onInput} onInteract={onInteract} />)
    expect(toJSON()).toBeNull()
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
  })

  it('renders 5 buttons on non-web', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { getAllByRole } = render(<TouchDpad onInput={onInput} onInteract={onInteract} />)
    // 4 direction buttons + 1 interact button
    expect(getAllByRole('button').length).toBe(5)
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
  })

  it('calls onInput(0, -1) when up pressed, onInput(0, 0) when released', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { getByTestId } = render(<TouchDpad onInput={onInput} onInteract={onInteract} />)
    fireEvent(getByTestId('dpad-up'), 'pressIn')
    expect(onInput).toHaveBeenCalledWith(0, -1)
    fireEvent(getByTestId('dpad-up'), 'pressOut')
    expect(onInput).toHaveBeenCalledWith(0, 0)
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
  })

  it('calls onInteract when center button pressed', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { getByTestId } = render(<TouchDpad onInput={onInput} onInteract={onInteract} />)
    fireEvent.press(getByTestId('dpad-interact'))
    expect(onInteract).toHaveBeenCalledTimes(1)
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
npm test -- components/__tests__/TouchDpad.test.tsx --watchAll=false
```

Expected: FAIL — `Cannot find module '../TouchDpad'`

- [ ] **Step 4: Create `components/TouchDpad.tsx`**

```tsx
import React from 'react'
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native'

interface TouchDpadProps {
  onInput: (dx: number, dy: number) => void
  onInteract: () => void
}

export function TouchDpad({ onInput, onInteract }: TouchDpadProps): React.ReactElement | null {
  if (Platform.OS === 'web') return null

  return (
    <View style={styles.container} accessibilityLabel="D-pad controls">
      {/* Up row */}
      <View style={styles.row}>
        <Pressable
          testID="dpad-up"
          accessibilityRole="button"
          style={styles.btn}
          onPressIn={() => onInput(0, -1)}
          onPressOut={() => onInput(0, 0)}
        >
          <Text style={styles.btnText}>▲</Text>
        </Pressable>
      </View>

      {/* Middle row: left, interact, right */}
      <View style={styles.row}>
        <Pressable
          testID="dpad-left"
          accessibilityRole="button"
          style={styles.btn}
          onPressIn={() => onInput(-1, 0)}
          onPressOut={() => onInput(0, 0)}
        >
          <Text style={styles.btnText}>◀</Text>
        </Pressable>

        <Pressable
          testID="dpad-interact"
          accessibilityRole="button"
          style={[styles.btn, styles.interactBtn]}
          onPress={onInteract}
        >
          <Text style={styles.btnText}>E</Text>
        </Pressable>

        <Pressable
          testID="dpad-right"
          accessibilityRole="button"
          style={styles.btn}
          onPressIn={() => onInput(1, 0)}
          onPressOut={() => onInput(0, 0)}
        >
          <Text style={styles.btnText}>▶</Text>
        </Pressable>
      </View>

      {/* Down row */}
      <View style={styles.row}>
        <Pressable
          testID="dpad-down"
          accessibilityRole="button"
          style={styles.btn}
          onPressIn={() => onInput(0, 1)}
          onPressOut={() => onInput(0, 0)}
        >
          <Text style={styles.btnText}>▼</Text>
        </Pressable>
      </View>
    </View>
  )
}

const BTN_SIZE = 64
const GAP = 8

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 100,
    gap: GAP,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    justifyContent: 'center',
  },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactBtn: {
    backgroundColor: 'rgba(192,160,96,0.25)',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'monospace',
  },
})
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npm test -- components/__tests__/TouchDpad.test.tsx --watchAll=false
```

Expected: PASS (4 tests)

- [ ] **Step 6: Integrate TouchDpad into `app/overworld.tsx`**

Add import and render inside the SafeAreaWrapper (after HUD, before interact prompt):

```tsx
// Add import:
import { TouchDpad } from '../components/TouchDpad'

// In the return statement, add after <HUD />:
      <TouchDpad
        onInput={(dx, dy) => { input.current!.dx = dx; input.current!.dy = dy }}
        onInteract={handleInteract}
      />
```

The full return becomes:
```tsx
  return (
    <SafeAreaWrapper style={styles.screen}>
      <WorldRenderer
        grid={OVERWORLD.grid}
        player={playerState}
        entities={OVERWORLD.entities}
        tileSize={TILE_SIZE}
        screenWidth={width}
        screenHeight={height}
      />
      <HUD />
      <TouchDpad
        onInput={(dx, dy) => { input.current!.dx = dx; input.current!.dy = dy }}
        onInteract={handleInteract}
      />
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
    </SafeAreaWrapper>
  )
```

- [ ] **Step 7: Integrate TouchDpad into `app/city/[id].tsx`**

Add import: `import { TouchDpad } from '../../components/TouchDpad'`

Add after `<HUD />` in return:
```tsx
      <TouchDpad
        onInput={(dx, dy) => { input.current!.dx = dx; input.current!.dy = dy }}
        onInteract={handleInteract}
      />
```

- [ ] **Step 8: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add components/TouchDpad.tsx components/__tests__/TouchDpad.test.tsx __mocks__/expo-haptics.js app/overworld.tsx "app/city/[id].tsx"
git commit -m "feat: TouchDpad component — virtual D-pad for iOS/Android, null on web"
```

---

### Task 3: Haptics Integration

**Files:**
- Modify: `store/game-store.ts` — haptic on level-up in `awardXP`
- Modify: `hooks/useBattle.ts` — haptic on hit received (enemy-turn-end)
- Modify: `app/city/[id].tsx` — haptic on NPC dialogue open
- Modify: `components/BattleMenu.tsx` — haptic on each menu button press
- Modify: `app/index.tsx` — haptic on class selection
- Test: `store/__tests__/game-store.test.ts` — verify haptic called on level-up

**Interfaces:**
- Consumes: `expo-haptics` — `notificationAsync`, `impactAsync`, `selectionAsync`
- All haptic calls wrapped in `if (Platform.OS !== 'web')` guards

- [ ] **Step 1: Install expo-haptics**

```bash
npx expo install expo-haptics
```

Expected: Package installed. No `--legacy-peer-deps` needed (Expo-native package).

- [ ] **Step 2: Write failing test for level-up haptic in game-store**

Open `store/__tests__/game-store.test.ts`. Add a new test at the end of the file:

```typescript
import * as Haptics from 'expo-haptics'

describe('awardXP haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store to fresh state
    useGameStore.setState({
      player: { name: 'Test', class: 'Tinkerer', hp: 60, maxHp: 60, level: 1, xp: 0 },
      progression: {
        currentCity: 'overworld',
        position: { x: 5, y: 5 },
        masteredConcepts: {},
        readLessons: {},
        metNPCs: {},
        completedSandboxes: {},
        defeatedBosses: {},
      },
      settings: { musicEnabled: true, sfxEnabled: true, masterVolume: 0.8 },
    })
  })

  it('calls Haptics.notificationAsync on level-up', () => {
    useGameStore.getState().awardXP(120) // exactly one level
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    )
  })

  it('does not call Haptics.notificationAsync for XP that does not trigger level-up', () => {
    useGameStore.getState().awardXP(10)
    expect(Haptics.notificationAsync).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
npm test -- store/__tests__/game-store.test.ts --watchAll=false
```

Expected: FAIL — `Haptics.notificationAsync` not called.

- [ ] **Step 4: Wire level-up haptic in `store/game-store.ts`**

Add import at top:
```typescript
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
```

In `awardXP`, inside the `while (xp >= XP_PER_LEVEL)` block, add haptic after `AudioManager.sfx('levelUp')`:
```typescript
      awardXP: (amount) =>
        set((state) => {
          let { xp, level, hp, maxHp } = state.player
          xp += amount
          while (xp >= XP_PER_LEVEL) {
            xp -= XP_PER_LEVEL
            level++
            maxHp += 5
            hp = maxHp
            AudioManager.sfx('levelUp')
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            }
          }
          return { player: { ...state.player, xp, level, hp, maxHp } }
        }),
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npm test -- store/__tests__/game-store.test.ts --watchAll=false
```

Expected: All store tests pass including the 2 new haptic tests.

- [ ] **Step 6: Wire hit haptic in `hooks/useBattle.ts`**

The hit sfx fires in the `useEffect` that watches `state.phase` transition from `enemy-turn`. Add haptic there:

```typescript
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

  // In the phase-transition useEffect:
  useEffect(() => {
    if (prevPhaseRef.current === 'enemy-turn' && state.phase !== 'enemy-turn') {
      AudioManager.sfx('hit')
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      }
    }
    prevPhaseRef.current = state.phase
  }, [state.phase])
```

- [ ] **Step 7: Wire dialogue-open haptic in `app/city/[id].tsx`**

Add imports:
```typescript
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
```

In `handleInteract`, in the `if (nearbyEntity.type === 'npc')` branch, add after `markNPCMet`:
```typescript
    if (nearbyEntity.type === 'npc') {
      const lines = nearbyEntity.data['lines'] as string[]
      const name = nearbyEntity.data['name'] as string
      markNPCMet(nearbyEntity.id)
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      setDialogue({ lines, speaker: name })
      AudioManager.sfx('npcBlip')
    }
```

- [ ] **Step 8: Wire menu-select haptic in `components/BattleMenu.tsx`**

Add imports:
```typescript
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
```

Wrap each `onPress` handler with a haptic call. Replace the component body:

```tsx
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
        <Text style={styles.btnText}>⚡ PSI</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.guard, disabled && styles.disabled]}
        onPress={() => withHaptic(onGuard)}
        disabled={disabled}
      >
        <Text style={styles.btnText}>🛡 Guard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.run, disabled && styles.disabled]}
        onPress={() => withHaptic(onRun)}
        disabled={disabled}
      >
        <Text style={styles.btnText}>💨 Run</Text>
      </TouchableOpacity>
    </View>
  )
}
```

- [ ] **Step 9: Wire class-select haptic in `app/index.tsx`**

Add imports:
```typescript
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
```

In the class selection `onPress` handler, add haptic:
```tsx
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync()
            setCls(c.id)
          }}
```

- [ ] **Step 10: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 11: Commit**

```bash
git add store/game-store.ts hooks/useBattle.ts "app/city/[id].tsx" components/BattleMenu.tsx app/index.tsx
git commit -m "feat: haptic feedback — level-up, hit received, NPC dialogue, menu selection"
```

---

### Task 4: Performance Pass

**Files:**
- Modify: `app/city/[id].tsx` — move `CITY_TRACK` constant to module scope (was inside component function, re-created every render)
- Verify: `renderer/WorldRenderer.tsx` — confirm `useMemo` covers camera and entity list (already present, no change needed)

**Interfaces:**
- No new exports. This task has no unit tests — changes are provably correct by inspection (moving a constant out of a function body cannot break behavior) and verified by TypeScript.

- [ ] **Step 1: Move `CITY_TRACK` to module scope in `app/city/[id].tsx`**

Currently `CITY_TRACK` is declared inside `CityScreen()` — it's re-created on every render. Move it to module scope, above the component function, alongside `CITY_ACT`:

```typescript
// After the CITY_ACT declaration (line ~19), add:
const CITY_TRACK: Record<string, TrackId> = {
  llamatown: 'llamatown',
  forge: 'forge',
  vale: 'caverns',
  ridge: 'convergence',
}
```

Remove the `const CITY_TRACK` block from inside `CityScreen`. The `useEffect` that uses it remains unchanged.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add "app/city/[id].tsx"
git commit -m "perf: move CITY_TRACK to module scope in city screen"
```

---

### Task 5: App Store Assets & Metadata

**Files:**
- Modify: `app.json` — add `description`, `android.package`, `ios.bundleIdentifier`, add `expo-haptics` to plugins

**Interfaces:**
- No code changes. Verified by `npx expo-doctor` producing 0 errors and `npx expo export --platform web` succeeding.

- [ ] **Step 1: Update `app.json`**

Replace the contents of `app.json` with:

```json
{
  "expo": {
    "name": "Llama Quest",
    "slug": "llama-quest",
    "version": "1.0.0",
    "description": "An Earthbound-style RPG that teaches local AI fundamentals: Ollama, ChromaDB, and RAG through city exploration, turn-based battles, and hands-on sandbox labs.",
    "scheme": "llama-quest",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "ios": {
      "bundleIdentifier": "com.llamaquest.app"
    },
    "android": {
      "package": "com.llamaquest.app"
    },
    "plugins": [
      "expo-router",
      "expo-av",
      "expo-haptics"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 2: Run expo-doctor**

```bash
npx expo-doctor
```

Expected: 0 errors. If warnings appear about missing icon/splash assets, note them — assets were set up in Phase 1. If `expo-doctor` reports a missing icon at `assets/icon.png`, verify:

```bash
ls assets/
```

The scaffold created `icon.png` and `splash-icon.png` in `assets/`. If missing, create placeholder 1024×1024 images or copy the favicon as a temporary stand-in (document in progress.md if assets need professional replacement).

- [ ] **Step 3: Run web export**

```bash
npx expo export --platform web
```

Expected: Build succeeds, outputs to `dist/` folder. Zero errors. (Warnings about source maps or bundle size are acceptable.)

If the command errors with "unknown flag", try:
```bash
npx expo export:web
```

- [ ] **Step 4: Run full test suite to confirm no regressions**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add app.json
git commit -m "chore: app store metadata — description, bundle IDs, expo-haptics plugin"
```

---

### Task 6: Playwright End-of-Phase Verification

**Goal:** Confirm all Phase 6 features work in the real web app and no regressions exist from previous phases.

- [ ] **Step 1: Start the dev server**

```bash
npx expo start --web
```

Wait for the Metro bundler to complete. Leave it running.

- [ ] **Step 2: Open browser at http://localhost:8081 — verify title screen**

Using Playwright MCP tools:
- Navigate to `http://localhost:8081`
- Confirm title screen renders within 5 seconds
- Confirm "LLAMA QUEST" heading and class selection buttons are visible

- [ ] **Step 3: Golden path — enter name, pick class, navigate to overworld**

- Fill in a player name
- Select a class (verify Haptics.selectionAsync would fire on native — no web haptic, that's correct)
- Press START GAME
- Confirm overworld loads with HUD

- [ ] **Step 4: Verify safe area on narrow viewport**

Resize browser to 375×812 (iPhone SE dimensions):
- Confirm no content clipped by status bar (top padding from SafeAreaWrapper)
- Confirm HUD and interact prompts visible
- Confirm no visual overflow

- [ ] **Step 5: Verify D-pad is null on web**

Confirm the TouchDpad does NOT render on web (correct — Platform.OS === 'web' returns null). The keyboard WASD controls should still work.

- [ ] **Step 6: Walk player, enter Llamatown, verify city and NPC**

- Walk into Llamatown entrance
- Confirm city screen loads
- Walk to Llama Elder NPC, press E to talk
- Confirm dialogue box opens with correct text

- [ ] **Step 7: Verify library and sandbox**

- Enter Llamatown library
- Open a lesson (confirm Codex renders)
- Go back, find sandbox portal
- Confirm Terminal opens

- [ ] **Step 8: Trigger a battle**

- Walk around until random encounter triggers
- Confirm battle screen renders with HP bars and menu
- Use Guard action, confirm enemy turn
- Run from battle, confirm return to city/overworld

- [ ] **Step 9: Check browser console**

After the full golden path, open DevTools console. Expected: 0 uncaught errors. AudioContext warnings about user gesture are acceptable and pre-existing.

- [ ] **Step 10: Update progress.md**

Open `.superpowers/sdd/progress.md` and add Phase 6 section:

```markdown
## Phase 6 — Mobile Polish ✅ Complete

Plan: docs/superpowers/plans/2026-06-19-llama-quest-phase6-mobile-polish.md

| Task | Status | Commits | Notes |
|------|--------|---------|-------|
| 1: Safe area integration | complete | <commit> | review clean |
| 2: TouchDpad component | complete | <commit> | review clean |
| 3: Haptics integration | complete | <commit> | review clean |
| 4: Performance pass | complete | <commit> | review clean |
| 5: App store metadata | complete | <commit> | review clean |
| Playwright end-of-phase | complete | — | <results> |
```

- [ ] **Step 11: Update CLAUDE.md Phase Status table**

In `CLAUDE.md`, update the Phase Status table:
```
| 6 — Mobile Polish | ✅ Complete | `docs/superpowers/plans/2026-06-19-llama-quest-phase6-mobile-polish.md` |
```

Also update the **Last updated** line at the bottom of CLAUDE.md:
```
**Last updated**: 2026-06-19 · Phase 6 complete · All phases done
```

- [ ] **Step 12: Final commit**

```bash
git add .superpowers/sdd/progress.md CLAUDE.md
git commit -m "chore: record Phase 6 Playwright results and mark complete"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Safe area — SafeAreaWrapper + SafeAreaProvider + applied to all 5 screens
- [x] TouchDpad — 5-button layout, platform-conditional, D-pad integration in overworld + city
- [x] Haptics — level-up (store), hit received (useBattle), NPC dialogue (city screen), menu buttons (BattleMenu + title class select)
- [x] Performance — CITY_TRACK moved to module scope; WorldRenderer useMemo already present
- [x] App store — description, android.package, ios.bundleIdentifier, expo-haptics plugin
- [x] expo-doctor + web export verification

**Spec items noted but intentionally not implemented (YAGNI):**
- Overworld haptic on NPC dialogue: overworld has no NPC entities (only building entrances); haptic added where dialogue actually fires (city screen only)
- `usePlayerInput` modification: not needed — D-pad mutates the ref directly, which is simpler and correct
- DialogueBox typewriter replacement: current setInterval approach works fine; replacing with useAnimatedValue is premature optimization
- "Profile with React Native DevTools / measure FPS": cannot be done in unit tests; covered by Playwright visual verification
