/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/__tests__/**/*.test.ts'],
  // 10 min per test/hook. Detox does NOT send SIGTERM — Jest does, via this setting.
  // With expo-dev-client using 10.0.2.2:8081 (QEMU host IP), Metro serves the pre-warmed
  // bundle instantly; app init (Skia + RN) takes ~30-120s on an unaccelerated emulator.
  // 600000ms (10 min) gives 563s effective for beforeAll (600 - ~37s module load overhead).
  testTimeout: 600000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
}
