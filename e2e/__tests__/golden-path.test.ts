import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { scheduleMetroConnect } from '../setup'

describe('Llama Quest — Golden Path', () => {
  beforeAll(async () => {
    jest.setTimeout(120000) // 2 min — warm Metro cache + ADB intent resolves in ~40s

    // scheduleMetroConnect seeds SharedPreferences (best-effort) then schedules an
    // ADB BROWSABLE intent at T+10s while launchApp() awaits. The intent is the
    // reliable path: device.launchApp({ newInstance: true }) calls pm-clear which
    // wipes any prefs seeded before the call, so the intent fires after the app is
    // running and expo-dev-client can handle it.
    const adbTimer = scheduleMetroConnect()
    await device.launchApp({ newInstance: true })
    clearTimeout(adbTimer)

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
