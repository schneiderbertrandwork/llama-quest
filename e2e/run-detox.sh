#!/usr/bin/env bash
set -e

# Start Metro bundler (CI=1 disables watch mode, EXPO_NO_TELEMETRY=1 skips analytics)
CI=1 EXPO_NO_TELEMETRY=1 npx expo start --port 8081 &

# Wait for Metro HTTP server to be ready (up to 90 seconds)
for i in $(seq 1 45); do
  curl -sf http://localhost:8081/status > /dev/null 2>&1 && echo "Metro ready after ${i} attempts" && break
  sleep 2
done

# Forward Metro port 8081 from emulator to host via ADB reverse tunnel.
adb reverse tcp:8081 tcp:8081
echo "ADB reverse: emulator localhost:8081 → host:8081"

# Pre-warm the Metro bundle. The warm-metro-cache CI job ensures the Metro
# transformer cache is already populated — bundle serves in ~30s.
# 180s ceiling is a safety margin; cold-cache compilation never runs here.
echo "Pre-warming Metro bundle (warm cache: ~30s)..."
curl -sf "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" \
  -o /dev/null --max-time 600 \
  && echo "Bundle pre-warm complete" \
  || echo "WARNING: bundle pre-warm exceeded 600s — proceeding"

# Run Detox E2E tests.
# Tests use exp+llama-quest:// deep link to auto-connect expo-dev-client to Metro.
npx detox test -c android.device.debug --headless --record-logs failing
