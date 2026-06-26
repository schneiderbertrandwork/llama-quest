import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { scheduleMetroConnect, clearAsyncStorage } from '../setup'

// Set per-test timeout at module level so it takes effect before jest-circus
// initialises the run — overrides testTimeout in e2e/jest.config.js only if this
// value is larger (it isn't, so this just documents the intent).
// NOTE: do NOT put jest.setTimeout inside beforeAll; by the time beforeAll runs,
// Detox has already read the timeout from global[TEST_TIMEOUT_SYMBOL] and a value
// set inside beforeAll cannot retroactively extend the session-level setupTimeout.
jest.setTimeout(900000) // 15 min — matches e2e/jest.config.js testTimeout

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

    // Wait for the title screen to render. 840s = 14 min gives ample headroom for
    // SoLoader/JNI cold-start on no-KVM CI (cache should be warm from pre-warm step,
    // but worst-case cold start takes 5-15 min).
    //
    // NOTE: waitForWindowFocus (ADB mCurrentFocus polling) was removed — mCurrentFocus
    // NEVER shows com.llamaquest.app on headless (-no-window) emulators regardless of
    // wait time (confirmed: 98 polls over 820s with zero matches). Since
    // detoxEnableSynchronization:0 disables Espresso's window-focus idle barrier,
    // we can rely directly on Detox's element-polling instead.
    await waitFor(element(by.id('name-input')))
      .toBeVisible()
      .withTimeout(840000) // 14 min — SoLoader cache warm from pre-warm; covers cold-start
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
