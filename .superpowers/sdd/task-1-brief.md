# Task 1 Brief: Expo Project Scaffold + GitHub Setup

## Context
You are building Llama Quest — an Earthbound-style SNES RPG learning game built in Expo (React Native + Web). This is Task 1 of 14: scaffold the entire project foundation so every subsequent task has a working repo to build in.

The working directory is: `C:\Users\schneider.bertrand\Documents\Learning\My learning Apps\Llama Quest`

This directory already contains:
- `localhost-quest.html` (original single-file game — do NOT delete it, it's content source)
- `CLAUDE.md`
- `docs/` folder

## Global Constraints (apply to all tasks)
- Expo SDK version: 52 exactly — do not use SDK 53+
- TypeScript: strict mode on, `"noUncheckedIndexedAccess": true` in tsconfig
- All game engine files in `engine/` must have zero React/React Native imports
- Save key: `llama_quest_v1`
- Tile coordinate system: integer (x, y) where (0,0) is top-left; tile size = 32 px
- Player speed: 4 tiles/second
- Game loop: cap delta time at 50 ms
- All Record<string, boolean> fields in game state (not Set<>)
- XP per lesson read: 20; per NPC met: 8
- Phase 1 delivers placeholder colored-rect tiles only

## Your Task

### Step 1: Initialise the Expo project
Run inside the `Llama Quest` directory:
```bash
npx create-expo-app@latest . --template blank-typescript
```
When prompted about an existing directory, confirm overwrite (it will keep existing files like localhost-quest.html and docs/).

### Step 2: Initialise git
```bash
git init
git add .
git commit -m "chore: initial expo scaffold"
```

### Step 3: Install all Phase 1 dependencies
```bash
npx expo install expo-router @shopify/react-native-skia react-native-reanimated react-native-gesture-handler @react-native-async-storage/async-storage zustand
npm install --save-dev jest-expo @testing-library/react-native @testing-library/jest-native
```

### Step 4: Replace `app.json` with expo-router config
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

### Step 5: Replace `tsconfig.json`
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

### Step 6: Replace `babel.config.js`
```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
```

### Step 7: Delete `App.tsx` and create `app/_layout.tsx`
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

### Step 8: Create `jest.config.js`
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

### Step 9: Create `jest.setup.ts`
```ts
import '@testing-library/jest-native/extend-expect'
```

### Step 10: Create `__mocks__/@shopify/react-native-skia.js`
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

### Step 11: Verify tests run (skip browser verification — subagents can't open browsers)
```bash
npm test -- --passWithNoTests
```
Expected: exits 0.

### Step 12: Create GitHub repository
```bash
gh repo create llama-quest --public --description "Llama Quest — SNES-style AI learning RPG" --source=. --remote=origin --push
```

### Step 13: Create `.github/workflows/ci.yml`
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

### Step 14: Commit and push CI workflow
```bash
git add .github/workflows/ci.yml
git commit -m "chore: add GitHub Actions CI workflow"
git push
```

### Step 15: Final commit of all scaffold files
```bash
git add -A
git commit -m "chore: install deps, configure expo-router, jest, skia mock"
git push
```

## Report Contract
Write your full report to: `.superpowers/sdd/task-1-report.md`

Include:
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- List of commits made (short hash + message)
- Test result: output of `npm test -- --passWithNoTests`
- Any deviations from the brief and why
- Concerns (if DONE_WITH_CONCERNS)

Return in your final message ONLY:
- Status (one word)
- Commit hashes (one per line)
- One-line test summary
- Any concerns
