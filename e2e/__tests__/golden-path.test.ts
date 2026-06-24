import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { scheduleMetroConnect } from '../setup'

// Set per-test timeout at module level so it takes effect before jest-circus
// initialises the run — overrides testTimeout in e2e/jest.config.js only if this
// value is larger (it isn't, so this just documents the intent).
// NOTE: do NOT put jest.setTimeout inside beforeAll; by the time beforeAll runs,
// Detox has already read the timeout from global[TEST_TIMEOUT_SYMBOL] and a value
// set inside beforeAll cannot retroactively extend the session-level setupTimeout.
jest.setTimeout(600000) // 10 min — matches e2e/jest.config.js testTimeout

describe('Llama Quest — Golden Path', () => {
  beforeAll(async () => {
    // scheduleMetroConnect seeds SharedPreferences (best-effort) then schedules an
    // ADB BROWSABLE intent at T+10s while launchApp() awaits. The intent is the
    // reliable path: device.launchApp({ newInstance: true }) calls pm-clear which
    // wipes any prefs seeded before the call, so the intent fires after the app is
    // running and expo-dev-client can handle it.
    const adbTimer = scheduleMetroConnect()
    await device.launchApp({ newInstance: true })
    clearTimeout(adbTimer)

    // Synchronization is disabled globally via detoxEnableSynchronization:0 in
    // detox.config.js (the 60fps game loop keeps mqt_js permanently busy).
    // Belt-and-suspenders call here in case config-level arg doesn't take effect.
    await device.disableSynchronization()

    // Wait for the title screen to be visible before tests begin.
    // expo-dev-client connects to Metro after the BROWSABLE intent fires (~10s),
    // then the bundle loads and the React Native window takes focus.
    // Without this wait, Espresso fails with "has-window-focus=false" on the
    // first test because the RN window hasn't taken focus yet.
    await waitFor(element(by.id('name-input')))
      .toBeVisible()
      .withTimeout(120000) // 2 min — bundle cold-load on slow CI emulator
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
