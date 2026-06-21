/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/__tests__/**/*.test.ts'],
  // 20 min: beforeAll calls device.launchApp() which blocks until the Metro bundle
  // is served. With warm transformer cache, assembly still takes 10-25 min.
  // testTimeout in config takes effect before any module code runs, unlike
  // jest.setTimeout() at module level which caused timer side-effects in Detox.
  testTimeout: 1200000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
}
