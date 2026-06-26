#!/usr/bin/env bash
set -e

# In CI: Metro is pre-started before emulator boot (see e2e-android.yml).
# Detect and reuse the running instance; fall back to starting it for local runs.
if curl -sf http://localhost:8081/status > /dev/null 2>&1; then
  echo "Metro already running (pre-started before emulator boot)"
else
  echo "Starting Metro bundler..."
  CI=1 EXPO_NO_TELEMETRY=1 npx expo start --port 8081 &
  for i in $(seq 1 45); do
    curl -sf http://localhost:8081/status > /dev/null 2>&1 \
      && echo "Metro ready after ${i} attempts" && break
    sleep 2
  done
fi

# Forward Metro port from emulator to host via ADB reverse tunnel.
adb reverse tcp:8081 tcp:8081
echo "ADB reverse: emulator localhost:8081 → host:8081"

# Verify emulator can reach Metro on BOTH paths before running tests.
# expo-dev-client tries http://10.0.2.2:8081 (QEMU gateway from emulator to host).
# If unreachable, the deep link silently fails and launchApp() times out.
echo "=== Emulator network connectivity ==="
echo -n "  10.0.2.2:8081 (QEMU gateway): "
adb shell "nc -w 3 10.0.2.2 8081 </dev/null > /dev/null 2>&1 && echo OK || echo UNREACHABLE"
echo -n "  localhost:8081 (ADB reverse):  "
adb shell "nc -w 3 localhost 8081 </dev/null > /dev/null 2>&1 && echo OK || echo UNREACHABLE"
echo "==="

# Wait for Android system services to be fully initialized BEFORE installing APKs.
# sys.boot_completed=1 fires 10-30s before `package` and `power` services are ready
# on slow software-emulated (no-KVM) runners. Installing APKs before the package
# manager service is ready causes "Broken pipe" / "Can't find service: package" —
# the APK silently fails to install and Detox then reports "package not installed".
# This wait must come BEFORE adb install, not after.
echo "=== Waiting for Android system services (package + power) ==="
for i in $(seq 1 60); do
  PKG=$(adb shell "service check package" 2>&1)
  PWR=$(adb shell "service check power" 2>&1)
  if echo "$PKG" | grep -q "found" && echo "$PWR" | grep -q "found"; then
    echo "System services ready after ${i} attempt(s)"
    break
  fi
  echo "  Attempt $i/60: package=[${PKG}] power=[${PWR}] — retrying in 5s"
  sleep 5
done
echo "==="

# Pre-install BOTH APKs (main + test instrumentation) so that Detox can run
# with --reuse (skip its own install step). Installing inside Detox's globalSetup
# was the root cause of emulator OOM crashes on no-KVM runners: the package
# manager work caused the emulator to crash ~4 min into the Detox session, and
# Detox then tried to relaunch the emulator (which fails without KVM).
# Installing here — after system services are confirmed ready — means the APKs
# land cleanly on the already-booted emulator before Detox touches anything.
echo "=== Pre-installing main APK ==="
for attempt in 1 2 3; do
  # '|| true' prevents set -e from aborting on a non-zero adb exit code so the
  # retry loop can continue.  The Success/failure check is done via grep below.
  INSTALL_OUT=$(adb install -r -t android/app/build/outputs/apk/debug/app-debug.apk 2>&1) || true
  echo "$INSTALL_OUT" | tail -2
  if echo "$INSTALL_OUT" | grep -q "Success"; then
    echo "Main APK installed successfully (attempt $attempt)"
    break
  fi
  echo "Main APK install attempt $attempt failed — retrying in 10s..."
  sleep 10
done

echo "=== Pre-installing test instrumentation APK ==="
for attempt in 1 2 3; do
  # '|| true' prevents set -e from aborting on a non-zero adb exit code so the
  # retry loop can continue.  The Success/failure check is done via grep below.
  INSTALL_OUT=$(adb install -r -t android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk 2>&1) || true
  echo "$INSTALL_OUT" | tail -2
  if echo "$INSTALL_OUT" | grep -q "Success"; then
    echo "Test APK installed successfully (attempt $attempt)"
    break
  fi
  echo "Test APK install attempt $attempt failed — retrying in 10s..."
  sleep 10
