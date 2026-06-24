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

import { execFileSync } from 'child_process'
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
 * Seeds SharedPreferences (best-effort) then schedules an ADB BROWSABLE intent
 * to fire at T+10s while device.launchApp() is awaiting.
 *
 * Usage in beforeAll:
 *   clearAsyncStorage()           // wipe AsyncStorage (no pm clear)
 *   const adbTimer = scheduleMetroConnect()
 *   await device.launchApp({ newInstance: true })  // NO resetAppState
 *   clearTimeout(adbTimer)
 *
 * Why T+10s: newInstance:true force-stops and relaunches (~2-3s total).
 * expo-dev-client shows its connection UI by T+4s.
 * The intent at T+10s arrives while expo-dev-client is ready to handle it.
 *
 * Why NO resetAppState: pm clear fails with exit code 1 on the 3rd call in the
 * same emulator session. Use clearAsyncStorage() (run-as) before this call instead.
 */
export function scheduleMetroConnect(): ReturnType<typeof setTimeout> {
    seedSharedPreferences()

    // URL-encode the Metro URL for the intent URI parameter.
    // localhost:8081 is reachable via adb reverse; 10.0.2.2:8081 is NOT in CI.
    const intentUri = `exp+llama-quest://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`

    return setTimeout(() => {
        try {
            execFileSync('adb', [
                'shell', 'am', 'start',
                '-a', 'android.intent.action.VIEW',
                '-c', 'android.intent.category.DEFAULT',
                '-c', 'android.intent.category.BROWSABLE',
                '-d', intentUri,
            ], { stdio: 'pipe', timeout: 15000 })
            console.log('[E2E] ADB BROWSABLE intent fired → expo-dev-client connecting to localhost:8081')
        } catch (e) {
            console.warn('[E2E] ADB intent failed (non-fatal):', String(e).slice(0, 200))
        }
    }, 10000)
}
