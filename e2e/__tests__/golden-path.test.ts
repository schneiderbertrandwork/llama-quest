import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { seedSharedPreferences } from '../setup'

describe('Llama Quest — Golden Path', () => {
  beforeAll(async () => {
    jest.setTimeout(120000) // 2 min — warm Metro cache serves bundle in ~30s

    // Seed expo-dev-client's SharedPreferences so it auto-connects to Metro on launch.
    // This runs after Detox installs the APK (global setup) but before launchApp().
    // Falls back gracefully if run-as fails — the URL intent below is the primary path.
    seedSharedPreferences()

    // device.launchApp({ url }) + expo-dev-client plugin in app.json registers the
    // exp+llama-quest:// intent filter, so Android routes the URL to expo-dev-client's
    // handler which extracts the Metro URL and connects automatically.
    await device.launchApp({
      newInstance: true,
      url: 'exp+llama-quest://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081',
    })

    // The game's 60fps requestAnimationFrame loop makes Detox's idle-synchronization
    // wait forever (app is never "idle"). Disable it here; tests use explicit waitFor
    // timeouts instead.
    await device.disableSynchronization()
  })

  afterAll(async () => {
    await device.terminateApp()
  })

  it('title screen renders "Llama Quest" text', async () => {
    await waitFor(element(by.text('LLAMA QUEST')))
      .toBeVisible()
      .withTimeout(15000)
  })

  it('name input accepts text', async () => {
    await waitFor(element(by.id('name-input')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('name-input')).typeText('Hero')
    await detoxExpect(element(by.id('name-input'))).toHaveText('Hero')
  })

  it('class buttons are tappable — tap Tinkerer', async () => {
    await waitFor(element(by.id('class-tinkerer')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('class-tinkerer')).tap()
    // Tinkerer should now be the selected class (no crash = pass)
  })

  it('tapping Start Game navigates to overworld without crash', async () => {
    // This is the critical regression test — catches the useFrameCallback crash
    await waitFor(element(by.id('start-game-btn')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('start-game-btn')).tap()

    // Wait for HUD to appear — proves the overworld rendered successfully
    await waitFor(element(by.id('hud')))
      .toBeVisible()
      .withTimeout(15000)
  })

  it('HUD is visible on overworld screen', async () => {
    await detoxExpect(element(by.id('hud'))).toBeVisible()
  })

  it('touch dpad buttons are tappable without crash', async () => {
    // Dpad only renders on native (Platform.OS !== 'web') — these will be present on Android
    await waitFor(element(by.id('dpad-up')))
      .toBeVisible()
      .withTimeout(5000)

    await element(by.id('dpad-up')).tap()
    await element(by.id('dpad-left')).tap()
    await element(by.id('dpad-right')).tap()
    await element(by.id('dpad-down')).tap()

    // If we get here without crash, the game loop + RAF path is stable
    await detoxExpect(element(by.id('hud'))).toBeVisible()
  })
})
