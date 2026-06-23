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
    // CI: android-emulator-runner@v2 boots the emulator and owns its lifecycle.
    // We use android.attached (not android.emulator) so Detox never tries to
    // boot/reboot the emulator — it just attaches to emulator-5554 which is
    // already running. Using android.emulator caused Detox to attempt a KVM-
    // accelerated relaunch after the first emulator interaction, which always
    // fails on GitHub Actions (KVM unavailable) with exit code 224.
    'emulator-ci': {
      type: 'android.attached',
      device: { adbName: 'emulator-5554' },
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
      device: 'emulator-ci',
      app: 'android.debug',
    },
    // Used for local testing with a physical device: npm run e2e:device
    'android.device.debug': {
      device: 'attached',
      app: 'android.debug',
    },
  },
}
