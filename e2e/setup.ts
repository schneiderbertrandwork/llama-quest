/**
 * Shared E2E setup helpers — imported by every test file's beforeAll.
 *
 * clearAsyncStorage() — called FIRST in each suite's beforeAll:
 *   Uses run-as to remove only /data/data/<pkg>/databases (AsyncStorage).
 *   Avoids pm clear entirely — pm clear fails with exit code 1 on the 3rd
 *   consecutive call in the same emulator session (Android package manager
 *   race/busy state). Non-fatal; goToOverworld() has a catch fallback.
 *
 * scheduleMetroConnect() — Metro connection mechanism:
 *   Seeds SharedPreferences (best-effort) then schedules an ADB BROWSABLE
 *   intent at T+10s while launchApp({ newInstance: true }) is awaiting.
 *   The intent fires after expo-dev-client is running and ready to handle it.
 *   See: memory/project-detox-root-cause.md for full diagnosis.
 *
 * ADB reverse (adb reverse tcp:8081 tcp:8081) in run-detox.sh makes emulator
 * localhost:8081 resolve to the host's Metro port. 10.0.2.2:8081 (QEMU gateway)
 * is UNREACHABLE in GitHub Actions CI — always use localhost:8081.
 */

import { execFileSync, execFile } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const PACKAGE = 'com.llamaquest.app'
const METRO_URL = 'http://localhost:8081'

/**
 * Clears the AsyncStorage databases directory via run-as so the app always
 * starts on the title screen (no persisted player state).
 *
 * Call BEFORE scheduleMetroConnect / launchApp in every suite's beforeAll.
 * Non-fatal — if it fails, goToOverworld() has a try/catch fallback.
 *
 * Why run-as instead of resetAppState / pm clear:
 *   pm clear fails with exit code 1 on the 3rd consecutive call in the same
 *   emulator session. run-as only removes the databases dir (AsyncStorage),
 *   which is all we need to reset game state. No package manager touched.
 */
export function clearAsyncStorage(): void {
    try {
        const clearCmd = `run-as ${PACKAGE} sh -c 'rm -rf /data/data/${PACKAGE}/databases'`
        execFileSync('adb', ['shell', clearCmd], { stdio: 'pipe', timeout: 10000 })
        console.log('[E2E] AsyncStorage cleared — suite starts with no saved game state')
    } catch (e) {
        console.warn('[E2E] AsyncStorage clear failed (non-fatal):', String(e).slice(0, 200))
    }
}

export function seedSharedPreferences(): void {
    try {
        const ts = Date.now()
        // expo-dev-client recently-opened-apps registry entry.
        // Fields match DevLauncherAppEntry in DevLauncherRecentlyOpenedAppsRegistry.kt.
        const entry = JSON.stringify({
            timestamp: ts,
            name: 'Llama Quest',
            url: METRO_URL,
            isEASUpdate: false,
            updateMessage: null,
            branchName: null,
        })

        // expo-dev-client reads this on every LAUNCHER-mode start.
        // getMostRecentApp() returns the newest entry (by timestamp).
        const devLauncherXml = [
            `<?xml version="1.0" encoding="utf-8" standalone="yes" ?>`,
            `<map>`,
            `<string name="${METRO_URL}">${entry}</string>`,
            `</map>`,
        ].join('\n')

        // React Native's PackagerConnectionSettings reads debug_http_host via
        // PreferenceManager.getDefaultSharedPreferences(). Fallback if expo-dev-client
        // injection of DevLauncherPackagerConnectionSettings returns false.
        const rnXml = [
            `<?xml version="1.0" encoding="utf-8" standalone="yes" ?>`,
            `<map>`,
            `<string name="debug_http_host">localhost:8081</string>`,
            `</map>`,
        ].join('\n')

        // Write to host temp files (avoids shell-quoting issues with JSON content).
        const tmpDir = os.tmpdir()
        const dlPrefsPath = path.join(tmpDir, 'e2e-dl-prefs.xml')
        const rnPrefsPath = path.join(tmpDir, 'e2e-rn-prefs.xml')
        fs.writeFileSync(dlPrefsPath, devLauncherXml, 'utf8')
        fs.writeFileSync(rnPrefsPath, rnXml, 'utf8')

        // Push to device public storage (readable by run-as).
        execFileSync('adb', ['push', dlPrefsPath, '/sdcard/e2e-dl-prefs.xml'],
            { stdio: 'pipe', timeout: 15000 })
        execFileSync('adb', ['push', rnPrefsPath, '/sdcard/e2e-rn-prefs.xml'],
            { stdio: 'pipe', timeout: 15000 })

        // Copy into app's private SharedPreferences directory via run-as.
        // run-as requires a debuggable APK — assembleDebug satisfies this.
        // mkdir -p is safe even if shared_prefs already exists.
        //
        // IMPORTANT: adb shell joins all extra args with spaces before sending to
        // the device shell, so 'sh -c <cmd>' must be passed as a SINGLE adb shell
        // argument — use the single-string form of adb shell to avoid splitting.
        const prefs = `/data/data/${PACKAGE}/shared_prefs`
        const shellCmd =
            `run-as ${PACKAGE} sh -c ` +
            `'mkdir -p ${prefs} && ` +
            `cp /sdcard/e2e-dl-prefs.xml ${prefs}/expo.modules.devlauncher.recentyopenedapps.xml && ` +
            `cp /sdcard/e2e-rn-prefs.xml ${prefs}/${PACKAGE}_preferences.xml'`
        execFileSync('adb', ['shell', shellCmd], { stdio: 'pipe', timeout: 20000 })

        console.log(`[E2E] SharedPreferences seeded — expo-dev-client lastOpenedApp=${METRO_URL}, debug_http_host=localhost:8081`)
    } catch (e) {
        // Non-fatal — scheduleMetroConnect's ADB intent is the reliable fallback.
        console.warn('[E2E] SharedPreferences seed failed (non-fatal):', String(e).slice(0, 400))
    }
}

