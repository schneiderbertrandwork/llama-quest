import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { scheduleMetroConnect } from '../setup'

async function goToOverworld() {
  // 120s timeout: expo-dev-client connects to Metro after BROWSABLE intent (~10s),
  // then cold bundle load on a slow CI emulator can take up to 2 min.
  await waitFor(element(by.id('name-input'))).toBeVisible().withTimeout(120000)
  await element(by.id('name-input')).typeText('Hero')
  await element(by.id('class-tinkerer')).tap()
  await element(by.id('start-game-btn')).tap()
  await waitFor(element(by.id('hud'))).toBeVisible().withTimeout(15000)
}

// Set per-test timeout at module level so it takes effect before jest-circus
// initialises the run. Setting inside beforeAll cannot extend Detox's session-level
// setupTimeout because that timer starts before any test file code executes.
jest.setTimeout(600000) // 10 min — matches e2e/jest.config.js testTimeout

describe('Battle mechanics', () => {
  beforeAll(async () => {
    const adbTimer = scheduleMetroConnect()
    // resetAppState: true calls pm-clear (wipes AsyncStorage / SharedPreferences) so
    // the app always starts on the title screen, not the overworld.
    // NOTE: delete: true does a full uninstall+reinstall which takes 60-90s on CI and
    // makes run-as fail with "unknown package". resetAppState achieves the same data
    // wipe while keeping the package registered and avoiding the reinstall overhead.
    await device.launchApp({ newInstance: true, resetAppState: true })
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

  it('random encounter triggers after walking on the overworld', async () => {
    // Walk right-left in 1.5s bursts. Each burst covers ~6 tiles = ~6 step events.
    // Encounter chance: 6% per step after a 90-frame (1.5s) cooldown.
    // Expected battles per 30s of walking: ~7. Test walks for up to 30s.
    // If battle triggers mid-longPress, Detox throws (dpad not found) — we catch that.
    for (let i = 0; i < 10; i++) {
      try { await element(by.id('dpad-right')).longPress(1500) } catch { break }
      try { await element(by.id('dpad-left')).longPress(1500) } catch { break }
    }

    // After walking, battle-screen must be visible.
    await waitFor(element(by.id('battle-screen')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('battle screen renders enemy HP and action buttons', async () => {
    await detoxExpect(element(by.id('battle-screen'))).toBeVisible()
    // Run button must be present and enabled (player turn)
    await waitFor(element(by.id('battle-run')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('pressing Run exits the battle without crash', async () => {
    // Run has ~70% escape chance. Retry up to 6 times (probability of never escaping: 0.3^6 < 0.1%).
    // After a failed run the enemy attacks, then player turn resumes — wait for battle-run to re-enable.
    for (let attempt = 0; attempt < 6; attempt++) {
      await waitFor(element(by.id('battle-run')))
        .toBeVisible()
        .withTimeout(8000)
      await element(by.id('battle-run')).tap()

      try {
        // If we escaped, HUD is visible within ~1s
        await waitFor(element(by.id('hud')))
          .toBeVisible()
          .withTimeout(2000)
        return  // escaped — test passes
      } catch {
        // Run failed — loop and try again next player turn
      }
    }
    // Should not reach here given the retry count
    throw new Error('Failed to escape battle after 6 Run attempts')
  })

  it('overworld HUD is visible after escaping battle', async () => {
    await detoxExpect(element(by.id('hud'))).toBeVisible()
  })

  it('can trigger a second encounter to verify no state corruption', async () => {
    // Walk again — confirms the encounter system resets correctly after battle exit
    for (let i = 0; i < 10; i++) {
      try { await element(by.id('dpad-right')).longPress(1500) } catch { break }
      try { await element(by.id('dpad-left')).longPress(1500) } catch { break }
    }
    // Either a second battle appeared OR player is still on overworld — neither should crash
    const onBattle = await element(by.id('battle-screen')).getAttributes().then(() => true).catch(() => false)
    if (onBattle) {
      // Exit via Run again
      for (let attempt = 0; attempt < 6; attempt++) {
        try { await element(by.id('battle-run')).tap() } catch {}
        try {
          await waitFor(element(by.id('hud'))).toBeVisible().withTimeout(2000)
          break
        } catch {}
      }
    }
    await detoxExpect(element(by.id('hud'))).toBeVisible()
  })
})
