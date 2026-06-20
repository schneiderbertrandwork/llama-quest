const { withAppBuildGradle } = require('@expo/config-plugins')

/**
 * Adds packagingOptions to android/app/build.gradle so that assembleAndroidTest
 * (used by Detox) does not fail on duplicate META-INF files from JUnit Jupiter JARs.
 *
 * Without this, Gradle throws:
 *   "6 files found with path 'META-INF/LICENSE.md'" and refuses to build the test APK.
 */
module.exports = function withAndroidTestPackaging(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents
    if (contents.includes('META-INF/LICENSE.md')) {
      return config  // already applied
    }
    const packaging = [
      '',
      '    packagingOptions {',
      '        resources {',
      "            excludes += ['META-INF/LICENSE.md', 'META-INF/LICENSE-notice.md', 'META-INF/NOTICE.md', 'META-INF/DEPENDENCIES']",
      '        }',
      '    }',
    ].join('\n')
    config.modResults.contents = contents.replace('android {', `android {${packaging}`)
    return config
  })
}