/**
 * Polls via ADB until the app's window has focus (has-window-focus=true), or until
 * timeoutMs is reached.  Fires `am start .MainActivity` on every attempt to keep
 * bringing the activity to front and to dismiss any covering system dialog (ANR,
 * crash dialog, etc.) that could be stealing window focus.
 *
 * Call this AFTER device.launchApp() and BEFORE the first Detox waitFor() call in
 * beforeAll.  Without this, Espresso's internal 10-second window-focus pre-condition
 * fires immediately and fails every interaction with "has-window-focus=false", even
 * though the 300-second waitFor timeout has not expired.
 *
 * Implementation: uses `adb shell dumpsys window windows` to check for the string
 * "mCurrentFocus=.*com.llamaquest.app" which appears when our window is focused.
 * Falls back to `am start -n .MainActivity` on each poll iteration to ensure the
 * activity is always being pushed to front.
 */
export async function waitForWindowFocus(timeoutMs = 300000): Promise<void> {
    const pollIntervalMs = 10000
    const start = Date.now()
    let attempt = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
        attempt++

        // Always try to bring MainActivity to front — harmless if already focused,
        // and dismisses any covering system dialog (ANR / crash dialog).
        await new Promise<void>((resolve) => {
            execFile(
                'adb',
                [
                    'shell', 'am', 'start',
                    '-n', `${PACKAGE}/.MainActivity`,
                    '--activity-no-animation',
                ],
                { timeout: 10000 },
                (err) => {
                    if (err) {
                        console.warn(`[E2E] waitForWindowFocus am start attempt ${attempt} failed (non-fatal):`, err.message.slice(0, 100))
                    }
                    resolve()
                },
            )
        })

        // Check if the window now has focus.
        const hasFocus = await new Promise<boolean>((resolve) => {
            execFile(
                'adb',
                ['shell', 'dumpsys', 'window', 'windows'],
                { timeout: 10000 },
                (err, stdout) => {
                    if (err || !stdout) {
                        resolve(false)
                        return
                    }
                    // mCurrentFocus=Window{... com.llamaquest.app/...} signals focus
                    const focused = stdout.includes('mCurrentFocus') &&
                        stdout.includes('com.llamaquest.app') &&
                        /mCurrentFocus=Window\{[^}]*com\.llamaquest\.app/.test(stdout)
                    resolve(focused)
                },
            )
        })

        if (hasFocus) {
            console.log(`[E2E] Window focus acquired after ${attempt} attempt(s) (${Date.now() - start}ms)`)
            return
        }

        const elapsed = Date.now() - start
        if (elapsed + pollIntervalMs > timeoutMs) {
            console.warn(`[E2E] waitForWindowFocus timed out after ${elapsed}ms — proceeding anyway`)
            return
        }

        console.log(`[E2E] waitForWindowFocus attempt ${attempt}: no focus yet (${elapsed}ms elapsed) — retrying in ${pollIntervalMs}ms`)
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }
}

