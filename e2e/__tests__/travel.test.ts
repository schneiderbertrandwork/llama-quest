import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { scheduleMetroConnect } from '../setup'

// Helper: go through the title screen so tests start on the overworld.
async function goToOverworld() {
  await waitFor(element(by.id('name-input'))).toBeVisible().withTimeout(15000)
  await element(by.id('name-input')).typeText('Hero')
  await element(by.id('class-tinkerer')).tap()
  await element(by.id('start-game-btn')).tap()
  await waitFor(element(by.id('hud'))).toBeVisible().withTimeout(15000)
}

// Set per-test timeout at module level so it takes effect before jest-circus
// initialises the run. Setting inside beforeAll cannot extend Detox's session-level
// setupTimeout because that timer starts before any test file code executes.
jest.setTimeout(600000) // 10 min — matches e2e/jest.config.js testTimeout

describe('Travel — Overworld gate to Llamatown', () => {
  beforeAll(async () => {
    const adbTimer = scheduleMetroConnect()
    await device.launchApp({ newInstance: true })
    clearTimeout(adbTimer)

    // Synchronization is disabled globally via detoxEnableSynchronization:0 in
    // detox.config.js (the 60fps game loop keeps mqt_js permanently busy).
    // Belt-and-suspenders call here in case config-level arg doesn't take effect.
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
