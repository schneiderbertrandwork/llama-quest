/** @type {import('@wix/detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    // setupTimeout controls Detox's globalSetup timeout AND the session-level
    // timer that SIGTERMs Jest workers after N ms from session start.
    // Cold Metro cache: golden-path (~5min) + travel (~8min) = 13min before battle
    // starts. The old 600000 (10min) fired SIGTERM 2min into battle.
    // Set to 7200000 (2h) — effectively "no session limit" for CI.
    jest: { setupTimeout: 7200000 },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    // CI: android-emulator-runner@v2 names the AVD "test" by default
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'test' },
    },
    // Local: physical Android device connected via USB with USB Debugging enabled
    // Note: emulator cannot run locally (netsimd.exe blocked by corporate network)
    attached: {
      type: 'android.attached',
      device: { adbName: '.*' },
    },
  },
  configurations: {
    // Used by CI (e2e-android.yml)
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    // Used for local testing with a physical device: npm run e2e:device
    'android.device.debug': {
      device: 'attached',
      app: 'android.debug',
    },
  },
}
