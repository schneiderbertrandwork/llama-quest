import { execFile } from 'child_process'
import { device, element, by, expect as detoxExpect, waitFor } from 'detox'

describe('Llama Quest — Golden Path', () => {
  beforeAll(async () => {
    jest.setTimeout(300000) // 5 min: 10s wait + ~60s bundle load + safety

    // Detox's am instrument URL delivery (detoxURLOverride) does not reach
    // expo-dev-client's connection handler. Fire the deep link as a real
    // ACTION_VIEW intent with BROWSABLE + DEFAULT categories — this is what
    // Android dispatches for deep links opened from a browser or other apps,
    // and what expo-dev-client's intent-filter expects.
    // The 10s delay gives expo-dev-client time to show its connection screen
    // before we deliver the Metro URL.
    const deepLinkTimer = setTimeout(() => {
      execFile(
        'adb',
        [
          'shell', 'am', 'start',
          '-a', 'android.intent.action.VIEW',
          '-d', 'exp+llama-quest://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081',
          '-c', 'android.intent.category.DEFAULT',
          '-c', 'android.intent.category.BROWSABLE',
        ],
        (_err, stdout) => console.log('[detox-deep-link]', stdout?.trim() || _err?.message || 'sent'),
      )
    }, 10000)

    await device.launchApp({ newInstance: true })
    clearTimeout(deepLinkTimer)

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
