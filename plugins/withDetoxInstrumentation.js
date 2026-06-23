const { withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

/**
 * Sets up Detox instrumentation for an Expo app that uses expo-dev-client.
 *
 * Two things are required to make Detox work with expo-dev-client:
 *
 * 1. testInstrumentationRunner must be DetoxJUnitRunner (not the default
 *    AndroidJUnitRunner). Without this, Detox never receives the "ready"
 *    WebSocket message from the instrumentation process — every launchApp()
 *    hangs until the 600s timeout fires.
 *
 * 2. DetoxTest.java (the test entry point) must bridge expo-dev-client's
 *    DevLauncherController to Detox's ReactNativeHost. The file in
 *    node_modules/expo-dev-client/e2e/android/DetoxTest.java is the
 *    official template — package name must match the app.
 */
module.exports = function withDetoxInstrumentation(config) {
  // Step 1: set DetoxJUnitRunner as the testInstrumentationRunner
  config = withAppBuildGradle(config, (mod) => {
    const contents = mod.modResults.contents
    if (contents.includes('DetoxJUnitRunner')) {
      return mod // already applied
    }
    mod.modResults.contents = contents.replace(
      /testInstrumentationRunner\s+"[^"]+"/,
      'testInstrumentationRunner "com.wix.detox.runners.DetoxJUnitRunner"'
    )
    return mod
  })

  // Step 2: generate DetoxTest.java bridging expo-dev-client → Detox
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const packageName = mod.android?.package ?? 'com.llamaquest.app'
      // Convert package name to directory path (dots → slashes)
      const packagePath = packageName.replace(/\./g, '/')

      // In withDangerousMod, modRequest.projectRoot is the correct path to the
      // Expo project root (not mod.modResults or process.cwd).
      const projectRoot = mod.modRequest.projectRoot
      const testDir = path.join(
        projectRoot,
        'android', 'app', 'src', 'androidTest', 'java',
        packagePath
      )
      fs.mkdirSync(testDir, { recursive: true })

      const testFilePath = path.join(testDir, 'DetoxTest.java')
      if (fs.existsSync(testFilePath)) {
        return mod // already written
      }

      const javaContent = [
        `package ${packageName};`,
        '',
        'import static androidx.test.espresso.Espresso.onView;',
        'import static androidx.test.espresso.matcher.ViewMatchers.isRoot;',
        'import static androidx.test.platform.app.InstrumentationRegistry.getInstrumentation;',
        '',
        'import android.app.Activity;',
        'import android.content.Context;',
        'import android.content.ContextWrapper;',
        'import android.view.View;',
        'import android.view.ViewGroup;',
        '',
        'import androidx.test.ext.junit.runners.AndroidJUnit4;',
        'import androidx.test.filters.LargeTest;',
        'import androidx.test.rule.ActivityTestRule;',
        '',
        'import com.facebook.react.ReactApplication;',
        'import com.facebook.react.ReactNativeHost;',
        'import com.wix.detox.Detox;',
        'import com.wix.detox.config.DetoxConfig;',
        '',
        'import org.junit.Rule;',
        'import org.junit.Test;',
        'import org.junit.runner.RunWith;',
        '',
        'import expo.modules.devlauncher.DevLauncherController;',
        'import expo.modules.devlauncher.launcher.DevLauncherActivity;',
        '',
        '/**',
        ' * Detox test entry point for expo-dev-client apps.',
        ' *',
        ' * DevLauncherController replaces the standard ReactNativeHost when expo-dev-client',
        ' * is active. This class bridges that host to Detox so the WebSocket "ready"',
        ' * handshake succeeds. Without this, Detox hangs on every launchApp() call.',
        ' *',
        ' * Based on: node_modules/expo-dev-client/e2e/android/DetoxTest.java',
        ' */',
        'class ReactNativeHolder extends ContextWrapper implements ReactApplication {',
        '  public ReactNativeHolder(Context base) {',
        '    super(base);',
        '  }',
        '',
        '  @Override',
        '  public ReactNativeHost getReactNativeHost() {',
        '    return DevLauncherController.getInstance().getDevClientHost();',
        '  }',
        '}',
        '',
        '@RunWith(AndroidJUnit4.class)',
        '@LargeTest',
        'public class DetoxTest {',
        '  @Rule',
        '  public ActivityTestRule<DevLauncherActivity> mActivityRule =',
        '      new ActivityTestRule<>(DevLauncherActivity.class, false, false);',
        '',
        '  @Test',
        '  public void runDetoxTests() {',
        '    DetoxConfig detoxConfig = new DetoxConfig();',
        '    // masterTimeoutSec: max idle time before Detox gives up on a UI operation.',
        '    detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;',
        '    // rnContextLoadTimeoutSec: time to wait for the React Native context (bundle)',
        '    // to load after the instrumentation starts. On no-KVM emulators this can be',
        '    // 60-180s; 300s gives plenty of margin.',
        '    detoxConfig.rnContextLoadTimeoutSec = 300;',
        '',
        '    ReactNativeHolder reactNativeHolder = new ReactNativeHolder(',
        '        getInstrumentation().getTargetContext().getApplicationContext());',
        '    Detox.runTests(mActivityRule, reactNativeHolder, detoxConfig);',
        '  }',
        '}',
      ].join('\n')

      fs.writeFileSync(testFilePath, javaContent, 'utf8')
      return mod
    },
  ])

  return config
}
