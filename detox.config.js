/** @type {import('@wix/detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    // setupTimeout: session-level timer from Jest start. SIGTERMs all Jest workers
    // if the entire session exceeds this. Metro bundle assembly takes 10-30 min even
    // with a warm transformer cache; golden-path beforeAll consumes most of that budget.
    // 2 hours gives battle ample time after golden-path + travel finish.
    jest: { setupTimeout: 7200000 }, // 2 hours
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
