/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/__tests__/**/*.test.ts'],
  // 15 min per test/hook. Detox does NOT send SIGTERM — Jest does, via this setting.
  // On no-KVM software-emulated CI runners, SoLoader (native .so library loading) blocks
  // the main thread for 5-6 min during DevLauncherActivity.onCreate(), keeping the app
  // process invisible in 'ps' until loading completes. launchApp() blocks until Detox
  // WebSocket connects (which requires the JS engine — i.e., SoLoader — to finish).
  // Timeline: SoLoader ~6 min + waitForWindowFocus up to 5 min + name-input up to 2 min
  // = up to 13 min for beforeAll. 900000ms (15 min) gives 3 min of headroom.
  testTimeout: 900000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
}
