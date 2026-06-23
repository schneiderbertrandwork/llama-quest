/**
 * Shared E2E setup helpers — imported by every test file's beforeAll.
 *
 * WHY: expo-dev-client shows a "Connect to dev server" screen on fresh app launches
 * because lastOpenedApp (in expo.modules.devlauncher.recentyopenedapps.xml) is null.
 * DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE defaults to true but has nothing to auto-connect
 * to. We pre-seed this file so expo-dev-client immediately calls loadApp("localhost:8081")
 * instead of showing the connection UI.
 *
 * A second SharedPreferences file (com.llamaquest.app_preferences.xml) pre-seeds
 * debug_http_host=localhost:8081 as a React Native fallback in case expo-dev-client's
 * DevLauncherPackagerConnectionSettings injection fails silently.
 *
 * Both files survive force-stop (they are on-disk files, not process memory).
 * Must be called AFTER the APK is installed (Detox installs before beforeAll runs)
 * but BEFORE device.launchApp() so the app reads them on first start.
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
        // Non-fatal: the URL intent fallback (device.launchApp url) still runs.
        console.warn('[E2E] SharedPreferences seed failed (non-fatal):', String(e).slice(0, 400))
    }
}
