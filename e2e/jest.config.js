/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/__tests__/**/*.test.ts'],
  // 5 min: enough for launchApp() with a warm Metro transformer cache (<120s assembly).
  // Do NOT raise above 300000 — Detox has an internal timer bug that fires at ~263s
  // when testTimeout is set to a high value (1200000 triggers it; 300000 does not).
  testTimeout: 300000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
}
