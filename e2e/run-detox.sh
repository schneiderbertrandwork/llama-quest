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

# Verify the exp+llama-quest:// scheme is registered in the installed app.
# If no activity handles this scheme, our ADB deep link is silently dropped.
echo "=== exp+llama-quest:// scheme registration ==="
adb shell "pm query-activities -a android.intent.action.VIEW -d 'exp+llama-quest://expo-development-client/?url=http://localhost:8081' 2>&1 || echo 'pm query-activities failed'"
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

# Capture logcat for post-mortem on failure.
# Tag names are case-sensitive; wrong names silently capture nothing.
#   ExpoDevLauncher  — expo-dev-client connection screen (receives deep links)
#   DETOX / DetoxSync — Detox instrumentation messages
#   ReactNative      — RN native bridge
#   ReactNativeJS    — JS console.log (older RN) / ReactAndroid (newer)
#   Hermes           — Hermes JS engine (SDK 52 uses Hermes)
#   AndroidRuntime:E — JVM crash stack traces
#   *:S              — silence everything else
adb logcat -c 2>/dev/null || true
adb logcat -v time ExpoDevLauncher:V DETOX:V DetoxSync:V ReactNative:V ReactNativeJS:V ReactAndroid:V Hermes:V AndroidRuntime:E *:S \
  > /tmp/logcat.log 2>&1 &
LOGCAT_PID=$!
echo "Logcat capture started (PID $LOGCAT_PID)"

# Kill logcat on any script exit (success or failure).
trap 'LINES=$(wc -l < /tmp/logcat.log 2>/dev/null || echo 0); kill '"$LOGCAT_PID"' 2>/dev/null || true; echo "Logcat: $LINES lines saved"' EXIT

# Wait for Android system services to be fully initialized before handing off to Detox.
# sys.boot_completed=1 fires 10-30s before `package` and `power` services are ready on
# slow software-emulated (no-KVM) runners. Detox's APK install hits the package manager
# immediately, causing "Broken pipe / Can't find service: package" failures.
echo "=== Waiting for Android system services (package + power) ==="
for i in $(seq 1 30); do
  PKG=$(adb shell "service check package" 2>&1)
  PWR=$(adb shell "service check power" 2>&1)
  if echo "$PKG" | grep -q "found" && echo "$PWR" | grep -q "found"; then
    echo "System services ready after ${i} attempt(s)"
    break
  fi
  echo "  Attempt $i/30: package=[${PKG}] power=[${PWR}] — retrying in 5s"
  sleep 5
done
echo "==="

# Run Detox E2E tests.
# Each test file's beforeAll() schedules an ADB deep link (setTimeout 10s) that fires
# while device.launchApp() is awaiting. The deep link uses BROWSABLE + DEFAULT categories,
# which is what expo-dev-client's intent-filter expects — bypassing Detox's own URL
# delivery via am instrument (detoxURLOverride) that never reached the connection handler.
npx detox test -c android.device.debug --headless --record-logs failing