/**
 * Seeds SharedPreferences (best-effort) then schedules an ADB BROWSABLE intent
 * to fire at T+10s while device.launchApp() is awaiting.
 *
 * Usage in beforeAll:
 *   clearAsyncStorage()
 *   scheduleMetroConnect()   // start T+10s timer BEFORE launchApp
 *   await device.launchApp({ newInstance: true })
 *   // do NOT clearTimeout — let the intent fire
 *
 * Why not clearTimeout: without pm clear, launchApp() returns in ~4s.
 * The T+10s intent must fire WHILE Espresso's 10s window-focus wait is running.
 * If cancelled, expo-dev-client's idle screen never takes focus → has-window-focus=false.
 *
 * Why T+10s: newInstance:true force-stops and relaunches (~2-3s total).
 * expo-dev-client shows its connection UI by T+4s.
 * The intent at T+10s arrives while expo-dev-client is ready to handle it.
 *
 * Why NO resetAppState: pm clear fails with exit code 1 on the 3rd call in the
 * same emulator session. Use clearAsyncStorage() (run-as) before this call instead.
 *
 * Focus recovery timers (T+3min to T+6min every 30s):
 * On no-KVM CI emulators, HardwareRenderer.init blocks ~5s on swiftshader_indirect
 * during the first Activity resume (~T+3m10s–T+3m30s). ANRWatchDog detects this and
 * Android shows an "App not responding" dialog that steals window focus. In headless
 * mode the dialog never auto-dismisses. run-detox.sh suppresses ANR dialogs via
 * `settings put global anr_show_background 0` as the primary fix. These timers are
 * belt-and-suspenders: they sweep every 30s starting at T+3min, bringing
 * MainActivity to front and dismissing any remaining system dialog. `am start` with
 * singleTask launch mode re-uses the existing task without recreating the activity,
 * so navigation state is preserved. Additionally, tests call waitForWindowFocus()
 * before any Espresso interaction to ensure focus is confirmed via ADB poll.
 */
export function scheduleMetroConnect(): ReturnType<typeof setTimeout> {
    seedSharedPreferences()

    // URL-encode the Metro URL for the intent URI parameter.
    // localhost:8081 is reachable via adb reverse; 10.0.2.2:8081 is NOT in CI.
    const intentUri = `exp+llama-quest://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`

    // Use async execFile (not execFileSync) so the Node.js event loop is NEVER
    // blocked when the intent fires. execFileSync inside a setTimeout callback
    // blocks the entire event loop for up to its timeout duration — this prevents
    // Detox's internal async ADB callbacks (including launchApp resolution) from
    // running, causing a deadlock where both our ADB call and Detox's ADB calls
    // starve each other → ETIMEDOUT on our side, launchApp never resolves.
    const handle = setTimeout(() => {
        execFile('adb', [
            'shell', 'am', 'start',
            '-a', 'android.intent.action.VIEW',
            '-c', 'android.intent.category.DEFAULT',
            '-c', 'android.intent.category.BROWSABLE',
            '-d', intentUri,
        ], { timeout: 15000 }, (err) => {
            if (err) {
                console.warn('[E2E] ADB intent failed (non-fatal):', err.message.slice(0, 200))
            } else {
                console.log('[E2E] ADB BROWSABLE intent fired → expo-dev-client connecting to localhost:8081')
            }
        })
    }, 10000)

    // Focus-recovery timers: dismiss any ANR dialog and restore window focus.
    // On no-KVM CI emulators, Hermes JS compilation during bundle load (~3-5 min)
    // saturates the main thread. ANRWatchDog detects this and Android shows an
    // "App not responding" dialog that steals window focus. In headless -no-window
    // mode the dialog never auto-dismisses, so all subsequent Espresso interactions
    // fail with "has-window-focus=false". Bringing MainActivity to the foreground
    // via `am start` implicitly dismisses the ANR dialog (Android clears system
    // alerts when the target activity is re-launched to front) and restores focus.
    // This is safe regardless of which screen the app is on — `am start` with
    // singleTask launch mode brings the existing task to front without recreating
    // the activity, so any ongoing navigation state is preserved.
    const bringToFront = (label: string) => {
        execFile('adb', [
            'shell', 'am', 'start',
            '-n', 'com.llamaquest.app/.MainActivity',
            '--activity-no-animation',
        ], { timeout: 10000 }, (err) => {
            if (err) {
                console.warn(`[E2E] ${label} bring-to-front failed (non-fatal):`, err.message.slice(0, 100))
            } else {
                console.log(`[E2E] ${label} — brought MainActivity to front, dismissed any ANR dialog`)
            }
        })
    }

    // Focus-recovery sweep: fire every 30s from T+3min to T+6min.
    //
    // Why T+3min onwards (not earlier): the ANR on no-KVM emulators fires at
    // T+3m10s to T+3m30s (HardwareRenderer.init blocks ~5s on swiftshader_indirect
    // during the first Activity resume). Firing before the ANR is too early — the
    // dialog appears after our am start and steals focus back. Run-detox.sh disables
    // ANR dialogs via `settings put global anr_show_background 0` so this is a
    // belt-and-suspenders sweep in case any system dialog survived.
    //
    // Why no re-intent: re-firing the BROWSABLE intent after the bundle has loaded
    // would tell expo-dev-client to reload the bundle, which resets navigation
    // state and makes all subsequent tests fail.
    for (let i = 0; i <= 6; i++) {
        setTimeout(
            () => bringToFront(`T+${3 + i * 0.5}min focus-recovery`),
            (180 + i * 30) * 1000,
        )
    }

    return handle
}