done

echo "--- exp+llama-quest:// scheme registration (post-install, meaningful) ---"
adb shell "pm query-activities -a android.intent.action.VIEW -d 'exp+llama-quest://expo-development-client/?url=http://localhost:8081' 2>&1 || echo 'pm query-activities failed'"

echo "--- run-as capability (required for SharedPreferences seeding) ---"
adb shell "run-as com.llamaquest.app sh -c 'ls /data/data/com.llamaquest.app/' 2>&1 | head -5 || echo 'run-as FAILED'"
echo "==="

# Pre-warm the Metro bundle with the URL expo-dev-client uses.
# expo-dev-client requests /.expo/.virtual-metro-entry.bundle?platform=android&dev=true&hot=true
# (Expo's rewriteRequestUrl middleware rewrites this to node_modules/expo-router/entry.bundle).
# This blocking curl ensures Metro compiles and caches the bundle BEFORE Detox's launchApp()
# runs. Without this, each launchApp() triggers a fresh 400s+ compilation and times out.
echo "Pre-warming Metro bundle (blocking — warm transformer cache makes this ~200-400s)..."
HTTP_STATUS=$(curl -s -o /tmp/bundle-prewarm.log -w "%{http_code}" \
  "http://localhost:8081/.expo/.virtual-metro-entry.bundle?platform=android&dev=true&hot=true&minify=false" \
  --max-time 1800 2>/dev/null) || HTTP_STATUS="ERROR"
BUNDLE_BYTES=$(wc -c < /tmp/bundle-prewarm.log 2>/dev/null || echo 0)
echo "Bundle pre-warm: HTTP $HTTP_STATUS, ${BUNDLE_BYTES} bytes"

if [ "$HTTP_STATUS" != "200" ]; then
  echo "WARNING: pre-warm returned $HTTP_STATUS — bundle may not be cached, tests may timeout"
fi

# Pre-warm SoLoader native library cache.
#
# Root cause: on no-KVM CI hardware, SoLoader.DirectApkSoSource.buildLibDepsCacheImpl
# walks every .so in the main APK zip and builds a dependency graph. This blocks the
# main thread for 5-15 minutes on software-emulated runners. Android's ANR watchdog
# fires after 5s of main-thread block, showing a foreground overlay dialog and
# permanently clearing has-window-focus from the app process.
#
# SoLoader writes a file-based dependency cache to the app's private data dir. Once
# written, subsequent process launches read the cache instead of re-parsing ELF headers,
# making library loading much faster (no ANR).
#
# Strategy: launch the app, poll until it actually has window focus (= SoLoader +
# full startup complete = cache fully written to disk), then force-stop.
# On the next launch (Detox launchApp), SoLoader reads the cache and skips the slow
# ELF-parsing path, completing without triggering ANR.
#
# Previous approach (fixed 300s sleep) failed because:
#   - SoLoader takes 5-15 min on no-KVM CI (not 210s as estimated)
#   - force-stopping mid-write leaves the cache file partially written / corrupt
#   - Subsequent process launches rebuild the cache from scratch → same ANR
#
# Poll-until-focus approach ensures the cache is fully written before we stop the app.
echo "=== Pre-warming SoLoader native library cache (wait for window focus) ==="
adb shell am start -n com.llamaquest.app/expo.modules.devlauncher.launcher.DevLauncherActivity
echo "App launched — polling for window focus (SoLoader + full startup must complete)..."
PREWARM_START=$(date +%s)
PREWARM_TIMEOUT=1200  # 20 min max; SoLoader takes 5-15 min on no-KVM CI
PREWARM_FOCUS=0
for i in $(seq 1 240); do
  # Dismiss ANR dialogs on every poll so the app can continue loading.
  adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS > /dev/null 2>&1 || true
  adb shell input tap 540 960 > /dev/null 2>&1 || true
  # Check for window focus (app fully started, SoLoader done).
  FOCUS=$(adb shell dumpsys window windows 2>/dev/null | grep "mCurrentFocus" || true)
  if echo "$FOCUS" | grep -q "com.llamaquest.app"; then
    ELAPSED=$(( $(date +%s) - PREWARM_START ))
    echo "Window focus acquired after ${ELAPSED}s — SoLoader cache fully written"
    PREWARM_FOCUS=1
    break
  fi
  ELAPSED=$(( $(date +%s) - PREWARM_START ))
  if [ "$ELAPSED" -ge "$PREWARM_TIMEOUT" ]; then
    echo "WARNING: pre-warm timed out after ${ELAPSED}s without focus — continuing anyway"
    break
  fi
  echo "  Pre-warm poll $i: no focus yet (${ELAPSED}s elapsed) — dismissing ANR + retrying in 5s"
  sleep 5
