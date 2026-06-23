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

