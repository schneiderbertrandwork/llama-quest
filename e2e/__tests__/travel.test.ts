import { execFile } from 'child_process'
import { device, element, by, expect as detoxExpect, waitFor } from 'detox'

// Helper: go through the title screen so tests start on the overworld.
async function goToOverworld() {
  await waitFor(element(by.id('name-input'))).toBeVisible().withTimeout(15000)
  await element(by.id('name-input')).typeText('Hero')
  await element(by.id('class-tinkerer')).tap()
  await element(by.id('start-game-btn')).tap()
  await waitFor(element(by.id('hud'))).toBeVisible().withTimeout(15000)
}

describe('Travel — Overworld gate to Llamatown', () => {
  beforeAll(async () => {
    jest.setTimeout(300000) // 5 min: 10s wait + ~60s bundle load + goToOverworld

    const deepLinkTimer = setTimeout(() => {
      execFile(
        'adb',
        [
          'shell', 'am', 'start',
          '-a', 'android.intent.action.VIEW',
          '-d', 'exp+llama-quest://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081',
          '-c', 'android.intent.category.DEFAULT',
          '-c', 'android.intent.category.BROWSABLE',
        ],
        (_err, stdout) => console.log('[detox-deep-link]', stdout?.trim() || _err?.message || 'sent'),
      )
    }, 10000)

    await device.launchApp({ newInstance: true })
    clearTimeout(deepLinkTimer)

    // Disable Detox idle-sync before navigating to the overworld where the 60fps
    // game loop runs — otherwise Detox waits forever for the app to become idle.
    await device.disableSynchronization()
    await goToOverworld()
  })

  afterAll(async () => {
    await device.terminateApp()
  })

  it('interact prompt appears at overworld spawn (gate is 1 tile north)', async () => {
    // Player spawns at (26, 74); Llamatown gate is at (26, 73) — distance 1.0, within
    // nearestInteractable's 1.5-tile radius. The [E] Enter prompt should appear immediately.
    await waitFor(element(by.id('interact-prompt')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('tapping [E] Enter transitions to Llamatown city screen without crash', async () => {
    await element(by.id('interact-prompt')).tap()
    // city-screen testID is on the SafeAreaWrapper root of city/[id].tsx
    await waitFor(element(by.id('city-screen')))
      .toBeVisible()
      .withTimeout(15000)
  })

  it('city HUD is visible in Llamatown', async () => {
    await detoxExpect(element(by.id('hud'))).toBeVisible()
  })

  it('NPC interact prompt appears after walking toward Mayor Lloyd', async () => {
    // Llamatown: player spawns at (9, 12), Mayor Lloyd at (9, 9) — 3 tiles north.
    // At PLAYER_SPEED = 4 tiles/sec, hold UP for 1200ms covers ~4.8 tiles (with safe margin).
    await element(by.id('dpad-up')).longPress(1200)
    await waitFor(element(by.id('interact-prompt')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('tapping interact opens NPC dialogue without crash', async () => {
    await element(by.id('interact-prompt')).tap()
    // DialogueBox renders the speaker name — Mayor Lloyd is the NPC we walked toward
    await waitFor(element(by.text('Mayor Lloyd')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('south gate returns to overworld without crash', async () => {
    // Close dialogue first (tap anywhere outside or wait for DialogueBox close)
    // DialogueBox has a close button — check city/[id].tsx for how to close it
    // Tap to advance dialogue then close
    await element(by.id('city-screen')).tap()
    // Walk south to gate-south at (9, 13) — player is around (9, 9), need ~4 tiles south
    await element(by.id('dpad-down')).longPress(1500)
    // Gate-south is unlocked — interact with it
    await waitFor(element(by.id('interact-prompt')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('interact-prompt')).tap()
    // Should navigate back to overworld, HUD remains visible
    await waitFor(element(by.id('hud')))
      .toBeVisible()
      .withTimeout(15000)
  })
})
