/** @type {import('@wix/detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    // 600 s: APK install + app launch on a KVM-less CI emulator can take > 5 min
    jest: { setupTimeout: 600000 },
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
