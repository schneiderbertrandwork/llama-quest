/**
 * Shared E2E setup helpers — imported by every test file's beforeAll.
 *
 * scheduleMetroConnect() — PRIMARY connection mechanism:
 *   device.launchApp({ newInstance: true }) calls `pm clear` which wipes any
 *   SharedPreferences seeded before the call. The ADB BROWSABLE intent fires
 *   at T+10s WHILE launchApp() is awaiting — after the app is running but before
 *   expo-dev-client gives up waiting — so it is immune to pm-clear.
 *   See: memory/project-detox-root-cause.md for full diagnosis.
 *
 * seedSharedPreferences() — SECONDARY (belt-and-suspenders):
 *   Still called first in case a future Detox version stops clearing data.
 *   Non-fatal if it fails or gets wiped.
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
        const prefs = `/data/data/${PACKAGE}/shared_prefs`
        execFileSync('adb', [
            'shell', 'run-as', PACKAGE, 'sh', '-c',
            `mkdir -p ${prefs} && ` +
            `cp /sdcard/e2e-dl-prefs.xml ${prefs}/expo.modules.devlauncher.recentyopenedapps.xml && ` +
            `cp /sdcard/e2e-rn-prefs.xml ${prefs}/${PACKAGE}_preferences.xml`,
        ], { stdio: 'pipe', timeout: 20000 })

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
 *   const adbTimer = scheduleMetroConnect()
 *   await device.launchApp({ newInstance: true })
 *   clearTimeout(adbTimer)
 *
 * Why T+10s: launchApp() force-stops + pm-clears the app (~3s), then the OS
 * starts it (~2s). expo-dev-client is showing its connection UI by T+5s.
 * The intent at T+10s arrives while expo-dev-client is idle and ready to handle it.
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
