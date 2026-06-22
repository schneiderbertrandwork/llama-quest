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

# Run Detox E2E tests.
# With the bundle pre-warmed, expo-dev-client's launchApp() gets an instant cache hit.
npx detox test -c android.device.debug --headless --record-logs failing
