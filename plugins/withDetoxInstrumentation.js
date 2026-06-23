const {
  withAppBuildGradle,
  withProjectBuildGradle,
  withSettingsGradle,
  withDangerousMod,
} = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

/**
 * Sets up Detox instrumentation for an Expo app that uses expo-dev-client.
 *
 * Detox has no Expo config plugin and no autolinking support — everything
 * must be added manually. Four things are required:
 *
 * 1. Detox local Maven repo. Detox ships its AAR at
 *    node_modules/detox/Detox-android/ as a local Maven repo. This must be
 *    registered so Gradle can resolve com.wix:detox.
 *
 *    Expo SDK 52 / AGP 8 / RN 0.71+ puts repositories inside
 *    dependencyResolutionManagement { repositories {} } in settings.gradle.
 *    Older setups put them in allprojects { repositories {} } in build.gradle.
 *    We patch both to be safe.
 *
 * 2. androidTestImplementation 'com.wix:detox:+' in android/app/build.gradle.
 *
 * 3. testInstrumentationRunner must be DetoxJUnitRunner (not AndroidJUnitRunner).
 *    Without this, Detox never receives the WebSocket "ready" message.
 *
 * 4. DetoxTest.java in android/app/src/androidTest/java/<package>/.
 *    expo-dev-client replaces the standard ReactNativeHost with
 *    DevLauncherController.getInstance().getDevClientHost(). This file bridges
 *    that host to Detox — without it every launchApp() hangs for 600s.
 */
module.exports = function withDetoxInstrumentation(config) {
  const DETOX_MAVEN_LINE =
    '        maven { url "$rootDir/../node_modules/detox/Detox-android" }'
  const DETOX_MAVEN_MARKER = 'Detox-android'

  // Step 1a: Try settings.gradle (dependencyResolutionManagement — Expo SDK 52 / AGP 8 / RN 0.71+)
  // Expo 52 with AGP 8 declares all Maven repos in settings.gradle inside
  // dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  //   repositories { ... } }
  // We insert the Detox local Maven repo right after the opening brace.
  config = withSettingsGradle(config, (mod) => {
    let contents = mod.modResults.contents
    if (contents.includes(DETOX_MAVEN_MARKER)) {
      return mod // already applied
    }
    // Pattern: dependencyResolutionManagement { ... repositories {
    // [^]* matches any character including newlines (JS . does not match \n in non-/s mode)
    const replaced = contents.replace(
      /(dependencyResolutionManagement\s*\{[^]*?repositories\s*\{)/,
      `$1\n${DETOX_MAVEN_LINE}`
    )
    if (replaced !== contents) {
      mod.modResults.contents = replaced
    }
    return mod
  })

  // Step 1b: Try project build.gradle (allprojects.repositories — older RN / fallback)
  // This handles cases where repositories are still declared in android/build.gradle.
  config = withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents
    if (contents.includes(DETOX_MAVEN_MARKER)) {
      return mod // already applied (either from Step 1a or a previous run)
    }
    // Pattern: allprojects { ... repositories {
    // [^]* matches any character including newlines.
    const replaced = contents.replace(
      /(allprojects\s*\{[^]*?repositories\s*\{)/,
      `$1\n${DETOX_MAVEN_LINE}`
    )
    if (replaced !== contents) {
      mod.modResults.contents = replaced
    }
    return mod
  })

  // Step 2 + 3: Detox dependency + DetoxJUnitRunner in android/app/build.gradle
  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents

    // 2a: testInstrumentationRunner
    // Expo SDK 52 / RN 0.76 generates a defaultConfig block WITHOUT testInstrumentationRunner.
    // We must INSERT it, not replace it.
    // Strategy: if the value already exists (any form), replace it; otherwise insert into defaultConfig.
    if (!contents.includes('DetoxJUnitRunner')) {
      // Try to replace an existing testInstrumentationRunner (single- or double-quoted)
      const replaced = contents.replace(
        /testInstrumentationRunner\s+['"][^'"]+['"]/,
        'testInstrumentationRunner "com.wix.detox.runners.DetoxJUnitRunner"'
      )
      if (replaced !== contents) {
        // Found and replaced an existing value
        contents = replaced
      } else {
        // No existing testInstrumentationRunner — insert into defaultConfig block
        contents = contents.replace(
          /defaultConfig\s*\{/,
          'defaultConfig {\n        testInstrumentationRunner "com.wix.detox.runners.DetoxJUnitRunner"'
        )
      }
    }

    // 2b: androidTestImplementation for Detox + transitive compile-time dependencies.
    //
    // expo-dev-launcher (autolinked via implementation project(...)) has its own
    // implementation-scope dependencies that are NOT exported to :app's compile
    // classpath (Gradle's "implementation" is non-transitive). DetoxTest.java imports
    // DevLauncherController which requires all of these at compile time:
    //   - expo-dev-menu-interface  → ReactHostWrapper (DevLauncherController import)
    //   - expo-dev-menu            → DevMenuManager (DevLauncherController import)
    //   - expo-manifests           → Manifest (DevLauncherController import)
    //   - expo-updates-interface   → UpdatesInterface + UpdatesInterfaceCallbacks
    //                                (DevLauncherControllerInterface extends these)
    // All four must be androidTestImplementation so javac can resolve the class files.
    if (!contents.includes('com.wix:detox')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        [
          'dependencies {',
          '    androidTestImplementation("com.wix:detox:+")',
          '    androidTestImplementation project(":expo-updates-interface")',
          '    androidTestImplementation project(":expo-dev-menu-interface")',
          '    androidTestImplementation project(":expo-dev-menu")',
          '    androidTestImplementation project(":expo-manifests")',
        ].join('\n')
      )
    }

    mod.modResults.contents = contents
    return mod
  })

  // Step 4: generate DetoxTest.java bridging expo-dev-client -> Detox
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const packageName = mod.android?.package ?? 'com.llamaquest.app'
      // Convert package name to directory path (dots -> slashes)
      const packagePath = packageName.replace(/\./g, '/')

      // In withDangerousMod, modRequest.projectRoot is the Expo project root.
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
        'import static androidx.test.platform.app.InstrumentationRegistry.getInstrumentation;',
        '',
        'import android.content.Context;',
        'import android.content.ContextWrapper;',
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
        ' * expo-dev-client replaces the standard ReactNativeHost with',
        ' * DevLauncherController.getDevClientHost(). This class bridges that host',
        ' * to Detox so the WebSocket "ready" handshake succeeds.',
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
        '    // to load after instrumentation starts. 300s for no-KVM emulators.',
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
