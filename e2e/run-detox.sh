#!/usr/bin/env bash
set -e

# Start Metro bundler (CI=1 disables watch mode)
CI=1 EXPO_NO_TELEMETRY=1 npx expo start --port 8081 &

# Wait for Metro to be ready (up to 90 seconds)
for i in $(seq 1 45); do
  curl -sf http://localhost:8081/status > /dev/null 2>&1 && echo "Metro ready after ${i} attempts" && break
  sleep 2
done

# Forward Metro port 8081 from the emulator to the host via ADB reverse tunnel.
# Without this, expo-dev-client in the emulator would use 10.0.2.2:8081 which
# may be firewalled on CI. With this, the app uses localhost:8081 which tunnels
# reliably to the host's Metro server.
adb reverse tcp:8081 tcp:8081
echo "ADB reverse: emulator localhost:8081 → host:8081"

# Pre-warm the Metro JS bundle. On a cold transformer cache (first CI run after a
# package.json change) compilation takes 25-35 min on a 2-CPU runner; on a warm
# cache it's ~30s. Metro holds the connection open until the bundle is ready, so
# a timeout here means the bundle is still compiling — we proceed anyway because
# Detox tests have their own waitFor timeouts that handle a slow-loading app.
echo "Pre-warming Metro bundle (cold: 25-35 min / warm: ~30s)..."
curl -sf "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" \
  -o /dev/null --max-time 1800 \
  && echo "Bundle pre-warm complete" \
  || echo "WARNING: bundle pre-warm exceeded 1800s — proceeding anyway"

# Run Detox E2E tests.
# Tests use exp+llama-quest:// deep link to auto-connect expo-dev-client to Metro.
npx detox test -c android.device.debug --headless --record-logs failing