done
adb shell am force-stop com.llamaquest.app 2>/dev/null || true
echo "Pre-warm complete — SoLoader cache persisted in app data dir (focus=${PREWARM_FOCUS})"
echo "==="

# Suppress ANR (App Not Responding) system dialogs before running tests.
# On no-KVM swiftshader emulators, HardwareRenderer initialisation can block
# the main thread for >5 s during the first Activity resume, triggering Android's
# ANR watchdog. Android then shows an "App not responding" system dialog which
# steals window focus from the app. In headless (-no-window) mode the dialog is
# never auto-dismissed, so every subsequent Espresso interaction fails with
# "has-window-focus=false". Disabling these settings prevents the dialogs from
# appearing so the app retains window focus throughout the test session.
echo "=== Suppressing ANR / crash dialogs ==="
adb shell settings put global anr_show_background 0
adb shell settings put global show_first_crash_dialog_dev_option 0
adb shell settings put global show_first_crash_dialog 0
echo "ANR and crash dialog suppression active"
echo "==="

# Capture logcat for post-mortem on failure.
# Tag names are case-sensitive; wrong names silently capture nothing.
# expo-dev-client internal tags (confirmed from expo-dev-client source):
#   DevLauncherActivity / DevLauncherController / DevLauncherIntentRegistry
#   ExpoDevLauncher — older alias
# React Native / Hermes:
#   ReactNative / ReactNativeJS / ReactAndroid / Hermes
# Detox:
#   DETOX / DetoxSync
# Catch-all for crashes:
#   AndroidRuntime:E
# Use *:W (warn+) as the floor instead of *:S so we don't silently miss new tags.
adb logcat -c 2>/dev/null || true
adb logcat -v time \
  DevLauncherActivity:V DevLauncherController:V DevLauncherIntentRegistry:V \
  ExpoDevLauncher:V ExpoModulesCore:V \
  DETOX:V DetoxSync:V \
  ReactNative:V ReactNativeJS:V ReactAndroid:V Hermes:V \
  AndroidRuntime:E *:W \
  > /tmp/logcat.log 2>&1 &
LOGCAT_PID=$!
echo "Logcat capture started (PID $LOGCAT_PID)"

# Kill logcat on any script exit (success or failure).
trap 'LINES=$(wc -l < /tmp/logcat.log 2>/dev/null || echo 0); kill '"$LOGCAT_PID"' 2>/dev/null || true; echo "Logcat: $LINES lines saved"' EXIT

# Run Detox E2E tests.
# --reuse: skip APK installation (both main + test APKs are pre-installed above).
#   This prevents Detox's globalSetup from running a second, OOM-inducing APK install
#   on the no-KVM emulator. Both APKs are already on the device from the pre-install step.
# android.emu.debug uses type: android.attached (adbName: emulator-5554) — Detox
#   attaches to the already-running emulator without managing its lifecycle. Using
#   android.emulator type caused Detox to attempt KVM-accelerated relaunch on crash,
#   which always fails on GitHub Actions (exit code 224).
# No --headless flag: android.attached ignores it, and it produces a harmless warning.
npx detox test -c android.emu.debug --reuse --record-logs failing
