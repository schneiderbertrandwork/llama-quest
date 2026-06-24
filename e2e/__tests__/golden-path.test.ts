import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { scheduleMetroConnect, clearAsyncStorage, waitForWindowFocus } from '../setup'

// Set per-test timeout at module level so it takes effect before jest-circus
// initialises the run — overrides testTimeout in e2e/jest.config.js only if this
// value is larger (it isn't, so this just documents the intent).
// NOTE: do NOT put jest.setTimeout inside beforeAll; by the time beforeAll runs,
// Detox has already read the timeout from global[TEST_TIMEOUT_SYMBOL] and a value
// set inside beforeAll cannot retroactively extend the session-level setupTimeout.
jest.setTimeout(600000) // 10 min — matches e2e/jest.config.js testTimeout

describe('Llama Quest — Golden Path', () => {
  beforeAll(async () => {
    // Clear AsyncStorage first (run-as, non-fatal) so app starts on title screen.
    // We do NOT use resetAppState/pm clear — pm clear fails with exit code 1 on the
    // 3rd consecutive call in the same emulator session.
    clearAsyncStorage()
    scheduleMetroConnect()
    await device.launchApp({ newInstance: true })
    // timer fires at T+10s — do NOT cancel early; window focus requires it

    // Synchronization is disabled globally via detoxEnableSynchronization:0 in
    // detox.config.js (the 60fps game loop keeps mqt_js permanently busy).
    // Belt-and-suspenders call here in case config-level arg doesn't take effect.
    await device.disableSynchronization()

    // Wait until the app's window has focus before calling any waitFor().
    // Espresso checks "has-window-focus=true" as a 10-second pre-condition on
    // every interaction — if the window doesn't have focus the call fails
    // immediately, regardless of the waitFor timeout. On no-KVM CI emulators,
    // HardwareRenderer.init blocks ~5 s during the first Activity resume, causing
    // an ANR dialog to briefly steal focus. waitForWindowFocus() polls via ADB and
    // fires `am start .MainActivity` on every attempt, which brings the activity to
    // front and dismisses any covering system dialog (ANR / crash overlay).
    await waitForWindowFocus(300000) // 5 min — bundle cold-load on no-KVM CI emulator

    // Belt-and-suspenders: also wait for the name-input element to be visible.
    await waitFor(element(by.id('name-input')))
      .toBeVisible()
      .withTimeout(120000) // 2 min — window focus is already confirmed above
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
